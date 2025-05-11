FROM python:3.12-slim-bullseye
ENV PYTHONUNBUFFERED 1
RUN apt-get update
RUN apt-get install -y \
  build-essential \
  pkg-config \
  default-libmysqlclient-dev \
  mariadb-client \
  && rm -rf /var/lib/apt/lists/*
ADD ./requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt
ADD ./ /app/
WORKDIR /app/
CMD ["./run.sh"]
