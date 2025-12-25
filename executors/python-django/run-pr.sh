#!/bin/sh

# Add Django PR source to Python path
export PYTHONPATH=/django-pr:$PYTHONPATH

echo "$CODE" > /app/app/models.py \
&& ./manage.py makemigrations --verbosity 0 \
&& ./manage.py migrate --verbosity 0 \
&& timeout 10 ./manage.py execute
