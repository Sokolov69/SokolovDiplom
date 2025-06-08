from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminOrReadOnly(BasePermission):
    """
    Разрешение, позволяющее только администраторам выполнять небезопасные действия.
    """
    def has_permission(self, request, view):
        # Разрешаем GET, HEAD и OPTIONS запросы для всех
        if request.method in SAFE_METHODS:
            return True
        
        # Проверяем, аутентифицирован ли пользователь и является ли он суперпользователем или модератором
        return request.user and (request.user.is_superuser or request.user.is_staff or request.user.is_moderator) 