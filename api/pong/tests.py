from django.test import TestCase
from django.utils import timezone
from .models import User, Game

class UserModelTests(TestCase):
    def test_create_user(self):
        """
        Test that a User can be created successfully.
        """
        user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            display_name='Test User',
            level=2
        )
        self.assertIsNotNone(user.id, "User should be created successfully and assigned an ID")
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.display_name, 'Test User')
        self.assertEqual(user.level, 2)

    def test_str_representation(self):
        """
        Test that the __str__ method returns the display_name.
        """
        user = User.objects.create_user(
            username='testuser2',
            password='testpass123',
            display_name='Display Name Test'
        )
        self.assertEqual(str(user), 'Display Name Test')


class GameModelTests(TestCase):
    def setUp(self):
        """
        Create two users (players) to be used in the tests.
        """
        self.player1 = User.objects.create_user(
            username='player1',
            password='playerpass1',
            display_name='Player 1'
        )
        self.player2 = User.objects.create_user(
            username='player2',
            password='playerpass2',
            display_name='Player 2'
        )

    def test_create_game(self):
        """
        Test that a Game can be created successfully.
        """
        game = Game.objects.create(
            player1=self.player1,
            player2=self.player2,
            score_player1=10,
            score_player2=20,
            is_ai_opponent=False
        )
        self.assertIsNotNone(game.id, "Game should be created successfully and assigned an ID")
        self.assertEqual(game.player1, self.player1)
        self.assertEqual(game.player2, self.player2)
        self.assertEqual(game.score_player1, 10)
        self.assertEqual(game.score_player2, 20)
        self.assertFalse(game.is_ai_opponent)

    def test_str_representation(self):
        """
        Test that the __str__ method returns the correct string format.
        """
        game = Game.objects.create(
            player1=self.player1,
            player2=self.player2,
        )
        expected_str = f"Game {game.id} - {self.player1.display_name} vs {self.player2.display_name}"
        self.assertEqual(str(game), expected_str)

    def test_set_winner(self):
        """
        Test that the winner can be set correctly and end_time is updated.
        """
        game = Game.objects.create(
            player1=self.player1,
            player2=self.player2,
            score_player1=7,
            score_player2=5
        )
        # Set the winner to player1
        game.winner = self.player1
        game.end_time = timezone.now()
        game.save()

        updated_game = Game.objects.get(id=game.id)
        self.assertEqual(updated_game.winner, self.player1)
        self.assertIsNotNone(updated_game.end_time)
