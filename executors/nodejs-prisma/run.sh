#!/bin/bash
set -e

# Get the database type from environment
DB_TYPE=${DB_TYPE:-sqlite}

# Write user code to schema.prisma
echo "$CODE" > /app/schema.prisma

# Extract the code block after schema (if any) and save as user-code.js
# For now, we'll look for a code block starting with "// Code:"
if grep -q "// Code:" /app/schema.prisma; then
  # Extract everything after "// Code:"
  sed -n '/\/\/ Code:/,$p' /app/schema.prisma | tail -n +2 > /app/user-code.js
  # Remove the code block from schema
  sed -i '/\/\/ Code:/,$d' /app/schema.prisma
else
  # Create empty user code file with a default run function
  cat > /app/user-code.js << 'USERCODE'
export async function run(prisma) {
  // User can add code here
  console.log('No run function provided');
}
USERCODE
fi

# Update the datasource provider in schema.prisma based on DB_TYPE
# Use awk to only replace provider in the datasource block
if [ "$DB_TYPE" = "sqlite" ]; then
  awk '/^datasource/,/^}/ {if (/provider = /) {sub(/provider = "[^"]*"/, "provider = \"sqlite\"")} if (/url.*=/) {sub(/url.*=.*/, "url = \"file:./db.sqlite3\"")}} 1' /app/schema.prisma > /app/schema.prisma.tmp && mv /app/schema.prisma.tmp /app/schema.prisma
  export DATABASE_URL="file:./db.sqlite3"
elif [ "$DB_TYPE" = "mariadb" ]; then
  awk '/^datasource/,/^}/ {if (/provider = /) {sub(/provider = "[^"]*"/, "provider = \"mysql\"")}} 1' /app/schema.prisma > /app/schema.prisma.tmp && mv /app/schema.prisma.tmp /app/schema.prisma
  DB_HOST=${SERVICE_DB_HOST:-localhost}
  DB_PORT=${SERVICE_DB_PORT:-3306}
  DB_USER=${DB_USER:-user}
  DB_PASSWORD=${DB_PASSWORD:-password}
  DB_NAME=${DB_NAME:-test}
  export DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
elif [ "$DB_TYPE" = "postgres" ]; then
  awk '/^datasource/,/^}/ {if (/provider = /) {sub(/provider = "[^"]*"/, "provider = \"postgresql\"")}} 1' /app/schema.prisma > /app/schema.prisma.tmp && mv /app/schema.prisma.tmp /app/schema.prisma
  DB_HOST=${SERVICE_DB_HOST:-localhost}
  DB_PORT=${SERVICE_DB_PORT:-5432}
  DB_USER=${DB_USER:-user}
  DB_PASSWORD=${DB_PASSWORD:-password}
  DB_NAME=${DB_NAME:-test}
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

# Debug: Check if there's any output before we start
echo "=== RUN.SH START ===" >&2

# Generate Prisma Client (redirect output to stderr to not pollute JSON output)
echo "=== Generating Prisma Client ===" >&2
npx prisma generate --schema=/app/schema.prisma >&2

# Debug: Confirm we're about to run the executor
echo "=== Running execute.js ===" >&2

# Execute with timeout and capture the output
timeout 10 node /app/app/execute.js

# Debug: Check exit code
echo "=== Execute.js exit code: $? ===" >&2
