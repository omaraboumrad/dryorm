#! /bin/sh

echo "$MODELS" > /app/models.py \
&& echo "$TRANSACTION" > /app/transaction.py \
&& python run.py
