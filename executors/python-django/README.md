# Dry ORM Executor - Django

An executor for [Dry ORM](http://github.com/omaraboumrad/dryorm) focused on executing [Django](http://djangoproject.com/) ORM calls.

## Build Instructions

Clone the repository

```shell
$ git clone https://github.com/omaraboumrad/dryorm
```

Build the image

```shell
$ cd executors/python-django
$ docker build -t dryorm-executor/python-django .
```

or alternatively build the entire stack

```shell
$ docker-compose build
```

## How to run

```shell
% docker run --rm \
    -e MODELS="$(cat example/models.py)" \
    -e TRANSACTION="$(cat example/transaction.py)" \
    dryorm-executor/python-django
{
  "output": "Available Drivers: ['john', 'doe', 'jane', 'smith']\n",
  "queries": [
    {
      "sql": "INSERT INTO \"core_driver\" (\"name\") SELECT 'john' UNION ALL SELECT 'doe' UNION ALL SELECT 'jane' UNION ALL SELECT 'smith'",
      "time": "0.000"
    },
    {
      "sql": "SELECT \"core_driver\".\"name\" FROM \"core_driver\"",
      "time": "0.000"
    }
  ]
}
```

