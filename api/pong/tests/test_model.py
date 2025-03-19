from django.test import TestCase, override_settings
from django.utils import timezone
from pong.models import User, Game, TournamentSession, TournamentParticipant


@override_settings(
    SECURE_SSL_REDIRECT=False, SESSION_COOKIE_SECURE=False, CSRF_COOKIE_SECURE=False
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
        )
        self.assertIsNotNone(
            user.id, "User should be created successfully and assigned an ID"
        )
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.display_name, "Test User")
        self.assertEqual(user.level, 2)

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


@override_settings(
    SECURE_SSL_REDIRECT=False, SESSION_COOKIE_SECURE=False, CSRF_COOKIE_SECURE=False
)
class GameModelTests(TestCase):
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

    def test_game_creation(self):
        """ゲームが正しく作成されるかテスト"""
        game = Game.objects.create(
            game_type="MULTI",
            status="WAITING",
            session_id="game_player1_player2_abc123_1234567890",
            player1=self.user1,
            player2=self.user2,
        )
        self.assertEqual(game.game_type, "MULTI")
        self.assertEqual(game.status, "WAITING")
        self.assertEqual(game.player1, self.user1)
        self.assertEqual(game.player2, self.user2)
        self.assertEqual(game.score_player1, 0)
        self.assertEqual(game.score_player2, 0)
        self.assertIsNone(game.winner)

    def test_game_with_winner(self):
        """勝者を設定したゲームが正しく動作するかテスト"""
        game = Game.objects.create(
            game_type="MULTI",
            status="COMPLETED",
            session_id="game_player1_player2_abc123_1234567890",
            player1=self.user1,
            player2=self.user2,
            score_player1=10,
            score_player2=5,
            winner=self.user1,
            end_time=timezone.now(),
        )
        self.assertEqual(game.winner, self.user1)
        self.assertEqual(game.status, "COMPLETED")
        self.assertTrue(game.end_time is not None)

    def test_game_string_representation(self):
        """ゲームの文字列表現が正しいかテスト"""
        game = Game.objects.create(
            game_type="MULTI",
            status="WAITING",
            session_id="game_player1_player2_abc123_1234567890",
            player1=self.user1,
            player2=self.user2,
        )
        expected_str = (
            f"Multiplayer: {self.user1.display_name} vs {self.user2.display_name}"
        )
        self.assertEqual(str(game), expected_str)

    def test_ai_opponent_game(self):
        """AIとの対戦ゲームが正しく作成されるかテスト"""
        game = Game.objects.create(
            game_type="SINGLE",
            status="IN_PROGRESS",
            session_id="game_player1_ai_abc123_1234567890",
            player1=self.user1,
            ai_level=1,
        )
        self.assertEqual(game.ai_level, 1)
        expected_str = f"Single Player: {self.user1.display_name} vs AI (Beginner)"
        self.assertEqual(str(game), expected_str)


@override_settings(
    SECURE_SSL_REDIRECT=False, SESSION_COOKIE_SECURE=False, CSRF_COOKIE_SECURE=False
)
class TournamentModelTests(TestCase):
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
        # 基本的なトーナメントを作成
        self.tournament = TournamentSession.objects.create()

    def test_tournament_default_values(self):
        """トーナメントがデフォルト値で正しく作成されるかテスト"""
        self.assertEqual(self.tournament.status, "WAITING_PLAYERS")
        self.assertEqual(self.tournament.max_players, 4)
        self.assertIsNone(self.tournament.started_at)
        self.assertIsNone(self.tournament.completed_at)
        self.assertIsNone(self.tournament.winner)
        self.assertEqual(self.tournament.participants.count(), 0)

    def test_tournament_status_transitions(self):
        """トーナメントのステータス遷移が正しく動作するかテスト"""
        # 進行中に変更
        self.tournament.status = "IN_PROGRESS"
        self.tournament.started_at = timezone.now()
        self.tournament.save()
        self.assertEqual(self.tournament.status, "IN_PROGRESS")
        self.assertIsNotNone(self.tournament.started_at)

        # 決勝ラウンド準備完了に変更
        self.tournament.status = "FINAL_READY"
        self.tournament.save()
        self.assertEqual(self.tournament.status, "FINAL_READY")

        # 完了に変更
        completed_time = timezone.now()
        self.tournament.status = "COMPLETED"
        self.tournament.completed_at = completed_time
        self.tournament.winner = self.user1
        self.tournament.save()

        # データベースから再取得して確認
        refreshed_tournament = TournamentSession.objects.get(id=self.tournament.id)
        self.assertEqual(refreshed_tournament.status, "COMPLETED")
        self.assertEqual(refreshed_tournament.winner, self.user1)
        self.assertIsNotNone(refreshed_tournament.completed_at)

    def test_tournament_participant_add_remove(self):
        """トーナメント参加者の追加と削除のテスト"""
        # 新しいトーナメントを毎回作成して問題を回避
        unique_tournament = TournamentSession.objects.create(
            status="WAITING_PLAYERS", max_players=4
        )

        # 参加者を追加
        participant1 = TournamentParticipant.objects.create(
            tournament=unique_tournament,  # 新しいトーナメントを使用
            user=self.user1,
            bracket_position=1,
            is_ready=True,
        )

        # 参加者が正しく追加されたか確認
        self.assertEqual(unique_tournament.participants.count(), 1)
        self.assertEqual(participant1.tournament, unique_tournament)
        self.assertEqual(participant1.user, self.user1)
        self.assertEqual(participant1.bracket_position, 1)
        self.assertTrue(participant1.is_ready)

        # 参加者を削除
        participant1.delete()
        self.assertEqual(unique_tournament.participants.count(), 0)

    def test_tournament_bracket_positions(self):
        """ブラケット位置が正しく設定されるかテスト"""
        # 準決勝の参加者（ブラケット位置1-4）
        TournamentParticipant.objects.create(
            tournament=self.tournament, user=self.user1, bracket_position=1
        )
        TournamentParticipant.objects.create(
            tournament=self.tournament, user=self.user2, bracket_position=2
        )
        TournamentParticipant.objects.create(
            tournament=self.tournament, user=self.user3, bracket_position=3
        )
        TournamentParticipant.objects.create(
            tournament=self.tournament, user=self.user4, bracket_position=4
        )

        # 決勝進出者（位置5）に更新
        finalists = self.tournament.participants.filter(bracket_position__in=[1, 2])
        for finalist in finalists:
            finalist.bracket_position = 5
            finalist.save()

        # 決勝進出者が2人いることを確認
        self.assertEqual(
            self.tournament.participants.filter(bracket_position=5).count(), 2
        )

        # 優勝者（位置6）に更新
        winner = self.tournament.participants.filter(bracket_position=5).first()
        winner.bracket_position = 6
        winner.save()

        # 優勝者が1人いることを確認
        self.assertEqual(
            self.tournament.participants.filter(bracket_position=6).count(), 1
        )

    def test_tournament_participant_string_representation(self):
        """TournamentParticipantの文字列表現テスト"""
        participant = TournamentParticipant.objects.create(
            tournament=self.tournament, user=self.user1, bracket_position=1
        )
        expected_str = f"{self.user1.display_name} in Tournament {self.tournament.id}"
        self.assertEqual(str(participant), expected_str)

    def test_tournament_with_games(self):
        """トーナメントとゲームの関連付けテスト"""
        # 準決勝第1試合
        # ruff: noqa
        semifinal1 = Game.objects.create(
            game_type="TOURNAMENT",
            status="COMPLETED",
            session_id=f"tournament_{self.tournament.id}_semi1_player1_player2_12345",
            player1=self.user1,
            player2=self.user2,
            tournament=self.tournament,
            tournament_round=0,  # 準決勝
            winner=self.user1,
        )

        # 準決勝第2試合
        # ruff: noqa
        semifinal2 = Game.objects.create(
            game_type="TOURNAMENT",
            status="COMPLETED",
            session_id=f"tournament_{self.tournament.id}_semi2_player3_player4_12345",
            player1=self.user3,
            player2=self.user4,
            tournament=self.tournament,
            tournament_round=0,  # 準決勝
            winner=self.user3,
        )

        # 決勝戦
        # ruff: noqa
        final = Game.objects.create(
            game_type="TOURNAMENT",
            status="WAITING",
            session_id=f"tournament_{self.tournament.id}_final_player1_player3_12345",
            player1=self.user1,
            player2=self.user3,
            tournament=self.tournament,
            tournament_round=1,  # 決勝
        )

        # トーナメントに関連づけられたゲームの数を確認
        self.assertEqual(self.tournament.games.count(), 3)

        # 準決勝のゲーム数を確認
        self.assertEqual(self.tournament.games.filter(tournament_round=0).count(), 2)

        # 決勝のゲーム数を確認
        self.assertEqual(self.tournament.games.filter(tournament_round=1).count(), 1)
