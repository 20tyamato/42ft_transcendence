from django.utils import timezone
from rest_framework.test import APITestCase
from django.test import TestCase
from pong.models import (
    User,
    Game,
    TournamentGameSession,
    TournamentMatch,
    TournamentParticipant,
)
from pong.serializers import (
    GameSerializer,
    UserSerializer,
    TournamentGameSessionSerializer,
    TournamentMatchSerializer,
    TournamentParticipantSerializer,
)


class UserSerializerTests(APITestCase):
    def setUp(self):
        """テストの初期設定"""
        self.valid_data = {
            "username": "testuser",
            "email": "test@example.com",
            "display_name": "Test User",
            "password": "SecurePass123!",
            "password2": "SecurePass123!",
        }

    # Username Tests
    def test_username_too_long(self):
        data = self.valid_data.copy()
        data["username"] = "a" * 151  # Djangoのデフォルト上限は150文字
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

    def test_username_empty(self):
        data = self.valid_data.copy()
        data["username"] = ""
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

    def test_username_special_chars(self):
        data = self.valid_data.copy()
        data["username"] = "test@user!"  # 特殊文字を含む
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

    # Email Tests
    def test_email_invalid_format(self):
        data = self.valid_data.copy()
        data["email"] = "invalid-email"
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_email_too_long(self):
        data = self.valid_data.copy()
        data["email"] = "a" * 245 + "@example.com"  # 254文字（標準的な上限は254文字）
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    # Display Name Tests
    def test_display_name_too_long(self):
        data = self.valid_data.copy()
        data["display_name"] = "a" * 51  # モデルで定義した50文字制限
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("display_name", serializer.errors)

    def test_display_name_empty(self):
        data = self.valid_data.copy()
        data["display_name"] = ""
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("display_name", serializer.errors)

    # Password Tests
    def test_password_too_short(self):
        data = self.valid_data.copy()
        data.update({"password": "short", "password2": "short"})
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)

    def test_password_no_numbers(self):
        data = self.valid_data.copy()
        data.update({"password": "NoNumbersHere!", "password2": "NoNumbersHere!"})
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)

    def test_password_no_special_chars(self):
        data = self.valid_data.copy()
        data.update({"password": "NoSpecialChars123", "password2": "NoSpecialChars123"})
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)

    # Missing Fields Tests
    def test_missing_username(self):
        data = self.valid_data.copy()
        del data["username"]
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

    def test_missing_email(self):
        data = self.valid_data.copy()
        del data["email"]
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_missing_display_name(self):
        data = self.valid_data.copy()
        del data["display_name"]
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("display_name", serializer.errors)

    # Additional Edge Cases
    def test_whitespace_only_fields(self):
        data = self.valid_data.copy()
        data["username"] = "   "
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

    def test_case_sensitivity_username(self):
        # First create a user
        user_data = self.valid_data.copy()
        user_data.pop("password2")
        User.objects.create_user(**user_data)

        # Try to create another user with same username but different case
        data = self.valid_data.copy()
        data["username"] = data["username"].upper()
        data["display_name"] = "Different Display Name"  # display_nameを変更
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)

    def test_unicode_characters(self):
        data = self.valid_data.copy()
        data["display_name"] = "테스트사용자"  # Korean characters
        serializer = UserSerializer(data=data)
        self.assertTrue(serializer.is_valid())  # Should allow Unicode characters

    def test_sql_injection_attempt(self):
        data = self.valid_data.copy()
        data["username"] = "robert'); DROP TABLE users;--"
        serializer = UserSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)


class GameSerializerTests(APITestCase):
    def setUp(self):
        self.player1 = User.objects.create_user(
            username="player1", password="playerpass1", display_name="Player 1"
        )
        self.player2 = User.objects.create_user(
            username="player2", password="playerpass2", display_name="Player 2"
        )

    def test_serialize_ai_game(self):
        """Test serialization of AI game"""
        game_data = {
            "player1": "player1",
            "player2": None,
            "score_player1": 15,
            "score_player2": 10,
            "is_ai_opponent": True,
            "winner": "player1",
            "end_time": timezone.now(),
        }
        serializer = GameSerializer(data=game_data)
        self.assertTrue(serializer.is_valid())

    def test_serialize_human_game(self):
        """Test serialization of human vs human game"""
        game_data = {
            "player1": "player1",
            "player2": "player2",
            "score_player1": 10,
            "score_player2": 15,
            "is_ai_opponent": False,
            "winner": "player1",
            "end_time": timezone.now(),
        }
        serializer = GameSerializer(data=game_data)
        self.assertTrue(serializer.is_valid())

    def test_deserialize_game(self):
        """Test deserialization of game data"""
        game = Game.objects.create(
            player1=self.player1,
            player2=None,
            score_player1=15,
            score_player2=10,
            is_ai_opponent=True,
            winner=self.player1,
        )
        serializer = GameSerializer(game)
        data = serializer.data
        self.assertEqual(data["player1"], self.player1.username)
        self.assertIsNone(data["player2"])
        self.assertTrue(data["is_ai_opponent"])

    def test_nonexistent_player1(self):
        """Test validation when player1 doesn't exist"""
        data = {
            "player1": "nonexistent_user",
            "score_player1": 15,
            "score_player2": 10,
            "is_ai_opponent": True,
        }
        serializer = GameSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("Player1 does not exist", str(serializer.errors))

    def test_missing_player1(self):
        """Test validation when player1 is missing"""
        data = {"score_player1": 15, "score_player2": 10, "is_ai_opponent": True}
        serializer = GameSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("This field is required", str(serializer.errors))

    def test_nonexistent_player2_in_human_game(self):
        """Test validation when player2 doesn't exist in human game"""
        data = {
            "player1": "player1",
            "player2": "nonexistent_user",
            "is_ai_opponent": False,
        }
        serializer = GameSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("Player2 does not exist", str(serializer.errors))

    def test_missing_player2_in_human_game(self):
        """Test validation when player2 is missing in human game"""
        data = {"player1": "player1", "player2": None, "is_ai_opponent": False}
        serializer = GameSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("Player2 is required for non-AI games", str(serializer.errors))


class TournamentGameSessionSerializerTests(TestCase):
    def setUp(self):
        self.valid_tournament_data = {
            'name': 'Test Tournament',
            'min_players': 2,
            'max_players': 8,
        }
        self.tournament = TournamentGameSession.objects.create(**self.valid_tournament_data)
        self.serializer = TournamentGameSessionSerializer(instance=self.tournament)

    def test_contains_expected_fields(self):
        """Test that serializer contains all expected fields"""
        data = self.serializer.data
        expected_fields = {
            'id', 'name', 'status', 'created_at', 'started_at',
            'completed_at', 'min_players', 'max_players', 'current_round'
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_valid_data_serialization(self):
        """Test serialization of valid tournament data"""
        data = self.serializer.data
        self.assertEqual(data['name'], 'Test Tournament')
        self.assertEqual(data['status'], 'WAITING_PLAYERS')
        self.assertEqual(data['min_players'], 2)
        self.assertEqual(data['max_players'], 8)
        self.assertEqual(data['current_round'], 0)

    def test_invalid_name(self):
        """Test validation with invalid name"""
        invalid_data = self.valid_tournament_data.copy()
        invalid_data['name'] = ''
        serializer = TournamentGameSessionSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)


class TournamentMatchSerializerTests(TestCase):
    def setUp(self):
        self.tournament = TournamentGameSession.objects.create(name='Test Tournament')
        self.player1 = User.objects.create_user(
            username='player1',
            password='testpass123',
            display_name='Player 1'
        )
        self.player2 = User.objects.create_user(
            username='player2',
            password='testpass123',
            display_name='Player 2'
        )
        self.game = Game.objects.create(
            player1=self.player1,
            player2=self.player2
        )
        self.match = TournamentMatch.objects.create(
            tournament=self.tournament,
            game=self.game,
            round_number=1,
            match_number=1,
            player1=self.player1,
            player2=self.player2
        )
        self.serializer = TournamentMatchSerializer(instance=self.match)

    def test_contains_expected_fields(self):
        """Test that serializer contains all expected fields"""
        data = self.serializer.data
        expected_fields = {
            'id', 'tournament', 'game', 'round_number',
            'match_number', 'player1', 'player2', 'next_match'
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_round_number_validation(self):
        """Test validation of round_number field"""
        invalid_data = {
            'tournament': self.tournament.id,
            'round_number': -1,  # Invalid round number
            'match_number': 1,
            'player1': self.player1.id,
            'player2': self.player2.id
        }
        serializer = TournamentMatchSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('round_number', serializer.errors)


class TournamentParticipantSerializerTests(TestCase):
    def setUp(self):
        self.tournament = TournamentGameSession.objects.create(name='Test Tournament')
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            display_name='Test User'
        )
        self.participant = TournamentParticipant.objects.create(
            tournament=self.tournament,
            user=self.user,
            seed=1
        )
        self.serializer = TournamentParticipantSerializer(instance=self.participant)

    def test_contains_expected_fields(self):
        """Test that serializer contains all expected fields"""
        data = self.serializer.data
        expected_fields = {
            'id', 'tournament', 'user', 'user_display_name',
            'joined_at', 'seed'
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_user_display_name(self):
        """Test that user_display_name is correctly serialized"""
        data = self.serializer.data
        self.assertEqual(data['user_display_name'], 'Test User')

    def test_unique_participant_validation(self):
        """Test that a user cannot join the same tournament twice"""
        duplicate_data = {
            'tournament': self.tournament.id,
            'user': self.user.id,
            'seed': 2
        }
        serializer = TournamentParticipantSerializer(data=duplicate_data)
        self.assertFalse(serializer.is_valid())