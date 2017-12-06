import contextlib
import json
import io
import logging

import handler

import models
import transaction

models.init()

queries_log = []
logger = logging.getLogger('peewee')
logger.setLevel(logging.DEBUG)
logger.addHandler(handler.ListHandler(queries_log))

out = io.StringIO()

with contextlib.redirect_stdout(out):
    transaction.execute()


combined = dict(
    output=out.getvalue(),
    queries=[{'sql': q, 'time': .0} for q in queries_log])

print(json.dumps(combined, indent=2))
