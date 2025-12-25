#!/bin/sh

# Copy Django source to writable location and install (fully offline)
cp -r /django-pr /tmp/django-src \
&& pip install --no-cache-dir --no-deps --no-index --no-build-isolation /tmp/django-src --quiet \
&& echo "$CODE" > /app/app/models.py \
&& ./manage.py makemigrations --verbosity 0 \
&& ./manage.py migrate --verbosity 0 \
&& timeout 10 ./manage.py execute
