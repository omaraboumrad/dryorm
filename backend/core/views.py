from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

import redis
import rq

import tasks

@csrf_exempt
def invoke(request):
    connection = redis.Redis('redis', 6379)
    queue = rq.Queue(connection=connection)
    job = queue.enqueue(
        tasks.run_django,
        'back-channel',
        request.POST.get('models'),
        request.POST.get('transactions'))
    return HttpResponse('Success')
