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

{
  "output": "starting script\n<QuerySet []>\nending script\n",
  "queries": [
    {
      "sql": "SELECT \"core_question\".\"id\", \"core_question\".\"name\" FROM \"core_question\" LIMIT 21",
      "time": "0.000"
    }
  ]
}
```

There's also an [example](./example) available, you can run it using

```shell
docker run \
    -v /path/to/host/example/models.py:/app/core/models.py \
    -v /path/to/host/example/sample_script.py:/app/core/scripts/sample_script.py \
    djanground

{
  "output": "Available Drivers: ['john', 'doe', 'jane', 'smith']\n",
  "queries": [
    {
      "sql": "BEGIN",
      "time": "0.000"
    },
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
