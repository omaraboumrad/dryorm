import signal
import sys

from django.core.management import call_command
from django.core.management.base import BaseCommand

# How long the user's own code may run. Migrating their models is not counted
# against it, which is what the three-invocation run.sh did by wrapping only
# `execute` in `timeout`.
EXECUTE_TIMEOUT = 10

# `timeout` exits with this; tasks.py maps it to the job-timeout event.
TIMEOUT_EXIT_CODE = 124


class SnippetTimeout(Exception):
    pass


class Command(BaseCommand):
    """Migrate the snippet's models and execute it, all in one process.

    run.sh used to invoke makemigrations, migrate and execute as three separate
    manage.py calls, which booted Django three times. On the PostGIS image that
    cost roughly 1.5s of the run before any of the user's code ran.

    makemigrations writes app/migrations/0001_initial.py and migrate picks it up
    in the same process because MigrationLoader.load_disk() reloads a migrations
    package it has already imported.
    """

    help = "Migrates the snippet's models and executes it"

    def handle(self, *args, **options):
        call_command("makemigrations", "app", verbosity=0)
        call_command("migrate", verbosity=0)

        signal.signal(signal.SIGALRM, self._timed_out)
        signal.alarm(EXECUTE_TIMEOUT)
        try:
            call_command("execute", stdout=self.stdout)
        except SnippetTimeout:
            sys.exit(TIMEOUT_EXIT_CODE)
        finally:
            signal.alarm(0)

    def _timed_out(self, signum, frame):
        raise SnippetTimeout
