import redis


if __name__ == '__main__':
    connection = redis.Redis('redis', 6379)
    pubsub = connection.pubsub()
    pubsub.subscribe('back-channel')

    for item in pubsub.listen():
        print(item)
