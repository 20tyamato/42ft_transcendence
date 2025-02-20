from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import (
    Game,
    User,
    TournamentGameSession,
    TournamentMatch,
    TournamentParticipant,
)


class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "is_online")


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "display_name",
            "password",
            "avatar",
            "level",
            "experience",
            "language",
            "is_online",
            "friends",
        ]
        extra_kwargs = {
            "username": {"required": True},
            "email": {"required": True},
            "display_name": {"required": True},
        }

    def validate(self, attrs):
        for field in ["username", "email", "display_name"]:
            if field in attrs and not attrs[field].strip():
                raise serializers.ValidationError(
                    {field: "This field may not be blank."}
                )
        return super().validate(attrs)

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            display_name=validated_data["display_name"],
            avatar=validated_data.get("avatar", ""),
            level=validated_data.get("level", 1),
            experience=validated_data.get("experience", 0),
            language=validated_data.get("language", "en"),
            is_online=validated_data.get("is_online", False),
        )
        user.set_password(validated_data["password"])
        user.save()
        return user


class UserAvatarSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ["avatar", "avatar_url"]

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if obj.avatar and hasattr(obj.avatar, "url"):
            # 絶対パスにする場合は request.build_absolute_uri を利用
            return (
                request.build_absolute_uri(obj.avatar.url)
                if request
                else obj.avatar.url
            )
        return None


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    attrs["user"] = user
                    return attrs
                raise serializers.ValidationError("User account is disabled.")
            raise serializers.ValidationError(
                "Unable to log in with provided credentials."
            )
        raise serializers.ValidationError('Must include "username" and "password".')


class GameSerializer(serializers.ModelSerializer):
    player1 = serializers.CharField(source="player1.username")
    player2 = serializers.CharField(
        source="player2.username", allow_null=True, required=False, allow_blank=True
    )
    winner = serializers.CharField(
        source="winner.username", allow_null=True, required=False, allow_blank=True
    )

    def validate_player1(self, value):
        """Validate that player1 exists"""
        try:
            User.objects.get(username=value)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Player1 does not exist")

    def validate_player2(self, value):
        """Validate player2 if present"""
        if value:
            try:
                User.objects.get(username=value)
                return value
            except User.DoesNotExist:
                raise serializers.ValidationError("Player2 does not exist")
        return value

    def validate(self, data):
        """Validate complete set of data"""
        if not data.get("player1"):
            raise serializers.ValidationError("Player1 is required")

        if data.get("is_ai_opponent") is False:
            if data.get("player2", {}).get("username") is None:
                raise serializers.ValidationError(
                    "Player2 is required for non-AI games"
                )
        return data

    def create(self, validated_data):
        player1_data = validated_data.pop("player1")
        player2_data = validated_data.pop("player2")
        # NOTE: Noneはデフォルト値.試合が中断されたときやAI対戦のときを想定
        winner_data = validated_data.pop("winner", None)

        player1 = User.objects.get(username=player1_data["username"])

        if player2_data["username"] is None:
            validated_data["player2"] = None
        else:
            validated_data["player2"] = User.objects.get(
                username=player2_data["username"]
            )

        # NOTE: 空欄もありえるので.今後の要件で変更あるかも.
        if winner_data and winner_data["username"]:
            validated_data["winner"] = User.objects.get(
                username=winner_data["username"]
            )
        else:
            validated_data["winner"] = None

        game = Game.objects.create(player1=player1, **validated_data)
        return game

    class Meta:
        model = Game
        fields = [
            "id",
            "player1",
            "player2",
            "start_time",
            "end_time",
            "winner",
            "score_player1",
            "score_player2",
            "is_ai_opponent",
        ]


class TournamentGameSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TournamentGameSession
        fields = [
            "id",
            "name",
            "status",
            "created_at",
            "started_at",
            "completed_at",
            "current_round",
            "participants"
        ]

    def get_participants(self, obj):
        """参加者のユーザー名リストを取得"""
        return [
            participant.user.username 
            for participant in obj.tournamentparticipant_set.all()
        ]

    def validate(self, data):
        if self.instance and self.instance.status != "WAITING_PLAYERS":
            # 進行中・完了済みトーナメントの編集を防止
            raise serializers.ValidationError(
                "Cannot modify tournament after it has started"
            )

        return data


class TournamentMatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = TournamentMatch
        fields = [
            "id",
            "tournament",
            "game",
            "round_number",
            "match_number",
            "player1",
            "player2",
            "next_match",
        ]
        read_only_fields = ["id"]

    def validate_round_number(self, value):
        """
        Check that round_number is positive
        """
        if value < 1:
            raise serializers.ValidationError("Round number must be greater than 0")
        return value

    def validate_match_number(self, value):
        """
        Check that match_number is positive
        """
        if value < 1:
            raise serializers.ValidationError("Match number must be greater than 0")
        return value

    def validate(self, data):
        """
        Custom validation for match data
        """
        player1 = data.get("player1")
        player2 = data.get("player2")

        # Ensure players are different if both are specified
        if player1 and player2 and player1 == player2:
            raise serializers.ValidationError({"player2": "Players must be different"})

        return data


class TournamentParticipantSerializer(serializers.ModelSerializer):
    user_display_name = serializers.CharField(
        source="user.display_name", read_only=True
    )

    class Meta:
        model = TournamentParticipant
        fields = ["id", "tournament", "user", "user_display_name", "joined_at", "seed"]
        read_only_fields = ["id", "joined_at"]

    def validate_seed(self, value):
        """
        Check that seed is positive if provided
        """
        if value is not None and value < 1:
            raise serializers.ValidationError(
                "Seed number must be greater than 0 if provided"
            )
        return value

    def validate(self, data):
        """
        Check for duplicate participation
        """
        tournament = data.get("tournament")
        user = data.get("user")

        # Skip validation if either tournament or user is not provided
        if not tournament or not user:
            return data

        # When creating a new participant
        if not self.instance:
            if TournamentParticipant.objects.filter(
                tournament=tournament, user=user
            ).exists():
                raise serializers.ValidationError(
                    {"user": "This user is already participating in this tournament"}
                )

        return data
