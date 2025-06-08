from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q
from .serializers import (
    UserSerializer, RegisterSerializer, UserUpdateSerializer,
    RoleSerializer, UserActionLogSerializer, PasswordChangeSerializer
)
from .models import Role, UserActionLog
from .permissions import IsSuperUser, IsModeratorOrAdmin

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    """
    Регистрация нового пользователя
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    Получение и обновление профиля текущего пользователя
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        # Обновляем время последней активности
        user = self.request.user
        user.last_activity = timezone.now()
        user.save(update_fields=['last_activity'])
        return user
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

class PasswordChangeView(generics.GenericAPIView):
    """
    Смена пароля для текущего пользователя
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = PasswordChangeSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Проверяем текущий пароль
            if not request.user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {'old_password': ['Текущий пароль неверен.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Устанавливаем новый пароль
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            
            # Логируем действие
            UserActionLog.objects.create(
                user=request.user,
                action_type='other',
                description='Смена пароля пользователем',
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response({'detail': 'Пароль успешно изменен.'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RoleViewSet(ReadOnlyModelViewSet):
    """
    Просмотр ролей пользователей (только для чтения)
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

class UserViewSet(ModelViewSet):
    """
    ViewSet для управления пользователями (только для администраторов)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsModeratorOrAdmin]
    
    def get_queryset(self):
        queryset = User.objects.all()
        # Поиск по имени пользователя
        username = self.request.query_params.get('username', None)
        if username:
            queryset = queryset.filter(username__icontains=username)
        
        # Фильтрация по активности
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active)
        
        # Фильтрация по блокировке
        is_banned = self.request.query_params.get('is_banned', None)
        if is_banned is not None:
            is_banned = is_banned.lower() == 'true'
            queryset = queryset.filter(is_banned=is_banned)
            
        return queryset
    
    @action(detail=True, methods=['post'])
    def ban(self, request, pk=None):
        """
        Блокировка пользователя
        """
        if not request.user.is_superuser and not request.user.is_staff:
            return Response(
                {'detail': 'У вас нет прав для блокировки пользователей'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        user = self.get_object()
        reason = request.data.get('reason', 'Нарушение правил платформы')
        expiry = request.data.get('expiry', None)
        
        user.is_banned = True
        user.ban_reason = reason
        if expiry:
            user.ban_expiry = expiry
        user.save()
        
        # Логирование действия
        UserActionLog.objects.create(
            user=request.user,
            action_type='user_ban',
            description=f'Блокировка пользователя. Причина: {reason}',
            target_user=user,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({'detail': 'Пользователь заблокирован'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def unban(self, request, pk=None):
        """
        Разблокировка пользователя
        """
        if not request.user.is_superuser and not request.user.is_staff:
            return Response(
                {'detail': 'У вас нет прав для разблокировки пользователей'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        user = self.get_object()
        
        user.is_banned = False
        user.ban_reason = None
        user.ban_expiry = None
        user.save()
        
        # Логирование действия
        UserActionLog.objects.create(
            user=request.user,
            action_type='user_unban',
            description='Разблокировка пользователя',
            target_user=user,
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({'detail': 'Пользователь разблокирован'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def add_role(self, request, pk=None):
        """
        Добавление роли пользователю
        """
        if not request.user.is_superuser:
            return Response(
                {'detail': 'У вас нет прав для изменения ролей пользователей'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        user = self.get_object()
        role_id = request.data.get('role_id')
        
        try:
            role = Role.objects.get(id=role_id)
            user.roles.add(role)
            
            # Логирование действия
            UserActionLog.objects.create(
                user=request.user,
                action_type='user_role_add',
                description=f'Добавлена роль {role.name}',
                target_user=user,
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response({'detail': f'Роль {role.name} добавлена'}, status=status.HTTP_200_OK)
        except Role.DoesNotExist:
            return Response({'detail': 'Роль не найдена'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def remove_role(self, request, pk=None):
        """
        Удаление роли у пользователя
        """
        if not request.user.is_superuser:
            return Response(
                {'detail': 'У вас нет прав для изменения ролей пользователей'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        user = self.get_object()
        role_id = request.data.get('role_id')
        
        try:
            role = Role.objects.get(id=role_id)
            user.roles.remove(role)
            
            # Логирование действия
            UserActionLog.objects.create(
                user=request.user,
                action_type='user_role_remove',
                description=f'Удалена роль {role.name}',
                target_user=user,
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response({'detail': f'Роль {role.name} удалена'}, status=status.HTTP_200_OK)
        except Role.DoesNotExist:
            return Response({'detail': 'Роль не найдена'}, status=status.HTTP_404_NOT_FOUND)

class UserActionLogViewSet(ReadOnlyModelViewSet):
    """
    ViewSet для просмотра логов действий пользователей (только для администраторов)
    """
    queryset = UserActionLog.objects.all()
    serializer_class = UserActionLogSerializer
    permission_classes = [IsModeratorOrAdmin]
    
    def get_queryset(self):
        queryset = UserActionLog.objects.all()
        
        # Фильтрация по пользователю
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Фильтрация по типу действия
        action_type = self.request.query_params.get('action_type', None)
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        
        # Фильтрация по целевому пользователю
        target_user_id = self.request.query_params.get('target_user_id', None)
        if target_user_id:
            queryset = queryset.filter(target_user_id=target_user_id)
            
        return queryset.order_by('-created_at') 