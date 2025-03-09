from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/test/$", consumers.TestConsumer.as_asgi()),
    re_path(r"ws/matchmaking/$", consumers.MatchmakingConsumer.as_asgi()),
    re_path(
        r"ws/game/(?P<session_id>game_[^/]+)/(?P<username>[^/]+)/$",
        consumers.GameConsumer.as_asgi(),
    ),
    re_path(r"ws/tournament/$", consumers.TournamentMatchmakingConsumer.as_asgi()),
    re_path(
        r"ws/tournament/game/(?P<round_type>[^/]+)/(?P<tournament_id>[^/]+)/(?P<username>[^/]+)/$",
        consumers.TournamentGameConsumer.as_asgi(),
    ),
    re_path(
        r"ws/tournament/waiting_final/(?P<session_id>[^/]+)/(?P<username>[^/]+)/$",
        consumers.TournamentWaitingFinalConsumer.as_asgi(),
    ),
]
