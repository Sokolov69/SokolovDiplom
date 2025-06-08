from rest_framework import serializers
from .models import UserProfile, Location, UserPreference
from django.contrib.auth import get_user_model
from django.conf import settings
import logging

# Настраиваем логгер
logger = logging.getLogger(__name__)

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'avatar', 'avatar_url', 'bio', 'phone_number', 
                 'rating', 'total_reviews', 'successful_trades', 'created_at', 'updated_at']
        read_only_fields = ['id', 'rating', 'total_reviews', 'successful_trades', 
                          'created_at', 'updated_at']
    
    def get_avatar_url(self, obj):
        """
        Получает прямой URL для аватара пользователя
        """
        if not obj.avatar:
            return None
            
        # Формируем прямой URL для S3 с правильной структурой
        avatar_path = str(obj.avatar)
        
        # Возвращаем URL с правильной структурой
        if settings.USE_S3:
            return f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{settings.MEDIA_LOCATION}/{avatar_path}"
        return f"{settings.MEDIA_URL}{avatar_path}"
    
    def validate_avatar(self, value):
        """
        Валидация изображения аватара
        """
        if value:
            # Проверка размера файла
            if value.size > 5 * 1024 * 1024:  # 5 МБ
                logger.warning(f"Загружено слишком большое изображение аватара: {value.name}, размер {value.size}")
                raise serializers.ValidationError("Размер файла не должен превышать 5 МБ")
            
            # Проверка формата файла
            allowed_formats = ['image/jpeg', 'image/png', 'image/webp']
            if hasattr(value, 'content_type') and value.content_type not in allowed_formats:
                logger.warning(f"Загружен файл неподдерживаемого формата: {value.content_type}")
                raise serializers.ValidationError("Поддерживаемые форматы изображений: JPEG, PNG, WebP")
            
            logger.debug(f"Аватар валидирован: {value.name}, тип {value.content_type}, размер {value.size}")
        
        return value
        
    def update(self, instance, validated_data):
        avatar = validated_data.get('avatar', None)
        old_avatar = instance.avatar
        
        if avatar:
            logger.info(f"Обновление профиля с новым аватаром: {avatar.name}, размер: {avatar.size}, тип: {getattr(avatar, 'content_type', 'неизвестно')}")
            logger.info(f"Предыдущий аватар: {old_avatar.name if old_avatar else 'отсутствует'}")
            
            if settings.USE_S3:
                # Используем S3Storage напрямую для загрузки файла
                from backend.storage_backends import S3Storage
                storage = S3Storage()
                url = storage.upload_file(avatar, folder=f"{settings.MEDIA_LOCATION}/avatars")
                
                if url:
                    logger.info(f"Аватар успешно загружен через S3Storage: {url}")
                    
                    # Удаляем аватар из validated_data, чтобы Django не пыталась дважды его сохранить
                    validated_data.pop('avatar')
                    
                    # Если аватар был успешно загружен, обновляем его имя в базе данных
                    import re
                    filename_match = re.search(r'/([^/]+)$', url)
                    if filename_match:
                        filename = f"avatars/{filename_match.group(1)}"
                        
                        # Обновляем аватар напрямую через SQL
                        from django.db import connection
                        with connection.cursor() as cursor:
                            cursor.execute(
                                "UPDATE user_profiles SET avatar = %s WHERE id = %s",
                                [filename, instance.id]
                            )
                            logger.info(f"Аватар успешно обновлен напрямую в БД: {filename}")
                        
                        # Обновляем объект в памяти
                        instance.refresh_from_db()
                        logger.info(f"Обновленный объект: avatar={instance.avatar}")
        
        # Обновляем остальные поля
        return super().update(instance, validated_data)


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'title', 'address', 'city', 'region', 'postal_code',
                 'country', 'latitude', 'longitude', 'is_primary', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """
        Проверка данных адреса
        """
        logger.info(f"Валидация данных адреса: {data}")
        
        # Проверка обязательных полей
        required_fields = ['title', 'address', 'city']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            msg = f"Обязательные поля отсутствуют: {', '.join(missing_fields)}"
            logger.warning(msg)
            raise serializers.ValidationError(msg)
        
        # Валидация координат
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if latitude is not None and (latitude < -90 or latitude > 90):
            msg = "Широта должна быть в диапазоне от -90 до 90"
            logger.warning(msg)
            raise serializers.ValidationError({"latitude": msg})
            
        if longitude is not None and (longitude < -180 or longitude > 180):
            msg = "Долгота должна быть в диапазоне от -180 до 180"
            logger.warning(msg)
            raise serializers.ValidationError({"longitude": msg})
        
        return data

    def validate_title(self, value):
        """
        Валидация названия адреса
        """
        if value and len(value) < 2:
            logger.warning(f"Слишком короткое название адреса: {value}")
            raise serializers.ValidationError("Название адреса должно содержать не менее 2 символов")
        return value

    def validate_address(self, value):
        """
        Валидация адреса
        """
        if value and len(value) < 5:
            logger.warning(f"Слишком короткий адрес: {value}")
            raise serializers.ValidationError("Адрес должен содержать не менее 5 символов")
        return value

    def create(self, validated_data):
        """
        Создание адреса
        """
        logger.info(f"Создание адреса с данными: {validated_data}")
        # Не добавляем user здесь, так как он будет добавлен в perform_create
        return Location.objects.create(**validated_data)


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = ['id', 'max_distance', 'notification_enabled', 
                 'email_notifications', 'push_notifications', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        user = self.context['request'].user
        return UserPreference.objects.create(user=user, **validated_data)


class PublicUserProfileSerializer(serializers.ModelSerializer):
    """
    Сериализатор для публичного отображения профиля пользователя
    Содержит только публичную информацию без приватных данных
    """
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'first_name', 'last_name', 'full_name',
            'avatar', 'avatar_url', 'bio', 'rating', 'total_reviews', 
            'successful_trades', 'created_at'
        ]
        read_only_fields = ['id', 'username', 'first_name', 'last_name', 
                          'rating', 'total_reviews', 'successful_trades', 'created_at']
    
    def get_avatar_url(self, obj):
        """
        Получает прямой URL для аватара пользователя
        """
        if not obj.avatar:
            return None
            
        # Формируем прямой URL для S3 с правильной структурой
        avatar_path = str(obj.avatar)
        
        # Возвращаем URL с правильной структурой
        if settings.USE_S3:
            return f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{settings.MEDIA_LOCATION}/{avatar_path}"
        return f"{settings.MEDIA_URL}{avatar_path}"
    
    def get_full_name(self, obj):
        """
        Возвращает полное имя пользователя
        """
        first_name = obj.user.first_name or ''
        last_name = obj.user.last_name or ''
        full_name = f"{first_name} {last_name}".strip()
        return full_name if full_name else obj.user.username 