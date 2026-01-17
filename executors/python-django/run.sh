#! /bin/sh

# Redirect all stderr to error.log for the entire script
exec 2>/tmp/error.log

echo "$CODE" > /app/app/models.py \
&& ./manage.py makemigrations --verbosity 0 \
&& ./manage.py migrate --verbosity 0 \
&& timeout 10 ./manage.py execute
