# api/pong/tournament_consumers.py
import json
import random
import time
from django.utils import timezone

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .base_consumers import BaseGameConsumer
from .models import User, TournamentSession, TournamentParticipant
from .serializers import generate_tournament_session_id


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
        print(f"Tournament matchmaking disconnected: {self.channel_name}, code: {close_code}")
    
    async def receive(self, text_data):
        """クライアントからのメッセージ受信処理"""
        try:
            data = json.loads(text_data)
            message_type = data.get("type")
            username = data.get("username")
            
            if not username:
                await self.send(json.dumps({
                    "type": "error", 
                    "message": "Username is required"
                }))
                return
            
            # メッセージタイプに応じた処理
            if message_type == "join_tournament":
                self.username = username  # インスタンス変数に保存
                await self.handle_join_tournament(username)
            elif message_type == "leave_tournament":
                await self.handle_leave_tournament(username)
            
        except json.JSONDecodeError:
            await self.send(json.dumps({
                "type": "error", 
                "message": "Invalid message format"
            }))
    
    async def handle_join_tournament(self, username):
        """トーナメント参加処理"""
        # ユーザー情報を取得
        user_data = await self.get_user_data(username)
        if not user_data:
            await self.send(json.dumps({
                "type": "error", 
                "message": "User not found"
            }))
            return
        
        # アクティブなトーナメントを取得または作成
        tournament_id, is_new = await self.get_or_create_active_tournament()
        
        # 既に参加しているかチェック
        if not is_new:
            already_joined = await self.check_already_joined(tournament_id, username)
            if already_joined:
                await self.send(json.dumps({
                    "type": "error", 
                    "message": "Already joined tournament"
                }))
                return
        
        # 参加者をデータベースに登録
        participant_added = await self.add_tournament_participant(tournament_id, username)
        if not participant_added:
            await self.send(json.dumps({
                "type": "error", 
                "message": "Failed to join tournament"
            }))
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
            await self.broadcast_waiting_status(TournamentMatchmakingConsumer.active_tournament_id)
    
    @database_sync_to_async
    def get_or_create_active_tournament(self):
        """アクティブなトーナメントを取得または作成"""
        # 既存のWAITING_PLAYERS状態のトーナメントを検索
        if TournamentMatchmakingConsumer.active_tournament_id:
            try:
                tournament = TournamentSession.objects.get(
                    id=TournamentMatchmakingConsumer.active_tournament_id,
                    status="WAITING_PLAYERS"
                )
                return tournament.id, False
            except TournamentSession.DoesNotExist:
                # 存在しない場合は新規作成
                pass
        
        # 新しいトーナメントを作成
        tournament = TournamentSession.objects.create(
            status="WAITING_PLAYERS",
            max_players=4
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
                tournament_id=tournament_id,
                user=user
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
            if TournamentParticipant.objects.filter(tournament=tournament, user=user).exists():
                return True
            
            # 参加者を追加
            TournamentParticipant.objects.create(
                tournament=tournament,
                user=user,
                is_ready=True
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
                tournament=tournament,
                user=user
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
            
            for participant in tournament.participants.select_related('user').all():
                participants.append({
                    "username": participant.user.username,
                    "display_name": participant.user.display_name,
                    "is_ready": participant.is_ready,
                    "joined_at": participant.joined_at.timestamp() if participant.joined_at else 0
                })
            
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
            "timestamp": int(time.time())
        }
        
        # チャンネルグループにブロードキャスト
        await self.channel_layer.group_send(
            "tournament_group",
            {
                "type": "tournament_update",
                "message": status_message
            }
        )
    
    async def start_tournament(self, tournament_id):
        """トーナメントを開始"""
        # 参加者を取得
        participants = await self.get_tournament_participants(tournament_id)
        
        if len(participants) < 4:
            print(f"Not enough participants to start tournament: {len(participants)}/4")
            return
        
        # トーナメントの状態を「IN_PROGRESS」に更新
        tournament_started = await self.update_tournament_status(tournament_id, "IN_PROGRESS")
        if not tournament_started:
            print("Failed to update tournament status")
            return
        
        # アクティブなトーナメントをリセット
        TournamentMatchmakingConsumer.active_tournament_id = None
        
        # 準決勝の組み合わせ生成
        semifinal_matches = self.generate_semifinal_matchups(participants, tournament_id)
        
        # 準決勝の対戦カードに基づいてブラケット位置を更新
        bracket_positions = {}
        
        # 準決勝1の通知
        await self.notify_semifinal_players(
            semifinal_matches["semi1"]["players"],
            semifinal_matches["semi1"]["session_id"],
            tournament_id,
            1,
            bracket_positions
        )
        
        # 準決勝2の通知
        await self.notify_semifinal_players(
            semifinal_matches["semi2"]["players"],
            semifinal_matches["semi2"]["session_id"],
            tournament_id,
            2,
            bracket_positions
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
            "semi1": {
                "players": semifinal1_players,
                "session_id": semi1_id
            },
            "semi2": {
                "players": semifinal2_players,
                "session_id": semi2_id
            }
        }
    
    async def notify_semifinal_players(self, players, session_id, tournament_id, match_number, bracket_positions):
        """準決勝プレイヤーに通知"""
        base_position = (match_number - 1) * 2 + 1  # 1または3
        
        for i, player in enumerate(players):
            # ブラケット位置計算（1,2または3,4）
            position = base_position + i
            bracket_positions[player["username"]] = position
            
            # 対戦相手の情報
            opponent = players[1-i]["username"]
            
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
                "bracket_position": position
            }
            
            # チャンネルグループに特定ユーザー向けメッセージを送信
            await self.channel_layer.group_send(
                "tournament_group",
                {
                    "type": "tournament_update",
                    "username": player["username"],
                    "message": match_data
                }
            )
    
    @database_sync_to_async
    def get_user_data(self, username):
        """ユーザー情報を取得"""
        try:
            user = User.objects.get(username=username)
            return {
                "id": user.id,
                "username": user.username,
                "display_name": user.display_name
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
                    tournament=tournament,
                    user=user
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
