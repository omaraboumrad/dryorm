#!/usr/bin/env python
import os
import sys


# Why? Because we're using test client in the snippets
# which resets the queries and closes old connections
# which won't allow us to capture _everything_ that
# happened in the snippet. This block will persist
# the previous connection/queries.
from django import db

noop = lambda *args, **kwargs: None
db._reset_queries = noop
db._close_old_connections = noop
db.reset_queries = noop
db.close_old_connections = noop

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "app.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError:
        # The above import may fail for some other reason. Ensure that the
        # issue is really that Django is missing to avoid masking other
        # exceptions on Python 2.
        try:
            import django
        except ImportError:
            raise ImportError(
                "Couldn't import Django. Are you sure it's installed and "
                "available on your PYTHONPATH environment variable? Did you "
                "forget to activate a virtual environment?"
            )
        raise
    execute_from_command_line(sys.argv)
