from datetime import timedelta

from django.contrib.auth import logout
from django.utils import timezone
from rest_framework.authtoken.models import Token


class UpdateLastActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            now = timezone.now()
            threshold = timedelta(minutes=1)
            last_activity = request.user.last_activity

            if last_activity and (now - last_activity > threshold):
                Token.objects.filter(user=request.user).delete()
                request.user.is_online = False
                request.user.save()
                logout(request)
            else:
                request.user.last_activity = now
                request.user.is_online = True
                request.user.save()
        response = self.get_response(request)
        return response
