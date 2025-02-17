from django.test import TestCase
from django.utils import timezone
from django.db import models
from channels.db import database_sync_to_async
from ..models import TournamentGameSession, TournamentParticipant, TournamentMatch, User, Game
from ..tournament.repositories import TournamentRepository

class TournamentRepositoryTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        """テストデータの初期設定"""
        pass  # async_setupで設定するため、ここでは何もしない

    async def asyncSetUp(self):
        """非同期セットアップ"""
        # ユーザーの作成
        self.user = await self._create_user("testuser", "test@example.com", "Test User")
        self.user2 = await self._create_user("testuser2", "test2@example.com", "Test User 2")

        # トーナメントの作成
        self.tournament = await self._create_tournament("Test Tournament")

        # マッチの作成
        self.match = await self._create_match(self.tournament, self.user, self.user2)

    @database_sync_to_async
    def _create_user(self, username, email, display_name):
        """ユーザーの作成（同期処理）"""
        return User.objects.create(
            username=username,
            email=email,
            display_name=display_name
        )

    @database_sync_to_async
    def _create_tournament(self, name):
        """トーナメントの作成（同期処理）"""
        return TournamentGameSession.objects.create(
            name=name,
            status="WAITING_PLAYERS",
            min_players=2,
            max_players=8
        )

    @database_sync_to_async
    def _create_match(self, tournament, player1, player2):
        """マッチの作成（同期処理）"""
        return TournamentMatch.objects.create(
            tournament=tournament,
            round_number=1,
            match_number=1,
            player1=player1,
            player2=player2
        )

    async def test_get_tournament(self):
        """トーナメント取得のテスト"""
        # Act
        result = await TournamentRepository.get_tournament(self.tournament.id)

        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result.id, self.tournament.id)
        self.assertEqual(result.name, "Test Tournament")

    async def test_get_tournament_not_found(self):
        """存在しないトーナメント取得のテスト"""
        # Act
        result = await TournamentRepository.get_tournament(999)

        # Assert
        self.assertIsNone(result)

    async def test_get_participants(self):
        """参加者リスト取得のテスト"""
        # Arrange
        participant = await database_sync_to_async(TournamentParticipant.objects.create)(
            tournament=self.tournament,
            user=self.user
        )

        # Act
        participants = await TournamentRepository.get_participants(self.tournament.id)

        # Assert
        self.assertEqual(len(participants), 1)
        self.assertEqual(participants[0].id, participant.id)
        self.assertEqual(participants[0].user_id, self.user.id)

    async def test_add_participant(self):
        """参加者追加のテスト"""
        # Act
        result = await TournamentRepository.add_participant(
            self.tournament.id,
            self.user.username
        )

        # Assert
        self.assertIsNotNone(result)
        self.assertEqual(result.tournament_id, self.tournament.id)
        self.assertEqual(result.user_id, self.user.id)

    async def test_add_participant_duplicate(self):
        """重複参加者追加のテスト"""
        # Arrange
        await database_sync_to_async(TournamentParticipant.objects.create)(
            tournament=self.tournament,
            user=self.user
        )

        # Act
        result = await TournamentRepository.add_participant(
            self.tournament.id,
            self.user.username
        )

        # Assert
        self.assertIsNone(result)

    async def test_get_current_match(self):
        """現在のマッチ取得のテスト"""
        # Act
        match = await TournamentRepository.get_current_match(
            self.tournament.id,
            self.user.username
        )

        # Assert
        self.assertIsNotNone(match)
        self.assertEqual(match.id, self.match.id)
        self.assertEqual(match.player1_id, self.user.id)
        self.assertEqual(match.player2_id, self.user2.id)

    async def test_record_match_result(self):
        """マッチ結果記録のテスト"""
        # Arrange
        score_player1 = 15
        score_player2 = 10

        # Act
        game = await TournamentRepository.record_match_result(
            self.match.id,
            self.user.username,
            score_player1,
            score_player2
        )

        # Assert
        self.assertIsNotNone(game)
        self.assertEqual(game.score_player1, score_player1)
        self.assertEqual(game.score_player2, score_player2)
        self.assertEqual(game.winner_id, self.user.id)

        # データベースに正しく保存されているか確認
        saved_game = await database_sync_to_async(Game.objects.get)(id=game.id)
        self.assertEqual(saved_game.score_player1, score_player1)
        self.assertEqual(saved_game.score_player2, score_player2)
        self.assertEqual(saved_game.winner_id, self.user.id)

    async def test_check_tournament_completion(self):
        """トーナメント完了チェックのテスト"""
        # Arrange - マッチにゲーム結果を設定
        game = await database_sync_to_async(Game.objects.create)(
            player1=self.match.player1,
            player2=self.match.player2,
            winner=self.match.player1,
            score_player1=15,
            score_player2=10
        )
        self.match.game = game
        await database_sync_to_async(self.match.save)()

        # Act
        is_completed = await TournamentRepository.check_tournament_completion(self.tournament.id)

        # Assert
        self.assertTrue(is_completed)