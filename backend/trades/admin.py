from django.contrib import admin
from django.utils.html import format_html
from .models import TradeStatus, TradeOffer, TradeOfferItem, TradeHistory


@admin.register(TradeStatus)
class TradeStatusAdmin(admin.ModelAdmin):
    """Админка для статусов обменов"""
    list_display = ['name', 'description', 'is_active', 'order']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    ordering = ['order', 'name']
    list_editable = ['is_active', 'order']


class TradeOfferItemInline(admin.TabularInline):
    """Инлайн для предметов в предложении обмена"""
    model = TradeOfferItem
    extra = 0
    readonly_fields = ['item_title', 'item_owner']
    fields = ['item', 'item_title', 'item_owner', 'is_from_initiator']
    
    def item_title(self, obj):
        """Название предмета"""
        return obj.item.title if obj.item else '-'
    item_title.short_description = 'Название предмета'
    
    def item_owner(self, obj):
        """Владелец предмета"""
        return obj.item.owner.username if obj.item else '-'
    item_owner.short_description = 'Владелец'


class TradeHistoryInline(admin.TabularInline):
    """Инлайн для истории изменений"""
    model = TradeHistory
    extra = 0
    readonly_fields = ['created_at', 'previous_status', 'new_status', 'changed_by', 'comment']
    fields = ['created_at', 'previous_status', 'new_status', 'changed_by', 'comment']
    ordering = ['-created_at']
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(TradeOffer)
class TradeOfferAdmin(admin.ModelAdmin):
    """Админка для предложений обмена"""
    list_display = [
        'id', 'initiator_username', 'receiver_username', 
        'status_colored', 'created_at', 'completed_at'
    ]
    list_filter = ['status', 'created_at', 'completed_at', 'is_countered']
    search_fields = [
        'initiator__username', 'receiver__username', 
        'message', 'id'
    ]
    readonly_fields = [
        'created_at', 'updated_at', 'initiator_info', 
        'receiver_info', 'items_summary'
    ]
    fields = [
        'initiator', 'receiver', 'status', 'message',
        'is_countered', 'parent_offer', 'completed_at',
        'created_at', 'updated_at', 'initiator_info',
        'receiver_info', 'items_summary'
    ]
    inlines = [TradeOfferItemInline, TradeHistoryInline]
    ordering = ['-created_at']
    
    def initiator_username(self, obj):
        """Имя инициатора"""
        return obj.initiator.username
    initiator_username.short_description = 'Инициатор'
    initiator_username.admin_order_field = 'initiator__username'
    
    def receiver_username(self, obj):
        """Имя получателя"""
        return obj.receiver.username
    receiver_username.short_description = 'Получатель'
    receiver_username.admin_order_field = 'receiver__username'
    
    def status_colored(self, obj):
        """Цветной статус"""
        colors = {
            'pending': '#ffc107',
            'accepted': '#28a745',
            'rejected': '#dc3545',
            'completed': '#17a2b8',
            'cancelled': '#6c757d'
        }
        color = colors.get(obj.status.name, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.status.description
        )
    status_colored.short_description = 'Статус'
    status_colored.admin_order_field = 'status__name'
    
    def initiator_info(self, obj):
        """Информация об инициаторе"""
        user = obj.initiator
        profile_info = ""
        if hasattr(user, 'profile') and user.profile:
            profile_info = f" ({user.profile.first_name} {user.profile.last_name})"
        return f"{user.username}{profile_info}"
    initiator_info.short_description = 'Инициатор (подробно)'
    
    def receiver_info(self, obj):
        """Информация о получателе"""
        user = obj.receiver
        profile_info = ""
        if hasattr(user, 'profile') and user.profile:
            profile_info = f" ({user.profile.first_name} {user.profile.last_name})"
        return f"{user.username}{profile_info}"
    receiver_info.short_description = 'Получатель (подробно)'
    
    def items_summary(self, obj):
        """Краткая информация о предметах"""
        initiator_items = obj.trade_items.filter(is_from_initiator=True)
        receiver_items = obj.trade_items.filter(is_from_initiator=False)
        
        summary = f"Предлагает ({initiator_items.count()}): "
        summary += ", ".join([item.item.title for item in initiator_items[:3]])
        if initiator_items.count() > 3:
            summary += f" и еще {initiator_items.count() - 3}"
        
        summary += f"\nЗа ({receiver_items.count()}): "
        summary += ", ".join([item.item.title for item in receiver_items[:3]])
        if receiver_items.count() > 3:
            summary += f" и еще {receiver_items.count() - 3}"
        
        return summary
    items_summary.short_description = 'Предметы обмена'


@admin.register(TradeHistory)
class TradeHistoryAdmin(admin.ModelAdmin):
    """Админка для истории обменов"""
    list_display = [
        'trade_offer_id', 'previous_status', 'new_status', 
        'changed_by_username', 'created_at'
    ]
    list_filter = ['previous_status', 'new_status', 'created_at']
    search_fields = [
        'trade_offer__id', 'changed_by__username', 'comment'
    ]
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    def trade_offer_id(self, obj):
        """ID предложения обмена"""
        return f"#{obj.trade_offer.id}"
    trade_offer_id.short_description = 'Обмен'
    trade_offer_id.admin_order_field = 'trade_offer__id'
    
    def changed_by_username(self, obj):
        """Кто изменил"""
        return obj.changed_by.username if obj.changed_by else '-'
    changed_by_username.short_description = 'Изменил'
    changed_by_username.admin_order_field = 'changed_by__username'
    
    def has_add_permission(self, request):
        """Запрещаем добавление записей вручную"""
        return False
