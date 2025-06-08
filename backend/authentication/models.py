from django.contrib.auth.models import AbstractUser, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _
from common.models import TimeStampedModel

# Create your models here.

class Role(models.Model):
    """
    Модель для ролей пользователей в системе
    """
    name = models.CharField(
        _("Название"), 
        max_length=100, 
        unique=True,
        help_text=_("Название роли")
    )
    description = models.TextField(
        _("Описание"), 
        null=True, 
        blank=True,
        help_text=_("Описание роли и её полномочий")
    )
    permissions = models.ManyToManyField(
        Permission, 
        blank=True, 
        related_name='roles',
        verbose_name=_("Права доступа"),
        help_text=_("Права доступа, предоставляемые этой ролью")
    )
    is_staff_role = models.BooleanField(
        _("Роль персонала"), 
        default=False,
        help_text=_("Предоставляет ли роль доступ к админ-панели")
    )
    is_moderator_role = models.BooleanField(
        _("Роль модератора"), 
        default=False,
        help_text=_("Предоставляет ли роль доступ к инструментам модерации")
    )
    is_superuser_role = models.BooleanField(
        _("Роль суперпользователя"), 
        default=False,
        help_text=_("Предоставляет ли роль полный доступ к системе")
    )
    priority = models.PositiveSmallIntegerField(
        _("Приоритет"), 
        default=0,
        help_text=_("Приоритет роли (выше число - выше приоритет)")
    )
    created_at = models.DateTimeField(
        _("Дата создания"), 
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        _("Дата обновления"), 
        auto_now=True
    )

    class Meta:
        db_table = 'roles'
        verbose_name = _("Роль")
        verbose_name_plural = _("Роли")
        ordering = ['-priority']

    def __str__(self):
        return self.name


class User(AbstractUser):
    """
    Расширенная модель пользователя
    """
    created_at = models.DateTimeField(
        _("Дата создания"), 
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        _("Дата обновления"), 
        auto_now=True
    )
    roles = models.ManyToManyField(
        Role, 
        related_name='users', 
        blank=True,
        verbose_name=_("Роли"),
        help_text=_("Роли пользователя в системе")
    )
    is_banned = models.BooleanField(
        _("Заблокирован"), 
        default=False,
        help_text=_("Заблокирован ли пользователь")
    )
    ban_reason = models.TextField(
        _("Причина блокировки"), 
        null=True, 
        blank=True,
        help_text=_("Причина блокировки пользователя")
    )
    ban_expiry = models.DateTimeField(
        _("Окончание блокировки"), 
        null=True, 
        blank=True,
        help_text=_("Дата окончания блокировки (пусто для бессрочной)")
    )
    last_activity = models.DateTimeField(
        _("Последняя активность"), 
        null=True, 
        blank=True,
        help_text=_("Дата и время последней активности пользователя")
    )

    class Meta:
        db_table = 'users'
        verbose_name = _("Пользователь")
        verbose_name_plural = _("Пользователи")

    def __str__(self):
        return self.username
    
    @property
    def is_moderator(self):
        """Проверяет, имеет ли пользователь роль модератора"""
        return self.roles.filter(is_moderator_role=True).exists()
    
    @property
    def highest_role(self):
        """Возвращает роль пользователя с наивысшим приоритетом"""
        return self.roles.order_by('-priority').first()
    
    def add_role(self, role_name):
        """Добавляет роль пользователю по названию"""
        role = Role.objects.get(name=role_name)
        self.roles.add(role)
    
    def remove_role(self, role_name):
        """Удаляет роль у пользователя по названию"""
        role = Role.objects.get(name=role_name)
        self.roles.remove(role)
    
    def has_role(self, role_name):
        """Проверяет, имеет ли пользователь указанную роль"""
        return self.roles.filter(name=role_name).exists()


class UserActionLog(TimeStampedModel):
    """
    Модель для логирования действий администраторов и модераторов
    """
    ACTION_TYPES = [
        ('user_ban', _('Блокировка пользователя')),
        ('user_unban', _('Разблокировка пользователя')),
        ('user_role_add', _('Добавление роли пользователю')),
        ('user_role_remove', _('Удаление роли у пользователя')),
        ('content_approve', _('Одобрение контента')),
        ('content_reject', _('Отклонение контента')),
        ('report_resolve', _('Обработка жалобы')),
        ('system_change', _('Изменение настроек системы')),
        ('other', _('Другое')),
    ]
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='action_logs',
        verbose_name=_("Пользователь"),
        help_text=_("Пользователь, выполнивший действие")
    )
    action_type = models.CharField(
        _("Тип действия"), 
        max_length=50, 
        choices=ACTION_TYPES,
        help_text=_("Тип выполненного действия")
    )
    description = models.TextField(
        _("Описание"),
        help_text=_("Подробное описание действия")
    )
    target_user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='targeted_logs',
        verbose_name=_("Целевой пользователь"),
        help_text=_("Пользователь, над которым выполнено действие (если применимо)")
    )
    entity_type = models.CharField(
        _("Тип сущности"), 
        max_length=100, 
        null=True, 
        blank=True,
        help_text=_("Тип сущности, над которой выполнено действие")
    )
    entity_id = models.PositiveIntegerField(
        _("ID сущности"), 
        null=True, 
        blank=True,
        help_text=_("ID сущности, над которой выполнено действие")
    )
    ip_address = models.GenericIPAddressField(
        _("IP-адрес"), 
        null=True, 
        blank=True,
        help_text=_("IP-адрес, с которого выполнено действие")
    )

    class Meta:
        db_table = 'user_action_logs'
        verbose_name = _("Лог действий пользователя")
        verbose_name_plural = _("Логи действий пользователей")
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_action_type_display()} пользователем {self.user.username}"
