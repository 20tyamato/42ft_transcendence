# base_consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json
import asyncio
from django.utils import timezone

from .models import Game, User


class BaseGameConsumer(AsyncWebsocketConsumer):
    """全ゲームタイプの基底となる WebSocket コンシューマ"""

    games = {}  # クラス変数として共有ゲームインスタンスを管理

    async def connect(self):
        """基本接続処理"""
        # URL パラメータの取得（サブクラスで拡張可能）
        self.session_id = self.scope["url_route"]["kwargs"].get("session_id", "")
        self.username = self.scope["url_route"]["kwargs"].get("username", "")

        # グループ名の設定（サブクラスでオーバーライド可能）
        self.game_group_name = f"game_{self.session_id}"

        # グループへの参加
        await self.channel_layer.group_add(self.game_group_name, self.channel_name)
        await self.accept()
        print(f"Player {self.username} connected to game {self.session_id}")

        # ゲーム更新ループの準備
        self.game_task = None

    async def disconnect(self, close_code):
        """基本切断処理"""
        # ゲームループのキャンセル処理
        if self.game_task:
            self.game_task.cancel()
            try:
                await self.game_task
            except asyncio.CancelledError:
                pass

        print(f"Player {self.username} disconnected from game {self.session_id}")

        # グループからの離脱
        await self.channel_layer.group_discard(self.game_group_name, self.channel_name)

    async def receive(self, text_data):
        """基本メッセージ受信処理"""
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            # タイプ別の処理分岐
            if message_type == "move":
                await self.handle_move(data)
            # その他のメッセージタイプはサブクラスで実装

        except json.JSONDecodeError:
            await self.send(
                json.dumps({"type": "error", "message": "Invalid JSON format"})
            )
        except Exception as e:
            await self.send(json.dumps({"type": "error", "message": str(e)}))

    async def handle_move(self, data):
        """移動処理の基本実装"""
        game = self.games.get(self.session_id)
        if game:
            game.move_player(username=self.username, new_x=data.get("position", 0))

    async def game_state(self, event):
        """ゲーム状態更新の送信"""
        # イベントからステートを取得してクライアントに送信
        state = event.get("state", {})
        await self.send(text_data=json.dumps({"type": "state_update", "state": state}))

    async def player_disconnected(self, event):
        """プレイヤー切断通知の送信"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "player_disconnected",
                    "disconnected_player": event.get("disconnected_player"),
                    "state": event.get("state", {}),
                }
            )
        )

    async def game_loop(self):
        """ゲーム状態更新ループの基本実装"""
        try:
            while True:
                if self.session_id in self.games:
                    game = self.games[self.session_id]
                    state = game.update(delta_time=0.016)  # 約60FPS

                    # グループにブロードキャスト
                    await self.channel_layer.group_send(
                        self.game_group_name, {"type": "game_state", "state": state}
                    )

                    # ゲーム終了判定
                    if not game.is_active:
                        # 終了処理はサブクラスで拡張
                        break

                await asyncio.sleep(0.016)

        except asyncio.CancelledError:
            # ループのキャンセル（クリーンアップ）
            pass
        except Exception as e:
            print(f"Error in game loop: {e}")

    @database_sync_to_async
    def save_game_state(self, game):
        """ゲーム状態をデータベースに保存（基本実装）"""
        if not hasattr(game, "db_game_id") or game.db_game_id is None:
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
                    game_instance.status = "COMPLETED"

            game_instance.save()
            
            # Update levels for both players when game ends
            player1 = User.objects.get(username=game.player1_name)
            player1.update_level()
            
            # Also update player2's level if it's not an AI opponent
            if game.player2_name and not hasattr(game, 'ai_level'):
                player2 = User.objects.get(username=game.player2_name)
                player2.update_level()

        except Game.DoesNotExist:
            print(f"Game with id {game.db_game_id} not found")
        except Exception as e:
            print(f"Error saving game state: {e}")
