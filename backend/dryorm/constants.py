from dataclasses import dataclass


@dataclass
class Executor:
    image: str
    key: str
    verbose: str
    memory: str
    max_containers: int
    django_version: str
    database: str


@dataclass
class DjangoVersion:
    version: str
    description: str


JOB_FIRED_EVENT = "job-fired"
JOB_DONE_EVENT = "job-done"
JOB_INTERNAL_ERROR_EVENT = "job-internal-error"
JOB_CODE_ERROR_EVENT = "job-code-error"
JOB_IMAGE_NOT_FOUND_ERROR_EVENT = "job-image-not-found-error"
JOB_OOM_KILLED_EVENT = "job-oom-killed"
JOB_NETWORK_DISABLED_EVENT = "job-network-disabled"
JOB_TIMEOUT_EVENT = "job-timeout"
JOB_OVERLOADED = "job-overloaded"


# Supported Django versions (ordered by preference, latest first)
DJANGO_VERSIONS = {
    "5.2.8": DjangoVersion(version="5.2.8", description="Django 5.2.8"),
    "4.2.26": DjangoVersion(version="4.2.26", description="Django 4.2.26 LTS"),
}

# Executors organized by database and django version
EXECUTORS = {
    ("postgres", "4.2.26"): Executor(
        image="dryorm-executor/python-django-postgres-4.2.26",
        key="python/django/postgres/4.2.26",
        verbose="Python - Django 4.2.26 - PostgreSQL",
        memory="75m",
        max_containers=10,
        django_version="4.2.26",
        database="postgres",
    ),
    ("postgres", "5.2.8"): Executor(
        image="dryorm-executor/python-django-postgres-5.2.8",
        key="python/django/postgres/5.2.8",
        verbose="Python - Django 5.2.8 - PostgreSQL",
        memory="75m",
        max_containers=10,
        django_version="5.2.8",
        database="postgres",
    ),
    ("mariadb", "4.2.26"): Executor(
        image="dryorm-executor/python-django-mariadb-4.2.26",
        key="python/django/mariadb/4.2.26",
        verbose="Python - Django 4.2.26 - MariaDB",
        memory="75m",
        max_containers=10,
        django_version="4.2.26",
        database="mariadb",
    ),
    ("mariadb", "5.2.8"): Executor(
        image="dryorm-executor/python-django-mariadb-5.2.8",
        key="python/django/mariadb/5.2.8",
        verbose="Python - Django 5.2.8 - MariaDB",
        memory="75m",
        max_containers=10,
        django_version="5.2.8",
        database="mariadb",
    ),
    ("sqlite", "4.2.26"): Executor(
        image="dryorm-executor/python-django-postgres-4.2.26",  # Use postgres base for sqlite
        key="python/django/sqlite/4.2.26",
        verbose="Python - Django 4.2.26 - SQLite",
        memory="75m",
        max_containers=10,
        django_version="4.2.26",
        database="sqlite",
    ),
    ("sqlite", "5.2.8"): Executor(
        image="dryorm-executor/python-django-postgres-5.2.8",  # Use postgres base for sqlite
        key="python/django/sqlite/5.2.8",
        verbose="Python - Django 5.2.8 - SQLite",
        memory="75m",
        max_containers=10,
        django_version="5.2.8",
        database="sqlite",
    ),
}


def get_executor(database: str, django_version: str) -> Executor:
    """Get the appropriate executor for the given database and Django version."""
    key = (database, django_version)
    if key not in EXECUTORS:
        # Default to latest version if specific combination not found
        key = (database, "5.2.8")
    return EXECUTORS.get(key, EXECUTORS[("sqlite", "5.2.8")])
