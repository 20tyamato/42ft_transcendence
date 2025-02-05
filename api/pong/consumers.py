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
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return
        await self.accept()
        await self.join_matchmaking()

    async def disconnect(self, close_code):
        await self.leave_matchmaking()

    @database_sync_to_async
    def create_or_join_session(self):
        # 待機中のセッションを探す
        waiting_session = GameSession.objects.filter(
            status='WAITING',
            player2__isnull=True
        ).first()

        if waiting_session:
            # 既存のセッションに参加
            waiting_session.player2 = self.user
            waiting_session.status = 'IN_PROGRESS'
            waiting_session.save()
            return waiting_session, True  # マッチ成立
        else:
            # 新しいセッションを作成
            new_session = GameSession.objects.create(
                player1=self.user,
                status='WAITING'
            )
            return new_session, False  # マッチ待ち

    @database_sync_to_async
    def remove_from_session(self):
        # プレイヤーが切断した場合のセッション cleanup
        GameSession.objects.filter(
            status='WAITING',
            player1=self.user
        ).delete()

        waiting_sessions = GameSession.objects.filter(
            status='WAITING',
            player2=self.user
        )
        for session in waiting_sessions:
            session.player2 = None
            session.save()

    async def join_matchmaking(self):
        session, match_found = await self.create_or_join_session()

        if match_found:
            # マッチが成立した場合、両プレイヤーに通知
            match_data = {
                'type': 'match_found',
                'session_id': str(session.id),
                'opponent': session.player1.display_name,
            }
            # player1のチャンネル名を構築
            player1_channel = f"user_{session.player1.id}"

            # 両プレイヤーにマッチ成立を通知
            await self.channel_layer.group_send(
                player1_channel,
                {
                    'type': 'match_notification',
                    'message': {
                        'type': 'match_found',
                        'session_id': str(session.id),
                        'opponent': session.player2.display_name,
                    }
                }
            )
            await self.send(text_data=json.dumps(match_data))
        else:
            # 待機状態の通知
            await self.send(json.dumps({
                'type': 'waiting',
                'message': 'Waiting for opponent...'
            }))

    async def leave_matchmaking(self):
        await self.remove_from_session()

    async def match_notification(self, event):
        # マッチ成立通知をクライアントに送信
        await self.send(text_data=json.dumps(event['message']))
