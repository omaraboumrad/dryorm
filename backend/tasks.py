import docker
import redis


def run_django(channel, models, transaction):
    client = docker.DockerClient(base_url='unix://var/run/docker.sock')

    result = client.containers.run(
        "djanground/executor",
        remove=True,
        environment=[
            'MODELS={}'.format(models),
            'TRANSACTION={}'.format(transaction)
        ])

    if result:
        decoded = result.decode('utf-8')
        connection = redis.Redis('redis')
        connection.publish(channel, decoded)
        return decoded
    else:
        # TODO: NO! NOT! NEIN! this should return a dictionary or json
        # with the appropriate information as to what/why it failed
        return None
