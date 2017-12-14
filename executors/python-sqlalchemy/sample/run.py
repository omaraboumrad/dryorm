import contextlib
import functools
import json
import io
import logging

import handler

import models
import transaction


def valid(query):
    return not any([
        query.startswith('BEGIN'),
        query.startswith('%'),
        query.startswith('Col'),
        query.startswith('Row'),
        query.startswith('COMMIT'),
    ])


engine = models.init()

query_log = []
logger = logging.getLogger('sqlalchemy.engine')
logger.setLevel(logging.DEBUG)
logger.addHandler(handler.ListHandler(query_log))

out = io.StringIO()

with contextlib.redirect_stdout(out):
    transaction.execute(engine)

filtered = filter(valid, query_log)
combined = dict(
    output=out.getvalue(),
    queries=[{'sql': q, 'time': .0} for q in filtered])

print(json.dumps(combined, indent=2))
