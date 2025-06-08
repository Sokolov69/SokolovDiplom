from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils.text import slugify
from common.models import TimeStampedModel, SoftDeleteModel

User = settings.AUTH_USER_MODEL

class ItemCondition(models.Model):
    """
    Модель для состояния предметов (например, новый, б/у, и т.д.)
    """
    name = models.CharField(
        _("Название"), 
        max_length=50, 
        unique=True,
        help_text=_("Название состояния предмета")
    )
    description = models.TextField(
        _("Описание"), 
        null=True, 
        blank=True,
        help_text=_("Подробное описание состояния")
    )
    order = models.PositiveSmallIntegerField(
        _("Порядок"), 
        default=0,
        help_text=_("Порядок отображения в списке")
    )

    class Meta:
        db_table = 'item_conditions'
        verbose_name = _("Состояние предмета")
        verbose_name_plural = _("Состояния предметов")
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class ItemStatus(models.Model):
    """
    Модель для статусов предметов (например, доступен, зарезервирован, обменен)
    """
    name = models.CharField(
        _("Название"), 
        max_length=50, 
        unique=True,
        help_text=_("Название статуса предмета")
    )
    description = models.TextField(
        _("Описание"), 
        null=True, 
        blank=True,
        help_text=_("Подробное описание статуса")
    )
    is_active = models.BooleanField(
        _("Активен"), 
        default=True,
        help_text=_("Доступен ли статус для выбора")
    )
    order = models.PositiveSmallIntegerField(
        _("Порядок"), 
        default=0,
        help_text=_("Порядок отображения в списке")
    )

    class Meta:
        db_table = 'item_statuses'
        verbose_name = _("Статус предмета")
        verbose_name_plural = _("Статусы предметов")
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Item(TimeStampedModel, SoftDeleteModel):
    """
    Основная модель для предметов обмена
    """
    title = models.CharField(
        _("Название"), 
        max_length=200,
        help_text=_("Название предмета")
    )
    slug = models.SlugField(
        _("Slug"), 
        max_length=250, 
        blank=True,
        help_text=_("URL-совместимое имя предмета")
    )
    description = models.TextField(
        _("Описание"),
        help_text=_("Подробное описание предмета")
    )
    owner = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='items',
        verbose_name=_("Владелец"),
        help_text=_("Пользователь, которому принадлежит предмет")
    )
    category = models.ForeignKey(
        'categories.Category', 
        on_delete=models.PROTECT, 
        related_name='items',
        verbose_name=_("Категория"),
        help_text=_("Категория предмета")
    )
    condition = models.ForeignKey(
        ItemCondition, 
        on_delete=models.PROTECT, 
        related_name='items',
        verbose_name=_("Состояние"),
        help_text=_("Состояние предмета (новый, б/у и т.д.)")
    )
    status = models.ForeignKey(
        ItemStatus, 
        on_delete=models.PROTECT, 
        related_name='items',
        verbose_name=_("Статус"),
        help_text=_("Текущий статус предмета")
    )
    location = models.ForeignKey(
        'profiles.Location', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='items',
        verbose_name=_("Местоположение"),
        help_text=_("Местоположение предмета")
    )
    estimated_value = models.DecimalField(
        _("Приблизительная стоимость"), 
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text=_("Приблизительная стоимость в рублях (для информации)")
    )
    views_count = models.PositiveIntegerField(
        _("Количество просмотров"), 
        default=0,
        help_text=_("Сколько раз просматривали предмет")
    )
    favorites_count = models.PositiveIntegerField(
        _("В избранном"), 
        default=0,
        help_text=_("Сколько раз добавляли в избранное")
    )
    is_featured = models.BooleanField(
        _("Рекомендуемый"), 
        default=False,
        help_text=_("Отображать в рекомендуемых предметах")
    )

    class Meta:
        db_table = 'items'
        verbose_name = _("Предмет")
        verbose_name_plural = _("Предметы")
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category'], name='item_category_idx'),
            models.Index(fields=['status'], name='item_status_idx'),
            models.Index(fields=['owner'], name='item_owner_idx'),
            models.Index(fields=['created_at'], name='item_created_idx'),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            self.slug = base_slug
            
            # Проверяем уникальность slug
            counter = 1
            while Item.objects.filter(slug=self.slug).exists():
                self.slug = f"{base_slug}-{counter}"
                counter += 1
                
        super().save(*args, **kwargs)


class ItemImage(TimeStampedModel):
    """
    Модель для изображений предметов
    """
    item = models.ForeignKey(
        Item, 
        on_delete=models.CASCADE, 
        related_name='images',
        verbose_name=_("Предмет"),
        help_text=_("Предмет, к которому относится изображение")
    )
    image = models.ImageField(
        _("Изображение"), 
        upload_to='item_images/',
        help_text=_("Файл изображения")
    )
    is_primary = models.BooleanField(
        _("Основное изображение"), 
        default=False,
        help_text=_("Является ли изображение основным")
    )
    order = models.PositiveSmallIntegerField(
        _("Порядок"), 
        default=0,
        help_text=_("Порядок отображения изображения")
    )
    
    class Meta:
        db_table = 'item_images'
        verbose_name = _("Изображение предмета")
        verbose_name_plural = _("Изображения предметов")
        ordering = ['order']

    def __str__(self):
        return f"Изображение {self.order} для {self.item.title}"


class ItemTag(models.Model):
    """
    Модель для тегов предметов
    """
    name = models.CharField(
        _("Название"), 
        max_length=50, 
        unique=True,
        help_text=_("Название тега")
    )
    slug = models.SlugField(
        _("Slug"), 
        unique=True,
        help_text=_("URL-совместимое имя тега")
    )

    class Meta:
        db_table = 'item_tags'
        verbose_name = _("Тег")
        verbose_name_plural = _("Теги")

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ItemTagRelation(models.Model):
    """
    Связующая модель между предметами и тегами
    """
    item = models.ForeignKey(
        Item, 
        on_delete=models.CASCADE, 
        related_name='tag_relations',
        verbose_name=_("Предмет")
    )
    tag = models.ForeignKey(
        ItemTag, 
        on_delete=models.CASCADE, 
        related_name='item_relations',
        verbose_name=_("Тег")
    )
    created_at = models.DateTimeField(
        _("Дата создания"), 
        auto_now_add=True
    )

    class Meta:
        db_table = 'item_tag_relations'
        verbose_name = _("Связь предмета с тегом")
        verbose_name_plural = _("Связи предметов с тегами")
        unique_together = ('item', 'tag')

    def __str__(self):
        return f"{self.item.title} - {self.tag.name}"


class Favorite(TimeStampedModel):
    """
    Модель для избранных предметов пользователей
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='favorites',
        verbose_name=_("Пользователь"),
        help_text=_("Пользователь, добавивший в избранное")
    )
    item = models.ForeignKey(
        Item, 
        on_delete=models.CASCADE, 
        related_name='favorited_by',
        verbose_name=_("Предмет"),
        help_text=_("Предмет, добавленный в избранное")
    )

    class Meta:
        db_table = 'favorites'
        verbose_name = _("Избранное")
        verbose_name_plural = _("Избранное")
        unique_together = ('user', 'item')

    def __str__(self):
        return f"{self.user.username} - {self.item.title}"
