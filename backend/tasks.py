import docker

client = docker.DockerClient(base_url='unix://var/run/docker.sock')

def run_django():
    return client.containers.run("djanground/executor", remove=True)
