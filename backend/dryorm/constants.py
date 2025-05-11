from dataclasses import dataclass


@dataclass
class Executor:
    image: str
    key: str
    verbose: str
    memory: str
    max_containers: int

@dataclass
class Database:
    key: str
    description: str
    host: str = ''
    port: int = 0
    user: str = ''
    password: str = ''

JOB_FIRED_EVENT = 'job-fired'
JOB_DONE_EVENT = 'job-done'
JOB_INTERNAL_ERROR_EVENT = 'job-internal-error'
JOB_CODE_ERROR_EVENT = 'job-code-error'
JOB_IMAGE_NOT_FOUND_ERROR_EVENT = 'job-image-not-found-error'
JOB_OOM_KILLED_EVENT = 'job-oom-killed'
JOB_NETWORK_DISABLED_EVENT = 'job-network-disabled'
JOB_TIMEOUT_EVENT = 'job-timeout'
JOB_OVERLOADED = 'job-overloaded'


EXECUTOR = Executor(
    image='dryorm-executor/python-django',
    key='python/django',
    memory='75m',
    verbose='Python - Django',
    max_containers=5,
)


DATABASES = {
    'sqlite': Database(
        key='sqlite',
        description='SQLite',
    ),
    'postgres': Database(
        key='postgres',
        description='PostgreSQL 17.4',
        host='database_snippets',
        port=5432,
        user='dryorm',
        password='dryorm',
    ),
}
