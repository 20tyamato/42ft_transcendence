from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsOwnerOfUserProfile(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.id == request.user.id


class IsPlayerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return (obj.player1 == request.user) or (obj.player2 == request.user)
