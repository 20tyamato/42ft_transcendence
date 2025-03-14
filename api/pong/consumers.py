import asyncio
import json
import time

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .base_consumers import BaseGameConsumer
from .game_logic import MultiplayerPongGame
from .models import Game, User


class MatchmakingConsumer(AsyncWebsocketConsumer):
    waiting_players = []  # クラス変数として待機プレイヤーを管理

    async def connect(self):
        await self.accept()
        print("Client connected to matchmaking")

    async def disconnect(self, close_code):
        if self in self.waiting_players:
            self.waiting_players.remove(self)
        print("Client disconnected from matchmaking")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            print(f"Received message: {data}")

            if data.get("type") == "join_matchmaking":
                # ユーザー名を取得
                self.username = data.get("username")
                await self.join_matchmaking()

        except json.JSONDecodeError:
            print("Received invalid JSON")
            return

    async def join_matchmaking(self):
        print(f"Player {self.username} joining matchmaking")
        print(f"Current waiting players: {len(self.waiting_players)}")

        self.waiting_players.append(self)
        await self.send(
            json.dumps({"type": "waiting", "message": "Waiting for opponent..."})
        )

        print(f"After joining: {len(self.waiting_players)} players waiting")
        if len(self.waiting_players) >= 2:
            player1 = self.waiting_players.pop(0)
            player2 = self.waiting_players.pop(0)

            match_data = {
                "type": "match_found",
                "session_id": f"game_{player1.username}_{player2.username}_{int(time.time())}",
                "player1": player1.username,
                "player2": player2.username,
            }

            print(f"Match found! Creating game session: {match_data}")
            await player1.send(json.dumps(match_data))
            await player2.send(json.dumps(match_data))


class GameConsumer(BaseGameConsumer):
    """マルチプレイヤー向けゲームコンシューマ"""

    async def connect(self):
        """マルチプレイヤー固有の接続処理"""
        await super().connect()

        # セッションIDからゲームインスタンス作成
        if self.session_id not in self.games:
            # セッションIDからプレイヤー名を抽出
            # 想定形式: game_player1_player2_timestamp
            parts = self.session_id.split("_")
            if len(parts) >= 3:  # game_type + player1 + player2 + timestamp
                player1_name = parts[1]
                player2_name = parts[2]

                self.games[self.session_id] = MultiplayerPongGame(
                    session_id=self.session_id,
                    player1_name=player1_name,
                    player2_name=player2_name,
                )

                # DBゲーム情報を設定
                game_instance = await self.get_or_create_game()
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
    def get_or_create_game(self):
        """ゲーム情報をDBから取得または作成"""
        parts = self.session_id.split("_")
        if len(parts) < 3:
            print(f"Invalid session ID format: {self.session_id}")
            return None

        player1_name = parts[1]
        player2_name = parts[2]

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
