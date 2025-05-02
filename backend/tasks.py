import json
import os

os.environ['DJANGO_SETTINGS_MODULE'] = 'dryorm.settings'

import channels
import docker
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from docker.errors import (
    APIError,
    ContainerError,
    ImageNotFound,
)

from dryorm import constants


def run_django(channel, code, framework):
    client = docker.from_env()

    executor = [e for e in constants.EXECUTORS if e.key == framework][0]

    try:
        result = client.containers.run(
            executor.image,
            mem_limit=executor.memory,
            memswap_limit=executor.memory,
            network_disabled=True,
            remove=True,
            environment=[
                'CODE={}'.format(code),
            ])
    except ContainerError as error: # Do some logging
        if error.exit_status == 137:
            reply = json.dumps(dict(
                event=constants.JOB_OOM_KILLED_EVENT,
                error="OOM! Please use less memory. Thanks!"
            ))
        else:
            reply = json.dumps(dict(
                event=constants.JOB_CODE_ERROR_EVENT,
                error=error.stderr.decode('utf-8') if error.stderr else str(error)
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
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.send)(channel, {
            "type": "websocket.send",
            "text": reply
        })
