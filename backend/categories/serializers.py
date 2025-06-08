from rest_framework import serializers
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from .models import Category
import logging

# Настраиваем логгер
logger = logging.getLogger(__name__)


class BaseCategorySerializer(serializers.ModelSerializer):
    """Базовый сериализатор для категорий"""
    
    def validate_icon(self, value):
        """Базовая валидация изображения"""
        if not value:
            return value
            
        # Проверка размера файла (10 МБ)
        max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 10 * 1024 * 1024)
        if value.size > max_size:
            logger.warning(f"Файл слишком большой: {value.name}, размер {value.size}")
            raise serializers.ValidationError(
                f"Размер файла не должен превышать {max_size // (1024 * 1024)} МБ"
            )
        
        # Проверка формата файла
        allowed_formats = getattr(settings, 'ALLOWED_IMAGE_FORMATS', ['jpeg', 'jpg', 'png', 'webp'])
        content_type_map = {
            'jpeg': 'image/jpeg',
            'jpg': 'image/jpeg', 
            'png': 'image/png',
            'webp': 'image/webp'
        }
        
        allowed_content_types = [content_type_map.get(fmt, f'image/{fmt}') for fmt in allowed_formats]
        
        if hasattr(value, 'content_type') and value.content_type not in allowed_content_types:
            logger.warning(f"Неподдерживаемый формат файла: {value.content_type}")
            raise serializers.ValidationError(
                f"Поддерживаемые форматы изображений: {', '.join(allowed_formats).upper()}"
            )
        
        logger.debug(f"Изображение валидировано: {value.name}, тип {getattr(value, 'content_type', 'неизвестно')}, размер {value.size}")
        return value

    def validate_parent(self, value):
        """Валидация родительской категории"""
        if not value:
            return value
            
        # Проверка на циклические зависимости
        if self.instance:
            if value == self.instance:
                raise serializers.ValidationError("Категория не может быть родителем самой себя")
            
            if not self.instance.can_be_parent_of(value):
                logger.warning(f"Попытка создания циклической зависимости: категория {self.instance.id} -> {value.id}")
                raise serializers.ValidationError("Категория не может быть родителем своего предка")
        
        # Проверка максимального уровня вложенности
        max_level = 5
        if value.level >= max_level:
            raise serializers.ValidationError(f"Превышен максимальный уровень вложенности ({max_level})")
                
        return value


class CategoryNestedSerializer(BaseCategorySerializer):
    """Сериализатор для отображения вложенной категории"""
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'is_active']


class CategoryListSerializer(BaseCategorySerializer):
    """Сериализатор для отображения краткой информации о категории"""
    icon_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'icon_url', 'level', 'parent', 'is_active']
        
    def get_icon_url(self, obj):
        """Получает URL иконки категории"""
        return self._get_icon_url(obj)
    
    def _get_icon_url(self, obj):
        """Внутренний метод для получения URL иконки"""
        if not obj.icon:
            return None
            
        try:
            if settings.USE_S3:
                # Формируем прямой URL для S3
                icon_path = str(obj.icon)
                return f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{settings.MEDIA_LOCATION}/{icon_path}"
            else:
                # Локальный URL
                return obj.icon.url if hasattr(obj.icon, 'url') else None
        except Exception as e:
            logger.error(f"Ошибка при получении URL иконки для категории {obj.id}: {e}")
            return None
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        logger.debug(f"Сериализация CategoryList: id={instance.id}, name={instance.name}")
        return data


class CategorySerializer(BaseCategorySerializer):
    """Полный сериализатор категории с вложенными категориями"""
    children = CategoryNestedSerializer(many=True, read_only=True)
    parent_details = CategoryNestedSerializer(source='parent', read_only=True)
    icon_url = serializers.SerializerMethodField()
    full_path = serializers.ReadOnlyField()
    children_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'parent', 'parent_details',
            'icon', 'icon_url', 'is_active', 'level', 'order', 'children', 
            'full_path', 'children_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['level', 'created_at', 'updated_at', 'full_path', 'children_count']
    
    def get_icon_url(self, obj):
        """Получает URL иконки категории"""
        return CategoryListSerializer()._get_icon_url(obj)
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        logger.debug(f"Сериализация CategorySerializer: id={instance.id}, name={instance.name}, children={len(instance.children.all())}")
        return data


class CategoryCreateSerializer(BaseCategorySerializer):
    """Сериализатор для создания категории"""
    
    class Meta:
        model = Category
        fields = ['name', 'slug', 'description', 'parent', 'icon', 'is_active', 'order']
        extra_kwargs = {
            'icon': {'required': False},
            'slug': {'required': False}
        }
    
    def validate_slug(self, value):
        """Проверка уникальности slug"""
        if value and Category.objects.filter(slug=value).exists():
            logger.warning(f"Попытка создания категории с дублирующимся slug: {value}")
            raise serializers.ValidationError("Категория с таким slug уже существует")
        return value
    
    def create(self, validated_data):
        """Создание категории с улучшенным логированием"""
        icon = validated_data.get('icon')
        category_name = validated_data.get('name')
        
        if icon:
            logger.info(f"Создание категории '{category_name}' с иконкой: {icon.name}, размер: {icon.size}")
        else:
            logger.info(f"Создание категории '{category_name}' без иконки")
        
        try:
            instance = super().create(validated_data)
            logger.info(f"Категория успешно создана: id={instance.id}, name={instance.name}")
            
            if instance.icon:
                logger.info(f"Иконка сохранена: {instance.icon.name}")
                
            return instance
        except Exception as e:
            logger.error(f"Ошибка при создании категории '{category_name}': {e}")
            raise


class CategoryUpdateSerializer(BaseCategorySerializer):
    """Сериализатор для обновления категории"""
    
    class Meta:
        model = Category
        fields = ['name', 'slug', 'description', 'parent', 'icon', 'is_active', 'order']
        extra_kwargs = {
            'icon': {'required': False},
            'name': {'required': False},
            'slug': {'required': False}
        }
    
    def validate_slug(self, value):
        """Проверка уникальности slug при обновлении"""
        if not value:
            return value
            
        # Исключаем текущий экземпляр из проверки
        queryset = Category.objects.filter(slug=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
            
        if queryset.exists():
            logger.warning(f"Попытка обновления категории с дублирующимся slug: {value}")
            raise serializers.ValidationError("Категория с таким slug уже существует")
        return value
    
    def update(self, instance, validated_data):
        """Обновление категории с улучшенной обработкой файлов"""
        icon = validated_data.get('icon')
        old_icon = instance.icon
        
        logger.info(f"Обновление категории: id={instance.id}, name={instance.name}")
        
        if icon:
            logger.info(f"Обновление с новой иконкой: {icon.name}, размер: {icon.size}")
            if old_icon:
                logger.info(f"Заменяется иконка: {old_icon.name}")
        
        try:
            # Стандартное обновление через Django ORM
            updated_instance = super().update(instance, validated_data)
            
            if icon:
                logger.info(f"Иконка успешно обновлена: {updated_instance.icon.name}")
            
            logger.info(f"Категория успешно обновлена: id={updated_instance.id}")
            return updated_instance
            
        except Exception as e:
            logger.error(f"Ошибка при обновлении категории {instance.id}: {e}")
            raise 