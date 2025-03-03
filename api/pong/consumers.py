import asyncio
import json
import random

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone

from .base_consumers import BaseGameConsumer
from .game_logic import MultiplayerPongGame
from .models import Game, User, TournamentSession, TournamentParticipant
from .serializers import TournamentParticipantSerializer


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


class GameConsumer(BaseGameConsumer):
    """マルチプレイヤー向けゲームコンシューマ"""

    async def connect(self):
        """マルチプレイヤー固有の接続処理"""
        await super().connect()

        # セッションIDからゲームインスタンス作成
        if self.session_id not in self.games:
            # プレイヤー名の取得
            player_names = self.session_id.replace("game_", "").split("_")
            if len(player_names) >= 2:  # セッションID形式の変更に対応
                self.games[self.session_id] = MultiplayerPongGame(
                    session_id=self.session_id,
                    player1_name=player_names[0],
                    player2_name=player_names[1],
                )

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


# TODO: BaseGameConsumerを継承してシンプルに
# class TournamentGameConsumer(BaseGameConsumer):


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

    @database_sync_to_async
    def get_or_create_active_tournament(self):
        """アクティブなトーナメントを取得または作成"""
        tournament = TournamentSession.objects.filter(status="WAITING_PLAYERS").first()

        if not tournament:
            tournament = TournamentSession.objects.create()

        return tournament

    @database_sync_to_async
    def add_participant(self, tournament, username):
        """トーナメントに参加者を追加"""
        user = User.objects.get(username=username)
        participant, created = TournamentParticipant.objects.get_or_create(
            tournament=tournament, user=user
        )
        return participant, created

    @database_sync_to_async
    def remove_participant(self, username):
        """トーナメントから参加者を削除"""
        TournamentParticipant.objects.filter(
            user__username=username, tournament__status="WAITING_PLAYERS"
        ).delete()

    @database_sync_to_async
    def get_tournament_status(self, tournament):
        """トーナメントの現在の状態を取得"""
        participants = tournament.participants.all().select_related("user")
        serializer = TournamentParticipantSerializer(participants, many=True)
        return {
            "sessionId": str(tournament.id),
            "status": tournament.status,
            "participants": serializer.data,
        }

    @database_sync_to_async
    def create_tournament_matches(self, tournament, participants):
        """準決勝の対戦カードを生成"""
        # 参加者をシャッフルして2試合に分ける
        player_list = list(participants)
        random.shuffle(player_list)

        # 準決勝の2試合を作成
        matches = [
            {
                "id": f"semi_1_{tournament.id}",
                "round": 0,  # 0: 準決勝
                "player1": player_list[0].user.username,
                "player2": player_list[1].user.username,
                "status": "pending",
            },
            {
                "id": f"semi_2_{tournament.id}",
                "round": 0,
                "player1": player_list[2].user.username,
                "player2": player_list[3].user.username,
                "status": "pending",
            },
        ]
        return matches

    async def handle_join_tournament(self, username):
        """トーナメント参加処理"""
        try:
            tournament = await self.get_or_create_active_tournament()
            await self.add_participant(tournament, username)

            status = await self.get_tournament_status(tournament)

            # 全参加者に状態を通知
            await self.channel_layer.group_send(
                "tournament_group", {"type": "tournament_status", "status": status}
            )

            # 4人揃ったら準備開始を通知
            if status["participants"].__len__() >= 4:
                # 対戦カードを生成
                matches = await self.create_tournament_matches(
                    tournament, tournament.participants.all()
                )

                # ステータスに対戦カード情報を追加
                status["matches"] = matches

                await self.channel_layer.group_send(
                    "tournament_group", {"type": "tournament_ready", "status": status}
                )

        except User.DoesNotExist:
            await self.send(json.dumps({"type": "error", "message": "User not found"}))
        except Exception as e:
            await self.send(json.dumps({"type": "error", "message": str(e)}))

    async def handle_leave_tournament(self, username):
        """トーナメント離脱処理"""
        await self.remove_participant(username)
        tournament = await self.get_or_create_active_tournament()
        status = await self.get_tournament_status(tournament)

        # 全参加者に状態を通知
        await self.channel_layer.group_send(
            "tournament_group", {"type": "tournament_status", "status": status}
        )

    async def tournament_status(self, event):
        """トーナメント状態の通知を送信"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "tournament_status",
                    "participants": event["status"]["participants"],
                }
            )
        )

    async def tournament_ready(self, event):
        """トーナメント準備開始の通知を送信"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "tournament_ready",
                    "sessionId": event["status"]["sessionId"],
                    "participants": event["status"]["participants"],
                    "matches": event["status"]["matches"],
                }
            )
        )
