import json
import channels
import redis
import rq
from channels.generic.websocket import AsyncWebsocketConsumer
from dryorm import constants
import tasks


class WSConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        connection = redis.Redis('redis')
        queue = rq.Queue(connection=connection)

        payload = json.loads(text_data)
        framework = payload['framework']
        code = payload['code']

        job = queue.enqueue(
            tasks.run_django,
            self.channel_name,
            code,
            framework)

        reply = json.dumps(dict(
            event=constants.JOB_FIRED_EVENT,
            key=job.key.decode('utf-8')
        ))

        await self.send(text_data=reply)

    async def websocket_send(self, event):
        """
        Handle websocket.send messages from the channel layer.
        """
        await self.send(text_data=event["text"])
