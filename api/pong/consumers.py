import asyncio
import json
import time

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .base_consumers import BaseGameConsumer
from .game_logic import MultiplayerPongGame
from .models import Game, User


class MatchmakingConsumer(AsyncWebsocketConsumer):
    waiting_players: list = []
    _lock = asyncio.Lock()
    # session_id -> (player1_username, player2_username)
    # アンダースコアを含むユーザー名での分割エラーを回避するために使用
    session_players: dict = {}

    async def connect(self):
        self.username = ""
        await self.accept()
        print("Client connected to matchmaking")

    async def disconnect(self, close_code):
        async with self._lock:
            if self in self.waiting_players:
                self.waiting_players.remove(self)
        print(f"Client {self.username} disconnected from matchmaking")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            print(f"Received message: {data}")

            if data.get("type") == "join_matchmaking":
                self.username = data.get("username", "")
                await self.join_matchmaking()

        except json.JSONDecodeError:
            print("Received invalid JSON")
            return

    async def join_matchmaking(self):
        print(f"Player {self.username} joining matchmaking")

        async with self._lock:
            # 同一ユーザーの重複エントリを防ぐ
            if any(p.username == self.username for p in self.waiting_players):
                return

            self.waiting_players.append(self)
            print(f"After joining: {len(self.waiting_players)} players waiting")

            if len(self.waiting_players) >= 2:
                player1 = self.waiting_players.pop(0)
                player2 = self.waiting_players.pop(0)
            else:
                player1 = None
                player2 = None

        # ロック外でネットワーク送信
        if player1 is None:
            await self.send(
                json.dumps({"type": "waiting", "message": "Waiting for opponent..."})
            )
            return

        session_id = f"game_{player1.username}_{player2.username}_{int(time.time())}"
        # プレイヤー名をセッションIDとは別に保存（アンダースコア含む名前対応）
        MatchmakingConsumer.session_players[session_id] = (player1.username, player2.username)

        match_data = {
            "type": "match_found",
            "session_id": session_id,
            "player1": player1.username,
            "player2": player2.username,
        }
        print(f"Match found! Creating game session: {match_data}")

        try:
            await player1.send(json.dumps(match_data))
        except Exception:
            # player1が切断済みの場合、player2を待機列に戻す
            async with self._lock:
                self.waiting_players.insert(0, player2)
            MatchmakingConsumer.session_players.pop(session_id, None)
            return

        try:
            await player2.send(json.dumps(match_data))
        except Exception:
            # player2が切断済みの場合、player1を待機列に戻す
            async with self._lock:
                self.waiting_players.insert(0, player1)
            MatchmakingConsumer.session_players.pop(session_id, None)


class GameConsumer(BaseGameConsumer):
    """マルチプレイヤー向けゲームコンシューマ"""

    async def connect(self):
        """マルチプレイヤー固有の接続処理"""
        await super().connect()

        # セッションIDからゲームインスタンス作成
        if self.session_id not in self.games:
            # マッチメイキング時に保存したプレイヤー名を取得（アンダースコア対応）
            player_pair = MatchmakingConsumer.session_players.pop(self.session_id, None)
            if player_pair:
                player1_name, player2_name = player_pair
            else:
                # フォールバック: セッションIDを分割（アンダースコアなしの名前のみ対応）
                parts = self.session_id.split("_")
                player1_name = parts[1] if len(parts) > 1 else ""
                player2_name = parts[2] if len(parts) > 2 else ""

            if player1_name and player2_name:
                self.games[self.session_id] = MultiplayerPongGame(
                    session_id=self.session_id,
                    player1_name=player1_name,
                    player2_name=player2_name,
                )

                # DBゲーム情報を設定
                game_instance = await self.get_or_create_game(player1_name, player2_name)
                if game_instance:
                    self.games[self.session_id].db_game_id = game_instance.id

        # ゲーム更新ループの開始
        self.game_task = asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        """マルチプレイヤー固有の切断処理"""
        # ゲームが存在する場合、切断処理を実行
        if self.session_id in self.games:
            game = self.games[self.session_id]
            game.handle_disconnection(self.username)

            # 残ったプレイヤーに切断を通知
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    "type": "player_disconnected",
                    "disconnected_player": self.username,
                    "state": game.get_state(),
                },
            )

            # ゲーム状態を保存
            await self.save_game_state(game)
            del self.games[self.session_id]

        await super().disconnect(close_code)

    async def game_loop(self):
        """マルチプレイヤー固有のゲームループ処理"""
        try:
            await super().game_loop()
            # ゲーム終了時の処理
            if self.session_id in self.games:
                game = self.games[self.session_id]
                await self.save_game_state(game)
                del self.games[self.session_id]
        except Exception as e:
            print(f"Error in multiplayer game loop: {e}")

    @database_sync_to_async
    def get_or_create_game(self, player1_name: str, player2_name: str):
        """ゲーム情報をDBから取得または作成"""
        try:
            # プレイヤー情報の取得
            player1 = User.objects.get(username=player1_name)
            player2 = User.objects.get(username=player2_name)

            # ゲーム取得または作成
            game, created = Game.objects.get_or_create(
                session_id=self.session_id,
                defaults={
                    "game_type": "MULTI",
                    "status": "IN_PROGRESS",
                    "player1": player1,
                    "player2": player2,
                },
            )

            if created:
                print(f"Created new multiplayer game: {game.id}")
            else:
                print(f"Found existing multiplayer game: {game.id}")

            return game
        except User.DoesNotExist as e:
            print(f"User not found: {e}")
            return None
        except Exception as e:
            print(f"Error creating multiplayer game: {e}")
            return None
