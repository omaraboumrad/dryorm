#!/bin/bash
set -e

echo "Building Prisma executor images..."

# PostgreSQL + Prisma 5.22
echo "Building postgres-5.22..."
docker build -f Dockerfile.multi --target postgres-5.22 \
  -t dryorm-executor/nodejs-prisma-postgres-5.22 .

# PostgreSQL + Prisma 6.3
echo "Building postgres-6.3..."
docker build -f Dockerfile.multi --target postgres-6.3 \
  -t dryorm-executor/nodejs-prisma-postgres-6.3 .

# MariaDB + Prisma 5.22
echo "Building mariadb-5.22..."
docker build -f Dockerfile.multi --target mariadb-5.22 \
  -t dryorm-executor/nodejs-prisma-mariadb-5.22 .

# MariaDB + Prisma 6.3
echo "Building mariadb-6.3..."
docker build -f Dockerfile.multi --target mariadb-6.3 \
  -t dryorm-executor/nodejs-prisma-mariadb-6.3 .

# SQLite + Prisma 5.22
echo "Building sqlite-5.22..."
docker build -f Dockerfile.multi --target sqlite-5.22 \
  -t dryorm-executor/nodejs-prisma-sqlite-5.22 .

# SQLite + Prisma 6.3
echo "Building sqlite-6.3..."
docker build -f Dockerfile.multi --target sqlite-6.3 \
  -t dryorm-executor/nodejs-prisma-sqlite-6.3 .

echo "All Prisma executor images built successfully!"
