from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone
from common.models import TimeStampedModel

User = settings.AUTH_USER_MODEL

class TradeStatus(models.Model):
    """
    Модель для статусов предложений обмена
    """
    name = models.CharField(
        _("Название"), 
        max_length=50, 
        unique=True,
        help_text=_("Название статуса обмена")
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
        db_table = 'trade_statuses'
        verbose_name = _("Статус обмена")
        verbose_name_plural = _("Статусы обменов")
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class TradeOffer(TimeStampedModel):
    """
    Модель для предложений обмена между пользователями
    """
    initiator = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='initiated_offers',
        verbose_name=_("Инициатор"),
        help_text=_("Пользователь, инициировавший обмен")
    )
    receiver = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='received_offers',
        verbose_name=_("Получатель"),
        help_text=_("Пользователь, получивший предложение")
    )
    status = models.ForeignKey(
        TradeStatus, 
        on_delete=models.PROTECT, 
        related_name='offers',
        verbose_name=_("Статус"),
        help_text=_("Текущий статус предложения")
    )
    location = models.ForeignKey(
        'profiles.Location',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='trade_offers',
        verbose_name=_("Адрес встречи"),
        help_text=_("Место встречи для обмена")
    )
    message = models.TextField(
        _("Сообщение"), 
        null=True, 
        blank=True,
        help_text=_("Сопроводительное сообщение к предложению")
    )
    is_countered = models.BooleanField(
        _("Встречное предложение"), 
        default=False,
        help_text=_("Является ли встречным предложением")
    )
    parent_offer = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='counter_offers',
        verbose_name=_("Исходное предложение"),
        help_text=_("Исходное предложение, если это встречное")
    )
    completed_at = models.DateTimeField(
        _("Дата завершения"), 
        null=True, 
        blank=True,
        help_text=_("Дата завершения обмена")
    )

    class Meta:
        db_table = 'trade_offers'
        verbose_name = _("Предложение обмена")
        verbose_name_plural = _("Предложения обмена")
        ordering = ['-created_at']

    def __str__(self):
        return f"Обмен #{self.id}: {self.initiator.username} -> {self.receiver.username}"
    
    def complete(self, status_name):
        """
        Завершить обмен, установив указанный статус и дату завершения
        """
        status = TradeStatus.objects.get(name=status_name)
        self.status = status
        self.completed_at = timezone.now()
        self.save()


class TradeOfferItem(models.Model):
    """
    Связующая модель между предложениями обмена и предметами
    """
    trade_offer = models.ForeignKey(
        TradeOffer, 
        on_delete=models.CASCADE, 
        related_name='trade_items',
        verbose_name=_("Предложение обмена"),
        help_text=_("Предложение обмена, к которому относится предмет")
    )
    item = models.ForeignKey(
        'items.Item', 
        on_delete=models.CASCADE, 
        related_name='trade_offers',
        verbose_name=_("Предмет"),
        help_text=_("Предмет, предлагаемый для обмена")
    )
    is_from_initiator = models.BooleanField(
        _("От инициатора"), 
        help_text=_("Предлагается ли предмет инициатором")
    )

    class Meta:
        db_table = 'trade_offer_items'
        verbose_name = _("Предмет предложения")
        verbose_name_plural = _("Предметы предложения")
        unique_together = ('trade_offer', 'item')

    def __str__(self):
        direction = "от" if self.is_from_initiator else "для"
        return f"Предмет {self.item.title} {direction} {self.trade_offer}"


class TradeHistory(TimeStampedModel):
    """
    Модель для истории изменений статуса предложений обмена
    """
    trade_offer = models.ForeignKey(
        TradeOffer, 
        on_delete=models.CASCADE, 
        related_name='history',
        verbose_name=_("Предложение обмена"),
        help_text=_("Предложение обмена, статус которого изменился")
    )
    previous_status = models.ForeignKey(
        TradeStatus, 
        on_delete=models.PROTECT, 
        related_name='+',
        verbose_name=_("Предыдущий статус"),
        help_text=_("Статус до изменения")
    )
    new_status = models.ForeignKey(
        TradeStatus, 
        on_delete=models.PROTECT, 
        related_name='+',
        verbose_name=_("Новый статус"),
        help_text=_("Статус после изменения")
    )
    changed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='+',
        verbose_name=_("Изменил"),
        help_text=_("Пользователь, изменивший статус")
    )
    comment = models.TextField(
        _("Комментарий"), 
        null=True, 
        blank=True,
        help_text=_("Комментарий к изменению статуса")
    )

    class Meta:
        db_table = 'trade_history'
        verbose_name = _("История обмена")
        verbose_name_plural = _("История обменов")
        ordering = ['-created_at']

    def __str__(self):
        return f"Изменение статуса обмена #{self.trade_offer.id}: {self.previous_status.name} -> {self.new_status.name}"
