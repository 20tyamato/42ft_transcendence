from channels.generic.websocket import AsyncWebsocketConsumer
import json

class TestConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("test_group", self.channel_name)
        await self.accept()
        print("WebSocket connected!")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("test_group", self.channel_name)
        print(f"WebSocket disconnected with code: {close_code}")

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        print(f"Received message: {message}")

        # グループにメッセージをブロードキャスト
        await self.channel_layer.group_send(
            "test_group",
            {
                'type': 'chat_message',
                'message': message
            }
        )

    async def chat_message(self, event):
        message = event['message']
        
        # WebSocketにメッセージを送信
        await self.send(text_data=json.dumps({
            'message': message
        }))