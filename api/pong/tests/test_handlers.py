from django.test import TestCase
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from unittest.mock import patch, AsyncMock
from ..tournament.handlers import TournamentWebSocketHandler

class TournamentWebSocketHandlerTests(TestCase):
    @database_sync_to_async
    def _setup_test_data(self):
        """テストデータのセットアップ（必要な場合）"""
        pass

    async def asyncSetUp(self):
        """非同期のセットアップメソッド"""
        await self._setup_test_data()
        self.communicator = WebsocketCommunicator(
            TournamentWebSocketHandler.as_asgi(),
            "/ws/tournament/1/testuser/"
        )
        self.communicator.scope["url_route"] = {
            "kwargs": {
                "tournament_id": "1",
                "username": "testuser"
            }
        }

    async def asyncTearDown(self):
        """非同期のクリーンアップメソッド"""
        if hasattr(self, 'communicator'):
            await self.communicator.disconnect()

    async def test_connect(self):
        # Arrange
        with patch('pong.tournament.handlers.TournamentWebSocketHandler.get_service') as mock_get_service:
            mock_service = AsyncMock()
            mock_service.initialize_tournament.return_value = True
            mock_get_service.return_value = mock_service

            # Act
            connected, _ = await self.communicator.connect()

            # Assert
            self.assertTrue(connected)
            mock_service.initialize_tournament.assert_called_once_with(1)

    async def test_connect_fails_for_invalid_tournament(self):
        # Arrange
        with patch('pong.tournament.handlers.TournamentWebSocketHandler.get_service') as mock_get_service:
            mock_service = AsyncMock()
            mock_service.initialize_tournament.return_value = False
            mock_get_service.return_value = mock_service

            # Act
            connected, _ = await self.communicator.connect()

            # Assert
            self.assertFalse(connected)

    async def test_receive_join_tournament(self):
        # Arrange
        with patch('pong.tournament.handlers.TournamentWebSocketHandler.get_service') as mock_get_service:
            mock_service = AsyncMock()
            mock_service.initialize_tournament.return_value = True
            mock_service.add_participant.return_value = True
            mock_get_service.return_value = mock_service

            await self.communicator.connect()

            # Act
            await self.communicator.send_json_to({
                "type": "join_tournament"
            })

            # Assert
            response = await self.communicator.receive_json_from()
            self.assertEqual(response["type"], "join_success")
            mock_service.add_participant.assert_called_once_with(1, "testuser")

    async def test_receive_match_result(self):
        # Arrange
        match_data = {
            "type": "match_result",
            "match_id": 1,
            "winner": "testuser",
            "scores": {
                "player1": 15,
                "player2": 10
            }
        }

        with patch('pong.tournament.handlers.TournamentWebSocketHandler.get_service') as mock_get_service:
            mock_service = AsyncMock()
            mock_service.initialize_tournament.return_value = True
            mock_get_service.return_value = mock_service

            await self.communicator.connect()

            # Act
            await self.communicator.send_json_to(match_data)

            # Assert
            mock_service.handle_match_result.assert_called_once_with(
                1, match_data["match_id"], match_data["winner"], match_data["scores"]
            )

    async def test_receive_invalid_json(self):
        # Arrange
        with patch('pong.tournament.handlers.TournamentWebSocketHandler.get_service') as mock_get_service:
            mock_service = AsyncMock()
            mock_service.initialize_tournament.return_value = True
            mock_get_service.return_value = mock_service

            await self.communicator.connect()

            # Act
            await self.communicator.send_to(text_data="invalid json")

            # Assert
            response = await self.communicator.receive_json_from()
            self.assertEqual(response["type"], "error")
            self.assertIn("Invalid message format", response["message"])

    async def test_disconnect(self):
        # Arrange
        with patch('pong.tournament.handlers.TournamentWebSocketHandler.get_service') as mock_get_service:
            mock_service = AsyncMock()
            mock_service.initialize_tournament.return_value = True
            mock_get_service.return_value = mock_service

            await self.communicator.connect()

            # Act
            await self.communicator.disconnect()

            # Assert
            mock_service.handle_participant_disconnection.assert_called_once_with(1, "testuser")