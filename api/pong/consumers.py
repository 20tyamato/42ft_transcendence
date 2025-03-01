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


class TournamentGameConsumer(AsyncWebsocketConsumer):
    games = {}  # セッションIDをキーとしたゲームインスタンスの管理

    async def connect(self):
        # URL routeからパラメータを取得
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.username = self.scope["url_route"]["kwargs"]["username"]
        self.is_final = "final" in self.scope["url_route"]["pattern"].pattern
        self.game_type = "final" if self.is_final else "semi-final"
        self.game_group_name = f"tournament_{self.game_type}_{self.session_id}"
        self.game_task = None

        # トーナメントセッションの検証
        is_valid = await self.validate_tournament_session()
        if not is_valid:
            await self.close()
            return

        # チャンネルグループに参加
        await self.channel_layer.group_add(self.game_group_name, self.channel_name)
        await self.accept()

        print(
            f"Player {self.username} connected to tournament {self.game_type} game {self.session_id}"
        )

        # ゲームインスタンスの初期化
        if self.session_id not in self.games:
            players = await self.get_match_players()
            if players and len(players) == 2:
                self.games[self.session_id] = MultiplayerPongGame(
                    session_id=self.session_id,
                    player1_name=players[0],
                    player2_name=players[1],
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

        print(
            f"Player {self.username} disconnected from tournament {self.game_type} game {self.session_id}"
        )

        # ゲームが存在する場合、切断による敗北処理を実行
        if self.session_id in self.games:
            game = self.games[self.session_id]
            game.handle_disconnection(self.username)

            # 残ったプレイヤーに切断を通知
            await self.channel_layer.group_send(
                self.game_group_name,
                {"type": "player_disconnected", "disconnected_player": self.username},
            )

            # ゲーム状態を保存して終了
            await self.save_game_state(game)
            await self.handle_tournament_db_update(game)
            del self.games[self.session_id]

        await self.channel_layer.group_discard(self.game_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            game = self.games.get(self.session_id)

            if game and data["type"] == "move":
                game.move_player(username=self.username, new_x=data["position"])

                # ゲーム状態の即時送信
                state = game.get_state()
                await self.channel_layer.group_send(
                    self.game_group_name, {"type": "game_state", "state": state}
                )

        except json.JSONDecodeError:
            print("Received invalid JSON")
            return
        except KeyError as e:
            print(f"Missing required field: {e}")
            return
        except Exception as e:
            print(f"Error processing message: {e}")
            return

    async def game_loop(self):
        """ゲーム状態の定期更新ループ"""
        try:
            while True:
                if self.session_id in self.games:
                    game = self.games[self.session_id]
                    state = game.update(delta_time=0.016)

                    await self.channel_layer.group_send(
                        self.game_group_name, {"type": "game_state", "state": state}
                    )

                    # スコアが変化した場合、ゲーム状態を保存
                    if (
                        game.score[game.player1_name] > 0
                        or game.score[game.player2_name] > 0
                    ):
                        await self.save_game_state(game)

                    if not game.is_active:
                        # データベース操作とWebSocket通信を分離
                        await self.handle_tournament_db_update(game)
                        await self.broadcast_game_end(game)
                        break

                await asyncio.sleep(0.016)  # 約60FPS
        except asyncio.CancelledError:
            # ゲームループのキャンセル時は正常終了
            pass
        except Exception as e:
            print(f"Error in game loop: {e}")

    async def game_state(self, event):
        """ゲーム状態の更新をクライアントに送信"""
        if self.games.get(self.session_id):
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "state_update",
                        "state": event["state"],
                        "game_type": self.game_type,  # 準決勝/決勝の情報を追加
                    }
                )
            )

    async def player_disconnected(self, event):
        """プレイヤーの切断をクライアントに通知"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "player_disconnected",
                    "disconnected_player": event["disconnected_player"],
                    "game_type": self.game_type,
                }
            )
        )

    async def game_end(self, event):
        """ゲーム終了をクライアントに通知"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "game_end",
                    "winner": event["winner"],
                    "is_final": self.is_final,
                    "next_stage": "final" if not self.is_final else "complete",
                    "game_type": self.game_type,
                    "tournament_id": self.session_id,
                }
            )
        )

    @database_sync_to_async
    def validate_tournament_session(self):
        """トーナメントセッションとプレイヤーの参加資格を検証"""
        try:
            tournament = TournamentSession.objects.get(id=self.session_id)
            participant = TournamentParticipant.objects.get(
                tournament=tournament, user__username=self.username
            )

            # トーナメントが進行中であることを確認
            is_valid = tournament.status == "IN_PROGRESS"
            # 対戦カードに含まれているかを確認
            is_valid &= participant.bracket_position is not None

            if not is_valid:
                print(
                    f"Invalid tournament session: status={tournament.status}, participant={participant}"
                )

            return is_valid

        except (
            TournamentSession.DoesNotExist,
            TournamentParticipant.DoesNotExist,
        ) as e:
            print(f"Tournament validation error: {e}")
            return False

    @database_sync_to_async
    def get_match_players(self):
        """現在の試合の対戦プレイヤーを取得"""
        try:
            tournament = TournamentSession.objects.get(id=self.session_id)

            # 準決勝か決勝かで取得条件を変更
            if self.is_final:
                # bracket_position=3 は決勝進出者を示す
                participants = TournamentParticipant.objects.filter(
                    tournament=tournament, bracket_position=3
                ).order_by("id")[:2]
            else:
                # bracket_position=1,2 は準決勝の対戦カードを示す
                start_position = 1 if "1" in self.game_group_name else 2
                participants = TournamentParticipant.objects.filter(
                    tournament=tournament,
                    bracket_position__in=[start_position, start_position + 1],
                ).order_by("bracket_position")

            if len(participants) != 2:
                print(f"Invalid number of participants: {len(participants)}")
                return None

            return [p.user.username for p in participants]

        except Exception as e:
            print(f"Error getting match players: {e}")
            return None

    @database_sync_to_async
    def save_game_state(self, game):
        """ゲーム状態をデータベースに保存"""
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

    @database_sync_to_async
    def handle_tournament_db_update(self, game):
        """トーナメントゲーム終了時のデータベース更新"""
        try:
            tournament = TournamentSession.objects.get(id=self.session_id)
            winner_name = game.get_winner()

            if not winner_name:
                return

            winner = User.objects.get(username=winner_name)
            winner_participant = TournamentParticipant.objects.get(
                tournament=tournament, user=winner
            )

            if self.is_final:
                # 決勝戦終了時の処理
                tournament.status = "COMPLETED"
                tournament.completed_at = timezone.now()
                tournament.save()

                # 勝者の記録
                winner_participant.bracket_position = 5  # 優勝者位置
                winner_participant.save()
            else:
                # 準決勝終了時の処理
                winner_participant.bracket_position = 3  # 決勝進出者位置
                winner_participant.save()

                # 全準決勝が終了したか確認
                finalists_count = TournamentParticipant.objects.filter(
                    tournament=tournament, bracket_position=3
                ).count()

                if finalists_count == 2:
                    # 決勝戦の準備
                    tournament.status = "FINAL_READY"
                    tournament.save()

        except Exception as e:
            print(f"Error handling tournament database update: {e}")

    async def broadcast_game_end(self, game):
        """ゲーム終了時のWebSocket通知送信"""
        winner_name = game.get_winner()
        if not winner_name:
            return

        # ゲーム終了のメッセージを構築
        message = {
            "type": "game_end",
            "winner": winner_name,
            "is_final": self.is_final,
            "game_type": self.game_type,
            "tournament_id": self.session_id,
            "scores": {
                game.player1_name: game.score[game.player1_name],
                game.player2_name: game.score[game.player2_name],
            },
        }

        if not self.is_final:
            message["next_stage"] = "final_waiting"
        else:
            message["next_stage"] = "tournament_complete"

        # 試合参加者に結果を送信
        await self.channel_layer.group_send(self.game_group_name, message)

        # トーナメント全体のグループにも結果を通知
        tournament_group = f"tournament_{self.session_id}"
        await self.channel_layer.group_send(
            tournament_group,
            {
                "type": "tournament_update",
                "event": "match_complete",
                "game_type": self.game_type,
                "winner": winner_name,
                "next_stage": message["next_stage"],
            },
        )


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
