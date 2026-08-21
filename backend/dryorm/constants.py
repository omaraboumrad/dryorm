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
    "django-6.1": DjangoVersion(version="django-6.1", description="Django 6.1"),
    "django-6.0": DjangoVersion(version="django-6.0", description="Django 6.0"),
    "django-5.2.8": DjangoVersion(version="django-5.2.8", description="Django 5.2.8 LTS"),
    "django-4.2.26": DjangoVersion(version="django-4.2.26", description="Django 4.2.26 LTS"),
}

# Legacy aliases for backward compatibility
DJANGO_VERSIONS = {
    "6.1": DjangoVersion(version="6.1", description="Django 6.1"),
    "6.0": DjangoVersion(version="6.0", description="Django 6.0"),
    "5.2.8": DjangoVersion(version="5.2.8", description="Django 5.2.8 LTS"),
    "4.2.26": DjangoVersion(version="4.2.26", description="Django 4.2.26 LTS"),
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
    ("postgres", "django-6.0"): Executor(
        image="dryorm-executor/python-django-postgres-6.0",
        key="python/django/postgres/6.0",
        verbose="Python - Django 6.0 - PostgreSQL",
        memory="75m",
        max_containers=10,
        django_version="django-6.0",
        database="postgres",
    ),
    ("postgres", "django-6.1"): Executor(
        image="dryorm-executor/python-django-postgres-6.1",
        key="python/django/postgres/6.1",
        verbose="Python - Django 6.1 - PostgreSQL",
        memory="75m",
        max_containers=10,
        django_version="django-6.1",
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
    ("mariadb", "django-6.0"): Executor(
        image="dryorm-executor/python-django-mariadb-6.0",
        key="python/django/mariadb/6.0",
        verbose="Python - Django 6.0 - MariaDB",
        memory="75m",
        max_containers=10,
        django_version="django-6.0",
        database="mariadb",
    ),
    ("mariadb", "django-6.1"): Executor(
        image="dryorm-executor/python-django-mariadb-6.1",
        key="python/django/mariadb/6.1",
        verbose="Python - Django 6.1 - MariaDB",
        memory="75m",
        max_containers=10,
        django_version="django-6.1",
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
    ("sqlite", "django-6.0"): Executor(
        image="dryorm-executor/python-django-postgres-6.0",  # Use postgres base for sqlite
        key="python/django/sqlite/6.0",
        verbose="Python - Django 6.0 - SQLite",
        memory="75m",
        max_containers=10,
        django_version="django-6.0",
        database="sqlite",
    ),
    ("sqlite", "django-6.1"): Executor(
        image="dryorm-executor/python-django-postgres-6.1",  # Use postgres base for sqlite
        key="python/django/sqlite/6.1",
        verbose="Python - Django 6.1 - SQLite",
        memory="75m",
        max_containers=10,
        django_version="django-6.1",
        database="sqlite",
    ),
    ("postgis", "django-4.2.26"): Executor(
        image="dryorm-executor/python-django-postgis-4.2.26",
        key="python/django/postgis/4.2.26",
        verbose="Python - Django 4.2.26 - PostGIS",
        memory="75m",
        max_containers=10,
        django_version="django-4.2.26",
        database="postgis",
    ),
    ("postgis", "django-5.2.8"): Executor(
        image="dryorm-executor/python-django-postgis-5.2.8",
        key="python/django/postgis/5.2.8",
        verbose="Python - Django 5.2.8 - PostGIS",
        memory="75m",
        max_containers=10,
        django_version="django-5.2.8",
        database="postgis",
    ),
    ("postgis", "django-6.0"): Executor(
        image="dryorm-executor/python-django-postgis-6.0",
        key="python/django/postgis/6.0",
        verbose="Python - Django 6.0 - PostGIS",
        memory="75m",
        max_containers=10,
        django_version="django-6.0",
        database="postgis",
    ),
    ("postgis", "django-6.1"): Executor(
        image="dryorm-executor/python-django-postgis-6.1",
        key="python/django/postgis/6.1",
        verbose="Python - Django 6.1 - PostGIS",
        memory="75m",
        max_containers=10,
        django_version="django-6.1",
        database="postgis",
    ),
}


# PR mode executors - Django is installed at runtime from mounted PR source
PR_EXECUTORS = {
    "postgres": Executor(
        image="dryorm-executor/python-django-pr-postgres",
        key="python/django/pr/postgres",
        verbose="Python - Django PR - PostgreSQL",
        memory="150m",  # Higher memory for pip install at runtime
        max_containers=5,
        django_version="pr",
        database="postgres",
    ),
    "mariadb": Executor(
        image="dryorm-executor/python-django-pr-mariadb",
        key="python/django/pr/mariadb",
        verbose="Python - Django PR - MariaDB",
        memory="150m",
        max_containers=5,
        django_version="pr",
        database="mariadb",
    ),
    "sqlite": Executor(
        image="dryorm-executor/python-django-pr-postgres",  # Use postgres base for sqlite
        key="python/django/pr/sqlite",
        verbose="Python - Django PR - SQLite",
        memory="150m",
        max_containers=5,
        django_version="pr",
        database="sqlite",
    ),
    "postgis": Executor(
        image="dryorm-executor/python-django-pr-postgis",
        key="python/django/pr/postgis",
        verbose="Python - Django PR - PostGIS",
        memory="150m",
        max_containers=5,
        django_version="pr",
        database="postgis",
    ),
}


def get_executor(database: str, orm_version: str) -> Executor:
    """Get the appropriate executor for the given database and ORM version."""
    key = (database, orm_version)

    # Support legacy format (a bare version without the 'django-' prefix)
    if key not in EXECUTORS:
        if not orm_version.startswith('django-'):
            key = (database, f"django-{orm_version}")

    if key not in EXECUTORS:
        # Default to latest Django version if specific combination not found
        key = (database, "django-6.1")

    return EXECUTORS.get(key, EXECUTORS[("sqlite", "django-6.1")])


def get_pr_executor(database: str) -> Executor:
    """Get the PR mode executor for the given database."""
    return PR_EXECUTORS.get(database, PR_EXECUTORS["postgres"])
