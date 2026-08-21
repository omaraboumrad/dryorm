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
def run():
    return execute_ok


@pytest.fixture
def run_raw():
    return execute
