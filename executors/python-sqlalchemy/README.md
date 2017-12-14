# Dry ORM Executor - SQL Alchemy

An executor for [Dry ORM](http://github.com/omaraboumrad/dryorm) focused on executing [SQL Alchemy](https://www.sqlalchemy.org/) ORM calls.

## Build Instructions

Clone the repository

```shell
$ git clone https://github.com/omaraboumrad/dryorm
```

Build the image

```shell
$ cd executors/python-sqlalchemy
$ docker build -t dryorm-executor/python-sqlalchemy .
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
dryorm-executor/python-sqlalchemy
{
  "output": "Newsboys\n",
  "queries": [
    {
      "sql": [
        "INSERT INTO \"artist\" (\"name\") VALUES (?)",
        [
          "Newsboys"
        ]
      ],
      "time": 0.0
    },
    {
      "sql": [
        "SELECT \"t1\".\"id\", \"t1\".\"name\" FROM \"artist\" AS t1 LIMIT 1 OFFSET 0",
        []
      ],
      "time": 0.0
    }
  ]
}
```
