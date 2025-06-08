from django.contrib import admin
from django.utils.html import format_html
from .models import Chat, Message, MessageAttachment, ChatParticipantStatus


class MessageInline(admin.TabularInline):
    """Инлайн для сообщений в чате"""
    model = Message
    extra = 0
    readonly_fields = ['sender', 'created_at', 'is_read', 'read_at']
    fields = ['sender', 'content', 'is_read', 'read_at', 'created_at']
    ordering = ['-created_at']
    
    def has_add_permission(self, request, obj=None):
        return False


class ChatParticipantStatusInline(admin.TabularInline):
    """Инлайн для статусов участников чата"""
    model = ChatParticipantStatus
    extra = 0
    readonly_fields = ['unread_count']
    fields = ['user', 'unread_count', 'is_muted']


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    """Админка для чатов"""
    list_display = [
        'id', 'get_participants', 'trade_offer', 'is_active', 
        'last_message_time', 'get_messages_count', 'created_at'
    ]
    list_filter = ['is_active', 'created_at', 'last_message_time']
    search_fields = ['participants__username', 'trade_offer__id']
    filter_horizontal = ['participants']
    readonly_fields = ['last_message_time', 'created_at', 'updated_at']
    inlines = [ChatParticipantStatusInline, MessageInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('participants', 'trade_offer', 'is_active')
        }),
        ('Временные метки', {
            'fields': ('last_message_time', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_participants(self, obj):
        """Получает список участников чата"""
        participants = obj.participants.all()
        if participants:
            return ', '.join([p.username for p in participants])
        return 'Нет участников'
    get_participants.short_description = 'Участники'
    
    def get_messages_count(self, obj):
        """Получает количество сообщений в чате"""
        count = obj.messages.filter(is_deleted=False).count()
        return format_html('<strong>{}</strong>', count)
    get_messages_count.short_description = 'Сообщений'


class MessageAttachmentInline(admin.TabularInline):
    """Инлайн для вложений к сообщениям"""
    model = MessageAttachment
    extra = 0
    readonly_fields = ['file_size', 'file_type', 'created_at']
    fields = ['file', 'file_name', 'file_size', 'file_type', 'created_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Админка для сообщений"""
    list_display = [
        'id', 'get_chat_info', 'sender', 'get_content_preview',
        'is_read', 'read_at', 'created_at'
    ]
    list_filter = ['is_read', 'created_at', 'chat__trade_offer']
    search_fields = ['sender__username', 'content', 'chat__id']
    readonly_fields = ['sender', 'is_read', 'read_at', 'created_at', 'updated_at']
    inlines = [MessageAttachmentInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('chat', 'sender', 'content')
        }),
        ('Статус прочтения', {
            'fields': ('is_read', 'read_at')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_chat_info(self, obj):
        """Получает информацию о чате"""
        chat = obj.chat
        if chat.trade_offer:
            return format_html(
                'Чат #{} (Сделка #{})', 
                chat.id, chat.trade_offer.id
            )
        else:
            participants = chat.participants.all()
            if participants:
                return format_html(
                    'Чат #{} ({})', 
                    chat.id, ', '.join([p.username for p in participants])
                )
        return f'Чат #{chat.id}'
    get_chat_info.short_description = 'Чат'
    
    def get_content_preview(self, obj):
        """Получает превью содержимого сообщения"""
        if len(obj.content) > 50:
            return obj.content[:50] + '...'
        return obj.content
    get_content_preview.short_description = 'Содержание'


@admin.register(MessageAttachment)
class MessageAttachmentAdmin(admin.ModelAdmin):
    """Админка для вложений к сообщениям"""
    list_display = [
        'id', 'get_message_info', 'file_name', 'get_file_size',
        'file_type', 'created_at'
    ]
    list_filter = ['file_type', 'created_at']
    search_fields = ['file_name', 'message__content', 'message__sender__username']
    readonly_fields = ['file_size', 'file_type', 'created_at']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('message', 'file', 'file_name')
        }),
        ('Метаданные файла', {
            'fields': ('file_size', 'file_type')
        }),
        ('Временные метки', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_message_info(self, obj):
        """Получает информацию о сообщении"""
        message = obj.message
        return format_html(
            'Сообщение #{} от {}', 
            message.id, message.sender.username
        )
    get_message_info.short_description = 'Сообщение'
    
    def get_file_size(self, obj):
        """Получает размер файла в читаемом формате"""
        size = obj.file_size
        if size < 1024:
            return f'{size} байт'
        elif size < 1024 * 1024:
            return f'{size / 1024:.1f} КБ'
        else:
            return f'{size / (1024 * 1024):.1f} МБ'
    get_file_size.short_description = 'Размер файла'


@admin.register(ChatParticipantStatus)
class ChatParticipantStatusAdmin(admin.ModelAdmin):
    """Админка для статусов участников чатов"""
    list_display = [
        'id', 'get_chat_info', 'user', 'unread_count',
        'is_muted', 'get_last_read_message'
    ]
    list_filter = ['is_muted', 'unread_count']
    search_fields = ['user__username', 'chat__id']
    readonly_fields = ['unread_count']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('chat', 'user')
        }),
        ('Статус', {
            'fields': ('last_read_message', 'unread_count', 'is_muted')
        }),
    )
    
    def get_chat_info(self, obj):
        """Получает информацию о чате"""
        chat = obj.chat
        if chat.trade_offer:
            return format_html(
                'Чат #{} (Сделка #{})', 
                chat.id, chat.trade_offer.id
            )
        return f'Чат #{chat.id}'
    get_chat_info.short_description = 'Чат'
    
    def get_last_read_message(self, obj):
        """Получает информацию о последнем прочитанном сообщении"""
        if obj.last_read_message:
            return format_html(
                'Сообщение #{}', 
                obj.last_read_message.id
            )
        return 'Нет'
    get_last_read_message.short_description = 'Последнее прочитанное'
