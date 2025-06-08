from rest_framework import viewsets, filters, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction, models
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from copy import copy
from .models import Category
from .serializers import (
    CategorySerializer, 
    CategoryListSerializer, 
    CategoryCreateSerializer,
    CategoryUpdateSerializer
)
from .permissions import IsAdminOrReadOnly
from authentication.models import UserActionLog
import logging

# Настраиваем логгер
logger = logging.getLogger(__name__)

# Create your views here.

class ActionLoggerMixin:
    """Миксин для логирования действий с категориями"""
    
    def _log_user_action(self, action_type, description, entity_id=None):
        """Логирует действие пользователя"""
        if self.request.user.is_authenticated:
            try:
                UserActionLog.objects.create(
                    user=self.request.user,
                    action_type=action_type,
                    description=description,
                    entity_type='Category',
                    entity_id=entity_id,
                    ip_address=self.request.META.get('REMOTE_ADDR')
                )
            except Exception as e:
                logger.error(f"Ошибка при создании лога действий: {e}")
    
    def _get_client_ip(self):
        """Получает IP адрес клиента"""
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip


class CacheManagerMixin:
    """Миксин для управления кешем"""
    
    def _get_cache_key(self, action, *args):
        """Генерирует ключ для кеша"""
        return f"categories:{action}:{':'.join(map(str, args))}"
    
    def _invalidate_cache(self):
        """Очищает кеш категорий"""
        cache_keys = [
            'categories:tree',
            'categories:root',
            'categories:list'
        ]
        cache.delete_many(cache_keys)
        logger.debug("Кеш категорий очищен")


class CategoryViewSet(ActionLoggerMixin, CacheManagerMixin, viewsets.ModelViewSet):
    """
    ViewSet для работы с категориями с улучшенной функциональностью.
    
    list: Получение списка всех категорий верхнего уровня
    retrieve: Получение деталей категории
    create: Создание новой категории (только админ)
    update: Обновление категории (только админ)
    destroy: Удаление категории (только админ)
    children: Получение дочерних категорий
    tree: Получение дерева категорий
    """
    queryset = Category.objects.select_related('parent').prefetch_related('children')
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['parent', 'level', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'order', 'level', 'created_at']
    ordering = ['order', 'name']
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    
    def get_serializer_class(self):
        """Возвращает соответствующий сериализатор для текущего действия"""
        serializer_map = {
            'list': CategoryListSerializer,
            'create': CategoryCreateSerializer,
            'update': CategoryUpdateSerializer,
            'partial_update': CategoryUpdateSerializer,
        }
        return serializer_map.get(self.action, CategorySerializer)
    
    def get_queryset(self):
        """Возвращает оптимизированный queryset с корректной обработкой фильтров"""
        queryset = self.queryset
        
        # Логируем запрос
        self._log_request()
        
        # Проверяем, есть ли параметр поиска
        search_param = self.request.query_params.get('search')
        parent_param = self.request.query_params.get('parent')
        
        # Если есть поиск, ищем по всем категориям, игнорируя parent фильтр
        if search_param:
            logger.debug(f"Поиск по всем категориям: search='{search_param}'")
            # Применяем только поиск и остальные фильтры, кроме parent
            for backend in self.filter_backends:
                if backend == DjangoFilterBackend:
                    # Применяем только is_active и level, исключая parent
                    queryset = self._apply_django_filters_except_parent(queryset)
                else:
                    # Применяем поиск и сортировку
                    queryset = backend().filter_queryset(self.request, queryset, self)
        else:
            # Обычная логика фильтрации с учетом parent
            # Обрабатываем фильтр parent корректно
            
            # Если parent= (пустое значение), фильтруем корневые категории
            if 'parent' in self.request.query_params and parent_param == '':
                queryset = queryset.filter(parent=None)
                logger.debug(f"Фильтрация корневых категорий: parent=None")
            elif parent_param and parent_param != 'null':
                # Указан конкретный parent ID
                try:
                    parent_id = int(parent_param)
                    queryset = queryset.filter(parent_id=parent_id)
                    logger.debug(f"Фильтрация по parent_id={parent_id}")
                except (ValueError, TypeError):
                    logger.warning(f"Неверный формат parent ID: {parent_param}")
                    queryset = queryset.none()
            
            # Применяем остальные фильтры (is_active, level и поиск)
            # Исключаем parent из стандартной обработки DjangoFilterBackend
            for backend in self.filter_backends:
                if backend == DjangoFilterBackend:
                    # Для DjangoFilterBackend применяем фильтры, исключая parent
                    queryset = self._apply_django_filters_except_parent(queryset)
                else:
                    # Применяем остальные бэкенды (поиск, сортировка)
                    queryset = backend().filter_queryset(self.request, queryset, self)
        
        return queryset
    
    def _apply_django_filters_except_parent(self, queryset):
        """Применяет Django фильтры, исключая parent"""
        # Применяем фильтры is_active и level вручную
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            if is_active.lower() in ('true', '1'):
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() in ('false', '0'):
                queryset = queryset.filter(is_active=False)
        
        level = self.request.query_params.get('level')
        if level:
            try:
                level_value = int(level)
                queryset = queryset.filter(level=level_value)
                logger.debug(f"Фильтрация по level={level_value}")
            except (ValueError, TypeError):
                logger.warning(f"Неверный формат level: {level}")
        
        return queryset
    
    def _log_request(self):
        """Логирует информацию о запросе"""
        user = self.request.user
        ip = self._get_client_ip()
        params = dict(self.request.query_params)
        
        # Определяем тип запроса
        search_param = self.request.query_params.get('search')
        parent_param = self.request.query_params.get('parent')
        
        request_type = "обычный"
        if search_param:
            request_type = "поиск по всем категориям"
        elif 'parent' in self.request.query_params and parent_param == '':
            request_type = "корневые категории"
        elif parent_param and parent_param != 'null':
            request_type = f"дочерние категории (parent={parent_param})"
        
        logger.info(
            f"Запрос категорий: action={self.action}, type={request_type}, "
            f"user={user.username if user.is_authenticated else 'anonymous'}, "
            f"ip={ip}, params={params}"
        )
    
    @method_decorator(cache_page(60 * 15))  # Кеш на 15 минут
    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """
        Возвращает дочерние категории для заданной категории
        """
        try:
            category = self.get_object()
            children = category.children.filter(is_active=True).order_by('order', 'name')
            
            serializer = CategoryListSerializer(children, many=True, context={'request': request})
            
            logger.info(f"Запрос дочерних категорий: parent_id={pk}, count={len(children)}")
            
            return Response({
                'parent': CategoryListSerializer(category, context={'request': request}).data,
                'children': serializer.data,
                'count': len(children)
            })
            
        except Category.DoesNotExist:
            logger.warning(f"Категория не найдена: id={pk}")
            return Response(
                {'error': 'Категория не найдена'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Ошибка при получении дочерних категорий: {e}")
            return Response(
                {'error': 'Внутренняя ошибка сервера'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @method_decorator(cache_page(60 * 30))  # Кеш на 30 минут
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """
        Возвращает дерево категорий, начиная с верхнего уровня
        """
        try:
            cache_key = self._get_cache_key('tree')
            cached_data = cache.get(cache_key)
            
            if cached_data:
                logger.debug("Возвращаем дерево категорий из кеша")
                return Response(cached_data)
            
            # Используем менеджер для построения дерева
            tree_data = Category.objects.build_tree()
            
            # Или альтернативный способ через сериализатор
            if not tree_data:
                root_categories = Category.objects.root_categories().active().ordered()
                serializer = CategorySerializer(
                    root_categories, 
                    many=True, 
                    context={'request': request}
                )
                tree_data = serializer.data
            
            # Кешируем результат
            cache.set(cache_key, tree_data, 60 * 30)
            
            logger.info(f"Запрос дерева категорий: root_count={len(tree_data)}")
            
            return Response(tree_data)
            
        except Exception as e:
            logger.error(f"Ошибка при получении дерева категорий: {e}")
            return Response(
                {'error': 'Внутренняя ошибка сервера'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Возвращает статистику по категориям
        """
        try:
            stats = {
                'total_categories': Category.objects.count(),
                'active_categories': Category.objects.active().count(),
                'root_categories': Category.objects.root_categories().count(),
                'max_level': Category.objects.aggregate(
                    max_level=models.Max('level')
                )['max_level'] or 0
            }
            
            # Статистика по уровням
            level_stats = Category.objects.values('level').annotate(
                count=models.Count('id')
            ).order_by('level')
            stats['levels'] = list(level_stats)
            
            logger.info(f"Запрос статистики категорий: {stats}")
            
            return Response(stats)
            
        except Exception as e:
            logger.error(f"Ошибка при получении статистики: {e}")
            return Response(
                {'error': 'Внутренняя ошибка сервера'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        """
        Обработка создания категории с транзакцией и логированием
        """
        try:
            with transaction.atomic():
                category = serializer.save()
                
                # Логируем действие
                self._log_user_action(
                    action_type='content_approve',
                    description=f'Создание категории: {category.name}',
                    entity_id=category.id
                )
                
                # Очищаем кеш
                self._invalidate_cache()
                
                logger.info(
                    f"Категория создана: id={category.id}, name={category.name}, "
                    f"user={self.request.user.username}, ip={self._get_client_ip()}"
                )
                
        except Exception as e:
            logger.error(f"Ошибка при создании категории: {e}")
            raise
    
    def perform_update(self, serializer):
        """
        Обработка обновления категории с транзакцией и логированием
        """
        try:
            with transaction.atomic():
                category = serializer.save()
                
                # Логируем действие
                self._log_user_action(
                    action_type='content_approve',
                    description=f'Обновление категории: {category.name}',
                    entity_id=category.id
                )
                
                # Очищаем кеш
                self._invalidate_cache()
                
                logger.info(
                    f"Категория обновлена: id={category.id}, name={category.name}, "
                    f"user={self.request.user.username}, ip={self._get_client_ip()}"
                )
                
        except Exception as e:
            logger.error(f"Ошибка при обновлении категории: {e}")
            raise
    
    def perform_destroy(self, instance):
        """
        Обработка удаления категории с проверками и логированием
        """
        category_id = instance.id
        category_name = instance.name
        
        try:
            # Проверяем, есть ли дочерние категории
            if instance.children.exists():
                raise ValidationError("Нельзя удалить категорию, у которой есть дочерние категории")
            
            # Проверяем, есть ли связанные элементы (если есть связь с items)
            if hasattr(instance, 'items') and instance.items.exists():
                raise ValidationError("Нельзя удалить категорию, в которой есть товары")
            
            with transaction.atomic():
                # Логируем действие перед удалением
                self._log_user_action(
                    action_type='content_reject',
                    description=f'Удаление категории: {category_name}',
                    entity_id=category_id
                )
                
                super().perform_destroy(instance)
                
                # Очищаем кеш
                self._invalidate_cache()
                
                logger.info(
                    f"Категория удалена: id={category_id}, name={category_name}, "
                    f"user={self.request.user.username}, ip={self._get_client_ip()}"
                )
                
        except Exception as e:
            logger.error(f"Ошибка при удалении категории {category_id}: {e}")
            raise
