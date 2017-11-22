from channels.routing import route

from djanground.consumers import ws_message

channel_routing = [
    route('websocket.receive', ws_message),
]
