from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Game, User


class CustomUserAdmin(UserAdmin):
    list_display = (
        "id",
        "username",
        "display_name",
        "email",
        "level",
        "avatar",
        "experience",
        "is_staff",
        "is_superuser",
        "is_active",
    )
    search_fields = ("username", "display_name", "email")
    list_filter = ("is_staff", "is_superuser", "is_active", "level")

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            "Personal info",
            {"fields": ("display_name", "avatar", "email", "level", "experience")},
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
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


admin.site.register(User, CustomUserAdmin)
