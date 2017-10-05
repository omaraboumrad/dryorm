import docker

from rq import get_current_job


def run_django(channel):

    # channel will eventually be the actual reply_channel
    # and instead of storing it in the meta, the result
    # will be published to redis through PUBLISH and
    # read back from the backend using SUBSCRIBE

    job = get_current_job()
    job.meta['channel'] = channel
    job.save_meta()

    client = docker.DockerClient(base_url='unix://var/run/docker.sock')
    return client.containers.run("djanground/executor", remove=True)
