import builtins
import contextlib
import io
import json
import re
import time
import inspect

from django.core.management.base import BaseCommand, CommandError
from django.core.management import call_command
from django.db import connection

import sqlparse
from . import mermaid

from app import models


class LineAwarePrintCapture:
    """Captures print statements with their line numbers from user code"""

    def __init__(self):
        self.outputs = []
        self.user_code_lines = []
        self.original_print = builtins.print
        self.output_buffer = io.StringIO()

    def set_user_code(self, code):
        """Store user code lines for line number tracking"""
        self.user_code_lines = code.splitlines()

    def get_user_code_line(self):
        """Extract line number from user code in the stack trace"""
        try:
            stack = inspect.stack()
            for frame_info in stack:
                if frame_info.filename == "/app/app/models.py":
                    line_number = frame_info.lineno
                    if self.user_code_lines and 1 <= line_number <= len(self.user_code_lines):
                        return {
                            "line_number": line_number,
                            "source_context": self.user_code_lines[line_number - 1].strip(),
                        }
        except Exception:
            pass
        return {}

    def tracked_print(self, *args, **kwargs):
        """Replacement print function that tracks line numbers"""
        line_info = self.get_user_code_line()

        # Capture the output
        output = io.StringIO()
        self.original_print(*args, file=output, **{k: v for k, v in kwargs.items() if k != 'file'})
        output_text = output.getvalue().rstrip('\n')

        # Store with line info
        self.outputs.append({
            "line_number": line_info.get("line_number"),
            "output": output_text,
        })

        # Also write to the buffer for combined output
        self.original_print(*args, file=self.output_buffer, **{k: v for k, v in kwargs.items() if k != 'file'})

    def patch(self):
        """Install the tracked print function"""
        builtins.print = self.tracked_print

    def restore(self):
        """Restore the original print function"""
        builtins.print = self.original_print

    def get_combined_output(self):
        """Get all output as a single string"""
        return self.output_buffer.getvalue()


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
            call_command("sqlmigrate", "app", "0001", stdout=sqlmigrate_out)
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
        {
            "time": q["time"],
            "sql": sqlparse.format(q["sql"], reindent=True),
            "template": sqlparse.format(q.get("template", q["sql"]), reindent=True),
            "line_number": q.get("line_number"),
            "source_context": q.get("source_context"),
        }
        for q in queries
        if q["sql"]
    ]


# The code for LineAwaraQueryLogger has been taken from:
# https://github.com/TkTech/wetorm
# and adapted to fit DryORM needs
class LineAwareQueryLogger:
    def __init__(self):
        self.queries = []
        self.user_code_lines = []
        self.logging_enabled = True

    def set_user_code(self, code):
        """Store user code lines for line number tracking"""
        self.user_code_lines = code.splitlines()

    def patch_cursor(self):
        """Patch the connection's cursor creation to wrap execute methods"""
        original_cursor = connection.cursor

        def create_cursor_with_line_tracking(*args, **kwargs):
            cursor = original_cursor(*args, **kwargs)

            # Store original methods
            original_execute = cursor.execute
            original_executemany = cursor.executemany

            def execute_with_line_tracking(sql, params=None):
                line_info = self.get_user_code_line()

                # Get the initial query count to find our new query
                initial_query_count = len(connection.queries)

                result = original_execute(sql, params)

                # Find the new query that was just added to connection.queries
                if self.logging_enabled and len(connection.queries) > initial_query_count:
                    django_query = connection.queries[-1]
                    # Use Django's actual executed SQL and timing
                    query_info = {
                        "sql": django_query["sql"],
                        "template": sql,  # Store the SQL template before interpolation
                        "time": django_query["time"],
                        "line_number": line_info.get("line_number"),
                        "source_context": line_info.get("source_context"),
                    }
                    self.queries.append(query_info)

                return result

            def executemany_with_line_tracking(sql, param_list):
                line_info = self.get_user_code_line()

                # Get the initial query count to find our new query
                initial_query_count = len(connection.queries)

                result = original_executemany(sql, param_list)

                # Find the new query that was just added to connection.queries
                if self.logging_enabled and len(connection.queries) > initial_query_count:
                    django_query = connection.queries[-1]
                    # Use Django's actual executed SQL and timing
                    query_info = {
                        "sql": django_query["sql"],
                        "template": sql,  # Store the SQL template before interpolation
                        "time": django_query["time"],
                        "line_number": line_info.get("line_number"),
                        "source_context": line_info.get("source_context"),
                    }
                    self.queries.append(query_info)

                return result

            # Patch the cursor methods
            cursor.execute = execute_with_line_tracking
            cursor.executemany = executemany_with_line_tracking

            return cursor

        # Monkey patch connection cursor creation
        connection.cursor = create_cursor_with_line_tracking

    def get_user_code_line(self):
        """Extract line number and context from user code in the stack trace"""
        try:
            stack = inspect.stack()
            for frame_info in stack:
                # Look for frames in the user's models.py file (not our app/models.py)
                if frame_info.filename == "/app/app/models.py":
                    line_number = frame_info.lineno
                    if self.user_code_lines and 1 <= line_number <= len(
                        self.user_code_lines
                    ):
                        return {
                            "line_number": line_number,
                            "source_context": self.user_code_lines[
                                line_number - 1
                            ].strip(),
                        }
        except Exception:
            pass
        return {}

    @contextlib.contextmanager
    def do_not_log(self):
        """Context manager to temporarily disable query logging"""
        previous_state = self.logging_enabled
        self.logging_enabled = False
        try:
            yield
        finally:
            self.logging_enabled = previous_state


# End of LineAwareQueryLogger class

# Global query logger instance (set during command execution)
_global_query_logger = None


@contextlib.contextmanager
def _do_not_log():
    """Global context manager to disable query logging

    Usage:
        with _do_not_log():
            # queries executed here will not be logged
            Person.objects.create(name='Hidden')
    """
    if _global_query_logger is not None:
        with _global_query_logger.do_not_log():
            yield
    else:
        # If logger not initialized, just pass through
        yield


class Command(BaseCommand):
    help = "executes the transaction"

    def handle(self, *args, **options):
        global _global_query_logger

        # Initialize line-aware query logger
        query_logger = LineAwareQueryLogger()
        _global_query_logger = query_logger

        # Initialize line-aware print capture
        print_capture = LineAwarePrintCapture()

        # Read the user code to enable line tracking
        try:
            with open("/app/app/models.py", "r") as f:
                user_code = f.read()
                query_logger.set_user_code(user_code)
                print_capture.set_user_code(user_code)
        except Exception:
            pass  # If we can't read the file, proceed without line tracking

        # Patch cursor for line tracking
        query_logger.patch_cursor()

        # Patch print for line tracking
        print_capture.patch()

        # Make _do_not_log available in models namespace
        models._do_not_log = _do_not_log

        try:
            sqlmigrate_queries = collect_ddl()
            connection.queries_log.clear()
            query_logger.queries.clear()  # Clear our custom queries too
            print_capture.outputs.clear()  # Clear print outputs too

            # Capture stderr separately (print capture handles stdout)
            err = io.StringIO()
            with contextlib.redirect_stderr(err):
                if hasattr(models, "run"):
                    returned = models.run()
                else:
                    returned = {}

            erd = mermaid.kroki_encode(mermaid.generate_mermaid_erd())

            # Combine Django's queries with our line-aware queries
            all_queries = sqlmigrate_queries + format_sql_queries(query_logger.queries)

            # Combine stdout from print capture with stderr
            combined_output = print_capture.get_combined_output()
            stderr_output = err.getvalue()
            if stderr_output:
                combined_output += stderr_output

            combined = dict(
                output=combined_output,
                outputs=print_capture.outputs,  # Line-aware print outputs
                erd=erd,
                queries=all_queries,
                returned=returned,
            )

            # Write to file instead of stdout to avoid pollution
            result_file = '/tmp/result.json'

            with open(result_file, 'w') as f:
                f.write(json.dumps(combined))

            # Also write to stdout for backward compatibility (can be removed later)
            self.stdout.write(json.dumps(combined, indent=2))
        finally:
            # Restore original print function
            print_capture.restore()
