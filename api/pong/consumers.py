from channels.generic.websocket import AsyncWebsocketConsumer
import json
from channels.db import database_sync_to_async
from .models import GameSession
from .game_logic import MultiplayerPongGame
import asyncio

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
        message = text_data_json['message']
        print(f"Received message: {message}")

        # グループにメッセージをブロードキャスト
        await self.channel_layer.group_send(
            "test_group",
            {
                'type': 'chat_message',
                'message': message
            }
        )

    async def chat_message(self, event):
        message = event['message']

        # WebSocketにメッセージを送信
        await self.send(text_data=json.dumps({
            'message': message
        }))

class MatchmakingConsumer(AsyncWebsocketConsumer):
    waiting_players = []  # クラス変数として待機プレイヤーを管理

    async def connect(self):
        # いったん認証チェックなしで接続を許可
        await self.accept()
        print("Client connected to matchmaking")  # デバッグ用ログ

    async def disconnect(self, close_code):
        # 切断時は待機リストから削除
        if self in self.waiting_players:
            self.waiting_players.remove(self)
        print("Client disconnected from matchmaking")  # デバッグ用ログ

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            print(f"Received message: {data}")  # デバッグ用ログ
            
            if data.get('type') == 'join_matchmaking':
                await self.join_matchmaking()
        except json.JSONDecodeError:
            print("Received invalid JSON")
            return

    async def join_matchmaking(self):
        print("Player joining matchmaking") # デバッグ出力追加
        print(f"Current waiting players: {len(self.waiting_players)}") # デバッグ出力追加
        
        self.waiting_players.append(self)
        await self.send(json.dumps({
            'type': 'waiting',
            'message': 'Waiting for opponent...'
        }))
        
        print(f"After joining: {len(self.waiting_players)} players waiting") # デバッグ出力追加
        if len(self.waiting_players) >= 2:
            print("Match found! Creating game session...") # デバッグ出力追加
            player1 = self.waiting_players.pop(0)
            player2 = self.waiting_players.pop(0)
            
            match_data = {
                'type': 'match_found',
                'session_id': f"game_{id(player1)}_{id(player2)}"
            }
            
            print(f"Sending match data: {match_data}") # デバッグ出力追加
            await player1.send(json.dumps(match_data))
            await player2.send(json.dumps(match_data))

class GameConsumer(AsyncWebsocketConsumer):
    games = {}  # セッションIDをキーとしたゲームインスタンスの管理

    async def connect(self):
        # セッションIDをURLパラメータから取得
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.game_group_name = f'game_{self.session_id}'

        # ゲームグループに参加
        await self.channel_layer.group_add(
            self.game_group_name,
            self.channel_name
        )
        await self.accept()

        # 必要に応じてゲームインスタンスを作成
        if self.session_id not in self.games:
            self.games[self.session_id] = MultiplayerPongGame(
                game_id=self.session_id,
                player1_id=self.scope["url_route"]["kwargs"]["player1_id"],
                player2_id=self.scope["url_route"]["kwargs"]["player2_id"]
            )

        # ゲーム更新ループの開始
        asyncio.create_task(self.game_loop())

    async def game_loop(self):
        while True:
            if self.session_id in self.games:
                game = self.games[self.session_id]
                state = game.update(delta_time=0.016)  # 約60FPS
                
                # 全プレイヤーに状態を送信
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'game_state',
                        'state': state
                    }
                )
                
                # ゲーム状態の保存
                await game.save_game_state()
                
                if not game.is_active:
                    # ゲーム終了処理
                    break
                    
            await asyncio.sleep(0.016)  # 約60FPS

    async def disconnect(self, close_code):
        # グループから削除
        await self.channel_layer.group_discard(
            self.game_group_name,
            self.channel_name
        )
        
        # 必要に応じてゲームを終了
        if self.session_id in self.games:
            game = self.games[self.session_id]
            await game.save_game_state()
            del self.games[self.session_id]

    async def receive(self, text_data):
        data = json.loads(text_data)
        game = self.games.get(self.session_id)
        
        if game and data['type'] == 'move':
            # プレイヤーの移動を処理
            game.move_player(
                player_id=data['player_id'],
                new_x=data['position']
            )

    async def game_state(self, event):
        # 各クライアントに適した視点のゲーム状態を送信
        game = self.games.get(self.session_id)
        if game:
            state = game.get_state_for_player(self.scope["url_route"]["kwargs"]["player_id"])
            await self.send(text_data=json.dumps({
                'type': 'state_update',
                'state': state
            }))