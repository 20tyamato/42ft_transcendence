import asyncio
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone

from .game_logic import MultiplayerPongGame
from .models import Game, User


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
        message = text_data_json["message"]
        print(f"Received message: {message}")

        # グループにメッセージをブロードキャスト
        await self.channel_layer.group_send(
            "test_group", {"type": "chat_message", "message": message}
        )

    async def chat_message(self, event):
        message = event["message"]

        # WebSocketにメッセージを送信
        await self.send(text_data=json.dumps({"message": message}))


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
                "session_id": f"game_{player1.username}_{player2.username}",
                "player1": player1.username,
                "player2": player2.username,
            }

            print(f"Match found! Creating game session: {match_data}")
            await player1.send(json.dumps(match_data))
            await player2.send(json.dumps(match_data))


class GameConsumer(AsyncWebsocketConsumer):
    games = {}  # セッションIDをキーとしたゲームインスタンスの管理

    async def connect(self):
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.username = self.scope["url_route"]["kwargs"]["username"]
        self.game_group_name = f"game_{self.session_id}"
        self.game_task = None

        await self.channel_layer.group_add(self.game_group_name, self.channel_name)
        await self.accept()
        print(f"Player {self.username} connected to game {self.session_id}")

        if self.session_id not in self.games:
            # セッションIDからプレイヤー名を抽出
            player_names = self.session_id.replace("game_", "").split("_")
            if len(player_names) == 2:
                self.games[self.session_id] = MultiplayerPongGame(
                    session_id=self.session_id,
                    player1_name=player_names[0],
                    player2_name=player_names[1],
                )

        # ゲーム更新ループの開始
        self.game_task = asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        # ゲームループのキャンセル
        if self.game_task:
            self.game_task.cancel()
            try:
                await self.game_task
            except asyncio.CancelledError:
                pass

        print(f"Player {self.username} disconnected from game {self.session_id}")

        # ゲームが存在する場合、切断による敗北処理を実行
        if self.session_id in self.games:
            game = self.games[self.session_id]
            game.handle_disconnection(self.username)
            
            # 残ったプレイヤーに切断を通知
            await self.channel_layer.group_send(
                self.game_group_name,
                {
                    "type": "player_disconnected",
                    "disconnected_player": self.username
                }
            )
            
            # ゲーム状態を保存して終了
            await self.save_game_state(game)
            del self.games[self.session_id]

        await self.channel_layer.group_discard(self.game_group_name, self.channel_name)

    async def player_disconnected(self, event):
        """切断通知をクライアントに送信"""
        await self.send(text_data=json.dumps({
            "type": "player_disconnected",
            "disconnected_player": event["disconnected_player"]
        }))

    @database_sync_to_async
    def save_game_state(self, game):
        """同期的なデータベース操作を非同期コンテキストで実行するためのメソッド"""
        if not hasattr(game, "db_game_id"):
            return

        try:
            game_instance = Game.objects.get(id=game.db_game_id)
            game_instance.score_player1 = game.score[game.player1_name]
            game_instance.score_player2 = game.score[game.player2_name]

            if not game.is_active:
                game_instance.end_time = timezone.now()
                winner_name = game.get_winner()
                if winner_name:
                    winner = User.objects.get(username=winner_name)
                    game_instance.winner = winner

            game_instance.save()
        except Game.DoesNotExist:
            print(f"Game with id {game.db_game_id} not found")
        except Exception as e:
            print(f"Error saving game state: {e}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        game = self.games.get(self.session_id)

        if game and data["type"] == "move":
            game.move_player(username=self.username, new_x=data["position"])

    async def game_state(self, event):
        game = self.games.get(self.session_id)
        if game:
            state = game.get_state()
            await self.send(
                text_data=json.dumps({"type": "state_update", "state": state})
            )

    async def game_loop(self):
        try:
            while True:
                if self.session_id in self.games:
                    game = self.games[self.session_id]
                    state = game.update(delta_time=0.016)

                    await self.channel_layer.group_send(
                        self.game_group_name, {"type": "game_state", "state": state}
                    )

                    # ゲーム状態の保存（頻度を下げる）
                    if (
                        game.score[game.player1_name] > 0
                        or game.score[game.player2_name] > 0
                    ):
                        await self.save_game_state(game)

                    if not game.is_active:
                        break

                await asyncio.sleep(0.016)  # 約60FPS
        except asyncio.CancelledError:
            # クリーンアップ処理
            pass
        except Exception as e:
            print(f"Error in game loop: {e}")
