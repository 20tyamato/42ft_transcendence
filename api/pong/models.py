from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    display_name = models.CharField(max_length=50, unique=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True, default="default_avatar.png")
    level = models.IntegerField(default=1)

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

class Game(models.Model):
    player1 = models.ForeignKey(User, related_name="games_as_player1", on_delete=models.CASCADE)
    player2 = models.ForeignKey(User, related_name="games_as_player2", on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    winner = models.ForeignKey(User, related_name="games_won", null=True, blank=True, on_delete=models.SET_NULL)
    score_player1 = models.IntegerField(default=0)
    score_player2 = models.IntegerField(default=0)
    is_ai_opponent = models.BooleanField(default=False)

    def __str__(self):
        return f"Game {self.id} - {self.player1.display_name} vs {self.player2.display_name}"
