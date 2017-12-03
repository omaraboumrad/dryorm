import contextlib
import io
import json

from django.core.management.base import BaseCommand
from django.db import connection

from core.scripts.transaction import run


class Command(BaseCommand):
    help = 'executes the transaction'		

    def handle(self, *args, **options):
        out = io.StringIO()

        with contextlib.redirect_stdout(out):
            run()

        combined = dict(
            output=out.getvalue(),
            queries=[q for q in connection.queries if q['sql'] != 'BEGIN'])

        self.stdout.write(json.dumps(combined, indent=2))
