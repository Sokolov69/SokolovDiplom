from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from common.models import TimeStampedModel

User = settings.AUTH_USER_MODEL

class NotificationType(models.Model):
    """
    Модель для типов уведомлений
    """
    name = models.CharField(
        _("Название"), 
        max_length=100, 
        unique=True,
        help_text=_("Уникальный идентификатор типа уведомления")
    )
    display_name = models.CharField(
        _("Отображаемое название"), 
        max_length=100,
        help_text=_("Название типа уведомления для отображения")
    )
    description = models.TextField(
        _("Описание"), 
        null=True, 
        blank=True,
        help_text=_("Описание типа уведомления")
    )
    icon = models.CharField(
        _("Иконка"), 
        max_length=50, 
        null=True, 
        blank=True,
        help_text=_("Класс иконки для отображения")
    )
    is_active = models.BooleanField(
        _("Активен"), 
        default=True,
        help_text=_("Используется ли данный тип уведомлений")
    )

    class Meta:
        db_table = 'notification_types'
        verbose_name = _("Тип уведомления")
        verbose_name_plural = _("Типы уведомлений")

    def __str__(self):
        return self.display_name


class NotificationTemplate(models.Model):
    """
    Модель для шаблонов текстов уведомлений
    """
    notification_type = models.ForeignKey(
        NotificationType, 
        on_delete=models.CASCADE, 
        related_name='templates',
        verbose_name=_("Тип уведомления")
    )
    title_template = models.CharField(
        _("Шаблон заголовка"), 
        max_length=255,
        help_text=_("Шаблон для заголовка уведомления с переменными в формате {variable}")
    )
    body_template = models.TextField(
        _("Шаблон сообщения"),
        help_text=_("Шаблон для текста уведомления с переменными в формате {variable}")
    )
    language_code = models.CharField(
        _("Код языка"), 
        max_length=10, 
        default='ru',
        help_text=_("Код языка (ISO) для шаблона")
    )
    is_default = models.BooleanField(
        _("По умолчанию"), 
        default=False,
        help_text=_("Является ли этот шаблон используемым по умолчанию для данного типа")
    )
    
    class Meta:
        db_table = 'notification_templates'
        verbose_name = _("Шаблон уведомления")
        verbose_name_plural = _("Шаблоны уведомлений")
        unique_together = ('notification_type', 'language_code')

    def __str__(self):
        return f"{self.notification_type.name} ({self.language_code})"


class Notification(TimeStampedModel):
    """
    Модель для хранения уведомлений пользователей
    """
    recipient = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notifications',
        verbose_name=_("Получатель"),
        help_text=_("Пользователь, получающий уведомление")
    )
    notification_type = models.ForeignKey(
        NotificationType, 
        on_delete=models.PROTECT, 
        related_name='notifications',
        verbose_name=_("Тип уведомления")
    )
    title = models.CharField(
        _("Заголовок"), 
        max_length=255,
        help_text=_("Заголовок уведомления")
    )
    message = models.TextField(
        _("Сообщение"),
        help_text=_("Текст уведомления")
    )
    is_read = models.BooleanField(
        _("Прочитано"), 
        default=False,
        help_text=_("Было ли уведомление прочитано")
    )
    read_at = models.DateTimeField(
        _("Время прочтения"), 
        null=True, 
        blank=True,
        help_text=_("Время, когда уведомление было прочитано")
    )
    entity_type = models.CharField(
        _("Тип сущности"), 
        max_length=100, 
        null=True, 
        blank=True,
        help_text=_("Тип связанной сущности (Item, User, TradeOffer и т.д.)")
    )
    entity_id = models.PositiveIntegerField(
        _("ID сущности"), 
        null=True, 
        blank=True,
        help_text=_("ID связанной сущности")
    )
    action_url = models.CharField(
        _("URL действия"), 
        max_length=255, 
        null=True, 
        blank=True,
        help_text=_("URL для перехода по уведомлению")
    )
    image_url = models.CharField(
        _("URL изображения"), 
        max_length=255, 
        null=True, 
        blank=True,
        help_text=_("URL изображения для уведомления")
    )

    class Meta:
        db_table = 'notifications'
        verbose_name = _("Уведомление")
        verbose_name_plural = _("Уведомления")
        ordering = ['-created_at']

    def __str__(self):
        return f"Уведомление #{self.id} для {self.recipient.username}: {self.title}"


class UserNotificationPreference(models.Model):
    """
    Модель для хранения предпочтений пользователя по уведомлениям
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notification_preferences',
        verbose_name=_("Пользователь")
    )
    notification_type = models.ForeignKey(
        NotificationType, 
        on_delete=models.CASCADE, 
        related_name='user_preferences',
        verbose_name=_("Тип уведомления")
    )
    email_enabled = models.BooleanField(
        _("Email"), 
        default=True,
        help_text=_("Отправлять уведомления по email")
    )
    push_enabled = models.BooleanField(
        _("Push"), 
        default=True,
        help_text=_("Отправлять push-уведомления")
    )
    in_app_enabled = models.BooleanField(
        _("В приложении"), 
        default=True,
        help_text=_("Показывать уведомления в приложении")
    )

    class Meta:
        db_table = 'user_notification_preferences'
        verbose_name = _("Настройка уведомлений пользователя")
        verbose_name_plural = _("Настройки уведомлений пользователей")
        unique_together = ('user', 'notification_type')

    def __str__(self):
        return f"Настройки уведомлений {self.notification_type.name} для {self.user.username}"


class PushToken(TimeStampedModel):
    """
    Модель для хранения push-токенов устройств пользователей
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='push_tokens',
        verbose_name=_("Пользователь")
    )
    token = models.CharField(
        _("Токен"), 
        max_length=255, 
        unique=True,
        help_text=_("Push-токен устройства")
    )
    device_type = models.CharField(
        _("Тип устройства"), 
        max_length=50,
        help_text=_("Тип устройства (android, ios и т.д.)")
    )
    device_name = models.CharField(
        _("Название устройства"), 
        max_length=100, 
        null=True, 
        blank=True,
        help_text=_("Название устройства пользователя")
    )
    is_active = models.BooleanField(
        _("Активен"), 
        default=True,
        help_text=_("Используется ли токен для отправки уведомлений")
    )
    last_used = models.DateTimeField(
        _("Последнее использование"), 
        null=True, 
        blank=True,
        help_text=_("Дата последнего использования токена")
    )

    class Meta:
        db_table = 'push_tokens'
        verbose_name = _("Push-токен")
        verbose_name_plural = _("Push-токены")

    def __str__(self):
        return f"Токен {self.device_type} для {self.user.username}"
