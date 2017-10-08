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

    connection = redis.Redis('redis', 6379)
    connection.publish(channel, result)

    return result
