# dryorm

Quickly test out model configurations and transactions

## Build Instructions

Clone the repository

```shell
$ git clone https://github.com/omaraboumrad/dryorm
```

Build the stack

```shell
$ docker-compose build
```

## How to run

```shell
$ docker-compose up -d
```

## Specification for Executors

In order to contribute an executor, you need to deliver the following:

- a self-sufficient image (preferably light)
- that takes `MODELS` and `TRANSACTION` env variables
- either fails with a none-zero error (stderr)
- or succeeds with a json result

The following example shows a sample of how the container will be called:

```shell
% docker run --rm\
    -e MODELS="$(cat executor/example/models.py)" \
    -e TRANSACTION="$(cat executor/example/transaction.py)" \
    dryorm/executor
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
