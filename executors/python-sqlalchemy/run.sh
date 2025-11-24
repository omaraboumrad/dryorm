#!/bin/bash
set -e

# Write user code to models.py
echo "$CODE" > /app/app/models.py

# Execute with timeout
timeout 10 python3 /app/app/execute.py
