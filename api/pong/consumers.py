from channels.generic.websocket import AsyncWebsocketConsumer
import json
from channels.db import database_sync_to_async
from .models import GameSession

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

class MatchmakingConsumer(AsyncWebsocketConsumer):
    waiting_players = []  # クラス変数として待機プレイヤーを管理

    async def connect(self):
        # いったん認証チェックなしで接続を許可
        await self.accept()
        print("Client connected to matchmaking")  # デバッグ用ログ

    async def disconnect(self, close_code):
        # 切断時は待機リストから削除
        if self in self.waiting_players:
            self.waiting_players.remove(self)
        print("Client disconnected from matchmaking")  # デバッグ用ログ

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            print(f"Received message: {data}")  # デバッグ用ログ
            
            if data.get('type') == 'join_matchmaking':
                await self.join_matchmaking()
        except json.JSONDecodeError:
            print("Received invalid JSON")
            return

    async def join_matchmaking(self):
        self.waiting_players.append(self)
        await self.send(json.dumps({
            'type': 'waiting',
            'message': 'Waiting for opponent...'
        }))
        
        # 2人以上のプレイヤーが待機中の場合マッチングを行う
        if len(self.waiting_players) >= 2:
            player1 = self.waiting_players.pop(0)
            player2 = self.waiting_players.pop(0)
            
            # 両プレイヤーにマッチング成立を通知
            match_data = {
                'type': 'match_found',
                'session_id': f"game_{id(player1)}_{id(player2)}"  # 仮のセッションID
            }
            
            await player1.send(json.dumps(match_data))
            await player2.send(json.dumps(match_data))