from rest_framework import serializers
from django.db import transaction
from .models import (
    Item, ItemImage, ItemCondition, 
    ItemStatus, ItemTag, ItemTagRelation, Favorite
)
from categories.serializers import CategoryNestedSerializer
from profiles.serializers import LocationSerializer
from django.contrib.auth import get_user_model
import logging
from django.conf import settings
from django.utils.text import slugify

# Настраиваем логгер
logger = logging.getLogger(__name__)

User = get_user_model()

# Словарь транслитерации для русских букв
CYRILLIC_TO_LATIN = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
}

def custom_slugify(text):
    """
    Создает slug из текста с корректной транслитерацией русских букв
    """
    logger.info(f"=== DEBUG: custom_slugify ===")
    logger.info(f"Входной text: '{text}' (тип: {type(text)})")
    
    # Приводим к нижнему регистру
    text = text.lower()
    logger.info(f"После lower(): '{text}'")
    
    # Заменяем русские буквы на латинские
    transliterated = ''.join(CYRILLIC_TO_LATIN.get(char, char) for char in text)
    logger.info(f"После транслитерации: '{transliterated}'")
    
    # Используем стандартную функцию slugify для остальных преобразований
    # (замена пробелов на дефисы, удаление спецсимволов и т.д.)
    result = slugify(transliterated)
    logger.info(f"Финальный slug: '{result}'")
    
    return result


class UserSerializer(serializers.ModelSerializer):
    """
    Сериализатор для отображения информации о пользователе в контексте товаров
    """
    avatar_url = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    successful_trades = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'full_name',
            'avatar_url', 'rating', 'total_reviews', 'successful_trades'
        ]
    
    def get_avatar_url(self, obj):
        """
        Получает URL аватара пользователя из профиля
        """
        try:
            profile = obj.profile
            if profile.avatar:
                avatar_path = str(profile.avatar)
                if settings.USE_S3:
                    return f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{settings.MEDIA_LOCATION}/{avatar_path}"
                return f"{settings.MEDIA_URL}{avatar_path}"
        except:
            pass
        return None
    
    def get_full_name(self, obj):
        """
        Возвращает полное имя пользователя
        """
        first_name = obj.first_name or ''
        last_name = obj.last_name or ''
        full_name = f"{first_name} {last_name}".strip()
        return full_name if full_name else obj.username
    
    def get_rating(self, obj):
        """
        Получает рейтинг пользователя из профиля
        """
        try:
            return float(obj.profile.rating)
        except:
            return 0.0
    
    def get_total_reviews(self, obj):
        """
        Получает количество отзывов пользователя из профиля
        """
        try:
            return obj.profile.total_reviews
        except:
            return 0
    
    def get_successful_trades(self, obj):
        """
        Получает количество успешных обменов пользователя из профиля
        """
        try:
            return obj.profile.successful_trades
        except:
            return 0


class ItemConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemCondition
        fields = ['id', 'name', 'description', 'order']


class ItemStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemStatus
        fields = ['id', 'name', 'description', 'is_active', 'order']


class ItemTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemTag
        fields = ['id', 'name', 'slug']
        read_only_fields = ['slug']
    
    def create(self, validated_data):
        """
        Создание тега с автоматической генерацией slug из имени
        """
        logger.info(f"=== DEBUG: ItemTagSerializer.create ===")
        logger.info(f"validated_data: {validated_data}")
        
        name = validated_data.get('name')
        logger.info(f"Имя тега для создания: '{name}' (тип: {type(name)})")
        
        validated_data['slug'] = custom_slugify(name)
        logger.info(f"Сгенерированный slug: '{validated_data['slug']}'")
        
        return super().create(validated_data)


class ItemImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ItemImage
        fields = ['id', 'image', 'image_url', 'is_primary', 'order', 'created_at']
        read_only_fields = ['created_at']
    
    def get_image_url(self, obj):
        """
        Получает прямой URL для изображения предмета
        """
        if not obj.image:
            return None
            
        # Формируем прямой URL для S3 с правильной структурой
        image_path = str(obj.image)
        
        # Возвращаем URL с правильной структурой, который точно доступен
        return f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{settings.MEDIA_LOCATION}/{image_path}"
    
    def validate_image(self, value):
        """
        Валидация изображения
        """
        logger.info(f"Валидация изображения: value={value}")
        if value is None:
            logger.error("Ошибка: изображение не предоставлено (значение None)")
            raise serializers.ValidationError("Изображение обязательно для загрузки")
            
        if value:
            logger.info(f"Тип файла: {type(value)}")
            logger.info(f"Атрибуты файла: name={getattr(value, 'name', 'нет')}, size={getattr(value, 'size', 'нет')}")
            
            if hasattr(value, 'content_type'):
                logger.info(f"Content-Type: {value.content_type}")
            else:
                logger.warning("У файла отсутствует атрибут content_type")
            
            # Проверка размера файла
            if value.size > 10 * 1024 * 1024:  # 10 МБ
                logger.warning(f"Загружено слишком большое изображение: {value.name}, размер {value.size}")
                raise serializers.ValidationError("Размер файла не должен превышать 10 МБ")
            
            # Проверка формата файла
            allowed_formats = ['image/jpeg', 'image/png', 'image/webp']
            if hasattr(value, 'content_type') and value.content_type not in allowed_formats:
                logger.warning(f"Загружен файл неподдерживаемого формата: {value.content_type}")
                raise serializers.ValidationError("Поддерживаемые форматы изображений: JPEG, PNG, WebP")
            
            logger.debug(f"Изображение валидировано: {value.name}, тип {value.content_type}, размер {value.size}")
        
        return value
    
    def validate(self, attrs):
        """
        Дополнительная валидация полных данных
        """
        logger.info(f"Валидация данных ItemImageSerializer: {attrs}")
        
        # Проверка наличия обязательных полей
        if 'image' not in attrs and self.context['request'].method == 'POST':
            logger.error("Ошибка: поле 'image' отсутствует в данных")
            raise serializers.ValidationError({"image": "Это поле обязательно."})
            
        return attrs


class ItemListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для отображения предметов в списке
    """
    category_details = CategoryNestedSerializer(source='category', read_only=True)
    primary_image = serializers.SerializerMethodField()
    owner_details = UserSerializer(source='owner', read_only=True)
    condition_name = serializers.CharField(source='condition.name', read_only=True)
    status_name = serializers.CharField(source='status.name', read_only=True)
    location_details = LocationSerializer(source='location', read_only=True)
    tags = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = [
            'id', 'title', 'slug', 'description', 'owner', 'owner_details',
            'category', 'category_details', 'condition', 'condition_name',
            'estimated_value', 'status', 'status_name', 'location', 'location_details',
            'primary_image', 'tags', 'created_at', 'updated_at'
        ]
    
    def get_primary_image(self, obj):
        """
        Получает URL первичного изображения предмета
        """
        primary_image = obj.images.filter(is_primary=True).first() or obj.images.first()
        if primary_image:
            # Возвращаем прямой URL с S3
            image_path = str(primary_image.image)
            return f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{settings.MEDIA_LOCATION}/{image_path}"
        return None
        
    def get_tags(self, obj):
        """
        Получает список тегов предмета
        """
        logger.info(f"=== DEBUG: get_tags для предмета id={obj.id}, title='{obj.title}' ===")
        
        # Получаем все связи тегов для этого предмета
        tag_relations = obj.tag_relations.all()
        logger.info(f"Найдено связей с тегами: {tag_relations.count()}")
        
        tags = []
        for relation in tag_relations:
            tag = relation.tag
            logger.info(f"Тег: id={tag.id}, name='{tag.name}', slug='{tag.slug}'")
            tags.append(tag)
        
        # Сериализуем теги
        serialized_tags = ItemTagSerializer(tags, many=True).data
        logger.info(f"Сериализованные теги: {serialized_tags}")
        
        return serialized_tags


class ItemDetailSerializer(serializers.ModelSerializer):
    """
    Сериализатор для детального отображения предмета
    """
    category_details = CategoryNestedSerializer(source='category', read_only=True)
    owner_details = UserSerializer(source='owner', read_only=True)
    condition_details = ItemConditionSerializer(source='condition', read_only=True)
    status_details = ItemStatusSerializer(source='status', read_only=True)
    location_details = LocationSerializer(source='location', read_only=True)
    images = ItemImageSerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = [
            'id', 'title', 'slug', 'description', 'owner', 'owner_details',
            'category', 'category_details', 'condition', 'condition_details',
            'status', 'status_details', 'location', 'location_details', 'estimated_value',
            'views_count', 'favorites_count', 'is_featured', 'images', 
            'tags', 'is_favorited', 'created_at', 'updated_at'
        ]
        read_only_fields = ['views_count', 'favorites_count', 'is_featured', 'created_at', 'updated_at']
        
    def get_tags(self, obj):
        """
        Получает список тегов предмета
        """
        logger.info(f"=== DEBUG: get_tags для предмета id={obj.id}, title='{obj.title}' ===")
        
        # Получаем все связи тегов для этого предмета
        tag_relations = obj.tag_relations.all()
        logger.info(f"Найдено связей с тегами: {tag_relations.count()}")
        
        tags = []
        for relation in tag_relations:
            tag = relation.tag
            logger.info(f"Тег: id={tag.id}, name='{tag.name}', slug='{tag.slug}'")
            tags.append(tag)
        
        # Сериализуем теги
        serialized_tags = ItemTagSerializer(tags, many=True).data
        logger.info(f"Сериализованные теги: {serialized_tags}")
        
        return serialized_tags
    
    def get_is_favorited(self, obj):
        """
        Проверяет, добавлен ли предмет в избранное текущим пользователем
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, item=obj).exists()
        return False


class ItemCreateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания предметов
    """
    images = ItemImageSerializer(many=True, required=False)
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Item
        fields = [
            'id', 'title', 'description', 'category', 'condition', 
            'status', 'location', 'estimated_value', 'images', 'tags'
        ]
        extra_kwargs = {
            'status': {'required': False},
            'location': {'required': False}
        }
    
    def validate_location(self, value):
        """
        Валидация того, что указанный адрес принадлежит текущему пользователю
        """
        if value is not None:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                if value.user != request.user:
                    raise serializers.ValidationError(
                        "Вы можете выбрать только адрес из своего списка адресов"
                    )
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        logger.info(f"=== DEBUG: ItemCreateSerializer.create ===")
        logger.info(f"Входящие validated_data: {validated_data}")
        
        tags_data = validated_data.pop('tags', [])
        images_data = validated_data.pop('images', [])
        
        logger.info(f"Извлеченные tags_data: {tags_data}")
        logger.info(f"Тип tags_data: {type(tags_data)}")
        if tags_data:
            for i, tag in enumerate(tags_data):
                logger.info(f"Тег {i}: '{tag}' (тип: {type(tag)})")
        
        # Установка владельца предмета
        validated_data['owner'] = self.context['request'].user
        
        # Если статус не указан, устанавливаем статус "Доступен"
        if 'status' not in validated_data:
            default_status = ItemStatus.objects.filter(name='Доступен').first()
            if default_status:
                validated_data['status'] = default_status
                logger.info(f"Автоматически установлен статус 'Доступен' для нового предмета")
            else:
                logger.warning("Не найден статус 'Доступен'. Проверьте миграцию данных.")
        
        # Создание предмета
        item = Item.objects.create(**validated_data)
        logger.info(f"Создан предмет: id={item.id}, title={item.title}, owner={validated_data['owner'].username}")
        
        # Обработка тегов
        for tag_data in tags_data:
            logger.info(f"=== DEBUG: Обработка тега '{tag_data}' ===")
            
            # Проверяем, является ли tag_data числом (ID существующего тега)
            if tag_data.isdigit():
                # Это ID существующего тега
                tag_id = int(tag_data)
                logger.info(f"Обнаружен ID тега: {tag_id}")
                
                try:
                    tag = ItemTag.objects.get(id=tag_id)
                    logger.info(f"Найден существующий тег по ID: id={tag.id}, name='{tag.name}', slug='{tag.slug}'")
                except ItemTag.DoesNotExist:
                    logger.warning(f"Тег с ID {tag_id} не найден, пропускаем")
                    continue
            else:
                # Это название тега (новый или существующий)
                tag_name = tag_data
                tag_slug = custom_slugify(tag_name)
                logger.info(f"Обработка тега по названию: {tag_name}, slug: {tag_slug}")
                
                # Проверяем, существует ли уже такой тег
                existing_tag = ItemTag.objects.filter(name=tag_name).first()
                if existing_tag:
                    logger.info(f"Найден существующий тег: id={existing_tag.id}, name='{existing_tag.name}', slug='{existing_tag.slug}'")
                    tag = existing_tag
                else:
                    tag, created = ItemTag.objects.get_or_create(
                        name=tag_name,
                        defaults={'slug': tag_slug}
                    )
                    if created:
                        logger.info(f"Создан новый тег: id={tag.id}, name='{tag.name}', slug='{tag.slug}'")
                    else:
                        logger.info(f"Получен существующий тег: id={tag.id}, name='{tag.name}', slug='{tag.slug}'")
            
            # Создаем связь между предметом и тегом
            relation = ItemTagRelation.objects.create(item=item, tag=tag)
            logger.info(f"Создана связь: item_id={item.id}, tag_id={tag.id}, relation_id={relation.id}")
        
        # Обработка изображений
        for i, image_data in enumerate(images_data):
            # Проверка, является ли изображение первым (и, следовательно, основным)
            is_primary = i == 0 or image_data.get('is_primary', False)
            
            # Если используем S3 напрямую и есть правильные настройки
            image_file = image_data.get('image')
            if image_file and hasattr(settings, 'USE_S3') and settings.USE_S3:
                from backend.storage_backends import S3Storage
                storage = S3Storage()
                
                logger.info(f"Загрузка изображения через S3Storage для предмета: {item.title}")
                url = storage.upload_file(image_file, folder=settings.MEDIA_LOCATION)
                
                if url:
                    logger.info(f"Изображение успешно загружено через S3Storage: {url}")
                    
                    # Создаем объект с минимальными данными
                    image_obj = ItemImage.objects.create(
                        item=item,
                        is_primary=is_primary,
                        order=i
                    )
                    
                    # Обновляем имя файла напрямую в БД
                    import re
                    filename_match = re.search(r'/([^/]+)$', url)
                    if filename_match:
                        filename = filename_match.group(1)
                        from django.db import connection
                        with connection.cursor() as cursor:
                            cursor.execute(
                                "UPDATE item_images SET image = %s WHERE id = %s",
                                [filename, image_obj.id]
                            )
                        logger.info(f"Изображение обновлено в БД: {filename}")
                        
                        # Обновляем объект в памяти
                        image_obj.refresh_from_db()
                else:
                    logger.warning(f"Не удалось загрузить изображение через S3Storage")
            else:
                # Стандартный способ создания
                image_data['is_primary'] = is_primary
                image_data['order'] = i
                ItemImage.objects.create(item=item, **image_data)
                logger.info(f"Создано изображение для предмета (стандартным способом): {item.title}")
        
        return item


class ItemUpdateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для обновления предметов
    """
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Item
        fields = [
            'title', 'description', 'category', 'condition', 
            'status', 'location', 'estimated_value', 'tags'
        ]
    
    def validate_location(self, value):
        """
        Валидация того, что указанный адрес принадлежит текущему пользователю
        """
        if value is not None:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                if value.user != request.user:
                    raise serializers.ValidationError(
                        "Вы можете выбрать только адрес из своего списка адресов"
                    )
        return value
    
    @transaction.atomic
    def update(self, instance, validated_data):
        logger.info(f"=== DEBUG: ItemUpdateSerializer.update ===")
        logger.info(f"Входящие validated_data: {validated_data}")
        
        tags_data = validated_data.pop('tags', None)
        
        logger.info(f"Извлеченные tags_data: {tags_data}")
        logger.info(f"Тип tags_data: {type(tags_data)}")
        if tags_data:
            for i, tag in enumerate(tags_data):
                logger.info(f"Тег {i}: '{tag}' (тип: {type(tag)})")
        
        # Обновляем поля предмета
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        logger.info(f"Обновлен предмет: id={instance.id}, title={instance.title}, owner={instance.owner.username}")
        
        # Если переданы теги, обновляем их
        if tags_data is not None:
            # Получаем текущие теги предмета для логирования изменений
            old_tags = [relation.tag.name for relation in instance.tag_relations.all()]
            logger.info(f"Старые теги предмета: {', '.join(old_tags) if old_tags else 'нет'}")
            logger.info(f"Новые теги предмета: {', '.join(tags_data) if tags_data else 'нет'}")
            
            # Удаляем существующие связи с тегами
            instance.tag_relations.all().delete()
            
            # Создаем новые связи с тегами
            for tag_data in tags_data:
                logger.info(f"=== DEBUG: Обновление тега '{tag_data}' ===")
                
                # Проверяем, является ли tag_data числом (ID существующего тега)
                if tag_data.isdigit():
                    # Это ID существующего тега
                    tag_id = int(tag_data)
                    logger.info(f"Обнаружен ID тега при обновлении: {tag_id}")
                    
                    try:
                        tag = ItemTag.objects.get(id=tag_id)
                        logger.info(f"Найден существующий тег по ID при обновлении: id={tag.id}, name='{tag.name}', slug='{tag.slug}'")
                    except ItemTag.DoesNotExist:
                        logger.warning(f"Тег с ID {tag_id} не найден при обновлении, пропускаем")
                        continue
                else:
                    # Это название тега (новый или существующий)
                    tag_name = tag_data
                    tag_slug = custom_slugify(tag_name)
                    logger.info(f"Обработка тега при обновлении по названию: {tag_name}, slug: {tag_slug}")
                    
                    # Проверяем, существует ли уже такой тег
                    existing_tag = ItemTag.objects.filter(name=tag_name).first()
                    if existing_tag:
                        logger.info(f"Найден существующий тег при обновлении: id={existing_tag.id}, name='{existing_tag.name}', slug='{existing_tag.slug}'")
                        tag = existing_tag
                    else:
                        tag, created = ItemTag.objects.get_or_create(
                            name=tag_name,
                            defaults={'slug': tag_slug}
                        )
                        if created:
                            logger.info(f"Создан новый тег при обновлении: id={tag.id}, name='{tag.name}', slug='{tag.slug}'")
                        else:
                            logger.info(f"Получен существующий тег при обновлении: id={tag.id}, name='{tag.name}', slug='{tag.slug}'")
                
                # Создаем связь между предметом и тегом
                relation = ItemTagRelation.objects.create(item=instance, tag=tag)
                logger.info(f"Создана связь при обновлении: item_id={instance.id}, tag_id={tag.id}, relation_id={relation.id}")
            
            # Удаляем теги, которые больше не используются
            orphaned_tags = ItemTag.objects.filter(item_relations__isnull=True)
            if orphaned_tags.exists():
                count = orphaned_tags.count()
                orphaned_tags.delete()
                logger.info(f"Удалено {count} неиспользуемых тегов")
        
        return instance


class FavoriteSerializer(serializers.ModelSerializer):
    """
    Сериализатор для избранного
    """
    item_details = ItemListSerializer(source='item', read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'item', 'item_details', 'created_at']
        read_only_fields = ['user', 'created_at']
        extra_kwargs = {'item': {'write_only': True}}
        
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data) 