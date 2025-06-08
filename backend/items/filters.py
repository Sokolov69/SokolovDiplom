import django_filters
from .models import Item, Favorite
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)

class ItemFilter(django_filters.FilterSet):
    """
    Фильтр для предметов
    """
    title = django_filters.CharFilter(lookup_expr='icontains')
    category = django_filters.NumberFilter()
    category_ancestors = django_filters.CharFilter(method='filter_category_ancestors')
    condition = django_filters.NumberFilter()
    status = django_filters.NumberFilter()
    min_value = django_filters.NumberFilter(field_name='estimated_value', lookup_expr='gte')
    max_value = django_filters.NumberFilter(field_name='estimated_value', lookup_expr='lte')
    owner = django_filters.NumberFilter(field_name='owner__id')
    tags = django_filters.CharFilter(method='filter_tags')
    is_favorite = django_filters.BooleanFilter(method='filter_favorites')
    
    def __init__(self, *args, **kwargs):
        self.request = kwargs.pop('request', None)
        super().__init__(*args, **kwargs)
        logger.info(f"=== ItemFilter INIT ===")
        logger.info(f"Filter data: {self.data}")
        logger.info(f"Request user: {getattr(self.request, 'user', 'No request')}")
    
    @property
    def qs(self):
        """
        Переопределяем свойство qs для логирования
        """
        logger.info(f"=== ItemFilter QS ===")
        logger.info(f"Filter form data: {self.form.data}")
        logger.info(f"Filter form is_valid: {self.form.is_valid()}")
        if not self.form.is_valid():
            logger.warning(f"Filter form errors: {self.form.errors}")
        
        queryset = super().qs
        logger.info(f"Filtered queryset count: {queryset.count()}")
        
        # Логируем применяемые фильтры
        for field_name, field_value in self.form.cleaned_data.items():
            if field_value is not None and field_value != '':
                logger.info(f"Applied filter: {field_name} = {field_value}")
        
        return queryset
    
    def filter_category_ancestors(self, queryset, name, value):
        """
        Фильтр по категории и всем её подкатегориям
        """
        # Находим все идентификаторы подкатегорий (рекурсивно)
        from categories.models import Category
        try:
            category = Category.objects.get(id=value)
            subcategories = Category.objects.filter(parent=category)
            category_ids = [category.id]
            
            while subcategories:
                new_subcategories = []
                for subcat in subcategories:
                    category_ids.append(subcat.id)
                    new_subcategories.extend(Category.objects.filter(parent=subcat))
                subcategories = new_subcategories
            
            return queryset.filter(category_id__in=category_ids)
        except Category.DoesNotExist:
            return queryset.none()
    
    def filter_tags(self, queryset, name, value):
        """
        Фильтр по тегам (разделенным запятыми)
        """
        if not value:
            return queryset
        
        tag_names = [tag.strip() for tag in value.split(',')]
        return queryset.filter(tag_relations__tag__name__in=tag_names).distinct()
    
    def filter_favorites(self, queryset, name, value):
        """
        Фильтр по предметам, добавленным в избранное текущим пользователем
        """
        request = self.request
        if not request or not request.user.is_authenticated:
            return queryset.none()
        
        # Если is_favorite=true, фильтруем только избранные
        if value:
            favorite_item_ids = Favorite.objects.filter(user=request.user).values_list('item_id', flat=True)
            return queryset.filter(id__in=favorite_item_ids)
        # Если is_favorite=false, фильтруем только неизбранные
        else:
            favorite_item_ids = Favorite.objects.filter(user=request.user).values_list('item_id', flat=True)
            return queryset.exclude(id__in=favorite_item_ids)
    
    class Meta:
        model = Item
        fields = [
            'title', 'category', 'condition', 'status', 
            'owner', 'min_value', 'max_value', 'is_favorite'
        ] 