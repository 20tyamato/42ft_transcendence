from typing import Optional
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .services import TournamentService

class TournamentWebSocketHandler(AsyncWebsocketConsumer):
    """トーナメントのWebSocket通信を管理するハンドラー"""

    # シングルトンとしてサービスインスタンスを保持
    _service: Optional[TournamentService] = None

    @classmethod
    def get_service(cls) -> TournamentService:
        if cls._service is None:
            cls._service = TournamentService()
        return cls._service

    async def connect(self):
        """WebSocket接続時の処理"""
        self.tournament_id = int(self.scope["url_route"]["kwargs"]["tournament_id"])
        self.username = self.scope["url_route"]["kwargs"]["username"]
        self.tournament_group = f"tournament_{self.tournament_id}"

        # トーナメントの初期化
        service = self.get_service()
        if not await service.initialize_tournament(self.tournament_id):
            await self.close()
            return

        # グループへの参加
        await self.channel_layer.group_add(self.tournament_group, self.channel_name)
        await self.accept()

        # 現在の状態をクライアントに送信
        await self.send_tournament_state()

    async def disconnect(self, close_code):
        """WebSocket切断時の処理"""
        service = self.get_service()
        await service.handle_participant_disconnection(self.tournament_id, self.username)
        
        # グループから離脱
        await self.channel_layer.group_discard(self.tournament_group, self.channel_name)

    async def receive(self, text_data):
        """クライアントからのメッセージ受信時の処理"""
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            handlers = {
                "join_tournament": self.handle_join_tournament,
                "start_match": self.handle_start_match,
                "match_result": self.handle_match_result,
            }

            handler = handlers.get(message_type)
            if handler:
                await handler(data)

        except json.JSONDecodeError:
            await self.send_error("Invalid message format")

    async def handle_join_tournament(self, data):
        """トーナメント参加リクエストの処理"""
        service = self.get_service()
        if await service.add_participant(self.tournament_id, self.username):
            # 参加成功の通知
            await self.send_json({
                "type": "join_success",
                "message": "Successfully joined the tournament"
            })
            # 全参加者に更新を通知
            await self.broadcast_tournament_state()
        else:
            await self.send_error("Failed to join tournament")

    async def handle_start_match(self, data):
        """試合開始リクエストの処理"""
        match_id = data.get("match_id")
        if not match_id:
            await self.send_error("Match ID is required")
            return

        # 試合情報の取得と通知は Service に委譲
        service = self.get_service()
        await service.start_match(self.tournament_id, match_id)

    async def handle_match_result(self, data):
        """試合結果の処理"""
        match_id = data.get("match_id")
        winner = data.get("winner")
        scores = data.get("scores")

        if not all([match_id, winner, scores]):
            await self.send_error("Missing required match result data")
            return

        service = self.get_service()
        await service.handle_match_result(
            self.tournament_id,
            match_id,
            winner,
            scores
        )
        # 結果を全参加者に通知
        await self.broadcast_tournament_state()

    # ブロードキャストメソッド
    async def broadcast_tournament_state(self):
        """トーナメントの状態を全参加者に通知"""
        service = self.get_service()
        state = await service.get_tournament_state(self.tournament_id)
        
        await self.channel_layer.group_send(
            self.tournament_group,
            {
                "type": "tournament_state_update",
                "state": state
            }
        )

    async def broadcast_match_update(self, match_data):
        """マッチの更新を関係者に通知"""
        await self.channel_layer.group_send(
            self.tournament_group,
            {
                "type": "match_state_update",
                "match_data": match_data
            }
        )

    # メッセージ送信メソッド
    async def tournament_state_update(self, event):
        """トーナメント状態更新の送信"""
        await self.send_json({
            "type": "tournament_state",
            "state": event["state"]
        })

    async def match_state_update(self, event):
        """マッチ状態更新の送信"""
        await self.send_json({
            "type": "match_update",
            "data": event["match_data"]
        })

    async def send_error(self, message: str):
        """エラーメッセージの送信"""
        await self.send_json({
            "type": "error",
            "message": message
        })

    async def send_json(self, data: dict):
        """JSON形式でメッセージを送信"""
        await self.send(text_data=json.dumps(data))

    # ユーティリティメソッド
    def get_tournament_group_name(self, tournament_id: int) -> str:
        """トーナメントのグループ名を取得"""
        return f"tournament_{tournament_id}"

    def get_match_group_name(self, match_id: int) -> str:
        """マッチのグループ名を取得"""
        return f"match_{match_id}"