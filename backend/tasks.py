import contextlib
import os
import tempfile

import docker
import redis


def run_django(channel, models_file, transactions_file):
    client = docker.DockerClient(base_url='unix://var/run/docker.sock')

    models_target = {'bind': '/app/core/models.py', 'mode': 'ro'}
    trans_target = {'bind': '/app/core/scripts/sample_script.py', 'mode': 'ro'}

    result = client.containers.run(
        "djanground/executor",
        remove=True,
        volumes={
            # TODO: Figure out how to remove this abomination
            os.path.join('/Users/xterm/repos/djanground/backend/snips/', models_file): models_target,
            os.path.join('/Users/xterm/repos/djanground/backend/snips/', transactions_file): trans_target
        })

    if result:
        decoded = result.decode('utf-8')
        connection = redis.Redis('redis')
        connection.publish(channel, decoded)
        return decoded
    else:
        # TODO: NO! NOT! NEIN! this should return a dictionary or json
        # with the appropriate information as to what/why it failed
        return None
