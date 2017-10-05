FROM python:alpine3.6
ENV PYTHONUNBUFFERED 1

ADD ./requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

ADD ./ /app/
WORKDIR /app/
