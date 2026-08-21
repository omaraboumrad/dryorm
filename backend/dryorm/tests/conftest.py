import textwrap
import uuid

import pytest

from dryorm import constants
from dryorm.tasks import run_django_sync

DEFAULT_ORM_VERSION = "django-6.1"


def execute(code, database="sqlite", orm_version=DEFAULT_ORM_VERSION):
    """Run a snippet the way a request does, and return the executor payload.

    Always bypasses the cache: the filebased cache outlives the test process,
    so a cached result would make a broken executor look healthy.
    """
    return run_django_sync(
        textwrap.dedent(code).strip() + "\n",
        database,
        ignore_cache=True,
        orm_version=orm_version,
    )


def execute_ok(code, database="sqlite", orm_version=DEFAULT_ORM_VERSION):
    """Run a snippet and assert it completed, returning just the result body."""
    reply = execute(code, database, orm_version)
    assert reply["event"] == constants.JOB_DONE_EVENT, reply.get("error")
    return reply["result"]


def execute_cached(code, database="sqlite", orm_version=DEFAULT_ORM_VERSION):
    """Run a snippet with the cache live, as production does."""
    return run_django_sync(
        textwrap.dedent(code).strip() + "\n",
        database,
        ignore_cache=False,
        orm_version=orm_version,
    )


@pytest.fixture
def run_cached():
    return execute_cached


@pytest.fixture
def unique_snippet():
    """A snippet whose code differs every call, so it misses the cache.

    The filebased cache is keyed on a hash of the code and survives between
    test runs.
    """

    def build(body="return {}"):
        marker = uuid.uuid4().hex
        return f"# {marker}\ndef run():\n    {body}\n"

    return build


@pytest.fixture
def default_database(request):
    """The backend a test runs against unless it names one explicitly.

    Parametrized indirectly by the `cross_backend` mark below.
    """
    return getattr(request, "param", "sqlite")


@pytest.fixture
def run(default_database):
    def _run(code, database=None, orm_version=DEFAULT_ORM_VERSION):
        return execute_ok(code, database or default_database, orm_version)

    return _run


@pytest.fixture
def run_raw(default_database):
    def _run(code, database=None, orm_version=DEFAULT_ORM_VERSION):
        return execute(code, database or default_database, orm_version)

    return _run


ALL_BACKENDS = ["sqlite", "postgres", "mariadb", "postgis"]


def pytest_addoption(parser):
    parser.addoption(
        "--backends",
        default=",".join(ALL_BACKENDS),
        help="Comma-separated backends for cross_backend tests. Narrow it to "
        "sqlite for a fast inner loop.",
    )


def pytest_generate_tests(metafunc):
    """Expand every cross_backend test over the requested backends.

    Deciding up front which assertions could not possibly differ per backend
    turned out to be a bad bet, so the default is all of them.
    """
    if metafunc.definition.get_closest_marker("cross_backend"):
        backends = [b.strip() for b in metafunc.config.getoption("--backends").split(",")]
        metafunc.parametrize("default_database", backends, indirect=True)
