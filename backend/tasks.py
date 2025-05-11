import hashlib
import subprocess
import traceback
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

def run_django(channel, code, database, ignore_cache=False):
    client = docker.from_env()
    key = hashlib.md5(code.encode('utf-8')).hexdigest()

    channel_layer = get_channel_layer()
    executor = constants.EXECUTOR
    selected_db = constants.DATABASES.get(database)
    cached_reply = cache.get(f'{database}-{key}')
    random_hash = uuid.uuid4().hex[:6]

    try:
        # Is the result already cached?
        if cached_reply and not ignore_cache:
            async_to_sync(channel_layer.send)(channel, {
                "type": "websocket.send",
                "text": cached_reply
            })
            return
        else:
            running = find_running_django_containers(client, prefix='django-')

            if len(running) >= executor.max_containers:
                raise OverloadedError

            environment = [
                f'CODE={code}',
                f'SERVICE_DB_HOST={selected_db.host}',
                f'SERVICE_DB_PORT={selected_db.port}',
                f'SERVICE_DB_USER={selected_db.user}',
                f'SERVICE_DB_PASSWORD={selected_db.password}',
                f'DB_TYPE={selected_db.key}',
                f'DB_NAME={selected_db.key}-{random_hash}',
                f'DB_USER={selected_db.key}-{random_hash}',
                f'DB_PASSWORD={selected_db.key}-{random_hash}',
            ]


            result = client.containers.run(
                executor.image,
                name=f'django-{uuid.uuid4().hex[:6]}',
                mem_limit=executor.memory,
                memswap_limit=executor.memory,
                network='dryorm_snippets_net',
                remove=True,
                environment=environment,
            )
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
    except:
        # Catch-all for any other exceptions
        message = traceback.format_exc()
        reply = json.dumps(dict(
            event=constants.JOB_INTERNAL_ERROR_EVENT,
            error=f"Unknown error occurred. Please try again later.\n{message}"
        ))
    else:
        decoded = result.decode('utf-8')

        # TODO: too much encoding/decoding, should revisit
        reply = json.dumps(dict(
            event=constants.JOB_DONE_EVENT,
            result=json.loads(decoded)
        ))
        cache.set(f'{database}-{key}', reply, timeout=60 * 60 * 24 * 365)
    finally:
        if not cached_reply or ignore_cache:
            subprocess.run([
                'psql',
                '-h', selected_db.host,
                '-p', str(selected_db.port),
                '-U', selected_db.user,
                '-c', f'DROP DATABASE "{selected_db.key}-{random_hash}";'
            ], env={**os.environ, 'PGPASSWORD': selected_db.password})


            async_to_sync(channel_layer.send)(channel, {
                "type": "websocket.send",
                "text": reply
            })
