from django.test import TestCase
from pong.models import User, Game, Tournament, BlockchainScore

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

    def test_create_game_ai_opponent(self):
        """Test game creation with AI opponent"""
        game = Game.objects.create(
            player1=self.player1,
            player2=None,
            score_player1=10,
            score_player2=20,
            is_ai_opponent=True
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
            is_ai_opponent=False
        )
        self.assertIsNotNone(game.id)
        self.assertEqual(game.player1, self.player1)
        self.assertEqual(game.player2, self.player2)
        self.assertFalse(game.is_ai_opponent)

    def test_str_representation_ai(self):
        """Test string representation for AI game"""
        game = Game.objects.create(
            player1=self.player1,
            player2=None,
            is_ai_opponent=True
        )
        expected_str = f"Game {game.id} - {self.player1.display_name} vs AI"
        self.assertEqual(str(game), expected_str)

    def test_str_representation_human(self):
        """Test string representation for human vs human game"""
        game = Game.objects.create(
            player1=self.player1,
            player2=self.player2,
            is_ai_opponent=False
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
            score_player2=3
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
            score_player2=5
        )
        human_game.winner = self.player2
        human_game.save()
        self.assertEqual(human_game.winner, self.player2)


class TournamentModelTests(TestCase):
    def setUp(self):
        """
        Create some users and games to be used in the Tournament tests.
        """
        self.user1 = User.objects.create_user(
            username='tournament_user1',
            password='tournament_pass1',
            display_name='Tournament User 1'
        )
        self.user2 = User.objects.create_user(
            username='tournament_user2',
            password='tournament_pass2',
            display_name='Tournament User 2'
        )

        self.game1 = Game.objects.create(
            player1=self.user1,
            player2=self.user2,
            score_player1=12,
            score_player2=10
        )
        self.game2 = Game.objects.create(
            player1=self.user2,
            player2=self.user1,
            score_player1=5,
            score_player2=7
        )

    def test_create_tournament(self):
        """
        Test that a Tournament can be created successfully.
        """
        tournament = Tournament.objects.create(name="Test Tournament")
        # M2Mフィールドを追加
        tournament.participants.set([self.user1, self.user2])
        tournament.games.set([self.game1, self.game2])
        tournament.save()

        self.assertIsNotNone(tournament.id, "Tournament should be created successfully and assigned an ID")
        self.assertEqual(tournament.name, "Test Tournament")
        self.assertIn(self.user1, tournament.participants.all())
        self.assertIn(self.user2, tournament.participants.all())
        self.assertIn(self.game1, tournament.games.all())
        self.assertIn(self.game2, tournament.games.all())

    def test_str_representation(self):
        """
        Test that the __str__ method returns the name of the Tournament.
        """
        tournament = Tournament.objects.create(name="Friendly Cup")
        self.assertEqual(str(tournament), "Friendly Cup")

    def test_blockchain_score_hash(self):
        """
        Test that we can store a blockchain_score_hash for the tournament.
        """
        tournament = Tournament.objects.create(
            name="Hash Test Tournament",
            blockchain_score_hash="abc123xyz"
        )
        self.assertEqual(tournament.blockchain_score_hash, "abc123xyz")


class BlockchainScoreModelTests(TestCase):
    def setUp(self):
        """
        Create a tournament to be used for BlockchainScore tests.
        """
        self.tournament = Tournament.objects.create(name="Blockchain Tournament")

    def test_create_blockchain_score(self):
        """
        Test that a BlockchainScore can be created successfully.
        """
        bc_score = BlockchainScore.objects.create(
            tournament=self.tournament,
            transaction_id="tx_12345",
            blockchain_address="0xABCDEF",
        )
        self.assertIsNotNone(bc_score.id, "BlockchainScore should be created successfully and assigned an ID")
        self.assertEqual(bc_score.tournament, self.tournament)
        self.assertEqual(bc_score.transaction_id, "tx_12345")
        self.assertEqual(bc_score.blockchain_address, "0xABCDEF")

    def test_str_representation(self):
        """
        Test that the __str__ method returns the correct string format.
        """
        bc_score = BlockchainScore.objects.create(
            tournament=self.tournament,
            transaction_id="tx_67890",
            blockchain_address="0x123456",
        )
        expected_str = f"Blockchain Score for Tournament {self.tournament.name}"
        self.assertEqual(str(bc_score), expected_str)
