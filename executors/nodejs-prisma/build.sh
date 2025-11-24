#!/bin/bash
set -e

echo "Building Prisma 6.3 executor images..."

# PostgreSQL + Prisma 6.3
echo "Building postgres-6.3..."
docker build -f Dockerfile.multi --target postgres-6.3 \
  -t dryorm-executor/nodejs-prisma-postgres-6.3 .

# MariaDB + Prisma 6.3
echo "Building mariadb-6.3..."
docker build -f Dockerfile.multi --target mariadb-6.3 \
  -t dryorm-executor/nodejs-prisma-mariadb-6.3 .

# SQLite + Prisma 6.3
echo "Building sqlite-6.3..."
docker build -f Dockerfile.multi --target sqlite-6.3 \
  -t dryorm-executor/nodejs-prisma-sqlite-6.3 .

echo "All Prisma executor images built successfully!"
