import json

import channels
import redis
import rq

from djanground import constants
import tasks


SCRIPT_PREPEND = """\
from core.models import *


def run():
"""


def indent(text):
    return '\n'.join('    {}'.format(t) for t in text.split('\n'))


def ws_message(message):
    connection = redis.Redis('redis')
    queue = rq.Queue(connection=connection)

    payload = json.loads(message.content['text'])
    models_code = payload['models']
    trans_code = payload['transactions']
    trans_code = SCRIPT_PREPEND + indent(trans_code)

    job = queue.enqueue(
        tasks.run_django,
        message.reply_channel.name,
        models_code,
        trans_code)

    reply = json.dumps(dict(
        event=constants.JOB_FIRED_EVENT,
        key=job.key.decode('utf-8')
    ))

    message.reply_channel.send(dict(text=reply))
