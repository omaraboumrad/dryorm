import json

import channels
import redis
import rq

from dryorm import constants
import tasks


def ws_message(message):
    connection = redis.Redis('redis')
    queue = rq.Queue(connection=connection)

    payload = json.loads(message.content['text'])
    framework = payload['framework']
    models_code = payload['models']
    trans_code = payload['transactions']

    job = queue.enqueue(
        tasks.run_django,
        message.reply_channel.name,
        models_code,
        trans_code,
        framework)

    reply = json.dumps(dict(
        event=constants.JOB_FIRED_EVENT,
        key=job.key.decode('utf-8')
    ))

    message.reply_channel.send(dict(text=reply))
