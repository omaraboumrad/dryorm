# SQLAlchemy Executor for DryORM

This executor allows users to test and share SQLAlchemy code snippets with multiple database backends.

## Features

- **SQLAlchemy 2.0**: Uses the latest SQLAlchemy version
- **Multiple Databases**: PostgreSQL, MariaDB, and SQLite
- **Query Tracking**: Tracks SQL queries with source line numbers
- **ERD Generation**: Automatically generates Entity-Relationship Diagrams
- **Isolated Execution**: Each execution runs in a fresh Docker container

## Directory Structure

```
python-sqlalchemy/
├── app/
│   ├── execute.py              # Main execution script
│   ├── mermaid_generator.py    # ERD diagram generator
│   └── models.py               # User code placeholder
├── Dockerfile.multi            # Multi-stage Docker build
├── run.sh                      # Container entry point
├── requirements-2.0-base.txt   # SQLAlchemy 2.0 dependencies
└── README.md                   # This file
```

## Usage

### Writing User Code

Users write SQLAlchemy models and code in the following format:

```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey

# Define Base class
class Base(DeclarativeBase):
    pass

# Define models
class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    email: Mapped[str] = mapped_column(String(100), unique=True)

    posts: Mapped[list["Post"]] = relationship(back_populates="author")

class Post(Base):
    __tablename__ = 'posts'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(String(1000))
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))

    author: Mapped["User"] = relationship(back_populates="posts")

# Define run function (executed automatically)
def run():
    # Create a session
    session = Session()

    # Create and add objects
    user = User(name="John Doe", email="john@example.com")
    session.add(user)
    session.commit()

    post = Post(title="First Post", content="Hello World!", user_id=user.id)
    session.add(post)
    session.commit()

    # Query objects
    users = session.query(User).all()
    for u in users:
        print(f"User: {u.name}, Email: {u.email}")
        for p in u.posts:
            print(f"  Post: {p.title}")

    session.close()
```

### Available Globals

The execution environment provides these globals automatically:

- `engine`: SQLAlchemy engine connected to the database
- `Session`: sessionmaker bound to the engine
- `DeclarativeBase`: Base class for ORM models
- `Column`, `Integer`, `String`, `Text`, `Boolean`, `Float`, `DateTime`, `Date`, `Time`
- `ForeignKey`, `Table`, `MetaData`
- `relationship`, `backref`, `Mapped`, `mapped_column`
- `select`, `insert`, `update`, `delete`
- `and_`, `or_`, `not_`, `desc`, `asc`, `func`

### Output Format

The executor returns JSON with the following structure:

```json
{
  "output": "stdout from run() function",
  "erd": "base64-encoded-compressed-mermaid-diagram",
  "queries": [
    {
      "sql": "formatted SQL query",
      "template": "SQL template",
      "time": "0.000",
      "line_number": 42,
      "source_context": "source code line"
    }
  ],
  "returned": "return value from run() function"
}
```

## Building Docker Images

Build all variants using Docker multi-stage builds:

```bash
# Build all images at once
./build.sh

# Or build individual images:

# PostgreSQL + SQLAlchemy 2.0
docker build -f Dockerfile.multi --target postgres-2.0 \
  -t dryorm-executor/python-sqlalchemy-postgres-2.0 .

# MariaDB + SQLAlchemy 2.0
docker build -f Dockerfile.multi --target mariadb-2.0 \
  -t dryorm-executor/python-sqlalchemy-mariadb-2.0 .

# SQLite + SQLAlchemy 2.0
docker build -f Dockerfile.multi --target sqlite-2.0 \
  -t dryorm-executor/python-sqlalchemy-sqlite-2.0 .
```

## Environment Variables

The executor expects the following environment variables:

- `CODE`: User code to execute (required)
- `DB_TYPE`: Database type (`sqlite`, `postgres`, or `mariadb`)
- `SERVICE_DB_HOST`: Database host (for PostgreSQL/MariaDB)
- `SERVICE_DB_PORT`: Database port (for PostgreSQL/MariaDB)
- `DB_USER`: Database user (for PostgreSQL/MariaDB)
- `DB_PASSWORD`: Database password (for PostgreSQL/MariaDB)
- `DB_NAME`: Database name (for PostgreSQL/MariaDB)

## Execution Flow

1. User code is written to `/app/app/models.py`
2. `run.sh` executes the main script with a 10-second timeout
3. The script:
   - Loads user code
   - Creates database connection
   - Tracks queries with line numbers
   - Executes user's `run()` function
   - Generates ERD diagram
   - Returns JSON output

## Resource Limits

- **Memory**: 75MB per container
- **Timeout**: 10 seconds (inner) + 60 seconds (outer)
- **Max Containers**: 10 concurrent executions

## Comparison with Django Executor

| Feature | Django | SQLAlchemy |
|---------|--------|------------|
| ORM | Django ORM | SQLAlchemy |
| Models | Django Models | DeclarativeBase |
| Migrations | Automatic | Alembic (not included) |
| Query Tracking | ✓ | ✓ |
| ERD Generation | ✓ | ✓ |
| Line Numbers | ✓ | ✓ |

## Notes

- Tables are created automatically via `Base.metadata.create_all()`
- The executor looks for a `Base` class that inherits from `DeclarativeBase`
- The `run()` function is optional but recommended for executing code
- All output is captured via stdout redirection
- Queries are logged before execution using SQLAlchemy events
