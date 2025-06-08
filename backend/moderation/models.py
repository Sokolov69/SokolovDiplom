from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone
from common.models import TimeStampedModel

User = settings.AUTH_USER_MODEL

class ReportReason(models.Model):
    """
    Модель для причин жалоб
    """
    name = models.CharField(
        _("Название"), 
        max_length=100, 
        unique=True,
        help_text=_("Название причины жалобы")
    )
    description = models.TextField(
        _("Описание"), 
        null=True, 
        blank=True,
        help_text=_("Подробное описание причины")
    )
    is_active = models.BooleanField(
        _("Активна"), 
        default=True,
        help_text=_("Доступна ли причина для выбора")
    )
    order = models.PositiveSmallIntegerField(
        _("Порядок"), 
        default=0,
        help_text=_("Порядок отображения в списке")
    )

    class Meta:
        db_table = 'report_reasons'
        verbose_name = _("Причина жалобы")
        verbose_name_plural = _("Причины жалоб")
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Report(TimeStampedModel):
    """
    Модель для жалоб на контент или пользователей
    """
    REPORT_STATUS_CHOICES = [
        ('pending', _('Ожидает')),
        ('in_progress', _('В работе')),
        ('resolved', _('Разрешена')),
        ('rejected', _('Отклонена')),
    ]
    
    reporter = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='submitted_reports',
        verbose_name=_("Отправитель"),
        help_text=_("Пользователь, отправивший жалобу")
    )
    reason = models.ForeignKey(
        ReportReason, 
        on_delete=models.PROTECT, 
        related_name='reports',
        verbose_name=_("Причина"),
        help_text=_("Причина жалобы")
    )
    entity_type = models.CharField(
        _("Тип сущности"), 
        max_length=100,
        help_text=_("Тип сущности (Item, User, Review и т.д.)")
    )
    entity_id = models.PositiveIntegerField(
        _("ID сущности"),
        help_text=_("ID сущности, на которую подана жалоба")
    )
    description = models.TextField(
        _("Описание"),
        help_text=_("Подробное описание проблемы")
    )
    status = models.CharField(
        _("Статус"), 
        max_length=20, 
        choices=REPORT_STATUS_CHOICES, 
        default='pending',
        help_text=_("Текущий статус жалобы")
    )
    resolved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='resolved_reports',
        verbose_name=_("Обработал"),
        help_text=_("Модератор, обработавший жалобу")
    )
    resolution_note = models.TextField(
        _("Примечание"), 
        null=True, 
        blank=True,
        help_text=_("Примечание по результатам обработки жалобы")
    )
    resolved_at = models.DateTimeField(
        _("Дата обработки"), 
        null=True, 
        blank=True,
        help_text=_("Дата обработки жалобы")
    )
    
    class Meta:
        db_table = 'reports'
        verbose_name = _("Жалоба")
        verbose_name_plural = _("Жалобы")
        ordering = ['-created_at']

    def __str__(self):
        return f"Жалоба #{self.id} от {self.reporter.username}"
    
    def resolve(self, resolver, status, note=None):
        """
        Обработать жалобу
        """
        self.status = status
        self.resolved_by = resolver
        self.resolved_at = timezone.now()
        if note:
            self.resolution_note = note
        self.save()


class BlockReason(models.Model):
    """
    Модель для причин блокировки пользователей
    """
    name = models.CharField(
        _("Название"), 
        max_length=100, 
        unique=True,
        help_text=_("Название причины блокировки")
    )
    description = models.TextField(
        _("Описание"), 
        null=True, 
        blank=True,
        help_text=_("Подробное описание причины")
    )
    is_active = models.BooleanField(
        _("Активна"), 
        default=True,
        help_text=_("Доступна ли причина для выбора")
    )
    suggested_duration_days = models.PositiveIntegerField(
        _("Рекомендуемый срок (дни)"), 
        default=0,
        help_text=_("Рекомендуемый срок блокировки в днях (0 - бессрочно)")
    )

    class Meta:
        db_table = 'block_reasons'
        verbose_name = _("Причина блокировки")
        verbose_name_plural = _("Причины блокировок")

    def __str__(self):
        return self.name


class UserBlock(TimeStampedModel):
    """
    Модель для блокировки пользователей
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='blocks',
        verbose_name=_("Пользователь"),
        help_text=_("Заблокированный пользователь")
    )
    reason = models.ForeignKey(
        BlockReason, 
        on_delete=models.PROTECT, 
        related_name='user_blocks',
        verbose_name=_("Причина"),
        help_text=_("Причина блокировки")
    )
    blocked_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='blocked_users',
        verbose_name=_("Заблокировал"),
        help_text=_("Модератор, выполнивший блокировку")
    )
    comment = models.TextField(
        _("Комментарий"), 
        null=True, 
        blank=True,
        help_text=_("Внутренний комментарий о блокировке")
    )
    message_for_user = models.TextField(
        _("Сообщение пользователю"), 
        null=True, 
        blank=True,
        help_text=_("Сообщение, которое будет показано пользователю")
    )
    end_date = models.DateTimeField(
        _("Дата окончания"), 
        null=True, 
        blank=True,
        help_text=_("Дата окончания блокировки (пусто для бессрочной)")
    )
    is_active = models.BooleanField(
        _("Активна"), 
        default=True,
        help_text=_("Активна ли блокировка")
    )
    related_report = models.ForeignKey(
        Report, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='resulting_blocks',
        verbose_name=_("Связанная жалоба"),
        help_text=_("Жалоба, в результате которой была выполнена блокировка")
    )
    
    class Meta:
        db_table = 'user_blocks'
        verbose_name = _("Блокировка пользователя")
        verbose_name_plural = _("Блокировки пользователей")
        ordering = ['-created_at']

    def __str__(self):
        if self.end_date:
            return f"Блокировка {self.user.username} до {self.end_date.strftime('%d.%m.%Y')}"
        return f"Бессрочная блокировка {self.user.username}"
    
    def unblock(self, comment=None):
        """
        Снять блокировку с пользователя
        """
        self.is_active = False
        if comment:
            self.comment += f"\n\nСнята: {comment}"
        self.save()


class ModeratedContent(TimeStampedModel):
    """
    Модель для отслеживания модерируемого контента
    """
    MODERATION_STATUS_CHOICES = [
        ('pending', _('Ожидает')),
        ('approved', _('Одобрено')),
        ('rejected', _('Отклонено')),
        ('auto_approved', _('Авто-одобрено')),
    ]
    
    entity_type = models.CharField(
        _("Тип сущности"), 
        max_length=100,
        help_text=_("Тип модерируемой сущности")
    )
    entity_id = models.PositiveIntegerField(
        _("ID сущности"),
        help_text=_("ID модерируемой сущности")
    )
    status = models.CharField(
        _("Статус"), 
        max_length=20, 
        choices=MODERATION_STATUS_CHOICES, 
        default='pending',
        help_text=_("Статус модерации")
    )
    moderated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='moderated_content',
        verbose_name=_("Модератор"),
        help_text=_("Модератор, обработавший содержимое")
    )
    moderated_at = models.DateTimeField(
        _("Дата модерации"), 
        null=True, 
        blank=True,
        help_text=_("Дата проведения модерации")
    )
    note = models.TextField(
        _("Примечание"), 
        null=True, 
        blank=True,
        help_text=_("Примечание модератора")
    )
    rejection_reason = models.CharField(
        _("Причина отклонения"), 
        max_length=255, 
        null=True, 
        blank=True,
        help_text=_("Причина отклонения контента")
    )
    
    class Meta:
        db_table = 'moderated_content'
        verbose_name = _("Модерируемый контент")
        verbose_name_plural = _("Модерируемый контент")
        unique_together = ('entity_type', 'entity_id')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.entity_type} #{self.entity_id}: {self.status}"


class ModeratorPermission(models.Model):
    """
    Модель для определения прав модераторов в системе
    """
    PERMISSION_TYPES = [
        ('review_items', _('Модерация предметов')),
        ('review_profiles', _('Модерация профилей')),
        ('review_reviews', _('Модерация отзывов')),
        ('review_reports', _('Обработка жалоб')),
        ('ban_users', _('Блокировка пользователей')),
        ('delete_content', _('Удаление контента')),
        ('edit_content', _('Редактирование контента')),
    ]
    
    name = models.CharField(
        _("Название"), 
        max_length=50, 
        choices=PERMISSION_TYPES, 
        unique=True,
        help_text=_("Тип права доступа для модераторов")
    )
    description = models.TextField(
        _("Описание"), 
        null=True, 
        blank=True,
        help_text=_("Описание права доступа")
    )
    is_active = models.BooleanField(
        _("Активно"), 
        default=True,
        help_text=_("Активно ли право доступа в системе")
    )
    
    class Meta:
        db_table = 'moderator_permissions'
        verbose_name = _("Право модератора")
        verbose_name_plural = _("Права модераторов")
        
    def __str__(self):
        return self.get_name_display()


class ModeratorRole(models.Model):
    """
    Модель для ролей модераторов с разными уровнями доступа
    """
    name = models.CharField(
        _("Название"), 
        max_length=100, 
        unique=True,
        help_text=_("Название роли модератора")
    )
    description = models.TextField(
        _("Описание"), 
        null=True, 
        blank=True,
        help_text=_("Описание роли модератора")
    )
    permissions = models.ManyToManyField(
        ModeratorPermission, 
        related_name='roles',
        verbose_name=_("Права доступа"),
        help_text=_("Права доступа, предоставляемые ролью")
    )
    priority = models.PositiveSmallIntegerField(
        _("Приоритет"), 
        default=0,
        help_text=_("Приоритет роли (выше число - выше приоритет)")
    )
    is_active = models.BooleanField(
        _("Активна"), 
        default=True,
        help_text=_("Активна ли роль модератора")
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
        db_table = 'moderator_roles'
        verbose_name = _("Роль модератора")
        verbose_name_plural = _("Роли модераторов")
        ordering = ['-priority']
        
    def __str__(self):
        return self.name


class ModeratorAssignment(TimeStampedModel):
    """
    Модель для назначения модераторов на определенные категории или типы контента
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='moderator_assignments',
        verbose_name=_("Модератор"),
        help_text=_("Пользователь, назначенный модератором")
    )
    role = models.ForeignKey(
        ModeratorRole, 
        on_delete=models.PROTECT, 
        related_name='assignments',
        verbose_name=_("Роль модератора"),
        help_text=_("Роль модератора с определенными правами")
    )
    category = models.ForeignKey(
        'categories.Category', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='moderators',
        verbose_name=_("Категория"),
        help_text=_("Категория, которую модерирует пользователь (если применимо)")
    )
    content_type = models.CharField(
        _("Тип контента"), 
        max_length=100, 
        null=True, 
        blank=True,
        help_text=_("Тип контента для модерации (items, reviews, profiles и т.д.)")
    )
    is_active = models.BooleanField(
        _("Активно"), 
        default=True,
        help_text=_("Активно ли назначение")
    )
    assigned_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='moderator_appointments',
        verbose_name=_("Назначил"),
        help_text=_("Администратор, назначивший модератора")
    )
    
    class Meta:
        db_table = 'moderator_assignments'
        verbose_name = _("Назначение модератора")
        verbose_name_plural = _("Назначения модераторов")
        unique_together = (('user', 'category'), ('user', 'content_type'))
        
    def __str__(self):
        if self.category:
            return f"{self.user.username}: модератор категории {self.category.name}"
        elif self.content_type:
            return f"{self.user.username}: модератор {self.content_type}"
        return f"{self.user.username}: модератор"
