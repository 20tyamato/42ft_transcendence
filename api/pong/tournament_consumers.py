# api/pong/tournament_consumers.py
import asyncio
import json
import random
import time
from django.utils import timezone

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .base_consumers import BaseGameConsumer
from .game_logic import MultiplayerPongGame
from .models import Game, User, TournamentSession, TournamentParticipant


# NOTE: セッションID：tournament_{tournament_id}_{round_type}_{player1}_{player2}_{timestamp}
class TournamentGameConsumer(BaseGameConsumer):
    """トーナメントゲーム向けWebSocketコンシューマ"""

    games = {}  # クラス変数として共有ゲームインスタンスを管理

    async def connect(self):
        """トーナメント特有の接続処理"""
        # URL パラメータの取得
        self.round_type = self.scope["url_route"]["kwargs"].get("round_type", "")
        self.tournament_id = self.scope["url_route"]["kwargs"].get("tournament_id", "")
        self.username = self.scope["url_route"]["kwargs"].get("username", "")

        # 初期状態
        self.session_id = None
        self.game_group_name = None  # 初期化時にはまだグループに入らない

        await self.accept()
        print(
            f"Player {self.username} connected to tournament game {self.tournament_id}, round {self.round_type}"
        )

    async def receive(self, text_data):
        """クライアントからのメッセージ受信処理"""
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            # セッションID初期化メッセージの処理
            if message_type == "session_init":
                self.session_id = data.get("session_id", "")
                print(f"Session ID received from client: {self.session_id}")

                # セッションIDをもとにグループ名を設定
                self.game_group_name = f"tournament_game_{self.session_id}"

                # グループへの参加（セッションID受信後）
                await self.channel_layer.group_add(
                    self.game_group_name, self.channel_name
                )

                # ゲームの初期化
                await self.initialize_game()
                return

            # 移動コマンドなど他のメッセージは、セッションIDがある場合のみ処理
            if not self.session_id:
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "error",
                            "message": "Session not initialized. Send session_init first.",
                        }
                    )
                )
                return

            # その他のメッセージをBaseGameConsumerで処理
            if message_type == "move":
                await self.handle_move(data)

        except json.JSONDecodeError:
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Invalid JSON format"}
                )
            )
        except Exception as e:
            await self.send(text_data=json.dumps({"type": "error", "message": str(e)}))

    async def initialize_game(self):
        """ゲームの初期化処理"""
        print(f"Initializing tournament game with session ID: {self.session_id}")

        # セッションIDからプレイヤー名を抽出
        parts = self.session_id.split("_")
        player1_name = parts[3]
        player2_name = parts[4]

        # ゲームインスタンスの作成
        if self.session_id not in self.games:
            self.games[self.session_id] = MultiplayerPongGame(
                session_id=self.session_id,
                player1_name=player1_name,
                player2_name=player2_name,
            )

            # DBゲーム情報を設定
            game_instance = await self.get_or_create_tournament_game()
            if game_instance:
                self.games[self.session_id].db_game_id = game_instance.id

        # ゲーム更新ループの開始
        self.game_task = asyncio.create_task(self.game_loop())

        # 初期化完了を通知
        await self.send(
            text_data=json.dumps(
                {"type": "game_initialized", "session_id": self.session_id}
            )
        )

    @database_sync_to_async
    def get_or_fetch_session_id(self):
        """セッションIDの取得またはセッション情報から生成"""
        try:
            # 既存のゲームからセッションIDを取得
            game = Game.objects.filter(
                tournament_id=self.tournament_id,
                tournament_round=0 if self.round_type.startswith("semi") else 1,
                status__in=["WAITING", "IN_PROGRESS"],
            ).first()

            if game and game.session_id:
                return game.session_id

            # フロントエンドからの初期メッセージを待つか、適切なエラー処理
            return None

        except Exception as e:
            print(f"Error getting tournament session ID: {e}")
            return None

    async def disconnect(self, close_code):
        """トーナメント特有の切断処理"""
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

            # トーナメント進行状況を更新
            await self.update_tournament_progress(is_disconnection=True)

            # ゲームインスタンスを削除
            del self.games[self.session_id]

        await super().disconnect(close_code)

    async def game_loop(self):
        """トーナメント特有のゲームループ処理"""
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
    def get_or_create_tournament_game(self):
        """トーナメントゲーム情報をDBから取得または作成"""
        session_info = self._parse_session_id()
        if not session_info:
            print(f"Invalid tournament session ID format: {self.session_id}")
            return None

        try:
            # トーナメント情報の取得
            tournament = TournamentSession.objects.get(id=session_info["tournament_id"])

            # プレイヤー情報の取得
            player1 = User.objects.get(username=session_info["player1"])
            player2 = User.objects.get(username=session_info["player2"])

            # ラウンド番号の決定
            tournament_round = 0 if session_info["round_type"].startswith("semi") else 1

            # ゲーム取得または作成
            game, created = Game.objects.get_or_create(
                session_id=self.session_id,
                defaults={
                    "game_type": "TOURNAMENT",
                    "status": "IN_PROGRESS",
                    "player1": player1,
                    "player2": player2,
                    "tournament": tournament,
                    "tournament_round": tournament_round,
                },
            )

            if created:
                print(
                    f"Created new tournament game: {game.id}, round: {tournament_round}"
                )
            else:
                print(
                    f"Found existing tournament game: {game.id}, round: {tournament_round}"
                )

            return game
        except Exception as e:
            print(f"Error creating tournament game: {e}")
        return None

    @database_sync_to_async
    def update_tournament_progress(self, is_disconnection=False):
        """トーナメント進行状況を更新する入口メソッド"""
        if not hasattr(self, "session_id"):
            return

        session_info = self._parse_session_id()
        if not session_info:
            return

        try:
            # トーナメント情報の取得
            tournament = TournamentSession.objects.get(id=session_info["tournament_id"])

            # ゲーム情報の取得
            game_instance = Game.objects.get(session_id=self.session_id)

            if session_info["round_type"].startswith("semi"):
                self._update_semifinal_progress(tournament, game_instance)
            elif session_info["round_type"] == "final":
                self._update_final_progress(tournament, game_instance)
        except Exception as e:
            print(f"Error updating tournament progress: {e}")

    def _update_semifinal_progress(self, tournament, game_instance):
        """準決勝の進行状況を更新"""
        # 勝者が決まっている場合
        if game_instance.winner:
            # 勝者のブラケット位置を更新（決勝進出者は5）
            participant = TournamentParticipant.objects.get(
                tournament=tournament, user=game_instance.winner
            )
            participant.bracket_position = 5
            participant.save()

            # 他の準決勝が完了しているか確認
            semifinals_completed = (
                Game.objects.filter(
                    tournament=tournament, tournament_round=0, status="COMPLETED"
                ).count()
                == 2
            )

            # 両方の準決勝が完了していれば、決勝の準備
            if semifinals_completed:
                self._prepare_final_match(tournament)

    def _prepare_final_match(self, tournament):
        """決勝戦の準備"""
        # トーナメント状態を更新
        tournament.status = "FINAL_READY"
        tournament.save()

        # 決勝進出者を取得
        finalists = TournamentParticipant.objects.filter(
            tournament=tournament, bracket_position=5
        ).select_related("user")

        if finalists.count() == 2:
            # 決勝戦のセッションIDを生成
            timestamp = int(timezone.now().timestamp())
            final_session_id = f"tournament_{tournament.id}_final_{finalists[0].user.username}_{finalists[1].user.username}_{timestamp}"

            # 決勝戦を作成
            Game.objects.create(
                session_id=final_session_id,
                game_type="TOURNAMENT",
                status="WAITING",
                player1=finalists[0].user,
                player2=finalists[1].user,
                tournament=tournament,
                tournament_round=1,
            )

    def _update_final_progress(self, tournament, game_instance):
        """決勝の進行状況を更新"""
        # 勝者が決まっている場合
        if game_instance.winner:
            # 勝者のブラケット位置を更新（優勝者は6）
            participant = TournamentParticipant.objects.get(
                tournament=tournament, user=game_instance.winner
            )
            participant.bracket_position = 6
            participant.save()

            # トーナメント優勝者を設定
            tournament.winner = game_instance.winner
            tournament.status = "COMPLETED"
            tournament.completed_at = timezone.now()
            tournament.save()

    def _parse_session_id(self, session_id=None):
        """セッションIDからトーナメント情報を抽出"""
        sid = session_id or self.session_id
        parts = sid.split("_")
        if len(parts) < 5:
            return None

        return {
            "tournament_id": parts[1],
            "round_type": parts[2],
            "player1": parts[3],
            "player2": parts[4],
            "timestamp": parts[5] if len(parts) > 5 else None,
        }


class TournamentMatchmakingConsumer(AsyncWebsocketConsumer):
    """トーナメント参加者のマッチメイキングを担当するコンシューマ"""

    # 現在アクティブなトーナメントのID（WAITING_PLAYERS状態のもの）
    active_tournament_id = None

    async def connect(self):
        """WebSocket接続時の処理"""
        await self.channel_layer.group_add("tournament_group", self.channel_name)
        await self.accept()
        print(f"Tournament matchmaking connected: {self.channel_name}")

    async def disconnect(self, close_code):
        """WebSocket切断時の処理"""
        # ユーザー名があれば、トーナメントから離脱処理
        if hasattr(self, "username"):
            await self.handle_leave_tournament(self.username)

        # グループから削除
        await self.channel_layer.group_discard("tournament_group", self.channel_name)
        print(
            f"Tournament matchmaking disconnected: {self.channel_name}, code: {close_code}"
        )

    async def receive(self, text_data):
        """クライアントからのメッセージ受信処理"""
        try:
            data = json.loads(text_data)
            message_type = data.get("type")
            username = data.get("username")

            if not username:
                await self.send(
                    json.dumps({"type": "error", "message": "Username is required"})
                )
                return

            # メッセージタイプに応じた処理
            if message_type == "join_tournament":
                self.username = username  # インスタンス変数に保存
                await self.handle_join_tournament(username)
            elif message_type == "leave_tournament":
                await self.handle_leave_tournament(username)

        except json.JSONDecodeError:
            await self.send(
                json.dumps({"type": "error", "message": "Invalid message format"})
            )

    async def handle_join_tournament(self, username):
        """トーナメント参加処理"""
        # ユーザー情報を取得
        user_data = await self.get_user_data(username)
        if not user_data:
            await self.send(json.dumps({"type": "error", "message": "User not found"}))
            return

        # アクティブなトーナメントを取得または作成
        tournament_id, is_new = await self.get_or_create_active_tournament()

        # 既に参加しているかチェック
        if not is_new:
            already_joined = await self.check_already_joined(tournament_id, username)
            if already_joined:
                await self.send(
                    json.dumps(
                        {"type": "error", "message": "Already joined tournament"}
                    )
                )
                return

        # 参加者をデータベースに登録
        participant_added = await self.add_tournament_participant(
            tournament_id, username
        )
        if not participant_added:
            await self.send(
                json.dumps({"type": "error", "message": "Failed to join tournament"})
            )
            return

        # 参加者数を取得
        player_count = await self.get_participant_count(tournament_id)

        # 全参加者に現在の状況を通知
        await self.broadcast_waiting_status(tournament_id)

        # 参加者が4人に達したらトーナメントを開始
        if player_count >= 4:
            await self.start_tournament(tournament_id)

    async def handle_leave_tournament(self, username):
        """トーナメント離脱処理"""
        # 現在アクティブなトーナメントから参加者を削除
        if TournamentMatchmakingConsumer.active_tournament_id:
            await self.remove_tournament_participant(
                TournamentMatchmakingConsumer.active_tournament_id, username
            )

        # 全参加者に現在の状況を通知
        if TournamentMatchmakingConsumer.active_tournament_id:
            await self.broadcast_waiting_status(
                TournamentMatchmakingConsumer.active_tournament_id
            )

    @database_sync_to_async
    def get_or_create_active_tournament(self):
        """アクティブなトーナメントを取得または作成"""
        # 既存のWAITING_PLAYERS状態のトーナメントを検索
        if TournamentMatchmakingConsumer.active_tournament_id:
            try:
                tournament = TournamentSession.objects.get(
                    id=TournamentMatchmakingConsumer.active_tournament_id,
                    status="WAITING_PLAYERS",
                )
                return tournament.id, False
            except TournamentSession.DoesNotExist:
                # 存在しない場合は新規作成
                pass

        # 新しいトーナメントを作成
        tournament = TournamentSession.objects.create(
            status="WAITING_PLAYERS", max_players=4
        )
        TournamentMatchmakingConsumer.active_tournament_id = tournament.id
        print(f"Created new tournament: {tournament.id}")
        return tournament.id, True

    @database_sync_to_async
    def check_already_joined(self, tournament_id, username):
        """ユーザーが既にトーナメントに参加しているかチェック"""
        try:
            user = User.objects.get(username=username)
            return TournamentParticipant.objects.filter(
                tournament_id=tournament_id, user=user
            ).exists()
        except User.DoesNotExist:
            return False

    @database_sync_to_async
    def add_tournament_participant(self, tournament_id, username):
        """トーナメントに参加者を追加"""
        try:
            tournament = TournamentSession.objects.get(id=tournament_id)
            user = User.objects.get(username=username)

            # 既に参加している場合は何もしない
            if TournamentParticipant.objects.filter(
                tournament=tournament, user=user
            ).exists():
                return True

            # 参加者を追加
            TournamentParticipant.objects.create(
                tournament=tournament, user=user, is_ready=True
            )
            return True
        except Exception as e:
            print(f"Error adding tournament participant: {e}")
            return False

    @database_sync_to_async
    def remove_tournament_participant(self, tournament_id, username):
        """トーナメントから参加者を削除"""
        try:
            tournament = TournamentSession.objects.get(id=tournament_id)
            user = User.objects.get(username=username)

            # 参加者を削除
            TournamentParticipant.objects.filter(
                tournament=tournament, user=user
            ).delete()

            return True
        except Exception as e:
            print(f"Error removing tournament participant: {e}")
            return False

    @database_sync_to_async
    def get_participant_count(self, tournament_id):
        """トーナメントの参加者数を取得"""
        try:
            tournament = TournamentSession.objects.get(id=tournament_id)
            return tournament.participants.count()
        except Exception as e:
            print(f"Error getting participant count: {e}")
            return 0

    @database_sync_to_async
    def get_tournament_participants(self, tournament_id):
        """トーナメントの参加者を取得"""
        try:
            tournament = TournamentSession.objects.get(id=tournament_id)
            participants = []

            for participant in tournament.participants.select_related("user").all():
                participants.append(
                    {
                        "username": participant.user.username,
                        "display_name": participant.user.display_name,
                        "is_ready": participant.is_ready,
                        "joined_at": participant.joined_at.timestamp()
                        if participant.joined_at
                        else 0,
                    }
                )

            return participants
        except Exception as e:
            print(f"Error getting tournament participants: {e}")
            return []

    async def broadcast_waiting_status(self, tournament_id):
        """待機中の全プレイヤーに現在の状況を通知"""
        # 参加者情報を取得
        participants = await self.get_tournament_participants(tournament_id)

        # 参加者数を取得
        player_count = len(participants)

        status_message = {
            "type": "waiting_status",
            "tournament_id": tournament_id,
            "players": participants,
            "total_players": player_count,
            "required_players": 4,
            "timestamp": int(time.time()),
        }

        # チャンネルグループにブロードキャスト
        await self.channel_layer.group_send(
            "tournament_group", {"type": "tournament_update", "message": status_message}
        )

    async def start_tournament(self, tournament_id):
        """トーナメントを開始"""
        # 参加者を取得
        participants = await self.get_tournament_participants(tournament_id)

        if len(participants) < 4:
            print(f"Not enough participants to start tournament: {len(participants)}/4")
            return

        # トーナメントの状態を「IN_PROGRESS」に更新
        tournament_started = await self.update_tournament_status(
            tournament_id, "IN_PROGRESS"
        )
        if not tournament_started:
            print("Failed to update tournament status")
            return

        # アクティブなトーナメントをリセット
        TournamentMatchmakingConsumer.active_tournament_id = None

        # 準決勝の組み合わせ生成
        semifinal_matches = self.generate_semifinal_matchups(
            participants, tournament_id
        )

        # 準決勝の対戦カードに基づいてブラケット位置を更新
        bracket_positions = {}

        # 準決勝1の通知
        await self.notify_semifinal_players(
            semifinal_matches["semi1"]["players"],
            semifinal_matches["semi1"]["session_id"],
            tournament_id,
            1,
            bracket_positions,
        )

        # 準決勝2の通知
        await self.notify_semifinal_players(
            semifinal_matches["semi2"]["players"],
            semifinal_matches["semi2"]["session_id"],
            tournament_id,
            2,
            bracket_positions,
        )

        # ブラケット位置の更新
        await self.update_bracket_positions(tournament_id, bracket_positions)

    @database_sync_to_async
    def update_tournament_status(self, tournament_id, status):
        """トーナメントの状態を更新"""
        try:
            tournament = TournamentSession.objects.get(id=tournament_id)
            tournament.status = status

            if status == "IN_PROGRESS":
                tournament.started_at = timezone.now()
            elif status == "COMPLETED":
                tournament.completed_at = timezone.now()

            tournament.save()
            return True
        except Exception as e:
            print(f"Error updating tournament status: {e}")
            return False

    def generate_semifinal_matchups(self, participants, tournament_id):
        """準決勝の組み合わせを生成"""
        # 参加者をランダムに並び替え
        random.shuffle(participants)

        # 準決勝の組み合わせ
        semifinal1_players = participants[0:2]
        semifinal2_players = participants[2:4]

        # タイムスタンプ生成（両方のマッチで共通）
        timestamp = int(time.time())

        # 準決勝1のセッションID
        semi1_id = f"tournament_{tournament_id}_semi1_{semifinal1_players[0]['username']}_{semifinal1_players[1]['username']}_{timestamp}"

        # 準決勝2のセッションID
        semi2_id = f"tournament_{tournament_id}_semi2_{semifinal2_players[0]['username']}_{semifinal2_players[1]['username']}_{timestamp}"

        return {
            "semi1": {"players": semifinal1_players, "session_id": semi1_id},
            "semi2": {"players": semifinal2_players, "session_id": semi2_id},
        }

    async def notify_semifinal_players(
        self, players, session_id, tournament_id, match_number, bracket_positions
    ):
        """準決勝プレイヤーに通知"""
        base_position = (match_number - 1) * 2 + 1  # 1または3

        for i, player in enumerate(players):
            # ブラケット位置計算（1,2または3,4）
            position = base_position + i
            bracket_positions[player["username"]] = position

            # 対戦相手の情報
            opponent = players[1 - i]["username"]

            # 通知データ作成
            match_data = {
                "type": "tournament_match",
                "tournament_id": tournament_id,
                "match_type": "semifinal",
                "match_number": match_number,
                "session_id": session_id,
                "opponent": opponent,
                "is_player1": i == 0,
                "next_match": "final",
                "bracket_position": position,
            }

            # チャンネルグループに特定ユーザー向けメッセージを送信
            await self.channel_layer.group_send(
                "tournament_group",
                {
                    "type": "tournament_update",
                    "username": player["username"],
                    "message": match_data,
                },
            )

    @database_sync_to_async
    def get_user_data(self, username):
        """ユーザー情報を取得"""
        try:
            user = User.objects.get(username=username)
            return {
                "id": user.id,
                "username": user.username,
                "display_name": user.display_name,
            }
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def update_bracket_positions(self, tournament_id, positions_dict):
        """トーナメント参加者のブラケット位置を更新"""
        try:
            tournament = TournamentSession.objects.get(id=tournament_id)

            for username, position in positions_dict.items():
                user = User.objects.get(username=username)
                participant = TournamentParticipant.objects.get(
                    tournament=tournament, user=user
                )
                participant.bracket_position = position
                participant.save()

            return True
        except Exception as e:
            print(f"Error updating bracket positions: {e}")
            return False

    # グループメッセージ受信ハンドラ（他のコンシューマからの通知を受け取る）
    async def tournament_update(self, event):
        """トーナメント更新通知をクライアントに転送"""
        # 特定ユーザー向けのメッセージなら、そのユーザーにだけ送信
        if "username" in event and hasattr(self, "username"):
            if event["username"] != self.username:
                return

        # メッセージを転送
        if "message" in event:
            await self.send(text_data=json.dumps(event["message"]))


class TournamentWaitingFinalConsumer(AsyncWebsocketConsumer):
    """決勝戦開始を待機するプレイヤー向けのWebSocketコンシューマ
    
    URL: /ws/tournament/waiting_final/{tournament_id}/{username}/
    """
    async def connect(self):
        """WebSocket接続時の処理"""
        # URLパラメータの取得
        self.tournament_id = self.scope["url_route"]["kwargs"].get("session_id", "")
        self.username = self.scope["url_route"]["kwargs"].get("username", "")

        # トーナメント待機グループに参加
        self.group_name = f"tournament_final_waiting_{self.tournament_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        
        # 接続を受け入れる
        await self.accept()
        print(f"Player {self.username} connected to tournament final waiting for tournament {self.tournament_id}")
        
        # 参加資格検証（準決勝勝者かどうか）
        is_eligible = await self.verify_eligibility()
        if not is_eligible:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "You are not eligible for the final match."
            }))
            # 接続を閉じる（資格のないユーザー）
            await self.close()
            return

    async def disconnect(self, close_code):
        """WebSocket切断時の処理"""
        # グループから離脱
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        print(f"Player {self.username} disconnected from tournament final waiting")

    async def receive(self, text_data):
        """クライアントからのメッセージ受信処理"""
        try:
            data = json.loads(text_data)
            message_type = data.get("type")
            
            # ステータス要求メッセージの処理
            if message_type == "request_status":
                status_data = await self.get_waiting_status()
                await self.send(text_data=json.dumps(status_data))
                
                # 両方の準決勝が完了していれば決勝戦の準備
                if status_data.get("all_semifinals_completed", False):
                    await self.check_and_prepare_final()
        
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Invalid JSON format"
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": str(e)
            }))

    @database_sync_to_async
    def verify_eligibility(self):
        """ユーザーが決勝戦に参加する資格があるか検証"""
        try:
            # トーナメント情報の取得
            tournament = TournamentSession.objects.get(id=self.tournament_id)
            user = User.objects.get(username=self.username)
            
            # ブラケット位置が5（決勝進出者）のプレイヤーであるか確認
            participant = TournamentParticipant.objects.filter(
                tournament=tournament,
                user=user,
                bracket_position=5  # 決勝進出者の位置
            ).exists()
            
            return participant
        except (TournamentSession.DoesNotExist, User.DoesNotExist):
            return False
        except Exception as e:
            print(f"Error verifying eligibility: {e}")
            return False

    @database_sync_to_async
    def get_waiting_status(self):
        """決勝待機ステータスの取得"""
        try:
            tournament = TournamentSession.objects.get(id=self.tournament_id)
            
            # 準決勝の完了数をカウント
            completed_semifinals = Game.objects.filter(
                tournament=tournament,
                tournament_round=0,  # 準決勝
                status="COMPLETED"
            ).count()
            
            # 決勝進出者リスト
            finalists = []
            for participant in TournamentParticipant.objects.filter(
                tournament=tournament,
                bracket_position=5  # 決勝進出者
            ).select_related("user"):
                finalists.append({
                    "username": participant.user.username,
                    "display_name": participant.user.display_name
                })
            
            # 全準決勝完了フラグ
            all_semifinals_completed = completed_semifinals == 2
            
            return {
                "type": "waiting_status",
                "tournament_id": self.tournament_id,
                "completed_semifinals": completed_semifinals,
                "all_semifinals_completed": all_semifinals_completed,
                "finalists": finalists,
                "timestamp": timezone.now().timestamp()
            }
        except Exception as e:
            print(f"Error getting waiting status: {e}")
            return {
                "type": "error",
                "message": f"Error getting status: {str(e)}"
            }

    async def check_and_prepare_final(self):
        """決勝戦の準備が整っているか確認し、準備"""
        try:
            # 決勝戦情報の取得
            final_match = await self.get_final_match()
            
            if not final_match:
                print("Final match not found or not ready")
                return
            
            # 決勝戦の準備が整っている場合、参加プレイヤーに通知
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "final_ready",
                    "session_id": final_match["session_id"],
                    "player1": final_match["player1"],
                    "player2": final_match["player2"]
                }
            )
        except Exception as e:
            print(f"Error checking and preparing final: {e}")

    @database_sync_to_async
    def get_final_match(self):
        """決勝戦情報の取得"""
        try:
            tournament = TournamentSession.objects.get(id=self.tournament_id)
            
            # 決勝戦の取得
            final_match = Game.objects.filter(
                tournament=tournament,
                tournament_round=1,  # 決勝
                status__in=["WAITING", "IN_PROGRESS"]
            ).first()
            
            if not final_match:
                return None
            
            return {
                "session_id": final_match.session_id,
                "player1": final_match.player1.username,
                "player2": final_match.player2.username,
                "status": final_match.status
            }
        except Exception as e:
            print(f"Error getting final match: {e}")
            return None

    async def final_ready(self, event):
        """決勝戦準備完了通知のハンドラー"""
        # プレイヤー1か2かを判定
        is_player1 = self.username == event["player1"]
        
        # クライアントに通知
        await self.send(text_data=json.dumps({
            "type": "final_ready",
            "session_id": event["session_id"],
            "is_player1": is_player1
        }))  