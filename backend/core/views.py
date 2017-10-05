from django.http import HttpResponse

import redis
import rq

import tasks


def invoke(request):
    connection = redis.Redis('redis', 6379)
    queue = rq.Queue(connection=connection)
    job = queue.enqueue(tasks.run_django, 'back-channel')
    return HttpResponse('Success')
