import contextlib
import io
import json
import re

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection
import sqlparse

from executor.models import run
from . import mermaid


def format_ddl(sql):
    cleaned = sqlparse.format(sql, strip_whitespace=True, strip_comments=True).strip()
    cleaned = re.sub(r'\(\s*', '(\n    ', cleaned, count=1)
    cleaned = re.sub(r',\s*', ',\n    ', cleaned)
    cleaned = re.sub(r'\);$', '\n);', cleaned)
    return cleaned


class Command(BaseCommand):
    help = 'executes the transaction'		

    def handle(self, *args, **options):
        # Grab the Migration SQL.
        sqlmigrate_out = io.StringIO()
        with contextlib.redirect_stdout(sqlmigrate_out):
            call_command('sqlmigrate', 'executor', '0001', stdout=sqlmigrate_out)

        sqlmigrate_queries = [
            {
                'time': '0.000',
                'sql': format_ddl(q)
            } for q in sqlparse.split(sqlmigrate_out.getvalue())
        ]

        connection.queries_log.clear()

        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            returned = run()

        erd = mermaid.kroki_encode(
            mermaid.generate_mermaid_erd()
        )

        combined = dict(
            output=out.getvalue(),
            erd=erd,
            queries=[
                {'time': q['time'], 'sql': sqlparse.format(q['sql'], reindent=True)}
                 for q in connection.queries if q['sql']
            ] + [
                q for q in sqlmigrate_queries
                if q['sql'].startswith('CREATE')
            ],
            returned=returned,
        )

        self.stdout.write(json.dumps(combined, indent=2))
