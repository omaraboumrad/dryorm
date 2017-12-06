# Dry ORM Executor - Peewee

An executor for [Dry ORM](http://github.com/omaraboumrad/dryorm) focused on executing [Peewee](http://docs.peewee-orm.com/en/latest/index.html) ORM calls.

## Build Instructions

Clone the repository

```shell
$ git clone https://github.com/omaraboumrad/dryorm
```

Build the image

```shell
$ cd executors/python-peewee
$ docker build -t dryorm-executor/python-peewee .
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
dryorm-executor/python-peewee
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
