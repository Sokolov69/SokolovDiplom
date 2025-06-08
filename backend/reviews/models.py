from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from common.models import TimeStampedModel

User = settings.AUTH_USER_MODEL

class ReviewType(models.Model):
    """
    Модель для типов отзывов
    """
    name = models.CharField(
        _("Название"), 
        max_length=50, 
        unique=True,
        help_text=_("Название типа отзыва")
    )
    description = models.TextField(
        _("Описание"), 
        null=True, 
        blank=True,
        help_text=_("Подробное описание типа отзыва")
    )
    
    class Meta:
        db_table = 'review_types'
        verbose_name = _("Тип отзыва")
        verbose_name_plural = _("Типы отзывов")
        
    def __str__(self):
        return self.name


class Review(TimeStampedModel):
    """
    Модель для отзывов о пользователях
    """
    author = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='written_reviews',
        verbose_name=_("Автор"),
        help_text=_("Пользователь, оставивший отзыв")
    )
    receiver = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='received_reviews',
        verbose_name=_("Получатель"),
        help_text=_("Пользователь, получивший отзыв")
    )
    trade_offer = models.ForeignKey(
        'trades.TradeOffer', 
        on_delete=models.CASCADE, 
        related_name='reviews',
        verbose_name=_("Предложение обмена"),
        help_text=_("Обмен, к которому относится отзыв")
    )
    review_type = models.ForeignKey(
        ReviewType, 
        on_delete=models.PROTECT, 
        related_name='reviews',
        verbose_name=_("Тип отзыва"),
        help_text=_("Тип отзыва (положительный, отрицательный и т.д.)")
    )
    rating = models.PositiveSmallIntegerField(
        _("Оценка"),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text=_("Оценка от 1 до 5")
    )
    comment = models.TextField(
        _("Комментарий"), 
        null=True, 
        blank=True,
        help_text=_("Текст отзыва")
    )
    is_hidden = models.BooleanField(
        _("Скрыт"), 
        default=False,
        help_text=_("Скрыт ли отзыв (для модерации)")
    )

    class Meta:
        db_table = 'reviews'
        verbose_name = _("Отзыв")
        verbose_name_plural = _("Отзывы")
        unique_together = ('author', 'trade_offer')
        ordering = ['-created_at']

    def __str__(self):
        return f"Отзыв от {self.author.username} для {self.receiver.username}"
