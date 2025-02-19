from django.test import TestCase
from django.db import IntegrityError

from pong.models import (
    User,
    Game,
    TournamentGameSession,
    TournamentMatch,
    TournamentParticipant,
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


class TournamentGameSessionTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="tournament_player1",
            password="test123",
            display_name="Tournament Player 1",
        )
        self.user2 = User.objects.create_user(
            username="tournament_player2",
            password="test123",
            display_name="Tournament Player 2",
        )
        self.tournament = TournamentGameSession.objects.create(
            name="Test Tournament", min_players=2, max_players=4
        )

    def test_create_tournament_session(self):
        """Test basic tournament session creation"""
        self.assertEqual(self.tournament.status, "WAITING_PLAYERS")
        self.assertEqual(self.tournament.current_round, 0)
        self.assertIsNone(self.tournament.started_at)
        self.assertIsNone(self.tournament.completed_at)

    def test_tournament_str_representation(self):
        """Test string representation of tournament"""
        expected = "Tournament: Test Tournament (WAITING_PLAYERS)"
        self.assertEqual(str(self.tournament), expected)

    def test_tournament_status_transitions(self):
        """Test tournament status transitions"""
        # Initial state
        self.assertEqual(self.tournament.status, "WAITING_PLAYERS")

        # Change to READY
        self.tournament.status = "READY"
        self.tournament.save()
        self.assertEqual(self.tournament.status, "READY")

        # Change to IN_PROGRESS
        self.tournament.status = "IN_PROGRESS"
        self.tournament.save()
        self.assertEqual(self.tournament.status, "IN_PROGRESS")

        # Change to COMPLETED
        self.tournament.status = "COMPLETED"
        self.tournament.save()
        self.assertEqual(self.tournament.status, "COMPLETED")


class TournamentMatchTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="match_player1", password="test123", display_name="Match Player 1"
        )
        self.user2 = User.objects.create_user(
            username="match_player2", password="test123", display_name="Match Player 2"
        )
        self.tournament = TournamentGameSession.objects.create(
            name="Match Test Tournament"
        )
        self.game = Game.objects.create(player1=self.user1, player2=self.user2)

    def test_create_tournament_match(self):
        """Test tournament match creation"""
        match = TournamentMatch.objects.create(
            tournament=self.tournament,
            round_number=1,
            match_number=1,
            player1=self.user1,
            player2=self.user2,
            game=self.game,
        )

        self.assertEqual(match.round_number, 1)
        self.assertEqual(match.match_number, 1)
        self.assertEqual(match.player1, self.user1)
        self.assertEqual(match.player2, self.user2)
        self.assertEqual(match.game, self.game)
        self.assertIsNone(match.next_match)

    def test_match_progression(self):
        """Test match progression with next_match relationship"""
        match1 = TournamentMatch.objects.create(
            tournament=self.tournament,
            round_number=1,
            match_number=1,
            player1=self.user1,
            player2=self.user2,
        )

        match2 = TournamentMatch.objects.create(
            tournament=self.tournament, round_number=2, match_number=1
        )

        match1.next_match = match2
        match1.save()

        self.assertEqual(match1.next_match, match2)

    def test_unique_match_in_tournament(self):
        """Test uniqueness constraint of round and match numbers in tournament"""
        TournamentMatch.objects.create(
            tournament=self.tournament, round_number=1, match_number=1
        )

        with self.assertRaises(IntegrityError):
            TournamentMatch.objects.create(
                tournament=self.tournament, round_number=1, match_number=1
            )


class TournamentParticipantTests(TestCase):
    def setUp(self):
        self.tournament = TournamentGameSession.objects.create(
            name="Participant Test Tournament", min_players=2, max_players=4
        )
        self.user1 = User.objects.create_user(
            username="participant1", password="test123", display_name="Participant 1"
        )

    def test_create_participant(self):
        """Test participant creation"""
        participant = TournamentParticipant.objects.create(
            tournament=self.tournament, user=self.user1, seed=1
        )

        self.assertEqual(participant.tournament, self.tournament)
        self.assertEqual(participant.user, self.user1)
        self.assertEqual(participant.seed, 1)

    def test_unique_participant_in_tournament(self):
        """Test that a user can't join the same tournament twice"""
        TournamentParticipant.objects.create(
            tournament=self.tournament, user=self.user1
        )

        with self.assertRaises(IntegrityError):
            TournamentParticipant.objects.create(
                tournament=self.tournament, user=self.user1
            )
