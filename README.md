# dryorm

Quickly test out model configurations and transactions

## Build Instructions

Clone the repository

```shell
$ git clone https://github.com/omaraboumrad/dryorm
```

Build the stack

```shell
$ docker compose build
```

## Setup the environment

add a .env file to the root of the project with the following content:

```shell
PROJECT=dryorm
TAG=latest
DEBUG=True
PYTHONUNBUFFERED=1
SECRET_KEY="secret-here"
ENVIRONMENT=development
SENTRY_DSN="dsn-here"

# Database
POSTGRES_USER=dryorm
POSTGRES_PASSWORD=dryorm
POSTGRES_DB=dryorm
POSTGRES_HOST=database
```

## How to run

```shell
$ docker compose up -d
```

## Specification for Executors

You don't need to read this unless you want to build your own executors.

In order to contribute an executor, you need to deliver the following:

- a self-sufficient image (preferably light)
- that takes `CODE` as an environment variable
- either fails with a none-zero error (stderr)
- or succeeds with a json result

You will also need to define the supported executors in the constants.py file.

```python
EXECUTOR = Executor(
    image='dryorm-executor/python-django',
    key='python/django',
    memory='75m',
    verbose='Python - Django',
    max_containers=5,
)
```

P.S. Multi executor support is currently suspended.

The following example shows a sample of how the container will be called:

```shell
% docker run --rm -e CODE="$(cat models.py)" dryorm/executor
{
  "erd": "base64-encoded-compress-hash-here"
  "output": "output here",
  "returned": [
    {"k1": "v1", "k2": "v2"},
    {"k1": "v3", "k2": "v4"},
  ],
  "queries": [
    { "sql": "query 1", "time": "0.000" },
    { "sql": "query 2", "time": "0.000" },
  ]
}
```
