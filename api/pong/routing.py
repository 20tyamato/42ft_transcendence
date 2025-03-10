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
        r"ws/tournament/semi-final/(?P<session_id>[^/]+)/(?P<username>[^/]+)/$",
        consumers.TournamentGameConsumer.as_asgi(),
    ),
    # TODO: add ws/tournament/waitin_final/
    re_path(
        r"ws/tournament/final/(?P<session_id>[^/]+)/(?P<username>[^/]+)/$",
        consumers.TournamentGameConsumer.as_asgi(),
    ),
]
