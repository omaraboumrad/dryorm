import hashlib
import json
import os
import uuid

os.environ['DJANGO_SETTINGS_MODULE'] = 'dryorm.settings'

from django.core.cache import cache
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

class OverloadedError(Exception):
    pass

def find_running_django_containers(client, prefix='django-'):
    return [
        container for container in client.containers.list()
        if container.name.startswith(prefix)
    ]

def run_django(channel, code):
    client = docker.from_env()
    key = hashlib.md5(code.encode('utf-8')).hexdigest()

    channel_layer = get_channel_layer()
    executor = constants.EXECUTOR

    try:
        # Is the result already cached?
        if reply := cache.get(key):
            async_to_sync(channel_layer.send)(channel, {
                "type": "websocket.send",
                "text": reply
            })
            return
        else:
            running = find_running_django_containers(client, prefix='django-')

            if len(running) >= executor.max_containers:
                raise OverloadedError

            container_name = f'django-{uuid.uuid4().hex[:6]}'
            result = client.containers.run(
                executor.image,
                name=container_name,
                mem_limit=executor.memory,
                memswap_limit=executor.memory,
                network_disabled=True,
                remove=True,
                environment=[
                    'CODE={}'.format(code),
                ])
    except ContainerError as error: # Do some logging
        match error.exit_status:
            case 137:
                # OOM killed
                reply = json.dumps(dict(
                    event=constants.JOB_OOM_KILLED_EVENT,
                    error="OOM! Please use less memory. Sorry!"
                ))
            case 101:
                # Network Error
                reply = json.dumps(dict(
                    event=constants.JOB_NETWORK_DISABLED_EVENT,
                    error="Network is disabled! Sorry!"
                ))
            case 124:
                # Network Error
                reply = json.dumps(dict(
                    event=constants.JOB_TIMEOUT_EVENT,
                    error="Timed out! Maximum allowed is 10 seconds. Sorry!"
                ))
            case _:
                if error.stderr:
                    error_message = error.stderr.decode('utf-8')
                else:
                    error_message = str(error)

                if error.exit_status == 1 and ('Network is unreachable' in error_message or 'Temporary failure in name resolution' in error_message):
                    # Network Error
                    reply = json.dumps(dict(
                        event=constants.JOB_NETWORK_DISABLED_EVENT,
                        error="Network is disabled! Sorry!"
                    ))
                else:
                    reply = json.dumps(dict(
                        event=constants.JOB_CODE_ERROR_EVENT,
                        error=error_message
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
    except OverloadedError as error:
        reply = json.dumps(dict(
            event=constants.JOB_OVERLOADED,
            error=f"System is currently overloaded (>= {executor.max_containers} instances), please try again in a few! Sorry!"
        ))
    else:
        decoded = result.decode('utf-8')

        # TODO: too much encoding/decoding, should revisit
        reply = json.dumps(dict(
            event=constants.JOB_DONE_EVENT,
            result=json.loads(decoded)
        ))
    finally:
        cache.set(key, reply)
        async_to_sync(channel_layer.send)(channel, {
            "type": "websocket.send",
            "text": reply
        })
