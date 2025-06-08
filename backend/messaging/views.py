from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, F, Count, Max
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Chat, Message, MessageAttachment, ChatParticipantStatus
from .serializers import (
    ChatSerializer, CreateChatSerializer, MessageSerializer, 
    CreateMessageSerializer, MessageAttachmentSerializer,
    ChatParticipantStatusSerializer
)

User = get_user_model()


class MessagePagination(PageNumberPagination):
    """Пагинация для сообщений"""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100


class ChatViewSet(viewsets.ModelViewSet):
    """
    ViewSet для работы с чатами
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateChatSerializer
        return ChatSerializer
    
    def get_queryset(self):
        user = self.request.user
        return Chat.objects.filter(
            participants=user,
            is_deleted=False
        ).select_related(
            'trade_offer'
        ).prefetch_related(
            'participants',
            'messages',
            'participant_statuses'
        ).distinct().order_by('-last_message_time', '-created_at')
    
    def create(self, request, *args, **kwargs):
        """Создание нового чата"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        chat = serializer.save()
        
        # Возвращаем созданный чат с полной информацией
        response_serializer = ChatSerializer(chat, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Отметить все сообщения в чате как прочитанные"""
        chat = self.get_object()
        user = request.user
        
        # Обновляем статус участника
        participant_status, created = ChatParticipantStatus.objects.get_or_create(
            chat=chat,
            user=user,
            defaults={'unread_count': 0}
        )
        
        if not created:
            participant_status.unread_count = 0
            participant_status.save(update_fields=['unread_count'])
        
        # Отмечаем все непрочитанные сообщения как прочитанные
        Message.objects.filter(
            chat=chat,
            is_read=False,
            is_deleted=False
        ).exclude(sender=user).update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({'status': 'success'})
    
    @action(detail=True, methods=['post'])
    def toggle_mute(self, request, pk=None):
        """Включить/выключить уведомления для чата"""
        chat = self.get_object()
        user = request.user
        
        participant_status, created = ChatParticipantStatus.objects.get_or_create(
            chat=chat,
            user=user,
            defaults={'is_muted': False}
        )
        
        participant_status.is_muted = not participant_status.is_muted
        participant_status.save(update_fields=['is_muted'])
        
        return Response({
            'is_muted': participant_status.is_muted
        })
    
    @action(detail=False, methods=['get'])
    def by_trade(self, request):
        """Получить чат по ID сделки"""
        trade_offer_id = request.query_params.get('trade_offer_id')
        if not trade_offer_id:
            return Response(
                {'error': 'trade_offer_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Ищем чат по trade_offer_id среди чатов, участником которых является текущий пользователь
            chat = Chat.objects.filter(
                trade_offer_id=trade_offer_id,
                is_deleted=False
            ).filter(participants=request.user).first()
            
            if chat:
                serializer = self.get_serializer(chat)
                return Response(serializer.data)
            else:
                return Response(
                    {'error': 'Chat not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def by_user(self, request):
        """Получить чат с конкретным пользователем"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Ищем приватный чат между двумя пользователями
            chat = Chat.objects.filter(
                participants__in=[request.user.id, user_id],
                trade_offer__isnull=True,
                is_deleted=False
            ).annotate(
                participant_count=Count('participants')
            ).filter(
                participant_count=2
            ).first()
            
            if chat:
                serializer = self.get_serializer(chat)
                return Response(serializer.data)
            else:
                return Response(
                    {'error': 'Chat not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet для работы с сообщениями
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = MessagePagination
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateMessageSerializer
        return MessageSerializer
    
    def get_queryset(self):
        user = self.request.user
        chat_id = self.request.query_params.get('chat_id')
        
        if chat_id:
            # Проверяем что пользователь участник чата
            if not Chat.objects.filter(
                id=chat_id, 
                participants=user,
                is_deleted=False
            ).exists():
                return Message.objects.none()
            
            return Message.objects.filter(
                chat_id=chat_id,
                is_deleted=False
            ).select_related(
                'sender', 'chat'
            ).prefetch_related(
                'attachments'
            ).order_by('-created_at')
        
        # Если chat_id не указан, возвращаем пустой queryset
        return Message.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Создание нового сообщения"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Проверяем что пользователь участник чата
        chat = serializer.validated_data['chat']
        if not chat.participants.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You are not a participant of this chat'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        message = serializer.save()
        
        # Обновляем счетчик непрочитанных сообщений для других участников
        other_participants = chat.participants.exclude(id=request.user.id)
        for participant in other_participants:
            ChatParticipantStatus.objects.filter(
                chat=chat,
                user=participant
            ).update(unread_count=F('unread_count') + 1)
        
        # Возвращаем созданное сообщение с полной информацией
        response_serializer = MessageSerializer(message, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Отметить сообщение как прочитанное"""
        message = self.get_object()
        
        # Только получатель может отметить сообщение как прочитанное
        if message.sender != request.user and not message.is_read:
            message.is_read = True
            message.read_at = timezone.now()
            message.save(update_fields=['is_read', 'read_at'])
            
            # Уменьшаем счетчик непрочитанных сообщений
            ChatParticipantStatus.objects.filter(
                chat=message.chat,
                user=request.user,
                unread_count__gt=0
            ).update(unread_count=F('unread_count') - 1)
        
        return Response({'status': 'success'})


class MessageAttachmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для работы с вложениями сообщений (только чтение)
    """
    serializer_class = MessageAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return MessageAttachment.objects.filter(
            message__chat__participants=user,
            message__is_deleted=False
        ).select_related('message__chat')
