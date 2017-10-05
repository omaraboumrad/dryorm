import time
import uuid

import redis
import rq

import tasks


if __name__ == '__main__':
    connection = redis.Redis('redis', 6379)
    queue = rq.Queue(connection=connection)
    job = queue.enqueue(tasks.run_django, uuid.uuid4().hex)

    time.sleep(5)

    print(job.result.decode('utf-8'))
