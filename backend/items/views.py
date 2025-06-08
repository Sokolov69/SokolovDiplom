from rest_framework import viewsets, filters, status, permissions, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F
import logging
from django.conf import settings

from .models import (
    Item, ItemImage, ItemCondition, 
    ItemStatus, ItemTag, Favorite
)
from .serializers import (
    ItemListSerializer, ItemDetailSerializer, ItemCreateSerializer, 
    ItemUpdateSerializer, ItemConditionSerializer, ItemStatusSerializer,
    ItemTagSerializer, ItemImageSerializer, FavoriteSerializer
)
from .permissions import IsOwnerOrReadOnly, IsOwner
from .filters import ItemFilter

# Настраиваем логгер
logger = logging.getLogger(__name__)

# Create your views here.

class ItemConditionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для состояний предметов (только чтение)
    """
    queryset = ItemCondition.objects.all().order_by('order', 'name')
    serializer_class = ItemConditionSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class ItemStatusViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для статусов предметов (только чтение)
    """
    queryset = ItemStatus.objects.filter(is_active=True).order_by('order', 'name')
    serializer_class = ItemStatusSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class ItemTagViewSet(viewsets.ModelViewSet):
    """
    ViewSet для тегов предметов.
    Позволяет создавать и получать теги.
    """
    queryset = ItemTag.objects.all()
    serializer_class = ItemTagSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    pagination_class = None
    
    def create(self, request, *args, **kwargs):
        """
        Создание нового тега.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        logger.info(f"Создан новый тег: {serializer.data['name']} (id: {serializer.data['id']})")
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet для предметов.
    """
    queryset = Item.objects.filter(is_deleted=False).select_related('owner', 'owner__profile', 'category', 'condition', 'status')
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ItemFilter
    search_fields = ['title', 'description', 'tag_relations__tag__name']
    ordering_fields = ['created_at', 'updated_at', 'views_count', 'favorites_count']
    ordering = ['-created_at']
    parser_classes = [MultiPartParser, FormParser, parsers.JSONParser]
    
    def get_queryset(self):
        """
        Переопределяем get_queryset для логирования
        """
        queryset = super().get_queryset()
        logger.info(f"=== GET QUERYSET ===")
        logger.info(f"Base queryset count: {queryset.count()}")
        logger.info(f"Action: {self.action}")
        logger.info(f"User: {self.request.user.username if hasattr(self, 'request') else 'No request'}")
        
        # Логируем первые несколько товаров из базового queryset
        for item in queryset[:5]:
            logger.info(f"Base item: ID={item.id}, title='{item.title}', owner='{item.owner.username}', is_deleted={item.is_deleted}")
        
        return queryset
    
    def get_permissions(self):
        """
        Переопределяем права доступа для разных действий
        """
        if self.action == 'favorite':
            # Для добавления в избранное нужна только аутентификация
            permission_classes = [permissions.IsAuthenticated]
        else:
            # Для остальных действий используем стандартные права
            permission_classes = self.permission_classes
        
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ItemListSerializer
        elif self.action == 'create':
            return ItemCreateSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return ItemUpdateSerializer
        return ItemDetailSerializer
    
    def filter_queryset(self, queryset):
        """
        Переопределяем метод, чтобы передать запрос в фильтр
        """
        logger.info(f"=== FILTER QUERYSET ===")
        logger.info(f"Initial queryset count: {queryset.count()}")
        logger.info(f"Filter params: {dict(self.request.GET)}")
        
        filterset = self.filterset_class(
            self.request.GET,
            queryset=queryset,
            request=self.request  # Передаем request в фильтр
        )
        
        # Проверяем, валиден ли фильтр
        if not filterset.is_valid():
            logger.warning(f"Невалидные параметры фильтра: {filterset.errors}")
        
        queryset = filterset.qs
        logger.info(f"Queryset count after DjangoFilterBackend: {queryset.count()}")
        
        # Применяем остальные бэкенды фильтрации
        for backend in list(self.filter_backends):
            if not isinstance(backend(), DjangoFilterBackend):  # Пропускаем DjangoFilterBackend, так как уже использовали его
                backend_name = backend.__name__
                queryset_before = queryset.count()
                queryset = backend().filter_queryset(self.request, queryset, self)
                queryset_after = queryset.count()
                logger.info(f"After {backend_name}: {queryset_before} -> {queryset_after} items")
        
        logger.info(f"Final queryset count: {queryset.count()}")
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Увеличиваем счетчик просмотров только если запрос от другого пользователя
        if instance.owner != request.user:
            instance.views_count = F('views_count') + 1
            instance.save(update_fields=['views_count'])
            instance.refresh_from_db()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def list(self, request, *args, **kwargs):
        """
        Получить список предметов с фильтрацией и поиском.
        
        Поддерживаемые фильтры:
        - title: фильтр по названию (напр. ?title=книга)
        - category: фильтр по ID категории (напр. ?category=1)
        - category_ancestors: фильтр по категории и всем её подкатегориям (напр. ?category_ancestors=1)
        - condition: фильтр по ID состояния (напр. ?condition=1)
        - status: фильтр по ID статуса (напр. ?status=1)
        - owner: фильтр по ID владельца (напр. ?owner=1)
        - min_value, max_value: фильтры по диапазону стоимости (напр. ?min_value=100&max_value=1000)
        - tags: фильтр по тегам через запятую (напр. ?tags=книги,электроника)
        - is_favorite: фильтр по избранному (true/false) (напр. ?is_favorite=true)
        
        Поиск:
        - search: поиск по названию, описанию и тегам (напр. ?search=книга)
        
        Сортировка:
        - ordering: сортировка по полям (created_at, updated_at, views_count, favorites_count)
          (напр. ?ordering=-created_at для сортировки по убыванию даты создания)
        """
        # Логируем параметры запроса
        logger.info(f"=== ITEMS LIST REQUEST ===")
        logger.info(f"User: {request.user.username} (ID: {request.user.id})")
        logger.info(f"Query params: {dict(request.GET)}")
        
        # Получаем базовый queryset
        queryset = self.filter_queryset(self.get_queryset())
        
        # Логируем информацию о queryset до пагинации
        logger.info(f"Queryset count after filtering: {queryset.count()}")
        
        # Логируем детали каждого товара
        for item in queryset[:10]:  # Логируем первые 10 товаров
            logger.info(f"Item: ID={item.id}, title='{item.title}', owner_id={item.owner_id}, owner='{item.owner.username}', is_deleted={item.is_deleted}")
        
        if queryset.count() > 10:
            logger.info(f"... и еще {queryset.count() - 10} товаров")
        
        # Если фильтруем по владельцу, добавляем дополнительную информацию
        owner_filter = request.GET.get('owner')
        if owner_filter:
            logger.info(f"Фильтр по владельцу: {owner_filter}")
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                owner_user = User.objects.get(id=owner_filter)
                logger.info(f"Владелец: {owner_user.username} (ID: {owner_user.id})")
                
                # Проверяем все товары этого владельца в БД
                all_owner_items = Item.objects.filter(owner_id=owner_filter)
                logger.info(f"Всего товаров у владельца в БД: {all_owner_items.count()}")
                
                # Проверяем товары без учета is_deleted
                all_owner_items_with_deleted = Item.objects.filter(owner_id=owner_filter, is_deleted=False)
                logger.info(f"Товаров у владельца (не удаленных): {all_owner_items_with_deleted.count()}")
                
                # Логируем все товары владельца
                for item in all_owner_items_with_deleted:
                    logger.info(f"Owner's item: ID={item.id}, title='{item.title}', is_deleted={item.is_deleted}, created_at={item.created_at}")
                    
            except Exception as e:
                logger.error(f"Ошибка при получении информации о владельце: {e}")
        
        # Выполняем стандартную логику list
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            logger.info(f"Возвращаем пагинированный результат: {len(page)} товаров на странице")
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        logger.info(f"Возвращаем все товары без пагинации: {len(serializer.data)} товаров")
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def favorite(self, request, pk=None):
        """
        Добавить/удалить предмет из избранного
        """
        item = self.get_object()
        user = request.user
        
        # Проверяем, что пользователь не пытается добавить свой товар в избранное
        if item.owner == user:
            logger.warning(f"Попытка добавить собственный товар в избранное: item_id={item.id}, user={user.username}")
            return Response(
                {'detail': 'Нельзя добавить собственный товар в избранное.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        favorite, created = Favorite.objects.get_or_create(user=user, item=item)
        
        if created:
            # Увеличиваем счетчик избранного
            item.favorites_count = F('favorites_count') + 1
            item.save(update_fields=['favorites_count'])
            item.refresh_from_db()
            logger.info(f"Предмет добавлен в избранное: item_id={item.id}, user={user.username}")
            return Response({'status': 'added to favorites'}, status=status.HTTP_201_CREATED)
        else:
            # Удаляем из избранного и уменьшаем счетчик
            favorite.delete()
            item.favorites_count = F('favorites_count') - 1
            item.save(update_fields=['favorites_count'])
            item.refresh_from_db()
            logger.info(f"Предмет удален из избранного: item_id={item.id}, user={user.username}")
            return Response({'status': 'removed from favorites'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def images(self, request, pk=None):
        """
        Получить список изображений для конкретного предмета
        """
        item = self.get_object()
        images = ItemImage.objects.filter(item=item).order_by('order')
        serializer = ItemImageSerializer(images, many=True, context={'request': request})
        logger.info(f"Запрошены изображения для предмета: item_id={item.id}, количество={images.count()}")
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def upload_image(self, request, pk=None):
        """
        Загрузить новое изображение для предмета
        """
        item = self.get_object()
        
        logger.info(f"Попытка загрузки изображения: item_id={pk}, user={request.user.username}")
        logger.info(f"Заголовки запроса: {request.headers}")
        logger.info(f"Метод запроса: {request.method}")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"FILES в запросе: {request.FILES}")
        logger.info(f"POST данные: {request.POST}")
        
        if item.owner != request.user:
            logger.warning(f"Попытка загрузить изображение для чужого предмета: item_id={item.id}, user={request.user.username}")
            return Response(
                {'detail': 'У вас нет прав для загрузки изображений к этому предмету.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Получаем файл изображения
        image_file = request.FILES.get('image')
        if not image_file:
            logger.error(f"Ошибка: файл изображения не найден в запросе. FILES={request.FILES}")
            return Response(
                {'detail': 'Не предоставлено изображение для загрузки.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Загрузка изображения для предмета: item_id={item.id}, filename={image_file.name}, size={image_file.size}, content_type={getattr(image_file, 'content_type', 'неизвестно')}")
        
        # Проверяем, использовать ли S3Storage напрямую
        if hasattr(settings, 'USE_S3') and settings.USE_S3:
            from backend.storage_backends import S3Storage
            storage = S3Storage()
            
            logger.info(f"Используем S3Storage для загрузки изображения. USE_S3={settings.USE_S3}")
            try:
                url = storage.upload_file(image_file, folder=settings.MEDIA_LOCATION)
                logger.info(f"Результат загрузки в S3: {url}")
            except Exception as e:
                logger.exception(f"Ошибка при загрузке в S3: {str(e)}")
                return Response(
                    {'detail': f'Ошибка при загрузке изображения: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            if url:
                logger.info(f"Изображение успешно загружено через S3Storage: {url}")
                
                # Определяем, должно ли быть изображение основным
                is_primary = not ItemImage.objects.filter(item=item).exists()
                
                # Получаем следующее значение order
                next_order = ItemImage.objects.filter(item=item).count()
                
                # Создаем объект с минимальными данными
                image_obj = ItemImage.objects.create(
                    item=item,
                    is_primary=is_primary,
                    order=next_order
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
                    
                    # Возвращаем данные созданного изображения
                    serializer = ItemImageSerializer(image_obj, context={'request': request})
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"Не удалось загрузить изображение через S3Storage")
                return Response(
                    {'detail': 'Ошибка при загрузке изображения.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Стандартное сохранение, если не используем S3 напрямую
        serializer = ItemImageSerializer(data={
            'image': image_file,
            'is_primary': not ItemImage.objects.filter(item=item).exists(),
            'order': ItemImage.objects.filter(item=item).count()
        })
        
        if serializer.is_valid():
            serializer.save(item=item)
            logger.info(f"Изображение успешно загружено стандартным способом: item_id={item.id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Ошибка валидации при загрузке изображения: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def delete_image(self, request, pk=None):
        """
        Удалить изображение предмета
        """
        item = self.get_object()
        if item.owner != request.user:
            logger.warning(f"Попытка удалить изображение чужого предмета: item_id={item.id}, user={request.user.username}")
            return Response(
                {'detail': 'У вас нет прав для удаления изображений этого предмета.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        image_id = request.query_params.get('image_id')
        if not image_id:
            return Response(
                {'detail': 'Не указан ID изображения для удаления.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            image = ItemImage.objects.get(id=image_id, item=item)
            was_primary = image.is_primary
            logger.info(f"Удаление изображения: image_id={image_id}, item_id={item.id}, is_primary={was_primary}")
            
            # Если удаляем основное изображение, нужно назначить новое основное
            if was_primary:
                # Находим другое изображение для этого предмета
                next_primary = ItemImage.objects.filter(item=item).exclude(id=image_id).first()
                if next_primary:
                    next_primary.is_primary = True
                    next_primary.save(update_fields=['is_primary'])
                    logger.info(f"Назначено новое основное изображение: image_id={next_primary.id}")
            
            # Удаляем изображение
            image.delete()
            
            # Обновляем порядок оставшихся изображений
            remaining_images = ItemImage.objects.filter(item=item).order_by('order')
            for i, img in enumerate(remaining_images):
                if img.order != i:
                    img.order = i
                    img.save(update_fields=['order'])
            
            logger.info(f"Изображение успешно удалено и порядок обновлен")
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except ItemImage.DoesNotExist:
            logger.warning(f"Попытка удалить несуществующее изображение: image_id={image_id}, item_id={item.id}")
            return Response(
                {'detail': 'Изображение не найдено.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def favorites(self, request):
        """
        Получить список избранных предметов пользователя
        """
        favorites = Favorite.objects.filter(user=request.user).select_related('item')
        items = [favorite.item for favorite in favorites]
        
        page = self.paginate_queryset(items)
        if page is not None:
            serializer = ItemListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ItemListSerializer(items, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my(self, request):
        """
        Получить список предметов текущего пользователя
        """
        items = Item.objects.filter(owner=request.user, is_deleted=False)
        
        # Применяем фильтры, если есть
        items = self.filter_queryset(items)
        
        page = self.paginate_queryset(items)
        if page is not None:
            serializer = ItemListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ItemListSerializer(items, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'])
    def soft_delete(self, request, pk=None):
        """
        Мягкое удаление предмета
        """
        item = self.get_object()
        if item.owner != request.user:
            return Response({'detail': 'У вас нет прав для удаления этого предмета.'}, status=status.HTTP_403_FORBIDDEN)
        
        item.is_deleted = True
        item.save(update_fields=['is_deleted'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    def create(self, request, *args, **kwargs):
        """
        Создание нового предмета с логированием входящих данных
        """
        logger.info(f"=== DEBUG: ItemViewSet.create ===")
        logger.info(f"request.data: {request.data}")
        logger.info(f"request.POST: {request.POST}")
        logger.info(f"request.FILES: {request.FILES}")
        
        # Проверяем теги отдельно
        tags = request.data.get('tags', [])
        logger.info(f"Теги из request.data: {tags} (тип: {type(tags)})")
        if isinstance(tags, list):
            for i, tag in enumerate(tags):
                logger.info(f"Тег {i}: '{tag}' (тип: {type(tag)})")
        
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """
        Обновление предмета с логированием входящих данных
        """
        logger.info(f"=== DEBUG: ItemViewSet.update ===")
        logger.info(f"request.data: {request.data}")
        logger.info(f"request.POST: {request.POST}")
        
        # Проверяем теги отдельно
        tags = request.data.get('tags', [])
        logger.info(f"Теги из request.data: {tags} (тип: {type(tags)})")
        if isinstance(tags, list):
            for i, tag in enumerate(tags):
                logger.info(f"Тег {i}: '{tag}' (тип: {type(tag)})")
        
        return super().update(request, *args, **kwargs)


class ItemImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet для изображений предметов
    """
    queryset = ItemImage.objects.all()
    serializer_class = ItemImageSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        if self.action == 'list':
            item_id = self.request.query_params.get('item')
            if item_id:
                return ItemImage.objects.filter(item_id=item_id).order_by('order')
        return super().get_queryset()
    
    def perform_create(self, serializer):
        item_id = self.request.data.get('item')
        logger.info(f"Создание изображения через ItemImageViewSet: item_id={item_id}")
        logger.info(f"Данные запроса: {self.request.data}")
        logger.info(f"FILES в запросе: {self.request.FILES}")
        
        try:
            item = Item.objects.get(id=item_id, owner=self.request.user)
            logger.info(f"Загрузка изображения для предмета: id={item.id}, title={item.title}")
            
            image = self.request.data.get('image')
            if image:
                logger.info(f"Полученное изображение: имя={image.name}, размер={image.size}, тип={getattr(image, 'content_type', 'неизвестно')}")
                
                # Проверяем, использовать ли S3Storage напрямую
                if hasattr(settings, 'USE_S3') and settings.USE_S3:
                    from backend.storage_backends import S3Storage
                    storage = S3Storage()
                    
                    logger.info(f"Используем S3Storage для загрузки изображения в ItemImageViewSet. USE_S3={settings.USE_S3}")
                    try:
                        url = storage.upload_file(image, folder=settings.MEDIA_LOCATION)
                        logger.info(f"Результат загрузки в S3: {url}")
                    except Exception as e:
                        logger.exception(f"Ошибка при загрузке в S3: {str(e)}")
                        return Response(
                            {'detail': f'Ошибка при загрузке изображения: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                    
                    if url:
                        logger.info(f"Изображение успешно загружено через S3Storage: {url}")
                        
                        # Создаем новый объект без прямого сохранения файла
                        instance = serializer.save(item=item, is_primary=not ItemImage.objects.filter(item=item).exists())
                        
                        # Обновляем имя файла напрямую в БД если необходимо
                        import re
                        filename_match = re.search(r'/([^/]+)$', url)
                        if filename_match:
                            filename = filename_match.group(1)
                            from django.db import connection
                            with connection.cursor() as cursor:
                                cursor.execute(
                                    "UPDATE item_images SET image = %s WHERE id = %s",
                                    [filename, instance.id]
                                )
                            logger.info(f"Изображение обновлено в БД: {filename}")
                            
                            # Обновляем объект в памяти
                            instance.refresh_from_db()
                        return
                
            # Стандартное сохранение, если не используем S3 напрямую
            is_first_image = not ItemImage.objects.filter(item=item).exists()
            if is_first_image:
                logger.info(f"Первое изображение для предмета, устанавливаем как основное")
                serializer.save(item=item, is_primary=True)
            else:
                serializer.save(item=item)
                
        except Item.DoesNotExist:
            logger.warning(f"Попытка загрузить изображение для несуществующего/чужого предмета: item_id={item_id}, user={self.request.user.username}")
            return Response(
                {'detail': 'Предмет не найден или вы не являетесь его владельцем.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def set_primary(self, request, pk=None):
        """
        Установить изображение как основное
        """
        image = self.get_object()
        logger.info(f"Установка основного изображения: image_id={pk}, item_id={image.item.id}")
        
        # Убираем флаг основного изображения у всех изображений предмета
        ItemImage.objects.filter(item=image.item).update(is_primary=False)
        # Устанавливаем флаг у текущего изображения
        image.is_primary = True
        image.save(update_fields=['is_primary'])
        
        logger.info(f"Изображение успешно установлено как основное")
        return Response({'status': 'Image set as primary'})


class FavoriteViewSet(viewsets.ModelViewSet):
    """
    ViewSet для избранных предметов
    """
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)
