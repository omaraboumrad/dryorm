# Prisma Executor for DryORM

This executor allows users to test and share Prisma ORM code snippets with multiple database backends.

## Features

- **Prisma 6.3**: Uses the latest Prisma version
- **Multiple Databases**: PostgreSQL, MariaDB, and SQLite
- **Query Tracking**: Tracks SQL queries with source line numbers
- **ERD Generation**: Automatically generates Entity-Relationship Diagrams from Prisma schema
- **Isolated Execution**: Each execution runs in a fresh Docker container

## Directory Structure

```
nodejs-prisma/
├── app/
│   ├── execute.js              # Main execution script
│   └── schema.prisma           # User schema placeholder
├── Dockerfile.multi            # Multi-stage Docker build
├── run.sh                      # Container entry point
├── package-6.3.json            # Prisma 6.3 dependencies
├── build.sh                    # Build all Docker images
└── README.md                   # This file
```

## Usage

### Writing User Code

Users write Prisma schemas and code in the following format:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)
  author    User    @relation(fields: [authorId], references: [id])
  authorId  Int
}

// Code:
export async function run(prisma) {
  // Create a user
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
    },
  });

  console.log('Created user:', user);

  // Create a post
  const post = await prisma.post.create({
    data: {
      title: 'First Post',
      content: 'Hello World!',
      authorId: user.id,
    },
  });

  console.log('Created post:', post);

  // Query users with their posts
  const users = await prisma.user.findMany({
    include: {
      posts: true,
    },
  });

  console.log('All users:', JSON.stringify(users, null, 2));
}
```

### Code Format

The executor expects:
1. **Prisma Schema**: Standard Prisma schema definition
2. **Code Block**: JavaScript/TypeScript code after `// Code:` comment
3. **Run Function**: Export an async `run(prisma)` function that receives the Prisma client

### Output Format

The executor returns JSON with the following structure:

```json
{
  "output": "stdout from run() function",
  "erd": "base64-encoded-compressed-mermaid-diagram",
  "queries": [
    {
      "sql": "SQL query",
      "template": "SQL template",
      "time": "0.000",
      "line_number": 42,
      "source_context": "source code line"
    }
  ],
  "returned": "return value from run() function"
}
```

## Building Docker Images

Build all variants using Docker multi-stage builds:

```bash
# Build all images at once
./build.sh

# Or build individual images:

# PostgreSQL + Prisma 6.3
docker build -f Dockerfile.multi --target postgres-6.3 \
  -t dryorm-executor/nodejs-prisma-postgres-6.3 .

# MariaDB + Prisma 6.3
docker build -f Dockerfile.multi --target mariadb-6.3 \
  -t dryorm-executor/nodejs-prisma-mariadb-6.3 .

# SQLite + Prisma 6.3
docker build -f Dockerfile.multi --target sqlite-6.3 \
  -t dryorm-executor/nodejs-prisma-sqlite-6.3 .
```

## Environment Variables

The executor expects the following environment variables:

- `CODE`: User code to execute (required)
- `DB_TYPE`: Database type (`sqlite`, `postgres`, or `mariadb`)
- `SERVICE_DB_HOST`: Database host (for PostgreSQL/MariaDB)
- `SERVICE_DB_PORT`: Database port (for PostgreSQL/MariaDB)
- `DB_USER`: Database user (for PostgreSQL/MariaDB)
- `DB_PASSWORD`: Database password (for PostgreSQL/MariaDB)
- `DB_NAME`: Database name (for PostgreSQL/MariaDB)

## Execution Flow

1. User code is written to `/app/schema.prisma`
2. Schema is parsed and code block is extracted to `/app/user-code.js`
3. Database provider is updated based on `DB_TYPE`
4. `run.sh` executes:
   - Generates Prisma Client
   - Runs migrations/db push
   - Executes user's `run()` function with 10-second timeout
   - Tracks queries and generates ERD
   - Returns JSON output

## Resource Limits

- **Memory**: 150MB per container (higher than Python executors due to Node.js overhead)
- **Timeout**: 10 seconds
- **Max Containers**: 10 concurrent executions

## Comparison with Other Executors

| Feature | Django | SQLAlchemy | Prisma |
|---------|--------|------------|--------|
| Language | Python | Python | JavaScript/TypeScript |
| ORM | Django ORM | SQLAlchemy | Prisma |
| Schema | Python Models | DeclarativeBase | Prisma Schema |
| Migrations | Automatic | Manual | Automatic |
| Query Tracking | ✓ | ✓ | ✓ |
| ERD Generation | ✓ | ✓ | ✓ |
| Line Numbers | ✓ | ✓ | ✓ |
| Type Safety | Partial | Partial | Full (TypeScript) |

## Notes

- The executor automatically runs `prisma migrate dev` or `prisma db push` to create tables
- The database provider in the schema is automatically updated based on `DB_TYPE`
- The `run()` function receives the Prisma client as an argument
- All console.log output is captured and returned
- Queries are logged using Prisma's event system
- ERD is generated by parsing the Prisma schema file

## Prisma-Specific Features

- **Type Safety**: Prisma provides full TypeScript type safety
- **Auto-completion**: Generated Prisma Client includes auto-completion
- **Migrations**: Automatic migration generation from schema changes
- **Relations**: First-class support for complex relationships
- **Aggregations**: Built-in support for count, sum, avg, etc.
