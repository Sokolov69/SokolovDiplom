from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from common.models import TimeStampedModel, SoftDeleteModel

User = settings.AUTH_USER_MODEL

class Chat(TimeStampedModel, SoftDeleteModel):
    """
    Модель для чатов между пользователями
    """
    participants = models.ManyToManyField(
        User, 
        related_name='chats',
        verbose_name=_("Участники"),
        help_text=_("Пользователи, участвующие в чате")
    )
    trade_offer = models.ForeignKey(
        'trades.TradeOffer', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='chat',
        verbose_name=_("Предложение обмена"),
        help_text=_("Предложение обмена, к которому относится чат")
    )
    is_active = models.BooleanField(
        _("Активен"), 
        default=True,
        help_text=_("Активен ли чат")
    )
    last_message_time = models.DateTimeField(
        _("Время последнего сообщения"),
        null=True,
        blank=True,
        help_text=_("Время отправки последнего сообщения в чате")
    )

    class Meta:
        db_table = 'chats'
        verbose_name = _("Чат")
        verbose_name_plural = _("Чаты")
        ordering = ['-last_message_time', '-created_at']

    def __str__(self):
        return f"Чат #{self.id}"


class Message(TimeStampedModel, SoftDeleteModel):
    """
    Модель для сообщений в чатах
    """
    chat = models.ForeignKey(
        Chat, 
        on_delete=models.CASCADE, 
        related_name='messages',
        verbose_name=_("Чат"),
        help_text=_("Чат, в котором отправлено сообщение")
    )
    sender = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='sent_messages',
        verbose_name=_("Отправитель"),
        help_text=_("Пользователь, отправивший сообщение")
    )
    content = models.TextField(
        _("Содержание"),
        help_text=_("Текст сообщения")
    )
    is_read = models.BooleanField(
        _("Прочитано"), 
        default=False,
        help_text=_("Прочитано ли сообщение получателем")
    )
    read_at = models.DateTimeField(
        _("Время прочтения"), 
        null=True, 
        blank=True,
        help_text=_("Время, когда сообщение было прочитано")
    )

    class Meta:
        db_table = 'messages'
        verbose_name = _("Сообщение")
        verbose_name_plural = _("Сообщения")
        ordering = ['created_at']

    def __str__(self):
        return f"Сообщение от {self.sender.username} в чате #{self.chat.id}"


class MessageAttachment(TimeStampedModel):
    """
    Модель для вложений к сообщениям
    """
    message = models.ForeignKey(
        Message, 
        on_delete=models.CASCADE, 
        related_name='attachments',
        verbose_name=_("Сообщение"),
        help_text=_("Сообщение, к которому прикреплено вложение")
    )
    file = models.FileField(
        _("Файл"), 
        upload_to='message_attachments/',
        help_text=_("Прикрепленный файл")
    )
    file_name = models.CharField(
        _("Имя файла"), 
        max_length=255,
        help_text=_("Оригинальное имя файла")
    )
    file_size = models.PositiveIntegerField(
        _("Размер файла"), 
        help_text=_("Размер файла в байтах")
    )
    file_type = models.CharField(
        _("Тип файла"), 
        max_length=100,
        help_text=_("MIME-тип файла")
    )

    class Meta:
        db_table = 'message_attachments'
        verbose_name = _("Вложение к сообщению")
        verbose_name_plural = _("Вложения к сообщениям")

    def __str__(self):
        return f"Вложение {self.file_name} к сообщению #{self.message.id}"


class ChatParticipantStatus(models.Model):
    """
    Модель для хранения статуса пользователя в чате
    """
    chat = models.ForeignKey(
        Chat, 
        on_delete=models.CASCADE, 
        related_name='participant_statuses',
        verbose_name=_("Чат")
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='chat_statuses',
        verbose_name=_("Пользователь")
    )
    last_read_message = models.ForeignKey(
        Message, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='+',
        verbose_name=_("Последнее прочитанное сообщение")
    )
    unread_count = models.PositiveIntegerField(
        _("Непрочитанных сообщений"), 
        default=0,
        help_text=_("Количество непрочитанных сообщений")
    )
    is_muted = models.BooleanField(
        _("Без уведомлений"), 
        default=False,
        help_text=_("Отключены ли уведомления для этого чата")
    )
    
    class Meta:
        db_table = 'chat_participant_statuses'
        verbose_name = _("Статус участника чата")
        verbose_name_plural = _("Статусы участников чатов")
        unique_together = ('chat', 'user')

    def __str__(self):
        return f"Статус {self.user.username} в чате #{self.chat.id}"
