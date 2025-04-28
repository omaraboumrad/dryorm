FROM python:3.12-slim-bullseye

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port RQ Dashboard will run on
EXPOSE 9181

# Set the default command
CMD ["rq-dashboard", "--redis-host", "redis", "--redis-port", "6379", "--port", "9181"] 