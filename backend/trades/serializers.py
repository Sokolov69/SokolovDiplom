from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from django.conf import settings
from .models import TradeStatus, TradeOffer, TradeOfferItem, TradeHistory
from items.models import Item
from profiles.serializers import LocationSerializer

User = get_user_model()


class TradeStatusSerializer(serializers.ModelSerializer):
    """Сериализатор для статусов обменов"""
    
    class Meta:
        model = TradeStatus
        fields = ['id', 'name', 'description']


class UserForTradeSerializer(serializers.ModelSerializer):
    """Расширенный сериализатор пользователя для отображения в обменах"""
    avatar_url = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    successful_trades = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'full_name',
            'avatar_url', 'rating', 'total_reviews', 'successful_trades'
        ]
    
    def get_avatar_url(self, obj):
        """
        Получает URL аватара пользователя из профиля
        """
        try:
            profile = obj.profile
            if profile.avatar:
                avatar_path = str(profile.avatar)
                if settings.USE_S3:
                    return f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{settings.MEDIA_LOCATION}/{avatar_path}"
                return f"{settings.MEDIA_URL}{avatar_path}"
        except:
            pass
        return None
    
    def get_full_name(self, obj):
        """
        Возвращает полное имя пользователя
        """
        first_name = obj.first_name or ''
        last_name = obj.last_name or ''
        full_name = f"{first_name} {last_name}".strip()
        return full_name if full_name else obj.username
    
    def get_rating(self, obj):
        """
        Получает рейтинг пользователя из профиля
        """
        try:
            return float(obj.profile.rating)
        except:
            return 0.0
    
    def get_total_reviews(self, obj):
        """
        Получает количество отзывов пользователя из профиля
        """
        try:
            return obj.profile.total_reviews
        except:
            return 0
    
    def get_successful_trades(self, obj):
        """
        Получает количество успешных обменов пользователя из профиля
        """
        try:
            return obj.profile.successful_trades
        except:
            return 0


class ItemBasicSerializer(serializers.ModelSerializer):
    """Базовый сериализатор предмета для отображения в обменах"""
    primary_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = ['id', 'title', 'primary_image']
    
    def get_primary_image(self, obj):
        """Получаем URL основного изображения предмета"""
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image and primary_image.image:
            # Возвращаем прямой URL с S3
            image_path = str(primary_image.image)
            return f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{settings.MEDIA_LOCATION}/{image_path}"
        return None


class TradeOfferSerializer(serializers.ModelSerializer):
    """Сериализатор для предложений обмена"""
    initiator = UserForTradeSerializer(read_only=True)
    receiver = UserForTradeSerializer(read_only=True)
    status = TradeStatusSerializer(read_only=True)
    location_details = LocationSerializer(source='location', read_only=True)
    initiator_items = serializers.SerializerMethodField()
    receiver_items = serializers.SerializerMethodField()
    
    class Meta:
        model = TradeOffer
        fields = [
            'id', 'initiator', 'receiver', 'status', 'location', 'location_details',
            'message', 'created_at', 'initiator_items', 'receiver_items'
        ]
    
    def get_initiator_items(self, obj):
        """Получаем предметы инициатора"""
        items = []
        for trade_item in obj.trade_items.filter(is_from_initiator=True):
            items.append(ItemBasicSerializer(trade_item.item, context=self.context).data)
        return items
    
    def get_receiver_items(self, obj):
        """Получаем предметы получателя"""
        items = []
        for trade_item in obj.trade_items.filter(is_from_initiator=False):
            items.append(ItemBasicSerializer(trade_item.item, context=self.context).data)
        return items


class CreateTradeOfferSerializer(serializers.Serializer):
    """Сериализатор для создания предложения обмена"""
    receiver_id = serializers.IntegerField()
    location = serializers.IntegerField(required=False, allow_null=True)
    message = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    initiator_items = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="Список ID предметов инициатора"
    )
    receiver_items = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="Список ID предметов получателя"
    )
    
    def validate_receiver_id(self, value):
        """Валидация получателя"""
        try:
            receiver = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Пользователь не найден")
        
        # Проверяем, что пользователь не создает предложение самому себе
        request = self.context.get('request')
        if request and request.user.id == value:
            raise serializers.ValidationError("Нельзя создать предложение самому себе")
        
        return value
    
    def validate_initiator_items(self, value):
        """Валидация предметов инициатора"""
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError("Не удалось определить пользователя")
        
        # Проверяем, что все предметы принадлежат инициатору
        items = Item.objects.filter(id__in=value, owner=request.user)
        if len(items) != len(value):
            raise serializers.ValidationError("Некоторые предметы не принадлежат вам")
        
        # Проверяем, что предметы доступны для обмена
        unavailable_items = items.filter(status__name__in=['reserved', 'traded'])
        if unavailable_items.exists():
            raise serializers.ValidationError("Некоторые предметы недоступны для обмена")
        
        return value
    
    def validate_receiver_items(self, value):
        """Валидация предметов получателя"""
        receiver_id = self.initial_data.get('receiver_id')
        if not receiver_id:
            raise serializers.ValidationError("Не указан получатель")
        
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            raise serializers.ValidationError("Получатель не найден")
        
        # Проверяем, что все предметы принадлежат получателю
        items = Item.objects.filter(id__in=value, owner=receiver)
        if len(items) != len(value):
            raise serializers.ValidationError("Некоторые предметы не принадлежат получателю")
        
        # Проверяем, что предметы доступны для обмена
        unavailable_items = items.filter(status__name__in=['reserved', 'traded'])
        if unavailable_items.exists():
            raise serializers.ValidationError("Некоторые предметы получателя недоступны для обмена")
        
        return value
    
    def validate_location(self, value):
        """Валидация адреса встречи"""
        if value is None:
            return value
        
        from profiles.models import Location
        
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError("Не удалось определить пользователя")
        
        receiver_id = self.initial_data.get('receiver_id')
        if not receiver_id:
            raise serializers.ValidationError("Не указан получатель")
        
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            raise serializers.ValidationError("Получатель не найден")
        
        # Проверяем, что адрес принадлежит либо инициатору, либо получателю
        try:
            location = Location.objects.get(id=value)
            if location.user_id not in [request.user.id, receiver.id]:
                raise serializers.ValidationError("Адрес должен принадлежать одному из участников обмена")
        except Location.DoesNotExist:
            raise serializers.ValidationError("Адрес не найден")
        
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        """Создание предложения обмена"""
        request = self.context.get('request')
        
        # Получаем статус "pending"
        pending_status = TradeStatus.objects.get(name='pending')
        
        # Создаем предложение
        trade_offer = TradeOffer.objects.create(
            initiator=request.user,
            receiver_id=validated_data['receiver_id'],
            status=pending_status,
            location_id=validated_data.get('location'),
            message=validated_data.get('message', '')
        )
        
        # Добавляем предметы инициатора
        for item_id in validated_data['initiator_items']:
            TradeOfferItem.objects.create(
                trade_offer=trade_offer,
                item_id=item_id,
                is_from_initiator=True
            )
        
        # Добавляем предметы получателя
        for item_id in validated_data['receiver_items']:
            TradeOfferItem.objects.create(
                trade_offer=trade_offer,
                item_id=item_id,
                is_from_initiator=False
            )
        
        return trade_offer


class TradeActionSerializer(serializers.Serializer):
    """Сериализатор для действий с предложениями обмена"""
    comment = serializers.CharField(max_length=500, required=False, allow_blank=True) 