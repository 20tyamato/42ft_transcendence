from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import IntegrityError

from pong.models import (
    User,
    Game,
    TournamentSession,
    TournamentParticipant
)

class UserModelTests(TestCase):
    def test_create_user(self):
        """
        Test that a User can be created successfully.
        """
        user = User.objects.create_user(
            username="testuser",
            password="testpass123",
            display_name="Test User",
            level=2,
            experience=100,
        )
        self.assertIsNotNone(
            user.id, "User should be created successfully and assigned an ID"
        )
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.display_name, "Test User")
        self.assertEqual(user.level, 2)
        self.assertEqual(user.experience, 100)

    def test_str_representation(self):
        """
        Test that the __str__ method returns the display_name.
        """
        user = User.objects.create_user(
            username="testuser2",
            password="testpass123",
            display_name="Display Name Test",
        )
        self.assertEqual(str(user), "Display Name Test")


class GameModelTests(TestCase):
    def setUp(self):
        self.player1 = User.objects.create_user(
            username="player1", password="playerpass1", display_name="Player 1"
        )
        self.player2 = User.objects.create_user(
            username="player2", password="playerpass2", display_name="Player 2"
        )

    def test_create_game_ai_opponent(self):
        """Test game creation with AI opponent"""
        game = Game.objects.create(
            player1=self.player1,
            player2=None,
            score_player1=10,
            score_player2=20,
            is_ai_opponent=True,
        )
        self.assertIsNotNone(game.id)
        self.assertEqual(game.player1, self.player1)
        self.assertIsNone(game.player2)
        self.assertTrue(game.is_ai_opponent)

    def test_create_game_human_opponent(self):
        """Test game creation with human opponent"""
        game = Game.objects.create(
            player1=self.player1,
            player2=self.player2,
            score_player1=10,
            score_player2=20,
            is_ai_opponent=False,
        )
        self.assertIsNotNone(game.id)
        self.assertEqual(game.player1, self.player1)
        self.assertEqual(game.player2, self.player2)
        self.assertFalse(game.is_ai_opponent)

    def test_str_representation_ai(self):
        """Test string representation for AI game"""
        game = Game.objects.create(
            player1=self.player1, player2=None, is_ai_opponent=True
        )
        expected_str = f"Game {game.id} - {self.player1.display_name} vs AI"
        self.assertEqual(str(game), expected_str)

    def test_str_representation_human(self):
        """Test string representation for human vs human game"""
        game = Game.objects.create(
            player1=self.player1, player2=self.player2, is_ai_opponent=False
        )
        expected_str = f"Game {game.id} - {self.player1.display_name} vs {self.player2.display_name}"
        self.assertEqual(str(game), expected_str)

    def test_null_fields(self):
        """Test nullable fields"""
        game = Game.objects.create(
            player1=self.player1,
            player2=None,
            winner=None,
            end_time=None,
        )
        self.assertIsNone(game.player2)
        self.assertIsNone(game.winner)
        self.assertIsNone(game.end_time)

    def test_winner_assignment(self):
        """Test winner assignment for both AI and human games"""
        # AI game
        ai_game = Game.objects.create(
            player1=self.player1,
            player2=None,
            is_ai_opponent=True,
            score_player1=5,
            score_player2=3,
        )
        ai_game.winner = self.player1
        ai_game.save()
        self.assertEqual(ai_game.winner, self.player1)

        # Human game
        human_game = Game.objects.create(
            player1=self.player1,
            player2=self.player2,
            is_ai_opponent=False,
            score_player1=3,
            score_player2=5,
        )
        human_game.winner = self.player2
        human_game.save()
        self.assertEqual(human_game.winner, self.player2)

User = get_user_model()

class TournamentSessionTests(TestCase):
    def setUp(self):
        self.tournament = TournamentSession.objects.create()
        self.user1 = User.objects.create_user(
            username='testuser1',
            display_name='Test User 1',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='testuser2',
            display_name='Test User 2',
            password='testpass123'
        )

    def test_tournament_creation(self):
        """トーナメントが正しく作成されることをテスト"""
        self.assertEqual(self.tournament.status, 'WAITING_PLAYERS')
        self.assertIsNotNone(self.tournament.created_at)
        self.assertIsNone(self.tournament.started_at)
        self.assertIsNone(self.tournament.completed_at)
        self.assertEqual(self.tournament.max_players, 4)

    def test_current_players_count(self):
        """プレイヤー数のカウントが正しく動作することをテスト"""
        self.assertEqual(self.tournament.current_players_count, 0)
        
        # 参加者を追加
        TournamentParticipant.objects.create(
            tournament=self.tournament,
            user=self.user1
        )
        self.assertEqual(self.tournament.current_players_count, 1)

        TournamentParticipant.objects.create(
            tournament=self.tournament,
            user=self.user2
        )
        self.assertEqual(self.tournament.current_players_count, 2)

    def test_is_full_property(self):
        """トーナメントが満員かどうかの判定をテスト"""
        self.assertFalse(self.tournament.is_full)

        # 4人参加させる
        users = []
        for i in range(4):
            user = User.objects.create_user(
                username=f'user{i}',
                display_name=f'User {i}',
                password='testpass123'
            )
            users.append(user)
            TournamentParticipant.objects.create(
                tournament=self.tournament,
                user=user
            )

        self.assertTrue(self.tournament.is_full)

    def test_string_representation(self):
        """文字列表現が正しいことをテスト"""
        expected_str = f"Tournament {self.tournament.id} (WAITING_PLAYERS)"
        self.assertEqual(str(self.tournament), expected_str)

class TournamentParticipantTests(TestCase):
    def setUp(self):
        self.tournament = TournamentSession.objects.create()
        self.user = User.objects.create_user(
            username='testuser',
            display_name='Test User',
            password='testpass123'
        )

    def test_participant_creation(self):
        """参加者が正しく作成されることをテスト"""
        participant = TournamentParticipant.objects.create(
            tournament=self.tournament,
            user=self.user
        )
        self.assertEqual(participant.tournament, self.tournament)
        self.assertEqual(participant.user, self.user)
        self.assertIsNotNone(participant.joined_at)
        self.assertFalse(participant.is_ready)
        self.assertIsNone(participant.bracket_position)

    def test_unique_tournament_user_constraint(self):
        """同じユーザーが同じトーナメントに重複参加できないことをテスト"""
        TournamentParticipant.objects.create(
            tournament=self.tournament,
            user=self.user
        )
        
        with self.assertRaises(IntegrityError):
            TournamentParticipant.objects.create(
                tournament=self.tournament,
                user=self.user
            )

    def test_string_representation(self):
        """文字列表現が正しいことをテスト"""
        participant = TournamentParticipant.objects.create(
            tournament=self.tournament,
            user=self.user
        )
        expected_str = f"{self.user.display_name} in Tournament {self.tournament.id}"
        self.assertEqual(str(participant), expected_str)
