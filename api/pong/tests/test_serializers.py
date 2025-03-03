from django.utils import timezone
from rest_framework.test import APITestCase
from django.test import TestCase
from rest_framework.test import APIRequestFactory
from pong.models import Game, User, TournamentSession, TournamentParticipant
from pong.serializers import (
    GameSerializer,
    UserSerializer,
    TournamentSessionSerializer,
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


class GameSerializerTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="player1",
            email="player1@example.com",
            password="testpass123",
            display_name="Player One",
        )
        self.user2 = User.objects.create_user(
            username="player2",
            email="player2@example.com",
            password="testpass123",
            display_name="Player Two",
        )

        self.game_attributes = {
            "player1": "player1",
            "player2": "player2",
            "game_type": "MULTI",
            "status": "WAITING",
        }

        self.factory = APIRequestFactory()

    def test_game_serializer_contains_expected_fields(self):
        """GameSerializerが期待されるフィールドを含んでいるかテスト"""
        game = Game.objects.create(
            player1=self.user1,
            player2=self.user2,
            game_type="MULTI",
            status="WAITING",
            session_id="game_test_123",
        )
        serializer = GameSerializer(game)
        data = serializer.data

        expected_fields = [
            "id",
            "game_type",
            "status",
            "session_id",
            "player1",
            "player2",
            "start_time",
            "end_time",
            "winner",
            "score_player1",
            "score_player2",
            "is_ai_opponent",
            "tournament_id",
            "tournament_round",
        ]

        self.assertEqual(set(data.keys()), set(expected_fields))

    def test_game_serializer_create(self):
        """GameSerializerがゲームを正しく作成できるかテスト"""
        serializer = GameSerializer(data=self.game_attributes)
        self.assertTrue(serializer.is_valid())
        game = serializer.save()

        self.assertEqual(game.player1, self.user1)
        self.assertEqual(game.player2, self.user2)
        self.assertEqual(game.game_type, "MULTI")
        self.assertEqual(game.status, "WAITING")
        self.assertTrue(game.session_id.startswith("multi_player1_player2_"))

    def test_game_serializer_with_tournament(self):
        """トーナメント関連の情報を持つゲームを正しく作成できるかテスト"""
        tournament = TournamentSession.objects.create()

        game_with_tournament = self.game_attributes.copy()
        game_with_tournament["tournament_id"] = tournament.id
        game_with_tournament["game_type"] = "TOURNAMENT"
        game_with_tournament["tournament_round"] = 0  # 準決勝

        serializer = GameSerializer(data=game_with_tournament)
        self.assertTrue(serializer.is_valid())
        game = serializer.save()

        self.assertEqual(game.tournament.id, tournament.id)
        self.assertEqual(game.tournament_round, 0)
        self.assertEqual(game.game_type, "TOURNAMENT")


class TournamentSerializerTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="player1",
            email="player1@example.com",
            password="testpass123",
            display_name="Player One",
        )
        self.user2 = User.objects.create_user(
            username="player2",
            email="player2@example.com",
            password="testpass123",
            display_name="Player Two",
        )
        self.user3 = User.objects.create_user(
            username="player3",
            email="player3@example.com",
            password="testpass123",
            display_name="Player Three",
        )
        self.user4 = User.objects.create_user(
            username="player4",
            email="player4@example.com",
            password="testpass123",
            display_name="Player Four",
        )

        self.factory = APIRequestFactory()

    def test_tournament_serializer_contains_expected_fields(self):
        """TournamentSessionSerializerが期待されるフィールドを含んでいるかテスト"""
        tournament = TournamentSession.objects.create()
        serializer = TournamentSessionSerializer(tournament)
        data = serializer.data

        expected_fields = [
            "id",
            "status",
            "created_at",
            "started_at",
            "completed_at",
            "max_players",
            "current_players_count",
            "participants",
            "games",
            "winner",
            "winner_username",
            "winner_display_name",
        ]

        self.assertEqual(set(data.keys()), set(expected_fields))

    def test_tournament_serializer_with_participants(self):
        """参加者を含むトーナメントが正しくシリアライズされるかテスト"""
        tournament = TournamentSession.objects.create()

        # 参加者を追加
        TournamentParticipant.objects.create(
            tournament=tournament, user=self.user1, bracket_position=1
        )
        TournamentParticipant.objects.create(
            tournament=tournament, user=self.user2, bracket_position=2
        )

        request = self.factory.get("/")
        serializer = TournamentSessionSerializer(
            tournament, context={"request": request}
        )
        data = serializer.data

        self.assertEqual(data["current_players_count"], 2)
        self.assertEqual(len(data["participants"]), 2)

        # 参加者の情報が正しくシリアライズされているか確認
        participants = sorted(data["participants"], key=lambda x: x["username"])
        self.assertEqual(participants[0]["username"], "player1")
        self.assertEqual(participants[0]["display_name"], "Player One")
        self.assertEqual(participants[0]["bracket_position"], 1)

    def test_tournament_serializer_with_winner(self):
        """優勝者を含むトーナメントが正しくシリアライズされるかテスト"""
        tournament = TournamentSession.objects.create(
            status="COMPLETED", completed_at=timezone.now(), winner=self.user1
        )

        request = self.factory.get("/")
        serializer = TournamentSessionSerializer(
            tournament, context={"request": request}
        )
        data = serializer.data

        self.assertEqual(data["winner"], self.user1.id)
        self.assertEqual(data["winner_username"], "player1")
        self.assertEqual(data["winner_display_name"], "Player One")
        self.assertEqual(data["status"], "COMPLETED")

    def test_tournament_participant_serializer(self):
        """TournamentParticipantSerializerが正しく動作するかテスト"""
        tournament = TournamentSession.objects.create()
        participant = TournamentParticipant.objects.create(
            tournament=tournament, user=self.user1, bracket_position=1, is_ready=True
        )

        serializer = TournamentParticipantSerializer(participant)
        data = serializer.data

        self.assertEqual(data["username"], "player1")
        self.assertEqual(data["display_name"], "Player One")
        self.assertEqual(data["bracket_position"], 1)
        self.assertTrue(data["is_ready"])
