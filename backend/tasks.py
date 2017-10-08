import contextlib
import tempfile

import docker
import redis


def run_django(channel, models_code, transactions_code):
    client = docker.DockerClient(base_url='unix://var/run/docker.sock')

    with contextlib.ExitStack() as stack:
        models_file = stack.enter_context(tempfile.NamedTemporaryFile())
        transactions_file = stack.enter_context(tempfile.NamedTemporaryFile())

        models_file.write(models_code.encode('utf-8'))
        transactions_file.write(transactions_code.encode('utf-8'))

        models_target = {'bind': '/app/core/models.py', 'mode': 'ro'}
        trans_target = {'bind': '/app/core/scripts/sample_script.py', 'mode': 'ro'}

        result = client.containers.run(
            "djanground/executor",
            remove=True,
            volumes={
                models_file.name: models_target,
                transactions_file.name : trans_target
            })

        connection = redis.Redis('redis', 6379)
        connection.publish(channel, result)

        return result
