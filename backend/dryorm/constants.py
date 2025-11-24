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


# Supported ORM versions (ordered by preference, latest first)
ORM_VERSIONS = {
    "django-5.2.8": DjangoVersion(version="django-5.2.8", description="Django 5.2.8"),
    "django-4.2.26": DjangoVersion(version="django-4.2.26", description="Django 4.2.26 LTS"),
    "sqlalchemy-2.0": DjangoVersion(version="sqlalchemy-2.0", description="SQLAlchemy 2.0"),
    "prisma-6.3": DjangoVersion(version="prisma-6.3", description="Prisma 6.3"),
}

# Legacy aliases for backward compatibility
DJANGO_VERSIONS = {
    "5.2.8": DjangoVersion(version="5.2.8", description="Django 5.2.8"),
    "4.2.26": DjangoVersion(version="4.2.26", description="Django 4.2.26 LTS"),
}
SQLALCHEMY_VERSIONS = {
    "2.0": DjangoVersion(version="2.0", description="SQLAlchemy 2.0"),
}
PRISMA_VERSIONS = {
    "6.3": DjangoVersion(version="6.3", description="Prisma 6.3"),
}

# Executors organized by database and ORM version
EXECUTORS = {
    # Django executors
    ("postgres", "django-4.2.26"): Executor(
        image="dryorm-executor/python-django-postgres-4.2.26",
        key="python/django/postgres/4.2.26",
        verbose="Python - Django 4.2.26 - PostgreSQL",
        memory="75m",
        max_containers=10,
        django_version="django-4.2.26",
        database="postgres",
    ),
    ("postgres", "django-5.2.8"): Executor(
        image="dryorm-executor/python-django-postgres-5.2.8",
        key="python/django/postgres/5.2.8",
        verbose="Python - Django 5.2.8 - PostgreSQL",
        memory="75m",
        max_containers=10,
        django_version="django-5.2.8",
        database="postgres",
    ),
    ("mariadb", "django-4.2.26"): Executor(
        image="dryorm-executor/python-django-mariadb-4.2.26",
        key="python/django/mariadb/4.2.26",
        verbose="Python - Django 4.2.26 - MariaDB",
        memory="75m",
        max_containers=10,
        django_version="django-4.2.26",
        database="mariadb",
    ),
    ("mariadb", "django-5.2.8"): Executor(
        image="dryorm-executor/python-django-mariadb-5.2.8",
        key="python/django/mariadb/5.2.8",
        verbose="Python - Django 5.2.8 - MariaDB",
        memory="75m",
        max_containers=10,
        django_version="django-5.2.8",
        database="mariadb",
    ),
    ("sqlite", "django-4.2.26"): Executor(
        image="dryorm-executor/python-django-postgres-4.2.26",  # Use postgres base for sqlite
        key="python/django/sqlite/4.2.26",
        verbose="Python - Django 4.2.26 - SQLite",
        memory="75m",
        max_containers=10,
        django_version="django-4.2.26",
        database="sqlite",
    ),
    ("sqlite", "django-5.2.8"): Executor(
        image="dryorm-executor/python-django-postgres-5.2.8",  # Use postgres base for sqlite
        key="python/django/sqlite/5.2.8",
        verbose="Python - Django 5.2.8 - SQLite",
        memory="75m",
        max_containers=10,
        django_version="django-5.2.8",
        database="sqlite",
    ),
    # SQLAlchemy executors
    ("postgres", "sqlalchemy-2.0"): Executor(
        image="dryorm-executor/python-sqlalchemy-postgres-2.0",
        key="python/sqlalchemy/postgres/2.0",
        verbose="Python - SQLAlchemy 2.0 - PostgreSQL",
        memory="75m",
        max_containers=10,
        django_version="sqlalchemy-2.0",
        database="postgres",
    ),
    ("mariadb", "sqlalchemy-2.0"): Executor(
        image="dryorm-executor/python-sqlalchemy-mariadb-2.0",
        key="python/sqlalchemy/mariadb/2.0",
        verbose="Python - SQLAlchemy 2.0 - MariaDB",
        memory="75m",
        max_containers=10,
        django_version="sqlalchemy-2.0",
        database="mariadb",
    ),
    ("sqlite", "sqlalchemy-2.0"): Executor(
        image="dryorm-executor/python-sqlalchemy-postgres-2.0",  # Use postgres base for sqlite
        key="python/sqlalchemy/sqlite/2.0",
        verbose="Python - SQLAlchemy 2.0 - SQLite",
        memory="75m",
        max_containers=10,
        django_version="sqlalchemy-2.0",
        database="sqlite",
    ),
    # Prisma executors
    ("postgres", "prisma-6.3"): Executor(
        image="dryorm-executor/nodejs-prisma-postgres-6.3",
        key="nodejs/prisma/postgres/6.3",
        verbose="Node.js - Prisma 6.3 - PostgreSQL",
        memory="250m",
        max_containers=10,
        django_version="prisma-6.3",
        database="postgres",
    ),
    ("mariadb", "prisma-6.3"): Executor(
        image="dryorm-executor/nodejs-prisma-mariadb-6.3",
        key="nodejs/prisma/mariadb/6.3",
        verbose="Node.js - Prisma 6.3 - MariaDB",
        memory="250m",
        max_containers=10,
        django_version="prisma-6.3",
        database="mariadb",
    ),
    ("sqlite", "prisma-6.3"): Executor(
        image="dryorm-executor/nodejs-prisma-postgres-6.3",  # Use postgres base for sqlite
        key="nodejs/prisma/sqlite/6.3",
        verbose="Node.js - Prisma 6.3 - SQLite",
        memory="250m",
        max_containers=10,
        django_version="prisma-6.3",
        database="sqlite",
    ),
}


def get_executor(database: str, orm_version: str) -> Executor:
    """Get the appropriate executor for the given database and ORM version."""
    key = (database, orm_version)

    # Support legacy format (without 'django-', 'sqlalchemy-', or 'prisma-' prefix)
    if key not in EXECUTORS:
        # Try adding django- prefix for backward compatibility
        if not orm_version.startswith(('django-', 'sqlalchemy-', 'prisma-')):
            key = (database, f"django-{orm_version}")

    if key not in EXECUTORS:
        # Default to latest Django version if specific combination not found
        key = (database, "django-5.2.8")

    return EXECUTORS.get(key, EXECUTORS[("sqlite", "django-5.2.8")])
