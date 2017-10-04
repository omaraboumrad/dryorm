#! /bin/sh

./manage.py makemigrations --verbosity 0 \
&& ./manage.py migrate --verbosity 0 \
&& ./manage.py execute
