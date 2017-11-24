import json
import os

os.environ['DJANGO_SETTINGS_MODULE'] = 'dryorm.settings'

import channels
import docker

from docker.errors import APIError, ContainerError

from dryorm import constants


def run_django(channel, models, transaction):
    client = docker.from_env()

    try:
        result = client.containers.run(
            "dryorm/executor",
            remove=True,
            environment=[
                'MODELS={}'.format(models),
                'TRANSACTION={}'.format(transaction)
            ])

    except APIError as error:  # Do some logging
        reply = json.dumps(dict(
            event=constants.JOB_INTERNAL_ERROR_EVENT,
            error=error.explanation.decode('utf-8')
        ))
    except ContainerError as error: # Do some logging
        reply = json.dumps(dict(
            event=constants.JOB_CODE_ERROR_EVENT,
            error=error.stderr.decode('utf-8')
        ))
    else:
        decoded = result.decode('utf-8')

        # TODO: too much encoding/decoding, should revisit
        reply = json.dumps(dict(
            event=constants.JOB_DONE_EVENT,
            result=json.loads(decoded)
        ))
    finally:
        channels.Channel(channel).send(dict(text=reply))
