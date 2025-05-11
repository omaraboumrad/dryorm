#! /bin/sh

echo "$CODE" > /app/executor/models.py \
&& ./manage.py makemigrations --verbosity 0 \
&& { [ "$DB_TYPE" != "sqlite" ] && ./scripts/create_db.sh > /dev/null 2>&1 || true; } \
&& ./manage.py migrate --verbosity 0 \
&& timeout 10 ./manage.py execute

