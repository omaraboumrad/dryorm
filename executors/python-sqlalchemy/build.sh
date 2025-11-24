#!/bin/bash
# Build all SQLAlchemy executor Docker images

set -e

echo "Building SQLAlchemy 2.0 executor images..."

# PostgreSQL variant
echo "Building PostgreSQL + SQLAlchemy 2.0..."
docker build -f Dockerfile.multi --target postgres-2.0 \
  -t dryorm-executor/python-sqlalchemy-postgres-2.0 .

# MariaDB variant
echo "Building MariaDB + SQLAlchemy 2.0..."
docker build -f Dockerfile.multi --target mariadb-2.0 \
  -t dryorm-executor/python-sqlalchemy-mariadb-2.0 .

# SQLite variant
echo "Building SQLite + SQLAlchemy 2.0..."
docker build -f Dockerfile.multi --target sqlite-2.0 \
  -t dryorm-executor/python-sqlalchemy-sqlite-2.0 .

echo "All images built successfully!"
