import time

from rest_framework import serializers

from .models import Game, TournamentParticipant, TournamentSession, User


def generate_session_id(game_type, player1_username, player2_username=None):
    """シンプル化されたセッションIDを生成"""
    timestamp = int(time.time())

    # player2がNoneまたは空の場合は'solo'を使用
    p2 = player2_username if player2_username else "solo"

    return f"{game_type.lower()}_{player1_username}_{p2}_{timestamp}"


def generate_tournament_session_id(
    tournament_id, round_type, player1_username, player2_username
):
    """トーナメント用セッションID生成関数"""
    timestamp = int(time.time())
    return f"tournament_{tournament_id}_{round_type}_{player1_username}_{player2_username}_{timestamp}"


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


# NOTE: セッションIDの形式変更済：tournament_{tournament_id}_{round_type}_{player1}_{player2}_{timestamp}
class GameSerializer(serializers.ModelSerializer):
    player1 = serializers.CharField(source="player1.username")
    player2 = serializers.CharField(
        source="player2.username", allow_null=True, required=False, allow_blank=True
    )
    winner = serializers.CharField(
        source="winner.username", allow_null=True, required=False, allow_blank=True
    )
    tournament_id = serializers.PrimaryKeyRelatedField(
        source="tournament",
        queryset=TournamentSession.objects.all(),
        required=False,
        allow_null=True,
    )
    # セッションIDは読み取り専用として設定（自動生成するため）
    session_id = serializers.CharField(read_only=True)

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

        # ゲームタイプに基づくバリデーション
        game_type = data.get("game_type", "MULTI")  # デフォルトはマルチプレイヤー

        # AIレベルが指定されている場合は1-4の範囲内か確認
        if data.get("ai_level") is not None:
            if data["ai_level"] not in [1, 3, 5, 10]:
                raise serializers.ValidationError(
                    "AI level must be between 1 (Beginner) and 10 (Oni)"
                )

        # マルチプレイまたはトーナメントの場合、AIでない限りplayer2が必要
        if game_type in ["MULTI", "TOURNAMENT"] and data.get("ai_level") is None:
            if data.get("player2", {}).get("username") is None:
                raise serializers.ValidationError(
                    "Player2 is required for non-AI multiplayer games"
                )

        # トーナメントの場合、tournament_idが必要
        if game_type == "TOURNAMENT" and not data.get("tournament"):
            raise serializers.ValidationError(
                "Tournament reference is required for tournament games"
            )

        return data

    def create(self, validated_data):
        player1_data = validated_data.pop("player1")
        player2_data = validated_data.pop("player2", {"username": None})
        winner_data = validated_data.pop("winner", None)

        # ユーザーオブジェクトの取得
        player1 = User.objects.get(username=player1_data["username"])
        player2_username = None

        if not player2_data or player2_data.get("username") is None:
            validated_data["player2"] = None
        else:
            player2_username = player2_data["username"]
            validated_data["player2"] = User.objects.get(username=player2_username)

        if winner_data and winner_data.get("username"):
            validated_data["winner"] = User.objects.get(
                username=winner_data["username"]
            )
        else:
            validated_data["winner"] = None

        # ゲームタイプの取得（デフォルトはMULTI）
        game_type = validated_data.get("game_type", "MULTI")

        # セッションIDの生成
        if game_type == "TOURNAMENT":
            tournament = validated_data.get("tournament")
            round_type = (
                "semi1" if validated_data.get("tournament_round") == 0 else "final"
            )
            validated_data["session_id"] = generate_tournament_session_id(
                tournament.id, round_type, player1.username, player2_username
            )
        else:
            validated_data["session_id"] = generate_session_id(
                game_type, player1.username, player2_username
            )

        game = Game.objects.create(player1=player1, **validated_data)
        return game

    class Meta:
        model = Game
        fields = [
            "id",
            "game_type",
            "status",
            "session_id",
            "player1",
            "player2",
            "start_time",
            "end_time",
            "winner",
            "score_player1",
            "score_player2",
            "ai_level",
            "tournament_id",
            "tournament_round",
        ]
        read_only_fields = ["id", "start_time", "session_id"]


class TournamentParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    display_name = serializers.CharField(source="user.display_name", read_only=True)

    class Meta:
        model = TournamentParticipant
        fields = [
            "id",
            "username",
            "display_name",
            "is_ready",
            "joined_at",
            "bracket_position",
        ]


class TournamentSessionSerializer(serializers.ModelSerializer):
    participants = TournamentParticipantSerializer(many=True, read_only=True)
    current_players_count = serializers.SerializerMethodField()
    games = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    winner_username = serializers.SerializerMethodField(read_only=True)
    winner_display_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TournamentSession
        fields = [
            "id",
            "status",
            "created_at",
            "started_at",
            "completed_at",
            "max_players",
            "current_players_count",
            "participants",
            "games",
            "winner",  # 優勝者ID
            "winner_username",  # 優勝者のユーザー名
            "winner_display_name",  # 優勝者の表示名
        ]

    def get_current_players_count(self, obj):
        return obj.participants.count()

    def get_winner_username(self, obj):
        """優勝者のユーザー名を返す"""
        if obj.winner:
            return obj.winner.username
        return None

    def get_winner_display_name(self, obj):
        """優勝者の表示名を返す"""
        if obj.winner:
            return obj.winner.display_name
        return None

    def validate(self, data):
        if self.instance and self.instance.status != "WAITING_PLAYERS":
            raise serializers.ValidationError(
                "Cannot modify tournament after it has started"
            )
        return data


class MatchHistorySerializer(serializers.ModelSerializer):
    opponent = serializers.SerializerMethodField()
    result = serializers.SerializerMethodField()
    match_type = serializers.CharField(source="get_game_type_display")
    date = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = [
            "id",
            "date",
            "opponent",
            "result",
            "match_type",
            "score_player1",
            "score_player2",
            "session_id",
        ]

    def get_opponent(self, obj):
        user = self.context.get("user")
        if user.id == obj.player1_id:
            return obj.player2.username if obj.player2 else "AI"
        return obj.player1.username

    def get_result(self, obj):
        user = self.context.get("user")
        # 勝者がNoneの場合は引き分け
        if not obj.winner:
            return "draw"

        # 自分が勝者の場合
        if obj.winner_id == user.id:
            return "win"

        # それ以外は敗北
        return "lose"

    def get_date(self, obj):
        # 終了時間がある場合はそれを、なければ開始時間を返す
        return obj.end_time or obj.start_time
