FROM python:3.12-slim-bullseye

ENV PYTHONUNBUFFERED 1

RUN apt-get update
RUN apt-get install -y \
  build-essential \
  python-dev \
  libpq-dev \
  zlib1g \
  zlib1g-dev \
  libev4 \
  libev-dev \
  linux-libc-dev \
  libpcre3 \
  libssl-dev \
  libffi-dev \
  libldap2-dev \
  libsasl2-dev \
  postgresql-client \
  pkg-config \
  default-libmysqlclient-dev \
  mariadb-client \
  wget \
  && rm -rf /var/lib/apt/lists/*

ADD ./requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

ADD ./ /app/
WORKDIR /app/
VOLUME ["/app/"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120", "dryorm.wsgi:application"]
