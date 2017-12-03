# Dry ORM Executor - Django

An executor for [Dry ORM](http://github.com/omaraboumrad/dryorm)  focused on executing django orm calls.

## Build Instructions

Clone the repository

```shell
$ git clone https://github.com/omaraboumrad/dryorm-executor-django
```

Build the stack

```shell
$ docker build -t dryorm-executor/django .
```

## How to run

```shell
% docker run --rm \
    -e MODELS="$(cat example/models.py)" \
    -e TRANSACTION="$(cat example/transaction.py)" \
    dryorm-executor/django
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
