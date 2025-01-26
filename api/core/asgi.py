"""
ASGI config for sample project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import django

# Django設定とアプリケーション初期化
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# 初期化後にインポート
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from pong.routing import websocket_urlpatterns
from whitenoise import WhiteNoise

# TODO: add root path????
application = ProtocolTypeRouter({
    "http": WhiteNoise(get_asgi_application(), root="/path/to/static/files/"),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})