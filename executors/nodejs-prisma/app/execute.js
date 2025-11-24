#!/usr/bin/env node
/**
 * Prisma executor for DryORM
 * Executes user code and tracks queries with line numbers
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import zlib from 'zlib';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Line-aware query logger
class LineAwareQueryLogger {
  constructor() {
    this.queries = [];
  }

  log(query) {
    // Get stack trace to find the source line
    const stack = new Error().stack.split('\n');
    let lineNumber = null;
    let sourceContext = null;

    // Find the frame from user code
    for (const frame of stack) {
      if (frame.includes('/app/user-code.js')) {
        const match = frame.match(/:(\d+):\d+/);
        if (match) {
          lineNumber = parseInt(match[1], 10);
          // Try to get the source line
          try {
            const userCode = readFileSync('/app/user-code.js', 'utf-8');
            const lines = userCode.split('\n');
            if (lineNumber > 0 && lineNumber <= lines.length) {
              sourceContext = lines[lineNumber - 1].trim();
            }
          } catch (e) {
            // Ignore errors
          }
        }
        break;
      }
    }

    this.queries.push({
      sql: query.query,
      template: query.query,
      time: (query.duration || 0).toFixed(3),
      line_number: lineNumber,
      source_context: sourceContext
    });
  }
}

// Database URL builder
function getDatabaseUrl() {
  const dbType = process.env.DB_TYPE || 'sqlite';

  if (dbType === 'sqlite') {
    return 'file:./db.sqlite3';
  }

  const dbHost = process.env.SERVICE_DB_HOST || 'localhost';
  const dbPort = process.env.SERVICE_DB_PORT || '5432';
  const dbUser = process.env.DB_USER || 'user';
  const dbPassword = process.env.DB_PASSWORD || 'password';
  const dbName = process.env.DB_NAME || 'test';

  if (dbType === 'postgres') {
    return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  } else if (dbType === 'mariadb') {
    return `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  } else {
    throw new Error(`Unsupported database type: ${dbType}`);
  }
}

// Generate ERD from schema
async function generateERD() {
  try {
    // Read schema file
    const schema = readFileSync('/app/schema.prisma', 'utf-8');

    // Parse schema and generate Mermaid ERD
    const mermaid = generateMermaidFromSchema(schema);

    // Compress and encode
    const compressed = zlib.deflateSync(Buffer.from(mermaid, 'utf-8'));
    return compressed.toString('base64');
  } catch (e) {
    return '';
  }
}

// Safe JSON stringifier that handles circular references and BigInt
function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    // Handle BigInt
    if (typeof value === 'bigint') {
      return value.toString();
    }
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

// Simple Mermaid ERD generator from Prisma schema
function generateMermaidFromSchema(schema) {
  const lines = schema.split('\n');
  let mermaid = 'erDiagram\n';
  let currentModel = null;
  const models = [];
  const relationships = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Model declaration
    if (trimmed.startsWith('model ')) {
      currentModel = trimmed.match(/model\s+(\w+)/)?.[1];
      if (currentModel) {
        models.push({
          name: currentModel,
          fields: []
        });
      }
    } else if (currentModel && trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('}')) {
      // Field declaration
      const fieldMatch = trimmed.match(/(\w+)\s+(\w+)(\[\])?(\?)?/);
      if (fieldMatch) {
        const [, fieldName, fieldType, isArray, isOptional] = fieldMatch;
        const model = models[models.length - 1];

        // Check if it's a relation field
        if (models.some(m => m.name === fieldType)) {
          const relationType = isArray ? '||--o{' : (isOptional ? '||--o|' : '||--||');
          relationships.push(`${currentModel} ${relationType} ${fieldType} : ""`);
        } else {
          // Regular field
          const typeStr = fieldType + (isArray ? '[]' : '') + (isOptional ? '?' : '');
          model.fields.push({ name: fieldName, type: typeStr });
        }
      }
    }
  }

  // Generate model definitions
  for (const model of models) {
    mermaid += `  ${model.name} {\n`;
    for (const field of model.fields) {
      mermaid += `    ${field.type} ${field.name}\n`;
    }
    mermaid += `  }\n`;
  }

  // Add relationships
  for (const rel of relationships) {
    mermaid += `  ${rel}\n`;
  }

  return mermaid;
}

// Main execution function
async function main() {
  const result = {
    output: '',
    queries: [],
    erd: '',
    returned: null
  };

  // Declare these at function level so they're accessible in catch blocks
  const originalLog = console.log;
  const logs = [];
  const logger = new LineAwareQueryLogger();
  let prisma = null;

  try {
    // Create Prisma client with query logging
    prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
      ],
    });

    // Set up query event listener
    prisma.$on('query', (e) => {
      logger.log(e);
    });

    // Run migrations (redirect output to stderr to avoid polluting JSON output)
    try {
      await execAsync('npx prisma migrate dev --name init --skip-generate >&2', {
        cwd: '/app',
        env: { ...process.env, DATABASE_URL: getDatabaseUrl() }
      });
    } catch (migrationError) {
      // Try db push as fallback
      try {
        await execAsync('npx prisma db push --skip-generate >&2', {
          cwd: '/app',
          env: { ...process.env, DATABASE_URL: getDatabaseUrl() }
        });
      } catch (pushError) {
        // Ignore if already exists
      }
    }

    // Load and execute user code
    const userCodePath = '/app/user-code.js';

    // Capture stdout (but don't write to actual stdout to avoid polluting JSON)
    console.log = (...args) => {
      logs.push(args.map(a => String(a)).join(' '));
      // Don't call originalLog - we only want to capture, not output
    };

    try {
      // Import user code as ES module
      const userModule = await import(userCodePath + '?t=' + Date.now());

      // Call the run function if it exists
      if (typeof userModule.run === 'function') {
        const returnValue = await userModule.run(prisma);
        if (returnValue !== undefined && returnValue !== null) {
          // Handle arrays and objects properly
          if (typeof returnValue === 'object') {
            result.returned = returnValue;
          } else {
            result.returned = String(returnValue);
          }
        }
      }
    } finally {
      console.log = originalLog;
    }

    result.output = logs.join('\n');
    result.queries = logger.queries;

    // Generate ERD
    result.erd = await generateERD();

    // Clean up
    if (prisma) {
      await prisma.$disconnect();
    }

  } catch (error) {
    // Restore console.log in case of error
    console.log = originalLog;

    result.output = logs.join('\n');
    result.queries = logger.queries;
    result.error = `${error.name}: ${error.message}`;
    result.traceback = error.stack;

    // Clean up prisma connection on error
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
    }
  }

  // Restore console.log before final output
  console.log = originalLog;

  // Write result to file instead of stdout to avoid pollution
  try {
    const jsonOutput = safeStringify(result);
    const resultFile = '/tmp/result.json';

    writeFileSync(resultFile, jsonOutput);

    // Also write to stdout for backward compatibility (can be removed later)
    process.stdout.write(jsonOutput + '\n');
  } catch (stringifyError) {
    // If even safe stringify fails, output a basic error
    const fallbackResult = {
      output: result.output || '',
      queries: [],
      erd: '',
      returned: null,
      error: `JSON Serialization Error: ${stringifyError.message}`,
      traceback: stringifyError.stack
    };
    const resultFile = '/tmp/result.json';
    writeFileSync(resultFile, JSON.stringify(fallbackResult));
    process.stdout.write(JSON.stringify(fallbackResult) + '\n');
  }
}

main().catch((error) => {
  // Fatal error - output basic error result
  const errorResult = {
    output: '',
    queries: [],
    erd: '',
    returned: null,
    error: `Fatal Error: ${error.message}`,
    traceback: error.stack
  };
  try {
    const jsonOutput = safeStringify(errorResult);
    const resultFile = '/tmp/result.json';
    writeFileSync(resultFile, jsonOutput);
    process.stdout.write(jsonOutput + '\n');
  } catch (e) {
    const fallbackOutput = JSON.stringify({
      output: '',
      queries: [],
      erd: '',
      returned: null,
      error: 'Critical serialization error',
      traceback: ''
    });
    const resultFile = '/tmp/result.json';
    writeFileSync(resultFile, fallbackOutput);
    process.stdout.write(fallbackOutput + '\n');
  }
  process.exit(1);
});
