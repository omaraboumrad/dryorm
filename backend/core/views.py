import contextlib
import os
import uuid

from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

import redis
import rq

import tasks


@csrf_exempt
def invoke(request):
    connection = redis.Redis('redis', 6379)
    queue = rq.Queue(connection=connection)
    models_code = request.POST.get('models')
    transactions_code = request.POST.get('transactions')

    models_file_name = uuid.uuid4().hex
    trans_file_name = uuid.uuid4().hex
    full_models_file_name = os.path.join(settings.SNIPS_DIR, models_file_name)
    full_trans_file_name = os.path.join(settings.SNIPS_DIR, trans_file_name)

    with contextlib.ExitStack() as stack:
        models_file = stack.enter_context(open(full_models_file_name, 'w'))
        transactions_file = stack.enter_context(open(full_trans_file_name, 'w'))

        models_file.write(models_code)
        transactions_file.write(transactions_code)

        job = queue.enqueue(
            tasks.run_django,
            'back-channel',
            models_file_name,
            trans_file_name)

    return HttpResponse(job.key)
