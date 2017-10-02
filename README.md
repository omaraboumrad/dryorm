# Djanground

Quickly test out model configurations and ORM calls.

## Build Instructions

Clone the repository

```shell
$ git clone https://github.com/omaraboumrad/djanground
```

Build the image

```shell
$ docker build -t djanground .
```

## How to run

You can confirm that the container is working by simply running

```shell
% docker run djanground

starting script
<QuerySet []>
ending script
```

There's also an [example](./example) available, you can run it using

```shell
docker run \
    -v /path/to/host/example/models.py:/app/core/models.py \
    -v /path/to/host/example/sample_script.py:/app/core/scripts/sample_script.py \
    djanground

starting script
Testing query output
qs: SELECT "core_driver"."id", "core_driver"."name" FROM "core_driver"
output: <QuerySet ['john', 'doe', 'jane', 'smith']>
ending script
```
