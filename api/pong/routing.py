from django.urls import re_path

from . import consumers
from .tournament_consumers import (
    TournamentGameConsumer,
    TournamentMatchmakingConsumer,
    TournamentWaitingFinalConsumer,
)

websocket_urlpatterns = [
    re_path(r"wss/matchmaking/$", consumers.MatchmakingConsumer.as_asgi()),
    re_path(
        r"wss/game/(?P<session_id>game_[^/]+)/(?P<username>[^/]+)/$",
        consumers.GameConsumer.as_asgi(),
    ),
    re_path(r"wss/tournament/$", TournamentMatchmakingConsumer.as_asgi()),
    re_path(
        r"wss/tournament/game/(?P<round_type>[^/]+)/(?P<tournament_id>[^/]+)/(?P<username>[^/]+)/$",
        TournamentGameConsumer.as_asgi(),
    ),
    re_path(
        r"wss/tournament/waiting_final/(?P<tournament_id>[^/]+)/(?P<username>[^/]+)/$",
        TournamentWaitingFinalConsumer.as_asgi(),
    ),
]
