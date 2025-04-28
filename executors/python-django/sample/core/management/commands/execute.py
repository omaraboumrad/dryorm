import contextlib
import io
import json

from django.core.management.base import BaseCommand
from django.db import connection

from core.models import run


class Command(BaseCommand):
    help = 'executes the transaction'		

    def handle(self, *args, **options):
        out = io.StringIO()

        with contextlib.redirect_stdout(out):
            run()

        excluded = [
            'BEGIN',
            'COMMIT',
            'ROLLBACK',
        ]

        combined = dict(
            output=out.getvalue(),
            queries=[q for q in connection.queries if q['sql'] not in excluded]
        )

        self.stdout.write(json.dumps(combined, indent=2))
