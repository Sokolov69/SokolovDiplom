from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Разрешение, позволяющее изменять предмет только его владельцу.
    """
    def has_object_permission(self, request, view, obj):
        # Разрешаем GET, HEAD и OPTIONS запросы для всех
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Разрешаем изменение только владельцу объекта
        return obj.owner == request.user


class IsOwner(permissions.BasePermission):
    """
    Разрешение, позволяющее доступ только владельцу объекта.
    """
    def has_object_permission(self, request, view, obj):
        # Проверяем что пользователь является владельцем
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        elif hasattr(obj, 'item'):
            # Для изображений проверяем владельца предмета
            return obj.item.owner == request.user
        return False


class ItemActionPermission(permissions.BasePermission):
    """
    Кастомное разрешение для различных действий с товарами.
    """
    def has_permission(self, request, view):
        # Базовая проверка аутентификации
        if not request.user or not request.user.is_authenticated:
            return False
        return True
    
    def has_object_permission(self, request, view, obj):
        # Для безопасных методов (GET, HEAD, OPTIONS) разрешаем всем
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Для действий с избранным разрешаем всем аутентифицированным пользователям
        if view.action == 'favorite':
            return True
        
        # Для просмотра изображений разрешаем всем
        if view.action == 'images':
            return True
        
        # Для остальных действий требуем права владельца
        return obj.owner == request.user 