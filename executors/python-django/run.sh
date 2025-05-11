#! /bin/sh

echo "$CODE" > /app/executor/models.py \
&& ./manage.py makemigrations --verbosity 0 \
&& ./manage.py migrate --verbosity 0 \
&& timeout 10 ./manage.py execute
