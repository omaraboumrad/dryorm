import docker
client = docker.DockerClient(base_url='unix://var/run/docker.sock')
output = client.containers.run("djanground/executor", remove=True)

print('=== From backend container ===')
print(output)
