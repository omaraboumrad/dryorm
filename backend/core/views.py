import contextlib
import json
import os
import pickle
import uuid

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

import redis
import rq

import tasks


SCRIPT_PREPEND = """\
from core.models import *


def run():
"""


def indent(text):
    return '\n'.join('    {}'.format(t) for t in text.split('\n'))


@csrf_exempt
def invoke(request):
    connection = redis.Redis('redis')
    queue = rq.Queue(connection=connection)
    models_code = request.POST.get('models')
    trans_code = request.POST.get('transactions')

    models_file_name = uuid.uuid4().hex
    trans_file_name = uuid.uuid4().hex
    full_models_file_name = os.path.join(settings.SNIPS_DIR, models_file_name)
    full_trans_file_name = os.path.join(settings.SNIPS_DIR, trans_file_name)

    with contextlib.ExitStack() as stack:
        models_file = stack.enter_context(open(full_models_file_name, 'w'))
        trans_file = stack.enter_context(open(full_trans_file_name, 'w'))

        models_file.write(models_code)
        trans_file.write(SCRIPT_PREPEND + indent(trans_code))

        job = queue.enqueue(
            tasks.run_django,
            'back-channel',
            models_file_name,
            trans_file_name)

    return JsonResponse(dict(key=job.key.decode('utf-8')))


@csrf_exempt
def check(request):
    key = request.POST.get('job')
    connection = redis.Redis('redis')
    result = connection.hget(key, b'result')

    if result:
        value = dict(success=True, result=json.loads(pickle.loads(result)))
    else:
        value = dict(success=False)


    return JsonResponse(value)
