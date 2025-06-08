from rest_framework import permissions

class IsSuperUser(permissions.BasePermission):
    """
    Разрешение только для суперпользователей
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser

class IsModeratorOrAdmin(permissions.BasePermission):
    """
    Разрешение для модераторов и администраторов
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Разрешаем, если пользователь суперпользователь, сотрудник или модератор
        return (request.user.is_superuser or 
                request.user.is_staff or 
                request.user.is_moderator) 