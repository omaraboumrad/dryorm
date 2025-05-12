import contextlib
import io
import json

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection
import sqlparse

from executor.models import run
from . import mermaid


class Command(BaseCommand):
    help = 'executes the transaction'		

    def handle(self, *args, **options):
        out = io.StringIO()

        with contextlib.redirect_stdout(out):
            returned = run()

        excluded = [
            # 'BEGIN',
            # 'COMMIT',
            # 'ROLLBACK',
        ]

        erd = mermaid.kroki_encode(
            mermaid.generate_mermaid_erd()
        )

        combined = dict(
            output=out.getvalue(),
            erd=erd,
            queries=[
                {'time': q['time'], 'sql': sqlparse.format(q['sql'], reindent=True)}
                 for q in connection.queries if q['sql'] not in excluded
            ],
            returned=returned,
        )

        self.stdout.write(json.dumps(combined, indent=2))
