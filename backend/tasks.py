import json
import os

os.environ['DJANGO_SETTINGS_MODULE'] = 'dryorm.settings'

import channels
import docker

from docker.errors import (
    APIError,
    ContainerError,
    ImageNotFound,
)

from dryorm import constants


def run_django(channel, models, transaction, framework):
    client = docker.from_env()

    executor = [e for e in constants.EXECUTORS if e.key == framework][0]

    try:
        result = client.containers.run(
            executor.image,
            remove=True,
            environment=[
                'MODELS={}'.format(models),
                'TRANSACTION={}'.format(transaction)
            ])
    except ContainerError as error: # Do some logging
        reply = json.dumps(dict(
            event=constants.JOB_CODE_ERROR_EVENT,
            error=error.stderr.decode('utf-8')
        ))
    except ImageNotFound as error:
        reply = json.dumps(dict(
            event=constants.JOB_IMAGE_NOT_FOUND_ERROR_EVENT,
            error=f'Executor for {executor.verbose} not found!'
        ))
    except APIError as error:  # Do some logging
        reply = json.dumps(dict(
            event=constants.JOB_INTERNAL_ERROR_EVENT,
            error=error.explanation
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
