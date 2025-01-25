from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    display_name = models.CharField(max_length=50, unique=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True, default="default_avatar.png")
    level = models.IntegerField(default=1)
    experience = models.IntegerField(default=0)

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
    player1 = models.ForeignKey(User, related_name="games_as_player1", on_delete=models.CASCADE)
    player2 = models.ForeignKey(User, related_name="games_as_player2", null=True, blank=True, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    winner = models.ForeignKey(User, related_name="games_won", null=True, blank=True, on_delete=models.SET_NULL)
    score_player1 = models.IntegerField(default=0)
    score_player2 = models.IntegerField(default=0)
    is_ai_opponent = models.BooleanField(default=False)

    # FIXME: display_name削除してusernameに統一したい...
    def __str__(self):
        player2_name = "AI" if self.is_ai_opponent else self.player2.display_name
        return f"Game {self.id} - {self.player1.display_name} vs {player2_name}"

class Tournament(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    participants = models.ManyToManyField(User, related_name="tournaments")
    games = models.ManyToManyField(Game, related_name="tournaments")
    blockchain_score_hash = models.CharField(max_length=256, null=True, blank=True)

    def __str__(self):
        return self.name

class BlockchainScore(models.Model):
    tournament = models.OneToOneField(Tournament, on_delete=models.CASCADE, related_name="blockchain_score")
    transaction_id = models.CharField(max_length=256)
    blockchain_address = models.CharField(max_length=256)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Blockchain Score for Tournament {self.tournament.name}"
