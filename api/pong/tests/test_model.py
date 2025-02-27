from django.test import TestCase
from django.db import IntegrityError

from pong.models import User, Game, TournamentSession, TournamentParticipant


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

