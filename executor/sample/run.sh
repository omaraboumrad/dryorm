#! /bin/sh

echo "$MODELS" > /app/core/models.py \
&& echo "$TRANSACTION" > /app/core/scripts/transaction.py \
&& ./manage.py makemigrations --verbosity 0 \
&& ./manage.py migrate --verbosity 0 \
&& ./manage.py execute
