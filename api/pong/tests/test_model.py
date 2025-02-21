from django.test import TestCase
from django.db import IntegrityError

from pong.models import (
    User,
    Game,
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
