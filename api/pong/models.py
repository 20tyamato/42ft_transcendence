from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    display_name = models.CharField(max_length=50, unique=True)
    avatar = models.ImageField(
        upload_to="avatars/", null=True, blank=True, default="default_avatar.png"
    )
    level = models.IntegerField(default=1)
    experience = models.IntegerField(default=0)
    language = models.CharField(max_length=10, default="en")
    is_online = models.BooleanField(default=False)
    friends = models.ManyToManyField(
        "self",
        symmetrical=True,
        blank=True,
        help_text="The friends of this user.",
    )

    groups = models.ManyToManyField(
        "auth.Group",
        related_name="custom_user_groups",
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="custom_user_permissions",
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )

    def __str__(self):
        return self.display_name

    @property
    def total_games_played(self):
        return self.games_as_player1.count() + self.games_as_player2.count()

    @property
    def total_games_won(self):
        return self.games_won.count()

    @property
    def total_games_lost(self):
        return self.total_games_played - self.total_games_won


class Game(models.Model):
    player1 = models.ForeignKey(
        User, related_name="games_as_player1", on_delete=models.CASCADE
    )
    player2 = models.ForeignKey(
        User,
        related_name="games_as_player2",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
    )
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    winner = models.ForeignKey(
        User, related_name="games_won", null=True, blank=True, on_delete=models.SET_NULL
    )
    score_player1 = models.IntegerField(default=0)
    score_player2 = models.IntegerField(default=0)
    is_ai_opponent = models.BooleanField(default=False)

    def __str__(self):
        player2_name = "AI" if self.is_ai_opponent else self.player2.display_name
        return f"Game {self.id} - {self.player1.display_name} vs {player2_name}"


class GameSession(models.Model):
    STATUS_CHOICES = [
        ("WAITING", "Waiting"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
    ]

    player1 = models.ForeignKey(
        User, related_name="sessions_as_player1", on_delete=models.CASCADE
    )
    player2 = models.ForeignKey(
        User, related_name="sessions_as_player2", on_delete=models.CASCADE, null=True
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="WAITING")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Game Session {self.id}: {self.player1.display_name} vs {self.player2.display_name if self.player2 else 'Waiting'}"

# TODO: 参加者のリストを追加する
class TournamentGameSession(models.Model):
    STATUS_CHOICES = [
        ("WAITING_PLAYERS", "Waiting for Players"),
        ("IN_PROGRESS", "Tournament in Progress"),
        ("COMPLETED", "Tournament Completed"),
        ("CANCELLED", "Tournament Cancelled"),
    ]

    name = models.CharField(max_length=100)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="WAITING_PLAYERS"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    current_round = models.IntegerField(default=0)

    def __str__(self):
        return f"Tournament: {self.name} ({self.status})"


class TournamentMatch(models.Model):
    tournament = models.ForeignKey(
        TournamentGameSession, related_name="matches", on_delete=models.CASCADE
    )
    game = models.OneToOneField(Game, null=True, blank=True, on_delete=models.SET_NULL)
    round_number = models.IntegerField()
    match_number = models.IntegerField()
    player1 = models.ForeignKey(
        User,
        related_name="tournament_matches_as_player1",
        null=True,
        on_delete=models.SET_NULL,
    )
    player2 = models.ForeignKey(
        User,
        related_name="tournament_matches_as_player2",
        null=True,
        on_delete=models.SET_NULL,
    )
    next_match = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL
    )

    class Meta:
        unique_together = [("tournament", "round_number", "match_number")]


class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(
        TournamentGameSession, related_name="participants", on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        User, related_name="tournament_participations", on_delete=models.CASCADE
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    seed = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = [("tournament", "user")]
