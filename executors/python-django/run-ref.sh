#!/bin/sh

# Add mounted Django ref source (PR/branch/tag) to Python path
export PYTHONPATH=/django-ref:$PYTHONPATH

# Redirect all stderr to error.log for the entire script
exec 2>/tmp/error.log

printf '%s\n' "$CODE" > /app/app/models.py \
&& timeout 30 ./manage.py run_snippet
