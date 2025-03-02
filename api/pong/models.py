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
    last_activity = models.DateTimeField(null=True, blank=True)
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
    GAME_TYPE_CHOICES = [
        ("SINGLE", "Single Player"),
        ("MULTI", "Multiplayer"),
        ("TOURNAMENT", "Tournament Match"),
    ]

    GAME_STATUS_CHOICES = [
        ("WAITING", "Waiting for Players"),
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
    ]

    # 基本情報
    game_type = models.CharField(
        max_length=10, choices=GAME_TYPE_CHOICES, default="MULTI"
    )
    status = models.CharField(
        max_length=20, choices=GAME_STATUS_CHOICES, default="WAITING"
    )
    session_id = models.CharField(
        max_length=100,
        unique=True,
        help_text="Unique identifier for WebSocket sessions in format: game_type_uniqueid_timestamp",
    )

    # プレイヤー情報
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
    is_ai_opponent = models.BooleanField(default=False)

    # 時間情報
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)

    # 結果情報
    score_player1 = models.IntegerField(default=0)
    score_player2 = models.IntegerField(default=0)
    winner = models.ForeignKey(
        User, related_name="games_won", null=True, blank=True, on_delete=models.SET_NULL
    )

    # トーナメント関連（トーナメントの場合のみ使用）
    tournament = models.ForeignKey(
        "TournamentSession",
        related_name="games",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    tournament_round = models.IntegerField(null=True, blank=True)  # 0=準決勝、1=決勝

    def __str__(self):
        opponent = (
            "AI"
            if self.is_ai_opponent
            else (self.player2.display_name if self.player2 else "Waiting for opponent")
        )
        return (
            f"{self.get_game_type_display()}: {self.player1.display_name} vs {opponent}"
        )


class TournamentSession(models.Model):
    STATUS_CHOICES = [
        ("WAITING_PLAYERS", "Waiting for Players"),
        ("IN_PROGRESS", "Tournament in Progress"),
        ("FINAL_READY", "Final Round Ready"),
        ("COMPLETED", "Tournament Completed"),
    ]

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="WAITING_PLAYERS"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    max_players = models.IntegerField(default=4)
    winner = models.ForeignKey(
        User,
        related_name="tournaments_won",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    def __str__(self):
        return f"Tournament {self.id} ({self.status})"


class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(
        TournamentSession, related_name="participants", on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        User, related_name="tournament_participations", on_delete=models.CASCADE
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    is_ready = models.BooleanField(default=False)
    bracket_position = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = [("tournament", "user")]

    def __str__(self):
        return f"{self.user.display_name} in Tournament {self.tournament.id}"
