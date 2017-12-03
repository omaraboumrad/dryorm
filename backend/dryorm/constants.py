from collections import namedtuple

Executor = namedtuple('Executor', 'image key verbose')

JOB_FIRED_EVENT = 'job-fired'
JOB_DONE_EVENT = 'job-done'
JOB_INTERNAL_ERROR_EVENT = 'job-internal-error'
JOB_CODE_ERROR_EVENT = 'job-code-error'

EXECUTORS = (
    Executor(
        image='dryorm-executor/python-django',
        key='python/django',
        verbose='Python - Django'),
    Executor(
        image='dryorm-executor/python-sqlalchemy',
        key='python/sqlalchemy',
        verbose='Python - SQLAlchemy'),
    Executor(
        image='dryorm-executor/python-peewee',
        key='python/peewee',
        verbose='Python - Peewee')
)
