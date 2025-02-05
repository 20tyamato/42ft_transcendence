# api/pong/tests/test_consumers.py

import json
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from django.test import TestCase
from django.contrib.auth import get_user_model
from ..consumers import MatchmakingConsumer
from ..models import GameSession
from channels.routing import URLRouter
from django.urls import re_path

class MatchmakingConsumerTests(TestCase):
    async def setUp(self):
        self.User = get_user_model()
        self.user1 = await database_sync_to_async(self.User.objects.create_user)(
            username='testuser1',
            password='testpass123',
            display_name='Test User 1'
        )
        self.user2 = await database_sync_to_async(self.User.objects.create_user)(
            username='testuser2',
            password='testpass123',
            display_name='Test User 2'
        )
        
        self.application = URLRouter([
            re_path(r'ws/matchmaking/$', MatchmakingConsumer.as_asgi()),
        ])

    async def test_connect_and_wait(self):
        communicator = WebsocketCommunicator(
            self.application,
            "/ws/matchmaking/",
        )
        communicator.scope["user"] = self.user1
        connected, _ = await communicator.connect()
        
        assert connected
        
        response = await communicator.receive_json_from()
        assert response["type"] == "waiting"
        
        await communicator.disconnect()

    async def test_match_making(self):
        # First player connects
        communicator1 = WebsocketCommunicator(
            self.application,
            "/ws/matchmaking/",
        )
        communicator1.scope["user"] = self.user1
        await communicator1.connect()
        
        # Check waiting status
        response1 = await communicator1.receive_json_from()
        assert response1["type"] == "waiting"
        
        # Second player connects
        communicator2 = WebsocketCommunicator(
            self.application,
            "/ws/matchmaking/",
        )
        communicator2.scope["user"] = self.user2
        await communicator2.connect()
        
        # Both players should receive match_found
        response2_1 = await communicator1.receive_json_from()
        response2_2 = await communicator2.receive_json_from()
        
        assert response2_1["type"] == "match_found"
        assert response2_2["type"] == "match_found"
        
        # Verify session was created
        session_count = await database_sync_to_async(GameSession.objects.count)()
        assert session_count == 1
        
        await communicator1.disconnect()
        await communicator2.disconnect()

    async def test_disconnect_during_waiting(self):
        communicator = WebsocketCommunicator(
            self.application,
            "/ws/matchmaking/",
        )
        communicator.scope["user"] = self.user1
        await communicator.connect()
        
        # Disconnect while waiting
        await communicator.disconnect()
        
        # Verify no lingering sessions
        session_count = await database_sync_to_async(GameSession.objects.filter(status='WAITING').count)()
        assert session_count == 0