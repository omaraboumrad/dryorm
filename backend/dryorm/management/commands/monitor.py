from django.core.management.base import BaseCommand

import redis


class Command(BaseCommand):
    help = "executes the transaction"

    def handle(self, *args, **options):
        connection = redis.Redis("redis", 6379)
        pubsub = connection.pubsub()
        pubsub.subscribe("back-channel")

        for item in pubsub.listen():
            print(item)
            # self.stdout.write(item.decode('utf-8'))
