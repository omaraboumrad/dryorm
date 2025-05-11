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
$ docker compose build
```

## How to run

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
