#!/usr/bin/env python3
"""
SQLAlchemy executor for DryORM
Executes user code and tracks queries with line numbers
"""
import os
import sys
import json
import base64
import zlib
import traceback
import io
from contextlib import redirect_stdout
from typing import Any, Dict, List, Optional
import sqlparse
from sqlalchemy import create_engine, event, inspect
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase


class LineAwareQueryLogger:
    """Tracks SQL queries with their source line numbers"""

    def __init__(self, user_code_path: str):
        self.queries: List[Dict[str, Any]] = []
        self.user_code_path = user_code_path
        self.ddl_queries: List[str] = []

    def log_query(self, conn, cursor, statement, parameters, context, executemany):
        """Event handler for query execution"""
        import time
        import linecache

        # Get the stack trace to find where the query originated
        stack = traceback.extract_stack()

        # Find the frame from user code
        line_number = None
        source_context = None

        for frame in reversed(stack):
            if self.user_code_path in frame.filename:
                line_number = frame.lineno
                source_context = linecache.getline(frame.filename, frame.lineno).strip()
                break

        # Format the SQL
        formatted_sql = sqlparse.format(
            str(statement),
            reindent=True,
            keyword_case='upper'
        )

        query_info = {
            'sql': formatted_sql,
            'template': str(statement),
            'time': '0.000',  # SQLAlchemy doesn't provide query time in this event
            'line_number': line_number,
            'source_context': source_context
        }

        self.queries.append(query_info)

        # Track DDL statements for ERD generation
        statement_upper = str(statement).upper().strip()
        if any(statement_upper.startswith(ddl) for ddl in ['CREATE TABLE', 'CREATE INDEX', 'ALTER TABLE']):
            self.ddl_queries.append(formatted_sql)


def generate_erd(engine: Engine, base_class: Optional[type] = None) -> str:
    """Generate Mermaid ERD diagram from SQLAlchemy models"""
    from mermaid_generator import generate_mermaid_erd

    try:
        mermaid = generate_mermaid_erd(engine, base_class)
        # Compress and encode like Django executor
        compressed = zlib.compress(mermaid.encode('utf-8'))
        encoded = base64.b64encode(compressed).decode('utf-8')
        return encoded
    except Exception as e:
        # Return empty string on error
        return ""


def get_database_url() -> str:
    """Build database URL from environment variables"""
    db_type = os.environ.get('DB_TYPE', 'sqlite')

    if db_type == 'sqlite':
        return 'sqlite:///db.sqlite3'

    db_host = os.environ.get('SERVICE_DB_HOST', 'localhost')
    db_port = os.environ.get('SERVICE_DB_PORT', '5432')
    db_user = os.environ.get('DB_USER', 'user')
    db_password = os.environ.get('DB_PASSWORD', 'password')
    db_name = os.environ.get('DB_NAME', 'test')

    if db_type == 'postgres':
        return f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
    elif db_type == 'mariadb':
        return f'mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
    else:
        raise ValueError(f"Unsupported database type: {db_type}")


def main():
    """Main execution function"""
    user_code_path = '/app/app/models.py'

    # Create database connection
    database_url = get_database_url()
    engine = create_engine(database_url, echo=False)

    # Set up query logging
    logger = LineAwareQueryLogger(user_code_path)
    event.listen(engine, "before_cursor_execute", logger.log_query)

    # Load user code
    try:
        with open(user_code_path, 'r') as f:
            user_code = f.read()
    except FileNotFoundError:
        print(json.dumps({
            'error': 'models.py not found',
            'output': '',
            'queries': [],
            'erd': '',
            'returned': None
        }))
        sys.exit(1)

    # Set up execution environment
    output_buffer = io.StringIO()
    result = {
        'output': '',
        'queries': [],
        'erd': '',
        'returned': None
    }

    try:
        # Execute user code
        user_globals = {
            '__name__': '__main__',
            '__file__': user_code_path,
            'engine': engine,
            'Session': sessionmaker(bind=engine),
            'DeclarativeBase': DeclarativeBase,
        }

        # Import commonly used SQLAlchemy components for convenience
        from sqlalchemy import (
            Column, Integer, String, Text, Boolean, Float, DateTime, Date, Time,
            ForeignKey, Table, MetaData, select, insert, update, delete,
            and_, or_, not_, desc, asc, func
        )
        from sqlalchemy.orm import relationship, backref, Mapped, mapped_column

        user_globals.update({
            'Column': Column,
            'Integer': Integer,
            'String': String,
            'Text': Text,
            'Boolean': Boolean,
            'Float': Float,
            'DateTime': DateTime,
            'Date': Date,
            'Time': Time,
            'ForeignKey': ForeignKey,
            'Table': Table,
            'MetaData': MetaData,
            'relationship': relationship,
            'backref': backref,
            'Mapped': Mapped,
            'mapped_column': mapped_column,
            'select': select,
            'insert': insert,
            'update': update,
            'delete': delete,
            'and_': and_,
            'or_': or_,
            'not_': not_,
            'desc': desc,
            'asc': asc,
            'func': func,
        })

        # Compile and execute user code
        compiled_code = compile(user_code, user_code_path, 'exec')

        with redirect_stdout(output_buffer):
            exec(compiled_code, user_globals)

            # Look for Base class (DeclarativeBase subclass)
            base_class = None
            for name, obj in user_globals.items():
                if (isinstance(obj, type) and
                    issubclass(obj, DeclarativeBase) and
                    obj is not DeclarativeBase):
                    base_class = obj
                    break

            # Create tables if Base class found
            if base_class:
                base_class.metadata.create_all(engine)

            # Run the user's run() function if it exists
            if 'run' in user_globals and callable(user_globals['run']):
                return_value = user_globals['run']()
                result['returned'] = str(return_value) if return_value is not None else None

        result['output'] = output_buffer.getvalue()
        result['queries'] = logger.queries

        # Generate ERD
        result['erd'] = generate_erd(engine, base_class)

    except Exception as e:
        result['output'] = output_buffer.getvalue()
        result['queries'] = logger.queries
        result['error'] = f"{type(e).__name__}: {str(e)}"
        result['traceback'] = traceback.format_exc()

    finally:
        engine.dispose()

    # Output result as JSON
    print(json.dumps(result))


if __name__ == '__main__':
    main()
