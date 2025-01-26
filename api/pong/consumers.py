from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
import json
from .models import Game, User

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """WebSocket接続確立時の処理"""
        # トークン認証を確認
        if self.scope["user"].is_anonymous:
            await self.close()
            return
    
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.room_group_name = f'game_{self.game_id}'
        
        # ゲームインスタンスを取得
        self.game = await self.get_game()
        if not self.game:
            await self.close()
            return

        # ゲームルームに参加
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        """WebSocket切断時の処理"""
        # ルームから退出
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """クライアントからのメッセージ受信時の処理"""
        if not await self.is_game_active():
            return

        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'paddle_move':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'paddle_movement',
                    'username': data.get('username'),
                    'position': data.get('position')
                }
            )

        elif message_type == 'ball_update':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'ball_movement',
                    'position': data.get('position'),
                }
            )

        elif message_type == 'score_update':
            score_player1 = data.get('score_player1', 0)
            score_player2 = data.get('score_player2', 0)
            await self.update_game_score(score_player1, score_player2)
            
            # スコア更新を全プレイヤーに通知
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'score_updated',
                    'score_player1': score_player1,
                    'score_player2': score_player2
                }
            )

    async def paddle_movement(self, event):
        """パドル移動情報の送信"""
        await self.send(text_data=json.dumps({
            'type': 'paddle_move',
            'username': event['username'],
            'position': event['position']
        }))

    async def ball_movement(self, event):
        """ボール位置情報の送信"""
        await self.send(text_data=json.dumps({
            'type': 'ball_update',
            'position': event['position']
        }))

    async def score_updated(self, event):
        """スコア更新情報の送信"""
        await self.send(text_data=json.dumps({
            'type': 'score_update',
            'score_player1': event['score_player1'],
            'score_player2': event['score_player2']
        }))

    @database_sync_to_async
    def get_game(self):
        """ゲームインスタンスの取得"""
        try:
            return Game.objects.get(id=self.game_id)
        except Game.DoesNotExist:
            return None

    @database_sync_to_async
    def is_game_active(self):
        """ゲームが進行中かどうかを確認"""
        return self.game.end_time is None

    @database_sync_to_async
    def update_game_score(self, score_player1, score_player2):
        """スコアの更新と勝敗判定"""
        if self.game.end_time:
            return False
            
        self.game.score_player1 = score_player1
        self.game.score_player2 = score_player2
        
        # 15点先取で勝利
        if score_player1 >= 15:
            self.game.winner = self.game.player1
            self.game.end_time = timezone.now()
        elif score_player2 >= 15:
            self.game.winner = self.game.player2
            self.game.end_time = timezone.now()
        
        self.game.save()
        return True

class MatchmakingConsumer(AsyncWebsocketConsumer):
    # クラス変数として待機中のプレイヤーを管理
    waiting_players = {}

    async def connect(self):
        """WebSocket接続時の処理"""
        # トークンチェック
        if self.scope["user"].is_anonymous:
            await self.close()
            return

        await self.accept()
        self.user = self.scope["user"]
        
        # 待機プレイヤーリストに追加
        MatchmakingConsumer.waiting_players[self.user.username] = self
        
        # マッチング処理を実行
        await self.find_match()

    async def disconnect(self, close_code):
        """WebSocket切断時の処理"""
        if hasattr(self, 'user'):
            # 待機プレイヤーリストから削除
            MatchmakingConsumer.waiting_players.pop(self.user.username, None)

    async def receive(self, text_data):
        """クライアントからのメッセージ受信時の処理"""
        try:
            data = json.loads(text_data)
            if data.get('type') == 'cancel_matching':
                # マッチング待機をキャンセル
                await self.handle_cancel()
        except json.JSONDecodeError:
            pass

    async def find_match(self):
        """マッチング処理"""
        # 自分以外の待機中プレイヤーを探す
        for username, player in MatchmakingConsumer.waiting_players.items():
            if username != self.user.username:
                # マッチが見つかった場合、ゲームを作成
                game = await self.create_game(self.user, player.user)
                
                # 両プレイヤーに通知
                await self.send(json.dumps({
                    'type': 'match_found',
                    'gameId': str(game.id),
                    'opponent': username
                }))
                
                await player.send(json.dumps({
                    'type': 'match_found',
                    'gameId': str(game.id),
                    'opponent': self.user.username
                }))
                
                # 待機リストから両プレイヤーを削除
                MatchmakingConsumer.waiting_players.pop(username)
                MatchmakingConsumer.waiting_players.pop(self.user.username)
                return

    @database_sync_to_async
    def create_game(self, player1, player2):
        """ゲームインスタンスの作成"""
        game = Game.objects.create(
            player1=player1,
            player2=player2,
            start_time=timezone.now()
        )
        return game

    async def handle_cancel(self):
        """マッチング待機のキャンセル処理"""
        if hasattr(self, 'user'):
            MatchmakingConsumer.waiting_players.pop(self.user.username, None)
        await self.close()