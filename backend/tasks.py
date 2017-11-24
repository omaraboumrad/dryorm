import json
import os

os.environ['DJANGO_SETTINGS_MODULE'] = 'dryorm.settings'

import channels
import docker

from dryorm import constants


def run_django(channel, models, transaction):
    client = docker.DockerClient(base_url='unix://var/run/docker.sock')

    result = client.containers.run(
        "dryorm/executor",
        remove=True,
        environment=[
            'MODELS={}'.format(models),
            'TRANSACTION={}'.format(transaction)
        ])

    if result:
        decoded = result.decode('utf-8')


        # TODO: too much encoding/decoding, should revisit
        reply = json.dumps(dict(
            event=constants.JOB_DONE_EVENT,
            result=json.loads(decoded)
        ))

        channels.Channel(channel).send(dict(text=reply))
        return decoded
    else:
        # TODO: NO! NOT! NEIN! this should return a dictionary or json
        # with the appropriate information as to what/why it failed
        return None
