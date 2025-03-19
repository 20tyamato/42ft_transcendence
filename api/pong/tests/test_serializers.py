from django.utils import timezone
from rest_framework.test import APITestCase
from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory
from pong.models import Game, User, TournamentSession, TournamentParticipant
from pong.serializers import (
    GameSerializer,
    UserSerializer,
    TournamentSessionSerializer,
    TournamentParticipantSerializer,
)


@override_settings(
    SECURE_SSL_REDIRECT=False, SESSION_COOKIE_SECURE=False, CSRF_COOKIE_SECURE=False
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


@override_settings(
    SECURE_SSL_REDIRECT=False, SESSION_COOKIE_SECURE=False, CSRF_COOKIE_SECURE=False
)
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
            "tournament_id",
            "tournament_round",
            "ai_level",
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

    def test_game_serializer_ai_game(self):
        """AIゲームのシリアライズが正しく機能するかテスト"""
        # AIゲームを作成（player2はNone、ai_levelを設定）
        ai_game = Game.objects.create(
            player1=self.user1,
            player2=None,
            game_type="SINGLE",
            status="IN_PROGRESS",
            session_id="game_player1_ai_123",
            ai_level=3,  # 中級AIレベル
        )

        serializer = GameSerializer(ai_game)
        data = serializer.data

        # AI関連フィールドを確認
        self.assertEqual(data["game_type"], "SINGLE")
        self.assertEqual(data["player1"], "player1")
        self.assertIsNone(data["player2"])
        self.assertEqual(data["ai_level"], 3)


@override_settings(
    SECURE_SSL_REDIRECT=False, SESSION_COOKIE_SECURE=False, CSRF_COOKIE_SECURE=False
)
class TournamentSerializerTests(TestCase):
    def setUp(self):
        """テスト用のユーザーとトーナメントを作成"""
        self.factory = APIRequestFactory()

        # テスト用ユーザーを作成
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

        # トーナメントを作成
        self.tournament = TournamentSession.objects.create()

    def test_tournament_serializer_empty(self):
        """空のトーナメントをシリアライズするテスト"""
        serializer = TournamentSessionSerializer(self.tournament)
        data = serializer.data

        # 期待されるフィールドが存在することを確認
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

        # 値を確認
        self.assertEqual(data["status"], "WAITING_PLAYERS")
        self.assertEqual(data["max_players"], 4)
        self.assertEqual(data["current_players_count"], 0)
        self.assertEqual(data["participants"], [])
        self.assertEqual(data["games"], [])
        self.assertIsNone(data["winner"])
        self.assertIsNone(data["winner_username"])
        self.assertIsNone(data["winner_display_name"])

    def test_tournament_serializer_with_participants(self):
        """参加者を含むトーナメントのシリアライズをテスト"""
        # 参加者を追加
        # ruff: noqa
        participant1 = TournamentParticipant.objects.create(
            tournament=self.tournament,
            user=self.user1,
            bracket_position=1,
            is_ready=True,
        )
        # ruff: noqa
        participant2 = TournamentParticipant.objects.create(
            tournament=self.tournament,
            user=self.user2,
            bracket_position=2,
            is_ready=False,
        )

        # シリアライズ
        request = self.factory.get("/")
        serializer = TournamentSessionSerializer(
            self.tournament, context={"request": request}
        )
        data = serializer.data

        # 参加者数が正しいことを確認
        self.assertEqual(data["current_players_count"], 2)
        self.assertEqual(len(data["participants"]), 2)

        # 参加者情報が正しくシリアライズされているか確認
        participants = sorted(data["participants"], key=lambda x: x["bracket_position"])
        self.assertEqual(participants[0]["username"], "player1")
        self.assertEqual(participants[0]["display_name"], "Player One")
        self.assertEqual(participants[0]["bracket_position"], 1)
        self.assertTrue(participants[0]["is_ready"])

        self.assertEqual(participants[1]["username"], "player2")
        self.assertEqual(participants[1]["display_name"], "Player Two")
        self.assertEqual(participants[1]["bracket_position"], 2)
        self.assertFalse(participants[1]["is_ready"])

    def test_tournament_serializer_with_games(self):
        """ゲームを含むトーナメントのシリアライズをテスト"""
        # 準決勝のゲームを追加
        semifinal = Game.objects.create(
            game_type="TOURNAMENT",
            status="COMPLETED",
            session_id=f"tournament_{self.tournament.id}_semi1_player1_player2_12345",
            player1=self.user1,
            player2=self.user2,
            tournament=self.tournament,
            tournament_round=0,
        )

        # シリアライズ
        serializer = TournamentSessionSerializer(self.tournament)
        data = serializer.data

        # ゲームIDが含まれていることを確認
        self.assertEqual(len(data["games"]), 1)
        self.assertEqual(data["games"][0], semifinal.id)

    def test_tournament_serializer_with_winner(self):
        """優勝者を含むトーナメントのシリアライズをテスト"""
        # トーナメントを完了状態に設定し、優勝者を指定
        completed_time = timezone.now()
        self.tournament.status = "COMPLETED"
        self.tournament.completed_at = completed_time
        self.tournament.winner = self.user1
        self.tournament.save()

        # シリアライズ
        serializer = TournamentSessionSerializer(self.tournament)
        data = serializer.data

        # 優勝者情報が正しくシリアライズされているか確認
        self.assertEqual(data["winner"], self.user1.id)
        self.assertEqual(data["winner_username"], "player1")
        self.assertEqual(data["winner_display_name"], "Player One")
        self.assertEqual(data["status"], "COMPLETED")

    def test_tournament_serializer_validation(self):
        """トーナメントシリアライザーのバリデーションテスト"""
        # 既に開始されているトーナメントを修正しようとした場合
        self.tournament.status = "IN_PROGRESS"
        self.tournament.started_at = timezone.now()
        self.tournament.save()

        serializer = TournamentSessionSerializer(
            self.tournament, data={"max_players": 8}, partial=True
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)

    def test_tournament_participant_serializer(self):
        """トーナメント参加者シリアライザーのテスト"""
        # 参加者を作成
        participant = TournamentParticipant.objects.create(
            tournament=self.tournament,
            user=self.user1,
            bracket_position=1,
            is_ready=True,
        )

        # シリアライズ
        serializer = TournamentParticipantSerializer(participant)
        data = serializer.data

        # フィールドを確認
        expected_fields = [
            "id",
            "username",
            "display_name",
            "is_ready",
            "joined_at",
            "bracket_position",
        ]
        self.assertEqual(set(data.keys()), set(expected_fields))

        # 値を確認
        self.assertEqual(data["username"], "player1")
        self.assertEqual(data["display_name"], "Player One")
        self.assertEqual(data["bracket_position"], 1)
        self.assertTrue(data["is_ready"])
        self.assertIsNotNone(data["joined_at"])  # 日時があることを確認

    def test_tournament_participant_list_serialization(self):
        """参加者リストのシリアライズをテスト"""
        # 4人の参加者を追加
        for i, user in enumerate([self.user1, self.user2, self.user3, self.user4], 1):
            TournamentParticipant.objects.create(
                tournament=self.tournament,
                user=user,
                bracket_position=i,
                is_ready=(i % 2 == 0),  # 偶数位置の参加者のみ準備完了
            )

        # 全参加者を取得
        participants = TournamentParticipant.objects.filter(tournament=self.tournament)

        # シリアライズ
        serializer = TournamentParticipantSerializer(participants, many=True)
        data = serializer.data

        # 4人分のデータがあることを確認
        self.assertEqual(len(data), 4)

        # 各参加者のデータを確認
        usernames = [item["username"] for item in data]
        self.assertIn("player1", usernames)
        self.assertIn("player2", usernames)
        self.assertIn("player3", usernames)
        self.assertIn("player4", usernames)

        # bracket_positionでソートして確認
        sorted_data = sorted(data, key=lambda x: x["bracket_position"])
        self.assertEqual(sorted_data[0]["username"], "player1")
        self.assertEqual(sorted_data[1]["username"], "player2")
        self.assertEqual(sorted_data[2]["username"], "player3")
        self.assertEqual(sorted_data[3]["username"], "player4")

        # is_readyが正しくシリアライズされているか確認
        self.assertFalse(sorted_data[0]["is_ready"])  # player1: False
        self.assertTrue(sorted_data[1]["is_ready"])  # player2: True
        self.assertFalse(sorted_data[2]["is_ready"])  # player3: False
        self.assertTrue(sorted_data[3]["is_ready"])  # player4: True
