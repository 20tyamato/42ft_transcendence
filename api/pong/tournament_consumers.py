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
    
    # クラス変数として待機中の参加者を管理
    waiting_players = []
    
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
        
        # 既に参加しているかチェック
        already_joined = any(p["username"] == username for p in self.waiting_players)
        if already_joined:
            await self.send(json.dumps({
                "type": "error", 
                "message": "Already joined tournament"
            }))
            return
        
        # プレイヤーリストに追加（参加した時点でready状態）
        player_info = {
            "consumer": self,
            "username": username,
            "display_name": user_data["display_name"],
            "is_ready": True  # 参加した時点でready
        }
        self.waiting_players.append(player_info)
        
        # 参加者数を計算
        player_count = len(self.waiting_players)
        
        # 全参加者に現在の状況を通知
        await self.broadcast_waiting_status()
        
        # 参加者がMAX_PLAYERS人（4人）に達したらトーナメントを開始
        if player_count >= 4:
            await self.create_tournament()
    
    async def handle_leave_tournament(self, username):
        """トーナメント離脱処理"""
        # 待機中のプレイヤーから削除
        self.waiting_players = [
            p for p in self.waiting_players if p["username"] != username
        ]
        
        # 全参加者に現在の状況を通知
        await self.broadcast_waiting_status()
    
    async def broadcast_waiting_status(self):
        """待機中の全プレイヤーに現在の状況を通知"""
        waiting_players_info = [
            {
                "username": p["username"],
                "display_name": p["display_name"],
                "is_ready": p["is_ready"]
            } for p in self.waiting_players
        ]
        
        status_message = {
            "type": "waiting_status",
            "players": waiting_players_info,
            "total_players": len(self.waiting_players),
            "required_players": 4,
            "timestamp": int(time.time())
        }
        
        # 全員に送信
        for player in self.waiting_players:
            await player["consumer"].send(json.dumps(status_message))

    async def create_tournament(self):
        """トーナメントを作成し、初回のマッチングを行う"""
        # 1. 参加者選定
        tournament_players = await self.select_tournament_players()
        if not tournament_players:
            return
            
        # 2. トーナメントセッション作成
        tournament_id = await self.create_tournament_session(
            [p["username"] for p in tournament_players]
        )
        
        if not tournament_id:
            await self.handle_tournament_creation_error(tournament_players)
            return
            
        # 3. 準決勝の組み合わせ生成
        semifinal_matches = self.generate_semifinal_matchups(tournament_players, tournament_id)
        
        # 4. 準決勝プレイヤーへの通知とブラケット位置更新
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
        
        # 5. ブラケット位置の更新
        await self.update_bracket_positions(tournament_id, bracket_positions)
    
    async def select_tournament_players(self):
        """トーナメント参加者を選定"""
        if len(self.waiting_players) < 4:
            return None
            
        # 先頭の4人を選択
        tournament_players = self.waiting_players[:4]
        
        # 待機リストから削除
        self.waiting_players = self.waiting_players[4:]
        
        return tournament_players
    
    async def handle_tournament_creation_error(self, players):
        """トーナメント作成エラー時の処理"""
        error_message = {
            "type": "error",
            "message": "Failed to create tournament"
        }
        
        for player in players:
            await player["consumer"].send(json.dumps(error_message))
    
    def generate_semifinal_matchups(self, players, tournament_id):
        """準決勝の組み合わせを生成"""
        # プレイヤーをランダムに並び替え
        random.shuffle(players)
        
        # 準決勝の組み合わせ
        semifinal1_players = players[0:2]
        semifinal2_players = players[2:4]
        
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
            
            # プレイヤーに通知
            await player["consumer"].send(json.dumps(match_data))
    
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
    def create_tournament_session(self, usernames):
        """トーナメントセッションをDBに作成"""
        try:
            # トーナメントセッションを作成
            tournament = TournamentSession.objects.create(
                status="WAITING_PLAYERS",
                max_players=4
            )
            
            # 参加者を登録
            for username in usernames:
                user = User.objects.get(username=username)
                TournamentParticipant.objects.create(
                    tournament=tournament,
                    user=user,
                    is_ready=True
                )
            
            # トーナメント開始状態に更新
            tournament.status = "IN_PROGRESS"
            tournament.started_at = timezone.now()
            tournament.save()
            
            return tournament.id
        except Exception as e:
            print(f"Error creating tournament: {e}")
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
        await self.send(text_data=json.dumps(event))


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
