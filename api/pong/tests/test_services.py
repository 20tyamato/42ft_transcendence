from django.test import TestCase
from unittest.mock import patch, AsyncMock, MagicMock
from channels.db import database_sync_to_async
from ..tournament.services import TournamentService
from ..models import TournamentGameSession, User

class TournamentServiceTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        pass

    async def asyncSetUp(self):
        """非同期のセットアップ"""
        self.service = TournamentService()
        self.tournament = await self._create_test_tournament()
        self.user = await self._create_test_user()

    @database_sync_to_async
    def _create_test_tournament(self):
        """テスト用トーナメントの作成"""
        return TournamentGameSession.objects.create(
            name="Test Tournament",
            status="WAITING_PLAYERS",
            min_players=2,
            max_players=8
        )

    @database_sync_to_async
    def _create_test_user(self):
        """テスト用ユーザーの作成"""
        return User.objects.create(
            username="testuser",
            email="test@example.com",
            display_name="Test User"
        )

    async def test_initialize_tournament(self):
        """トーナメント初期化のテスト"""
        # Arrange
        tournament_id = self.tournament.id
        
        with patch('pong.tournament.repositories.TournamentRepository.get_tournament', 
                  return_value=self.tournament):
            # Act
            result = await self.service.initialize_tournament(tournament_id)

            # Assert
            self.assertTrue(result)
            self.assertIn(tournament_id, self.service.active_tournaments)
            self.assertEqual(
                self.service.active_tournaments[tournament_id]["status"],
                "WAITING_PLAYERS"
            )

    async def test_initialize_tournament_not_found(self):
        """存在しないトーナメント初期化のテスト"""
        # Arrange
        with patch('pong.tournament.repositories.TournamentRepository.get_tournament', 
                  return_value=None):
            # Act
            result = await self.service.initialize_tournament(999)

            # Assert
            self.assertFalse(result)
            self.assertNotIn(999, self.service.active_tournaments)

    async def test_add_participant(self):
        """参加者追加のテスト"""
        # Arrange
        tournament_id = self.tournament.id
        username = self.user.username
        self.service.active_tournaments[tournament_id] = {
            "status": "WAITING_PLAYERS",
            "participants": [],
            "current_round": 0
        }

        with patch('pong.tournament.repositories.TournamentRepository.add_participant', 
                  return_value=AsyncMock(tournament_id=tournament_id, user_id=self.user.id)):
            # Act
            result = await self.service.add_participant(tournament_id, username)

            # Assert
            self.assertTrue(result)
            self.assertIn(username, self.service.active_tournaments[tournament_id]["participants"])

    async def test_handle_participant_disconnection_during_countdown(self):
        """カウントダウン中の切断処理テスト"""
        # Arrange
        tournament_id = self.tournament.id
        username = self.user.username
        countdown_task = MagicMock()
        countdown_task.cancel = MagicMock()
        
        self.service.active_tournaments[tournament_id] = {
            "status": "WAITING_PLAYERS",
            "participants": [username],
            "current_round": 0,
            "countdown_task": countdown_task
        }

        # Act
        await self.service.handle_participant_disconnection(tournament_id, username)

        # Assert
        self.assertNotIn(username, self.service.active_tournaments[tournament_id]["participants"])
        countdown_task.cancel.assert_called_once()

    async def test_handle_participant_disconnection_during_match(self):
        """試合中の切断処理テスト"""
        # Arrange
        tournament_id = self.tournament.id
        username = self.user.username
        opponent_username = "opponent"
        
        self.service.active_tournaments[tournament_id] = {
            "status": "IN_PROGRESS",
            "participants": [username, opponent_username],
            "current_round": 1
        }

        mock_match = AsyncMock(
            id=1,
            player1=AsyncMock(username=username),
            player2=AsyncMock(username=opponent_username)
        )

        with patch('pong.tournament.repositories.TournamentRepository.get_current_match', 
                  return_value=mock_match), \
             patch('pong.tournament.repositories.TournamentRepository.record_match_result', 
                  return_value=AsyncMock()) as mock_record_result:
            # Act
            await self.service.handle_participant_disconnection(tournament_id, username)

            # Assert
            mock_record_result.assert_called_once()
            args = mock_record_result.call_args.args
            self.assertEqual(args[0], mock_match.id)  # match_id
            self.assertEqual(args[1], opponent_username)  # winner_username
            self.assertEqual(args[2], 0)  # disconnected player score
            self.assertEqual(args[3], 15)  # opponent score

    async def test_complete_tournament(self):
        """トーナメント完了処理のテスト"""
        # Arrange
        tournament_id = self.tournament.id
        game_task = MagicMock()
        game_task.cancel = MagicMock()
        
        self.service.active_tournaments[tournament_id] = {
            "status": "IN_PROGRESS",
            "participants": ["user1", "user2"],
            "current_round": 1
        }
        self.service.game_tasks[tournament_id] = game_task

        with patch('pong.tournament.repositories.TournamentRepository.update_tournament_status', 
                  return_value=AsyncMock()) as mock_update:
            # Act
            await self.service.complete_tournament(tournament_id)

            # Assert
            mock_update.assert_called_once_with(tournament_id, "COMPLETED")
            game_task.cancel.assert_called_once()
            self.assertNotIn(tournament_id, self.service.active_tournaments)
            self.assertNotIn(tournament_id, self.service.game_tasks)

    async def asyncTearDown(self):
        """非同期のクリーンアップ"""
        # アクティブなタスクのクリーンアップ
        for task in self.service.game_tasks.values():
            if hasattr(task, 'cancel') and not task.done():
                task.cancel()
        
        self.service.active_tournaments.clear()
        self.service.game_tasks.clear()

        # データベースのクリーンアップ
        await database_sync_to_async(self.tournament.delete)()
        await database_sync_to_async(self.user.delete)()