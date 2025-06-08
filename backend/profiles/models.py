from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from common.models import TimeStampedModel, SoftDeleteModel
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

# Настраиваем логгер
logger = logging.getLogger(__name__)

User = settings.AUTH_USER_MODEL

def user_avatar_path(instance, filename):
    """
    Формирует путь для сохранения аватара пользователя
    """
    # Генерируем уникальное имя файла, включая user_id
    import uuid
    ext = filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    return f'avatars/{instance.user.id}/{unique_filename}'

class UserProfile(TimeStampedModel):
    """
    Модель профиля пользователя с дополнительной информацией
    """
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile', 
        verbose_name=_("Пользователь")
    )
    avatar = models.ImageField(
        _("Аватар"), 
        upload_to=user_avatar_path, 
        null=True, 
        blank=True,
        help_text=_("Изображение профиля пользователя")
    )
    bio = models.TextField(
        _("О себе"), 
        null=True, 
        blank=True,
        help_text=_("Краткая информация о пользователе")
    )
    phone_number = models.CharField(
        _("Номер телефона"), 
        max_length=20, 
        null=True, 
        blank=True,
        help_text=_("Контактный номер телефона")
    )
    rating = models.DecimalField(
        _("Рейтинг"), 
        max_digits=3, 
        decimal_places=2, 
        default=0.0,
        help_text=_("Рейтинг пользователя по шкале от 0 до 5")
    )
    total_reviews = models.PositiveIntegerField(
        _("Всего отзывов"), 
        default=0,
        help_text=_("Общее количество полученных отзывов")
    )
    successful_trades = models.PositiveIntegerField(
        _("Успешных обменов"), 
        default=0,
        help_text=_("Количество успешно завершенных обменов")
    )

    class Meta:
        db_table = 'user_profiles'
        verbose_name = _("Профиль пользователя")
        verbose_name_plural = _("Профили пользователей")

    def __str__(self):
        return f"Профиль {self.user.username}"
    
    def save(self, *args, **kwargs):
        # Логируем информацию о загрузке аватара
        if self.avatar and hasattr(self.avatar, 'name'):
            logger.info(f"Сохранение профиля с аватаром: user_id={self.user.id}, avatar={self.avatar.name}")
        
        # Вызываем оригинальный метод save
        super().save(*args, **kwargs)
        
        # Логируем после сохранения
        if self.avatar:
            # Формируем прямой URL
            direct_url = None
            if settings.USE_S3:
                # Получаем путь к файлу относительно корня медиа
                avatar_path = str(self.avatar)
                direct_url = f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{settings.MEDIA_LOCATION}/{avatar_path}"
                
            logger.info(f"После сохранения профиля {self.user.username} (id={self.pk}): "
                        f"аватар={self.avatar.name}, "
                        f"URL={self.avatar.url if hasattr(self.avatar, 'url') else 'нет URL'}, "
                        f"Прямой URL={direct_url}")


# Сигнал для автоматического создания профиля пользователя
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Создает профиль пользователя при его регистрации
    """
    if created:
        try:
            UserProfile.objects.create(user=instance)
            logger.info(f"Автоматически создан профиль для пользователя {instance.username} (id={instance.id})")
        except Exception as e:
            logger.error(f"Ошибка при создании профиля для пользователя {instance.username}: {str(e)}")


class Location(TimeStampedModel):
    """
    Модель для адресов пользователей
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='locations',
        verbose_name=_("Пользователь")
    )
    title = models.CharField(
        _("Название"), 
        max_length=100,
        help_text=_("Название для адреса (например, 'Дом', 'Работа')")
    )
    address = models.CharField(
        _("Адрес"), 
        max_length=255,
        help_text=_("Полный адрес")
    )
    city = models.CharField(
        _("Город"), 
        max_length=100,
        help_text=_("Название города")
    )
    region = models.CharField(
        _("Регион"), 
        max_length=100, 
        null=True, 
        blank=True,
        help_text=_("Регион/область")
    )
    postal_code = models.CharField(
        _("Почтовый индекс"), 
        max_length=20, 
        null=True, 
        blank=True,
        help_text=_("Почтовый индекс")
    )
    country = models.CharField(
        _("Страна"), 
        max_length=100, 
        default="Россия",
        help_text=_("Название страны")
    )
    latitude = models.DecimalField(
        _("Широта"), 
        max_digits=15, 
        decimal_places=12, 
        null=True, 
        blank=True,
        help_text=_("Географическая широта для геолокации")
    )
    longitude = models.DecimalField(
        _("Долгота"), 
        max_digits=15, 
        decimal_places=12, 
        null=True, 
        blank=True,
        help_text=_("Географическая долгота для геолокации")
    )
    is_primary = models.BooleanField(
        _("Основной адрес"), 
        default=False,
        help_text=_("Является ли адрес основным")
    )

    class Meta:
        db_table = 'locations'
        verbose_name = _("Адрес")
        verbose_name_plural = _("Адреса")
        
    def __str__(self):
        return f"{self.title}: {self.city}, {self.address}"


class UserPreference(TimeStampedModel):
    """
    Модель для хранения предпочтений пользователя
    """
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='preferences',
        verbose_name=_("Пользователь")
    )
    max_distance = models.PositiveIntegerField(
        _("Максимальное расстояние"), 
        default=50,
        help_text=_("Максимальное расстояние для поиска в километрах")
    )
    notification_enabled = models.BooleanField(
        _("Уведомления включены"), 
        default=True,
        help_text=_("Включить или отключить все уведомления")
    )
    email_notifications = models.BooleanField(
        _("Email уведомления"), 
        default=True,
        help_text=_("Получать уведомления по email")
    )
    push_notifications = models.BooleanField(
        _("Push уведомления"), 
        default=True,
        help_text=_("Получать push-уведомления")
    )

    class Meta:
        db_table = 'user_preferences'
        verbose_name = _("Предпочтение пользователя")
        verbose_name_plural = _("Предпочтения пользователей")
        
    def __str__(self):
        return f"Предпочтения {self.user.username}"
