FROM python:alpine3.6

ENV PYTHONUNBUFFERED 1

RUN apk add --no-cache --virtual .build-deps \
        build-base \
        python-dev \
        libev-dev \
     && apk add --no-cache \
        libstdc++ \
        libev \
        zlib \
        pcre

ADD ./requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

ADD ./ /app/
WORKDIR /app/
CMD ["gunicorn", "--workers=3", "-b", "0.0.0.0:5000", "dryorm.wsgi:application"]
