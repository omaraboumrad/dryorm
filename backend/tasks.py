import hashlib
import subprocess
import traceback
import json
import os
import uuid
import redis
import time

os.environ["DJANGO_SETTINGS_MODULE"] = "dryorm.settings"

from django.core.cache import cache
import docker

from docker.errors import (
    APIError,
    ContainerError,
    ImageNotFound,
)

from dryorm import constants
from dryorm.databases import DATABASES


class OverloadedError(Exception):
    pass


def run_django_sync(code, database, ignore_cache=False, orm_version="django-5.2.8"):
    """Synchronous version for HTTP request/response cycle."""
    client = docker.from_env()
    redis_client = redis.Redis("redis")
    key = hashlib.md5(code.encode("utf-8")).hexdigest()

    executor = constants.get_executor(database, orm_version)
    selected_db = DATABASES.get(database, "sqlite")
    cached_reply = cache.get(f"{database}-{orm_version}-{key}")
    unique_name = None
    container = None
    container_slot_acquired = False

    try:
        # Is the result already cached?
        if cached_reply and not ignore_cache:
            return json.loads(cached_reply)
        else:
            # Use Redis to atomically check and increment container count
            container_count_key = "dryorm:running_containers"

            # Try to acquire a slot atomically
            with redis_client.pipeline() as pipe:
                while True:
                    try:
                        pipe.watch(container_count_key)
                        current_count = int(pipe.get(container_count_key) or 0)

                        if current_count >= executor.max_containers:
                            pipe.unwatch()
                            raise OverloadedError

                        # Atomically increment
                        pipe.multi()
                        pipe.incr(container_count_key)
                        pipe.expire(container_count_key, 60)  # Expire after 60s as safety
                        pipe.execute()
                        container_slot_acquired = True
                        break
                    except redis.WatchError:
                        # Another request modified the count, retry
                        continue

            if selected_db.needs_setup:
                unique_name = selected_db.setup()

            # Create and start container
            container_name = f"executor-{uuid.uuid4().hex[:6]}"

            environment = [
                f"CODE={code}",
                f"SERVICE_DB_HOST={selected_db.host}",
                f"SERVICE_DB_PORT={selected_db.port}",
                f"SERVICE_DB_USER={selected_db.user}",
                f"SERVICE_DB_PASSWORD={selected_db.password}",
                f"DB_TYPE={selected_db.key}",
                f"DB_NAME={unique_name}",
                f"DB_USER={unique_name}",
                f"DB_PASSWORD={unique_name}",
            ]

            container = client.containers.create(
                executor.image,
                name=container_name,
                mem_limit=executor.memory,
                memswap_limit=executor.memory,
                network="dryorm_snippets_net",
                environment=environment,
                detach=True,
            )

            # Start and wait for container
            container.start()
            exit_status = container.wait()

            # Read result from file instead of logs
            try:
                # Try to read from file first
                exec_result = container.exec_run('cat /tmp/result.json')

                if exec_result.exit_code == 0:
                    result = exec_result.output
                    print("Successfully read from /tmp/result.json")
                else:
                    # File doesn't exist or cat failed, fall back to logs
                    print(f"File read failed (exit code {exec_result.exit_code}), falling back to logs")
                    print(f"Exec output: {exec_result.output.decode('utf-8')}")
                    result = container.logs(stdout=True, stderr=False)
            except Exception as e:
                # If exec fails completely, fall back to logs
                print(f"Exec failed with exception: {e}, falling back to logs")
                result = container.logs(stdout=True, stderr=False)

            # Remove container
            container.remove()

            # Check if container exited with error
            if exit_status['StatusCode'] != 0:
                error = ContainerError(
                    container=container,
                    exit_status=exit_status['StatusCode'],
                    command='',
                    image=executor.image,
                    stderr=result
                )
                raise error
    except ContainerError as error:
        match error.exit_status:
            case 137:
                # OOM killed
                result_dict = {
                    "event": constants.JOB_OOM_KILLED_EVENT,
                    "error": "OOM! Please use less memory. Sorry!",
                }
            case 101:
                # Network Error
                result_dict = {
                    "event": constants.JOB_NETWORK_DISABLED_EVENT,
                    "error": "Network is disabled! Sorry!",
                }
            case 124:
                # Timeout
                result_dict = {
                    "event": constants.JOB_TIMEOUT_EVENT,
                    "error": "Timed out! Maximum allowed is 10 seconds. Sorry!",
                }
            case _:
                if error.stderr:
                    error_message = error.stderr.decode("utf-8")
                else:
                    error_message = str(error)

                if error.exit_status == 1 and (
                    "Network is unreachable" in error_message
                    or "Temporary failure in name resolution" in error_message
                ):
                    # Network Error
                    result_dict = {
                        "event": constants.JOB_NETWORK_DISABLED_EVENT,
                        "error": "Network is disabled! Sorry!",
                    }
                else:
                    result_dict = {
                        "event": constants.JOB_CODE_ERROR_EVENT,
                        "error": error_message
                    }
        return result_dict
    except ImageNotFound as error:
        return {
            "event": constants.JOB_IMAGE_NOT_FOUND_ERROR_EVENT,
            "error": f"Executor for {executor.verbose} not found!",
        }
    except APIError as error:
        return {
            "event": constants.JOB_INTERNAL_ERROR_EVENT,
            "error": error.explanation
        }
    except OverloadedError as error:
        return {
            "event": constants.JOB_OVERLOADED,
            "error": f"System is currently overloaded (>= {executor.max_containers} instances), please try again in a few! Sorry!",
        }
    except:
        # Catch-all for any other exceptions
        message = traceback.format_exc()
        return {
            "event": constants.JOB_INTERNAL_ERROR_EVENT,
            "error": f"Unknown error occurred. Please try again later.\n{message}",
        }
    else:
        decoded = result.decode("utf-8")

        # Debug: Log the raw output
        print("=" * 80)
        print("RAW CONTAINER OUTPUT:")
        print(decoded)
        print("=" * 80)
        print(f"Length: {len(decoded)} bytes")
        print(f"First 100 chars: {repr(decoded[:100])}")
        print(f"Last 100 chars: {repr(decoded[-100:])}")
        print("=" * 80)

        # TODO: too much encoding/decoding, should revisit
        try:
            result_dict = {
                "event": constants.JOB_DONE_EVENT,
                "result": json.loads(decoded)
            }
        except json.JSONDecodeError as e:
            print(f"JSON DECODE ERROR: {e}")
            print(f"Error at position {e.pos}")
            if e.pos < len(decoded):
                print(f"Context around error: {repr(decoded[max(0, e.pos-50):e.pos+50])}")
            raise

        # Cache the result
        reply_str = json.dumps(result_dict)
        cache.set(f"{database}-{orm_version}-{key}", reply_str, timeout=60 * 60 * 24 * 365)

        return result_dict
    finally:
        # Release container slot if it was acquired
        if container_slot_acquired:
            try:
                redis_client.decr("dryorm:running_containers")
            except:
                pass

        # Clean up container if it exists and wasn't removed
        if container:
            try:
                container.remove(force=True)
            except:
                pass  # Container may already be removed

        # Clean up database
        if not cached_reply or ignore_cache:
            if unique_name and selected_db.needs_setup:
                selected_db.teardown(unique_name)
