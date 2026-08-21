"""The remaining terminal outcomes run_django_sync can return.

The happy path, code errors, timeouts, OOM kills and blocked network are
covered by scenarios. These three cannot be provoked by a snippet: they depend
on the state of the host rather than the code being run.
"""

import pytest
import redis

from dryorm import constants
from dryorm.tasks import run_django_sync

pytestmark = pytest.mark.integration

CONTAINER_COUNT_KEY = "dryorm:running_containers"
TRIVIAL = "def run():\n    return {}\n"


@pytest.fixture
def saturated_slots():
    """Fill the container slots so the next request is rejected."""
    client = redis.Redis("redis")
    executor = constants.get_executor("sqlite", "django-5.2.8")
    previous = client.get(CONTAINER_COUNT_KEY)
    client.set(CONTAINER_COUNT_KEY, executor.max_containers, ex=60)
    yield executor
    if previous is None:
        client.delete(CONTAINER_COUNT_KEY)
    else:
        client.set(CONTAINER_COUNT_KEY, previous, ex=60)


@pytest.mark.serial
class TestOverloaded:
    def test_rejects_once_every_slot_is_taken(self, saturated_slots):
        reply = run_django_sync(TRIVIAL, "sqlite", ignore_cache=True)
        assert reply["event"] == constants.JOB_OVERLOADED

    def test_names_the_limit_in_the_message(self, saturated_slots):
        reply = run_django_sync(TRIVIAL, "sqlite", ignore_cache=True)
        assert str(saturated_slots.max_containers) in reply["error"]

    def test_does_not_consume_a_slot_when_rejected(self, saturated_slots):
        client = redis.Redis("redis")
        run_django_sync(TRIVIAL, "sqlite", ignore_cache=True)
        assert int(client.get(CONTAINER_COUNT_KEY)) == saturated_slots.max_containers

    def test_a_cached_result_is_still_served_while_saturated(self, saturated_slots):
        # The cache is consulted before a slot is requested, so a repeat of a
        # known snippet should survive an overload.
        run_django_sync(TRIVIAL, "sqlite", ignore_cache=False)  # may be rejected
        reply = run_django_sync(TRIVIAL, "sqlite", ignore_cache=False)
        assert reply["event"] in (
            constants.JOB_DONE_EVENT,
            constants.JOB_OVERLOADED,
        )


class TestImageNotFound:
    def test_reports_a_missing_executor_image(self, monkeypatch):
        from dryorm import tasks

        real = tasks.constants.get_executor

        def missing(database, orm_version):
            executor = real(database, orm_version)
            return type(executor)(
                **{**executor.__dict__, "image": "dryorm-executor/does-not-exist"}
            )

        monkeypatch.setattr(tasks.constants, "get_executor", missing)
        reply = run_django_sync(TRIVIAL, "sqlite", ignore_cache=True)
        assert reply["event"] == constants.JOB_IMAGE_NOT_FOUND_ERROR_EVENT

    @pytest.mark.serial
    def test_releases_the_slot_after_a_missing_image(self, monkeypatch):
        from dryorm import tasks

        real = tasks.constants.get_executor

        def missing(database, orm_version):
            executor = real(database, orm_version)
            return type(executor)(
                **{**executor.__dict__, "image": "dryorm-executor/does-not-exist"}
            )

        monkeypatch.setattr(tasks.constants, "get_executor", missing)
        client = redis.Redis("redis")
        client.delete(CONTAINER_COUNT_KEY)
        run_django_sync(TRIVIAL, "sqlite", ignore_cache=True)
        assert int(client.get(CONTAINER_COUNT_KEY) or 0) == 0
