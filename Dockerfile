FROM python:alpine3.6
ENV PYTHONUNBUFFERED 1
ADD ./sample/requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt
ADD ./sample/ /app/
WORKDIR /app/
CMD ["./run.sh"]
