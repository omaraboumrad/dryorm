#!/bin/bash
# Build all SQLAlchemy executor Docker images

set -e

echo "Building SQLAlchemy executor images..."

# PostgreSQL variants
# echo "Building PostgreSQL + SQLAlchemy 2.0..."
# docker build -f Dockerfile.multi --target postgres-2.0 \
#   -t dryorm-executor/python-sqlalchemy-postgres-2.0 .
# 
# echo "Building PostgreSQL + SQLAlchemy 1.4..."
# docker build -f Dockerfile.multi --target postgres-1.4 \
#   -t dryorm-executor/python-sqlalchemy-postgres-1.4 .
# 
# # MariaDB variants
# echo "Building MariaDB + SQLAlchemy 2.0..."
# docker build -f Dockerfile.multi --target mariadb-2.0 \
#   -t dryorm-executor/python-sqlalchemy-mariadb-2.0 .
# 
# echo "Building MariaDB + SQLAlchemy 1.4..."
# docker build -f Dockerfile.multi --target mariadb-1.4 \
#   -t dryorm-executor/python-sqlalchemy-mariadb-1.4 .

# SQLite variants (optional, can use postgres images)
echo "Building SQLite + SQLAlchemy 2.0..."
docker build -f Dockerfile.multi --target sqlite-2.0 \
  -t dryorm-executor/python-sqlalchemy-sqlite-2.0 .

echo "Building SQLite + SQLAlchemy 1.4..."
docker build -f Dockerfile.multi --target sqlite-1.4 \
  -t dryorm-executor/python-sqlalchemy-sqlite-1.4 .

echo "All images built successfully!"
