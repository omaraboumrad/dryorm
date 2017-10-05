import docker
import redis


def run_django(channel):
    client = docker.DockerClient(base_url='unix://var/run/docker.sock')
    result = client.containers.run("djanground/executor", remove=True)

    connection = redis.Redis('redis', 6379)
    connection.publish(channel, result)

    return result
