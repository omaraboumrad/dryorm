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


def interpolate_sql_params(sql, params):
    """Safely interpolate SQL parameters with proper quoting"""
    if not params:
        return sql
    
    def quote_param(param):
        if param is None:
            return 'NULL'
        elif isinstance(param, str):
            # Escape single quotes and wrap in quotes
            return "'" + param.replace("'", "''") + "'"
        elif isinstance(param, (int, float)):
            return str(param)
        elif isinstance(param, bool):
            return 'TRUE' if param else 'FALSE'
        else:
            # For other types, convert to string and quote
            return "'" + str(param).replace("'", "''") + "'"
    
    try:
        if isinstance(params, (list, tuple)):
            if params and isinstance(params[0], (list, tuple)):
                # Multiple parameter sets (bulk operations)
                examples = params[:3]  # Show first 3 examples
                result_sqls = []
                
                for i, param_set in enumerate(examples):
                    if isinstance(param_set, (list, tuple)):
                        quoted_params = [quote_param(p) for p in param_set]
                        # Replace %s with actual quoted values
                        interpolated = sql
                        for param in quoted_params:
                            interpolated = interpolated.replace('%s', param, 1)
                        result_sqls.append(interpolated)
                
                result = result_sqls[0]
                if len(result_sqls) > 1:
                    for i, additional_sql in enumerate(result_sqls[1:], 2):
                        result += f"\n-- Example {i}:\n{additional_sql}"
                
                if len(params) > 3:
                    result += f"\n-- ... and {len(params) - 3} more rows"
                
                return result
            else:
                # Single parameter set as list/tuple
                quoted_params = [quote_param(p) for p in params]
                interpolated = sql
                for param in quoted_params:
                    interpolated = interpolated.replace('%s', param, 1)
                return interpolated
        else:
            # Single parameter
            return sql.replace('%s', quote_param(params), 1)
    except Exception:
        # If interpolation fails, return original SQL
        return sql

def format_sql_queries(queries):
    return [
        {
            "time": q["time"],
            "sql": sqlparse.format(
                interpolate_sql_params(q["sql"], q.get("params")), 
                reindent=True
            ),
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
                start_time = time.time()
                try:
                    result = original_execute(sql, params)
                    execution_time = time.time() - start_time

                    # Store enhanced query info
                    query_info = {
                        "sql": sql,
                        "time": f"{execution_time:.6f}",
                        "params": params,
                        "line_number": line_info.get("line_number"),
                        "source_context": line_info.get("source_context"),
                    }
                    self.queries.append(query_info)
                    return result
                except Exception as e:
                    execution_time = time.time() - start_time
                    query_info = {
                        "sql": sql,
                        "time": f"{execution_time:.6f}",
                        "params": params,
                        "line_number": line_info.get("line_number"),
                        "source_context": line_info.get("source_context"),
                    }
                    self.queries.append(query_info)
                    raise

            def executemany_with_line_tracking(sql, param_list):
                line_info = self.get_user_code_line()
                start_time = time.time()
                try:
                    result = original_executemany(sql, param_list)
                    execution_time = time.time() - start_time

                    query_info = {
                        "sql": sql,
                        "time": f"{execution_time:.6f}",
                        "params": param_list,
                        "line_number": line_info.get("line_number"),
                        "source_context": line_info.get("source_context"),
                    }
                    self.queries.append(query_info)
                    return result
                except Exception as e:
                    execution_time = time.time() - start_time
                    query_info = {
                        "sql": sql,
                        "time": f"{execution_time:.6f}",
                        "params": param_list,
                        "line_number": line_info.get("line_number"),
                        "source_context": line_info.get("source_context"),
                    }
                    self.queries.append(query_info)
                    raise

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
# End of LineAwareQueryLogger class


class Command(BaseCommand):
    help = "executes the transaction"

    def handle(self, *args, **options):
        # Initialize line-aware query logger
        query_logger = LineAwareQueryLogger()

        # Read the user code to enable line tracking
        try:
            with open("/app/app/models.py", "r") as f:
                user_code = f.read()
                query_logger.set_user_code(user_code)
        except Exception:
            pass  # If we can't read the file, proceed without line tracking

        # Patch cursor for line tracking
        query_logger.patch_cursor()

        try:
            sqlmigrate_queries = collect_ddl()
            connection.queries_log.clear()
            query_logger.queries.clear()  # Clear our custom queries too

            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                if hasattr(models, "run"):
                    returned = models.run()
                else:
                    returned = {}

            erd = mermaid.kroki_encode(mermaid.generate_mermaid_erd())

            # Combine Django's queries with our line-aware queries
            all_queries = sqlmigrate_queries + format_sql_queries(query_logger.queries)

            combined = dict(
                output=out.getvalue(),
                erd=erd,
                queries=all_queries,
                returned=returned,
            )

            self.stdout.write(json.dumps(combined, indent=2))
        finally:
            # Restore original cursor method
            pass  # The monkey patch will be cleaned up when the process ends
