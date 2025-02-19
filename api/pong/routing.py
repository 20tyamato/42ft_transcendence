from django.urls import re_path

from . import consumers
from .tournament.handlers import TournamentWebSocketHandler

websocket_urlpatterns = [
    re_path(r"ws/test/$", consumers.TestConsumer.as_asgi()),
    re_path(r"ws/matchmaking/$", consumers.MatchmakingConsumer.as_asgi()),
    re_path(
        r"ws/game/(?P<session_id>game_[^/]+)/(?P<username>[^/]+)/$",
        consumers.GameConsumer.as_asgi(),
    ),
    re_path(
        r"ws/tournament/(?P<tournament_id>\d+)/(?P<username>[^/]+)/$",
        TournamentWebSocketHandler.as_asgi(),
    ),
]
