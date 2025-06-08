from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from common.models import TimeStampedModel
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class CategoryQuerySet(models.QuerySet):
    """Кастомный QuerySet для категорий"""
    
    def active(self):
        """Возвращает только активные категории"""
        return self.filter(is_active=True)
    
    def root_categories(self):
        """Возвращает категории верхнего уровня"""
        return self.filter(parent=None)
    
    def by_level(self, level):
        """Возвращает категории определенного уровня"""
        return self.filter(level=level)
    
    def with_children(self):
        """Возвращает категории с предзагруженными дочерними элементами"""
        return self.prefetch_related('children')
    
    def ordered(self):
        """Возвращает категории в правильном порядке"""
        return self.order_by('order', 'name')


class CategoryManager(models.Manager):
    """Кастомный менеджер для категорий"""
    
    def get_queryset(self):
        return CategoryQuerySet(self.model, using=self._db)
    
    def active(self):
        return self.get_queryset().active()
    
    def root_categories(self):
        return self.get_queryset().root_categories()
    
    def build_tree(self):
        """Строит дерево категорий"""
        categories = list(self.get_queryset().active().ordered())
        return self._build_tree_recursive(categories, None)
    
    def _build_tree_recursive(self, categories, parent_id):
        """Рекурсивно строит дерево категорий"""
        tree = []
        for category in categories:
            if category.parent_id == parent_id:
                children = self._build_tree_recursive(categories, category.id)
                category_dict = {
                    'id': category.id,
                    'name': category.name,
                    'slug': category.slug,
                    'level': category.level,
                    'children': children
                }
                tree.append(category_dict)
        return tree


def category_icon_upload_path(instance, filename):
    """Генерирует путь для загрузки иконок категорий"""
    import uuid
    import os
    
    ext = os.path.splitext(filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    return f'category_icons/{unique_filename}'


class Category(TimeStampedModel):
    """
    Модель для категорий предметов с улучшенной функциональностью
    """
    name = models.CharField(
        _("Название"), 
        max_length=100,
        help_text=_("Название категории"),
        db_index=True
    )
    slug = models.SlugField(
        _("Slug"), 
        unique=True,
        help_text=_("URL-совместимое имя категории"),
        db_index=True
    )
    description = models.TextField(
        _("Описание"), 
        null=True, 
        blank=True,
        help_text=_("Подробное описание категории")
    )
    parent = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='children',
        verbose_name=_("Родительская категория"),
        help_text=_("Родительская категория для создания иерархии"),
        db_index=True
    )
    icon = models.ImageField(
        _("Иконка"),
        upload_to=category_icon_upload_path,
        null=True, 
        blank=True,
        help_text=_("Иконка или изображение категории"),
        validators=[
            FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'webp'],
                message=_("Поддерживаемые форматы: JPG, JPEG, PNG, WebP")
            )
        ]
    )
    is_active = models.BooleanField(
        _("Активна"), 
        default=True,
        help_text=_("Отображать ли категорию в списках"),
        db_index=True
    )
    level = models.PositiveSmallIntegerField(
        _("Уровень"), 
        default=0,
        help_text=_("Уровень вложенности категории в иерархии"),
        db_index=True
    )
    order = models.PositiveSmallIntegerField(
        _("Порядок"), 
        default=0,
        help_text=_("Порядок отображения категории в списке"),
        db_index=True
    )

    objects = CategoryManager()

    class Meta:
        db_table = 'categories'
        verbose_name = _("Категория")
        verbose_name_plural = _("Категории")
        ordering = ['order', 'name']
        indexes = [
            models.Index(fields=['parent', 'is_active'], name='cat_parent_active_idx'),
            models.Index(fields=['level', 'order'], name='cat_level_order_idx'),
        ]

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} - {self.name}"
        return self.name
    
    def clean(self):
        """Валидация модели"""
        super().clean()
        
        # Проверка на циклические зависимости
        if self.parent and self._check_circular_dependency():
            raise ValidationError(_("Категория не может быть родителем самой себя или своих предков"))
        
        # Проверка максимального уровня вложенности
        if self.level > 5:  # Максимум 5 уровней
            raise ValidationError(_("Превышен максимальный уровень вложенности (5)"))
    
    def save(self, *args, **kwargs):
        # Генерация slug если не указан
        if not self.slug:
            self.slug = self._generate_unique_slug()
        
        # Расчет уровня вложенности
        self._calculate_level()
        
        # Валидация перед сохранением
        self.full_clean()
        
        # Логирование загрузки иконки
        self._log_icon_save()
        
        super().save(*args, **kwargs)
        
        # Обновление уровня дочерних элементов при изменении родителя
        self._update_children_levels()

    def _generate_unique_slug(self):
        """Генерирует уникальный slug"""
        base_slug = slugify(self.name)
        slug = base_slug
        counter = 1
        
        while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        return slug

    def _calculate_level(self):
        """Рассчитывает уровень вложенности"""
        if self.parent:
            self.level = self.parent.level + 1
        else:
            self.level = 0

    def _check_circular_dependency(self):
        """Проверяет наличие циклических зависимостей"""
        current_parent = self.parent
        while current_parent:
            if current_parent.id == self.id:
                return True
            current_parent = current_parent.parent
        return False

    def _update_children_levels(self):
        """Обновляет уровень всех дочерних категорий"""
        children = self.children.all()
        for child in children:
            old_level = child.level
            child._calculate_level()
            if child.level != old_level:
                child.save(update_fields=['level'])

    def _log_icon_save(self):
        """Логирует информацию о сохранении иконки"""
        if self.icon and hasattr(self.icon, 'name'):
            logger.info(f"Сохранение категории с иконкой: category_id={self.pk}, icon={self.icon.name}")

    @property
    def full_path(self):
        """Возвращает полный путь категории"""
        path = [self.name]
        current = self.parent
        while current:
            path.insert(0, current.name)
            current = current.parent
        return " > ".join(path)

    @property
    def children_count(self):
        """Возвращает количество дочерних категорий"""
        return self.children.filter(is_active=True).count()

    @property
    def descendants_count(self):
        """Возвращает общее количество потомков"""
        count = 0
        for child in self.children.filter(is_active=True):
            count += 1 + child.descendants_count
        return count

    def get_ancestors(self):
        """Возвращает список всех предков"""
        ancestors = []
        current = self.parent
        while current:
            ancestors.insert(0, current)
            current = current.parent
        return ancestors

    def get_descendants(self):
        """Возвращает список всех потомков"""
        descendants = []
        for child in self.children.filter(is_active=True):
            descendants.append(child)
            descendants.extend(child.get_descendants())
        return descendants

    def can_be_parent_of(self, category):
        """Проверяет, может ли категория быть родителем указанной категории"""
        if category == self:
            return False
        
        # Проверяем, не является ли указанная категория предком текущей
        current = self.parent
        while current:
            if current == category:
                return False
            current = current.parent
        
        return True
