from django.test import TestCase
from django.utils import timezone
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
            is_ai_opponent=True,
        )
        self.assertTrue(game.is_ai_opponent)
        expected_str = f"Single Player: {self.user1.display_name} vs AI"
        self.assertEqual(str(game), expected_str)


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

    def test_tournament_session_creation(self):
        """トーナメントセッションが正しく作成されるかテスト"""
        tournament = TournamentSession.objects.create()
        self.assertEqual(tournament.status, "WAITING_PLAYERS")
        self.assertEqual(tournament.max_players, 4)
        self.assertIsNone(tournament.started_at)
        self.assertIsNone(tournament.completed_at)
        self.assertIsNone(tournament.winner)

    def test_tournament_with_winner(self):
        """優勝者を設定したトーナメントが正しく動作するかテスト"""
        tournament = TournamentSession.objects.create(
            status="COMPLETED", completed_at=timezone.now(), winner=self.user1
        )
        self.assertEqual(tournament.winner, self.user1)
        self.assertEqual(tournament.status, "COMPLETED")
        self.assertTrue(tournament.completed_at is not None)

    def test_tournament_string_representation(self):
        """トーナメントの文字列表現が正しいかテスト"""
        tournament = TournamentSession.objects.create(status="IN_PROGRESS")
        expected_str = f"Tournament {tournament.id} (IN_PROGRESS)"
        self.assertEqual(str(tournament), expected_str)

    def test_tournament_participant_creation(self):
        """トーナメント参加者が正しく作成されるかテスト"""
        tournament = TournamentSession.objects.create()
        participant = TournamentParticipant.objects.create(
            tournament=tournament, user=self.user1, bracket_position=1
        )
        self.assertEqual(participant.tournament, tournament)
        self.assertEqual(participant.user, self.user1)
        self.assertEqual(participant.bracket_position, 1)
        self.assertFalse(participant.is_ready)

    def test_tournament_with_participants(self):
        """参加者を追加したトーナメントが正しく動作するかテスト"""
        tournament = TournamentSession.objects.create()

        # 4人の参加者を追加
        TournamentParticipant.objects.create(
            tournament=tournament, user=self.user1, bracket_position=1
        )
        TournamentParticipant.objects.create(
            tournament=tournament, user=self.user2, bracket_position=2
        )
        TournamentParticipant.objects.create(
            tournament=tournament, user=self.user3, bracket_position=3
        )
        TournamentParticipant.objects.create(
            tournament=tournament, user=self.user4, bracket_position=4
        )

        self.assertEqual(tournament.participants.count(), 4)

        # bracket_positionでフィルタリングできることを確認
        semi_final1_players = tournament.participants.filter(
            bracket_position__in=[1, 2]
        )
        self.assertEqual(semi_final1_players.count(), 2)

        # 準決勝1のプレイヤーが正しいことを確認
        usernames = sorted([p.user.username for p in semi_final1_players])
        self.assertEqual(usernames, ["player1", "player2"])
