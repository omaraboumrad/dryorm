#! /bin/sh

echo "$MODELS" > /app/models.py \
&& echo "$TRANSACTION" > /app/transaction.py \
&& python /app/models.py \
&& python /app/transaction.py
