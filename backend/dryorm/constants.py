from dataclasses import dataclass


@dataclass
class Executor:
    image: str
    key: str
    verbose: str
    memory: str
    max_containers: int


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

# Executor(
#     image='dryorm-executor/python-sqlalchemy',
#     key='python/sqlalchemy',
#     verbose='Python - SQLAlchemy'),
# Executor(
#     image='dryorm-executor/python-peewee',
#     key='python/peewee',
#     verbose='Python - Peewee')
