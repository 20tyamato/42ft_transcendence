import asyncio
import json
import random
import time

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone

from .base_consumers import BaseGameConsumer
from .game_logic import TournamentPongGame
from .models import Game, User, TournamentSession, TournamentParticipant
from .serializers import TournamentParticipantSerializer


# NOTE: セッションID：tournament_{tournament_id}_{round_type}_{player1}_{player2}_{timestamp}
# TODO: dev
class TournamentGameConsumer(BaseGameConsumer):
    games = {}  # セッションIDをキーとしたゲームインスタンスの管理

    async def connect(self):
        return 
    
    async def disconnect(self, close_code):
        return

    async def receive(self, text_data):
        return

    async def game_loop(self):
        """ゲーム状態の定期更新ループ"""
        return

    async def game_state(self, event):
        """ゲーム状態の更新をクライアントに送信"""
        return

    async def game_end(self, event):
        """ゲーム終了をクライアントに通知"""
        return

    @database_sync_to_async
    def validate_tournament_session(self):
        """トーナメントセッションとプレイヤーの参加資格を検証"""
        return

    @database_sync_to_async
    def save_game_state(self, game):
        """ゲーム状態をデータベースに保存"""
        return



class TournamentMatchmakingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("tournament_group", self.channel_name)
        await self.accept()
        print("Tournament WebSocket connected!")

    async def disconnect(self, close_code):
        # 切断時のクリーンアップ処理
        if hasattr(self, "username"):
            await self.handle_leave_tournament(self.username)
        await self.channel_layer.group_discard("tournament_group", self.channel_name)
        print(f"Tournament WebSocket disconnected with code: {close_code}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")
            username = data.get("username")

            if not username:
                await self.send(
                    json.dumps({"type": "error", "message": "Username is required"})
                )
                return

            if message_type == "join_tournament":
                self.username = username  # インスタンス変数として保存
                await self.handle_join_tournament(username)
            elif message_type == "leave_tournament":
                await self.handle_leave_tournament(username)

        except json.JSONDecodeError:
            await self.send(
                json.dumps({"type": "error", "message": "Invalid message format"})
            )


# TODO
class TournamentWaitingFinalConsumer(AsyncWebsocketConsumer):
    """決勝戦開始を待機するプレイヤー向けのWebSocketコンシューマ"""

    async def connect(self):
        return

    async def disconnect(self, close_code):
        # グループからの離脱
        return

    async def receive(self, text_data):
        """クライアントからのメッセージ受信処理"""
        return
