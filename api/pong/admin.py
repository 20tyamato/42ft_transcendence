from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Game, Tournament, BlockchainScore

class CustomUserAdmin(UserAdmin):
    list_display = (
        "id",
        "username",
        "display_name",
        "email",
        "level",
        "experience",
        "is_staff",
        "is_superuser",
        "is_active",
    )
    search_fields = ("username", "display_name", "email")
    list_filter = ("is_staff", "is_superuser", "is_active", "level")

    fieldsets = (
        (None, {
            "fields": ("username", "password")
        }),
        ("Personal info", {
            "fields": ("display_name", "avatar", "email", "level", "experience")
        }),
        ("Permissions", {
            "fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")
        }),
        ("Important dates", {
            "fields": ("last_login", "date_joined")
        }),
    )

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "player1",
        "player2",
        "start_time",
        "end_time",
        "winner",
        "score_player1",
        "score_player2",
        "is_ai_opponent",
    )
    list_filter = ("is_ai_opponent", "winner", "start_time")
    search_fields = ("player1__display_name", "player2__display_name")

@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "created_at",
        "blockchain_score_hash",
    )
    search_fields = ("name",)
    filter_horizontal = ("participants", "games")

@admin.register(BlockchainScore)
class BlockchainScoreAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "tournament",
        "transaction_id",
        "blockchain_address",
        "created_at",
    )
    search_fields = ("transaction_id", "blockchain_address")

admin.site.register(User, CustomUserAdmin)
