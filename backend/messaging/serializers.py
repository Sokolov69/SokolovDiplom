from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Q, Max, Count
from .models import Chat, Message, MessageAttachment, ChatParticipantStatus
from authentication.serializers import UserSerializer

User = get_user_model()


class MessageAttachmentSerializer(serializers.ModelSerializer):
    """Сериализатор для вложений к сообщениям"""
    
    class Meta:
        model = MessageAttachment
        fields = [
            'id', 'file', 'file_name', 'file_size', 
            'file_type', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    """Сериализатор для сообщений"""
    sender_details = UserSerializer(source='sender', read_only=True)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'chat', 'sender', 'sender_details', 'content',
            'is_read', 'read_at', 'attachments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'sender', 'is_read', 'read_at', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class CreateMessageSerializer(serializers.ModelSerializer):
    """Сериализатор для создания сообщений"""
    attachments = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Message
        fields = ['chat', 'content', 'attachments']

    def create(self, validated_data):
        attachments_data = validated_data.pop('attachments', [])
        validated_data['sender'] = self.context['request'].user
        
        message = super().create(validated_data)
        
        # Создаем вложения
        for attachment_file in attachments_data:
            MessageAttachment.objects.create(
                message=message,
                file=attachment_file,
                file_name=attachment_file.name,
                file_size=attachment_file.size,
                file_type=getattr(attachment_file, 'content_type', 'application/octet-stream')
            )
        
        # Обновляем время последнего сообщения в чате
        chat = message.chat
        chat.last_message_time = message.created_at
        chat.save(update_fields=['last_message_time'])
        
        return message


class ChatParticipantStatusSerializer(serializers.ModelSerializer):
    """Сериализатор для статуса участника чата"""
    
    class Meta:
        model = ChatParticipantStatus
        fields = [
            'user', 'last_read_message', 'unread_count', 
            'is_muted'
        ]


class ChatSerializer(serializers.ModelSerializer):
    """Сериализатор для чатов"""
    participants_details = UserSerializer(source='participants', many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    is_muted = serializers.SerializerMethodField()
    
    class Meta:
        model = Chat
        fields = [
            'id', 'participants', 'participants_details', 'trade_offer',
            'is_active', 'last_message_time', 'last_message', 
            'unread_count', 'is_muted', 'created_at'
        ]
        read_only_fields = ['id', 'last_message_time', 'created_at']

    def get_last_message(self, obj):
        """Получает последнее сообщение в чате"""
        last_message = obj.messages.filter(is_deleted=False).last()
        if last_message:
            return MessageSerializer(last_message).data
        return None

    def get_unread_count(self, obj):
        """Получает количество непрочитанных сообщений для текущего пользователя"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                status = obj.participant_statuses.get(user=request.user)
                return status.unread_count
            except ChatParticipantStatus.DoesNotExist:
                return 0
        return 0

    def get_is_muted(self, obj):
        """Проверяет отключены ли уведомления для текущего пользователя"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                status = obj.participant_statuses.get(user=request.user)
                return status.is_muted
            except ChatParticipantStatus.DoesNotExist:
                return False
        return False


class CreateChatSerializer(serializers.ModelSerializer):
    """Сериализатор для создания чатов"""
    participants = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True
    )
    
    class Meta:
        model = Chat
        fields = ['participants', 'trade_offer']

    def validate_participants(self, value):
        """Валидация участников чата"""
        if len(value) < 2:
            raise serializers.ValidationError("В чате должно быть минимум 2 участника")
        
        # Проверяем что все пользователи существуют
        users = User.objects.filter(id__in=value)
        if users.count() != len(value):
            raise serializers.ValidationError("Один или несколько пользователей не найдены")
        
        return value

    def validate(self, data):
        """Общая валидация"""
        # Если указан trade_offer, проверяем что текущий пользователь участник сделки
        if data.get('trade_offer'):
            trade_offer = data['trade_offer']
            current_user = self.context['request'].user
            if current_user not in [trade_offer.initiator, trade_offer.receiver]:
                raise serializers.ValidationError(
                    "Вы не можете создать чат для сделки, в которой не участвуете"
                )
            
            # Для чата сделки участники должны быть инициатор и получатель
            required_participants = {trade_offer.initiator.id, trade_offer.receiver.id}
            provided_participants = set(data['participants'])
            if required_participants != provided_participants:
                raise serializers.ValidationError(
                    "Для чата сделки участниками должны быть только инициатор и получатель"
                )
        
        return data

    def create(self, validated_data):
        participants_ids = validated_data.pop('participants')
        
        # Проверяем есть ли уже чат между этими пользователями
        if validated_data.get('trade_offer'):
            # Для чата сделки проверяем по trade_offer
            existing_chat = Chat.objects.filter(
                trade_offer=validated_data['trade_offer'],
                is_deleted=False
            ).first()
        else:
            # Для обычного чата проверяем по участникам
            existing_chat = Chat.objects.filter(
                participants__in=participants_ids,
                trade_offer__isnull=True,
                is_deleted=False
            ).annotate(
                participant_count=Count('participants')
            ).filter(
                participant_count=len(participants_ids)
            ).first()
        
        if existing_chat:
            # Если такой чат уже существует, возвращаем его
            return existing_chat
        
        # Создаем новый чат
        chat = super().create(validated_data)
        chat.participants.set(participants_ids)
        
        # Создаем статусы участников
        for user_id in participants_ids:
            ChatParticipantStatus.objects.create(
                chat=chat,
                user_id=user_id
            )
        
        return chat 