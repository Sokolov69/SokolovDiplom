from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters, parsers
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
import json

from .models import UserProfile, Location, UserPreference
from .serializers import UserProfileSerializer, LocationSerializer, UserPreferenceSerializer, PublicUserProfileSerializer
import logging

# Настраиваем логгер
logger = logging.getLogger(__name__)


class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    # Отключаем пагинацию
    pagination_class = None

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    def get_object(self):
        """
        Возвращает профиль текущего пользователя. 
        Создает его, если не существует.
        """
        try:
            profile = UserProfile.objects.get(user=self.request.user)
        except UserProfile.DoesNotExist:
            # Если профиль не существует, создаем его
            profile = UserProfile.objects.create(user=self.request.user)
            logger.info(f"Создан профиль для пользователя {self.request.user.username} (id={self.request.user.id})")
        return profile
    
    @action(detail=False, methods=['GET'])
    def me(self, request):
        """
        Возвращает профиль текущего пользователя
        """
        logger.info(f"Запрос /me от пользователя: {request.user}")
        try:
            # Получаем или создаем профиль пользователя
            profile = self.get_object()
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Ошибка при запросе /me: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['GET'], url_path='public/(?P<user_id>[^/.]+)')
    def public_profile(self, request, user_id=None):
        """
        Возвращает публичную информацию о профиле пользователя по его ID
        Доступно для всех аутентифицированных пользователей
        """
        logger.info(f"Запрос публичного профиля пользователя ID={user_id} от пользователя: {request.user}")
        
        try:
            # Получаем пользователя по ID
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                logger.warning(f"Пользователь с ID={user_id} не найден")
                return Response(
                    {'detail': 'Пользователь не найден'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Проверяем, что пользователь активен и не заблокирован
            if not user.is_active or getattr(user, 'is_banned', False):
                logger.warning(f"Попытка получить профиль неактивного/заблокированного пользователя ID={user_id}")
                return Response(
                    {'detail': 'Профиль пользователя недоступен'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Получаем или создаем профиль пользователя
            try:
                profile = UserProfile.objects.get(user=user)
            except UserProfile.DoesNotExist:
                # Если профиль не существует, создаем его с базовыми данными
                profile = UserProfile.objects.create(user=user)
                logger.info(f"Создан профиль для пользователя {user.username} (id={user.id}) при запросе публичного профиля")
            
            # Используем специальный сериализатор для публичных данных
            serializer = PublicUserProfileSerializer(profile)
            logger.info(f"Возвращен публичный профиль пользователя {user.username} (ID={user_id})")
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Ошибка при запросе публичного профиля пользователя ID={user_id}: {str(e)}")
            return Response(
                {"error": "Внутренняя ошибка сервера"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_update(self, serializer):
        instance = serializer.save()
        logger.info(f"Обновлен профиль пользователя: id={instance.id}, user={self.request.user.username}")

    @action(detail=False, methods=['POST'], parser_classes=[parsers.MultiPartParser, parsers.FormParser])
    def avatar(self, request):
        """
        Специальный эндпоинт для обновления только аватара профиля
        """
        profile = self.get_object()
        
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'Необходимо предоставить файл аватара'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        avatar_file = request.FILES['avatar']
        logger.info(f"Загрузка аватара: {avatar_file.name}, размер: {avatar_file.size}, тип: {getattr(avatar_file, 'content_type', 'неизвестно')}")
        
        serializer = self.get_serializer(profile, data={'avatar': avatar_file}, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LocationViewSet(viewsets.ModelViewSet):
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    # Отключаем пагинацию для этого представления
    pagination_class = None

    def get_queryset(self):
        return Location.objects.filter(user=self.request.user)
    
    def list(self, request, *args, **kwargs):
        """
        Возвращает список всех адресов пользователя без пагинации
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        logger.info(f"Запрос списка адресов от пользователя {request.user.username}, найдено: {queryset.count()}")
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """
        Создает новый адрес
        """
        logger.info(f"Запрос на создание адреса от пользователя {request.user.username}")
        try:
            # Логируем данные запроса
            logger.info(f"Данные запроса: {json.dumps(request.data, ensure_ascii=False, default=str)}")
            
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                self.perform_create(serializer)
                headers = self.get_success_headers(serializer.data)
                logger.info(f"Адрес успешно создан: {serializer.data}")
                return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            else:
                # Логируем ошибки валидации
                logger.warning(f"Ошибка валидации при создании адреса: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Ошибка при создании адреса: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        # Если установлен флаг is_primary, сбрасываем его у всех других адресов
        if serializer.validated_data.get('is_primary', False):
            Location.objects.filter(user=self.request.user, is_primary=True).update(is_primary=False)
        instance = serializer.save(user=self.request.user)
        logger.info(f"Создан адрес: id={instance.id}, title={instance.title}, user={self.request.user.username}")

    def update(self, request, *args, **kwargs):
        """
        Обновляет существующий адрес
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        logger.info(f"Запрос на обновление адреса id={instance.id} от пользователя {request.user.username}")
        try:
            # Логируем данные запроса
            logger.info(f"Данные запроса: {json.dumps(request.data, ensure_ascii=False, default=str)}")
            
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                self.perform_update(serializer)
                logger.info(f"Адрес успешно обновлен: {serializer.data}")
                return Response(serializer.data)
            else:
                # Логируем ошибки валидации
                logger.warning(f"Ошибка валидации при обновлении адреса: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Ошибка при обновлении адреса: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_update(self, serializer):
        # Если установлен флаг is_primary, сбрасываем его у всех других адресов
        if serializer.validated_data.get('is_primary', False):
            Location.objects.filter(user=self.request.user, is_primary=True).exclude(pk=self.get_object().pk).update(is_primary=False)
        instance = serializer.save()
        logger.info(f"Обновлен адрес: id={instance.id}, title={instance.title}, user={self.request.user.username}")

    def destroy(self, request, *args, **kwargs):
        """
        Удаляет адрес
        """
        instance = self.get_object()
        logger.info(f"Запрос на удаление адреса id={instance.id} от пользователя {request.user.username}")
        
        try:
            instance_id = instance.id
            instance_title = instance.title
            self.perform_destroy(instance)
            logger.info(f"Адрес успешно удален: id={instance_id}, title={instance_title}")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Ошибка при удалении адреса: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['GET'])
    def primary(self, request):
        """
        Возвращает основной адрес пользователя
        """
        logger.info(f"Запрос основного адреса от пользователя {request.user.username}")
        try:
            primary_location = self.get_queryset().filter(is_primary=True).first()
            if primary_location:
                serializer = self.get_serializer(primary_location)
                logger.info(f"Основной адрес найден: id={primary_location.id}, title={primary_location.title}")
                return Response(serializer.data)
            else:
                logger.info(f"Основной адрес не найден для пользователя {request.user.username}")
                return Response({'detail': 'Основной адрес не найден'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Ошибка при запросе основного адреса: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['GET'])
    def participant_locations(self, request):
        """
        Получить адреса участников для выбора при создании обмена
        Принимает параметр receiver_id - ID получателя предложения
        """
        receiver_id = request.query_params.get('receiver_id')
        if not receiver_id:
            return Response(
                {'detail': 'Параметр receiver_id обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Получаем адреса инициатора (текущий пользователь)
            initiator_locations = Location.objects.filter(user=request.user)
            
            # Получаем адреса получателя
            receiver_locations = Location.objects.filter(user_id=receiver_id)
            
            data = {
                'initiator_locations': LocationSerializer(initiator_locations, many=True).data,
                'receiver_locations': LocationSerializer(receiver_locations, many=True).data
            }
            
            logger.info(f"Запрос адресов участников: инициатор={request.user.username}({len(data['initiator_locations'])}) получатель=id:{receiver_id}({len(data['receiver_locations'])})")
            return Response(data)
            
        except Exception as e:
            logger.error(f"Ошибка при получении адресов участников: {str(e)}")
            return Response(
                {'detail': f'Ошибка при получении адресов: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = UserPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    # Отключаем пагинацию
    pagination_class = None

    def get_queryset(self):
        return UserPreference.objects.filter(user=self.request.user)

    def get_object(self):
        # Получаем или создаем объект предпочтений для текущего пользователя
        obj, created = UserPreference.objects.get_or_create(user=self.request.user)
        if created:
            logger.info(f"Созданы предпочтения для пользователя: {self.request.user.username}")
        return obj

    def perform_update(self, serializer):
        instance = serializer.save(user=self.request.user)
        logger.info(f"Обновлены предпочтения пользователя: id={instance.id}, user={self.request.user.username}")


# Добавляем простой класс для тестирования
class ProfileTestView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        return Response({
            "message": "Тестовый API работает",
            "user": str(request.user),
            "authenticated": request.user.is_authenticated
        })


@api_view(['GET'])
def debug_me_view(request):
    """
    Простой отладочный вид для проверки маршрутизации
    """
    if request.user.is_authenticated:
        try:
            profile = UserProfile.objects.get(user=request.user)
            return Response({
                "message": "Отладочный вид работает",
                "user": str(request.user),
                "profile_id": profile.id
            })
        except UserProfile.DoesNotExist:
            return Response({
                "message": "Профиль не найден",
                "user": str(request.user)
            })
    else:
        return Response({
            "message": "Пользователь не аутентифицирован"
        }, status=status.HTTP_401_UNAUTHORIZED)
