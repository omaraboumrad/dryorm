import contextlib
import io
import json
import re

from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
from django.db import connection

import sqlparse
from . import mermaid

from executor.models import run


def format_ddl(sql):
    cleaned = sqlparse.format(sql, strip_whitespace=True, strip_comments=True).strip()
    cleaned = re.sub(r"\(\s*", "(\n    ", cleaned, count=1)
    cleaned = re.sub(r",\s*", ",\n    ", cleaned)
    cleaned = re.sub(r"\);$", "\n);", cleaned)
    return cleaned


def collect_ddl():
    sqlmigrate_out = io.StringIO()
    with contextlib.redirect_stdout(sqlmigrate_out):
        try:
            call_command("sqlmigrate", "executor", "0001", stdout=sqlmigrate_out)
        except CommandError:
            # Handle the case where the migration file does not exist
            return []

        return [
            {"time": "0.000", "sql": format_ddl(q)}
            for q in sqlparse.split(sqlmigrate_out.getvalue())
            # if q.startswith('CREATE')
        ]


def format_sql_queries(queries):
    return [
        {"time": q["time"], "sql": sqlparse.format(q["sql"], reindent=True)}
        for q in queries
        if q["sql"]
    ]


class Command(BaseCommand):
    help = "executes the transaction"

    def handle(self, *args, **options):
        sqlmigrate_queries = collect_ddl()
        connection.queries_log.clear()

        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            returned = run()

        erd = mermaid.kroki_encode(mermaid.generate_mermaid_erd())

        combined = dict(
            output=out.getvalue(),
            erd=erd,
            queries=sqlmigrate_queries + format_sql_queries(connection.queries),
            returned=returned,
        )

        self.stdout.write(json.dumps(combined, indent=2))
