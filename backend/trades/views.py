from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.db.models import Q, Prefetch, F
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import TradeStatus, TradeOffer, TradeOfferItem, TradeHistory
from .serializers import (
    TradeStatusSerializer, 
    TradeOfferSerializer, 
    CreateTradeOfferSerializer,
    TradeActionSerializer
)
from items.models import Item
from profiles.models import UserProfile


class TradeStatusViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для статусов обменов"""
    queryset = TradeStatus.objects.filter(is_active=True)
    serializer_class = TradeStatusSerializer
    permission_classes = [AllowAny]


class TradeOfferViewSet(viewsets.ModelViewSet):
    """ViewSet для предложений обмена"""
    serializer_class = TradeOfferSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Получение queryset с оптимизированными запросами"""
        user = self.request.user
        
        # Базовый queryset с предзагрузкой связанных объектов
        queryset = TradeOffer.objects.select_related(
            'initiator', 'receiver', 'status', 'location',
            'initiator__profile', 'receiver__profile'
        ).prefetch_related(
            Prefetch(
                'trade_items',
                queryset=TradeOfferItem.objects.select_related('item').prefetch_related(
                    'item__images'
                )
            )
        )
        
        # Фильтрация по типу запроса
        offer_type = self.request.query_params.get('type')
        
        if offer_type == 'sent':
            # Отправленные предложения
            queryset = queryset.filter(initiator=user)
        elif offer_type == 'received':
            # Полученные предложения
            queryset = queryset.filter(receiver=user)
        else:
            # Все предложения пользователя (по умолчанию)
            queryset = queryset.filter(Q(initiator=user) | Q(receiver=user))
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'create':
            return CreateTradeOfferSerializer
        return TradeOfferSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Получение детальной информации о предложении"""
        instance = self.get_object()
        
        # Проверяем права доступа (только участники обмена)
        if instance.initiator != request.user and instance.receiver != request.user:
            return Response(
                {'detail': 'У вас нет прав для просмотра этого предложения'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Создание нового предложения обмена"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        trade_offer = serializer.save()
        
        # Возвращаем полную информацию о созданном предложении
        response_serializer = TradeOfferSerializer(trade_offer, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Принятие предложения обмена"""
        trade_offer = self.get_object()
        
        # Проверяем права (только получатель может принять)
        if trade_offer.receiver != request.user:
            return Response(
                {'detail': 'Только получатель может принять предложение'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем текущий статус
        if trade_offer.status.name != 'pending':
            return Response(
                {'detail': 'Предложение уже обработано'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = TradeActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            # Сохраняем предыдущий статус для истории
            previous_status = trade_offer.status
            
            # Меняем статус на "accepted"
            accepted_status = TradeStatus.objects.get(name='accepted')
            trade_offer.status = accepted_status
            trade_offer.save()
            
            # Записываем в историю
            TradeHistory.objects.create(
                trade_offer=trade_offer,
                previous_status=previous_status,
                new_status=accepted_status,
                changed_by=request.user,
                comment=serializer.validated_data.get('comment', '')
            )
        
        return Response({'success': True, 'message': 'Предложение принято'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Отклонение предложения обмена"""
        trade_offer = self.get_object()
        
        # Проверяем права (только получатель может отклонить)
        if trade_offer.receiver != request.user:
            return Response(
                {'detail': 'Только получатель может отклонить предложение'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем текущий статус
        if trade_offer.status.name != 'pending':
            return Response(
                {'detail': 'Предложение уже обработано'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = TradeActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            # Сохраняем предыдущий статус для истории
            previous_status = trade_offer.status
            
            # Меняем статус на "rejected"
            rejected_status = TradeStatus.objects.get(name='rejected')
            trade_offer.status = rejected_status
            trade_offer.save()
            
            # Записываем в историю
            TradeHistory.objects.create(
                trade_offer=trade_offer,
                previous_status=previous_status,
                new_status=rejected_status,
                changed_by=request.user,
                comment=serializer.validated_data.get('comment', '')
            )
        
        return Response({'success': True, 'message': 'Предложение отклонено'})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Отмена предложения обмена"""
        trade_offer = self.get_object()
        
        # Проверяем права (только инициатор может отменить)
        if trade_offer.initiator != request.user:
            return Response(
                {'detail': 'Только инициатор может отменить предложение'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем текущий статус
        if trade_offer.status.name not in ['pending', 'accepted']:
            return Response(
                {'detail': 'Предложение нельзя отменить в текущем статусе'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = TradeActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            # Сохраняем предыдущий статус для истории
            previous_status = trade_offer.status
            
            # Меняем статус на "cancelled"
            cancelled_status = TradeStatus.objects.get(name='cancelled')
            trade_offer.status = cancelled_status
            trade_offer.save()
            
            # Записываем в историю
            TradeHistory.objects.create(
                trade_offer=trade_offer,
                previous_status=previous_status,
                new_status=cancelled_status,
                changed_by=request.user,
                comment=serializer.validated_data.get('comment', '')
            )
        
        return Response({'success': True, 'message': 'Предложение отменено'})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Подтверждение завершения обмена"""
        trade_offer = self.get_object()
        
        # Проверяем права (любой участник может подтвердить завершение)
        if trade_offer.initiator != request.user and trade_offer.receiver != request.user:
            return Response(
                {'detail': 'Только участники обмена могут подтвердить завершение'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверяем текущий статус
        if trade_offer.status.name != 'accepted':
            return Response(
                {'detail': 'Можно завершить только принятые предложения'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = TradeActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            # Сохраняем предыдущий статус для истории
            previous_status = trade_offer.status
            
            # Меняем статус на "completed"
            completed_status = TradeStatus.objects.get(name='completed')
            trade_offer.status = completed_status
            trade_offer.completed_at = timezone.now()
            trade_offer.save()
            
            # Обновляем счетчик успешных сделок у обоих участников
            # Увеличиваем счетчик у инициатора
            UserProfile.objects.filter(user=trade_offer.initiator).update(
                successful_trades=F('successful_trades') + 1
            )
            
            # Увеличиваем счетчик у получателя
            UserProfile.objects.filter(user=trade_offer.receiver).update(
                successful_trades=F('successful_trades') + 1
            )
            
            # Записываем в историю
            TradeHistory.objects.create(
                trade_offer=trade_offer,
                previous_status=previous_status,
                new_status=completed_status,
                changed_by=request.user,
                comment=serializer.validated_data.get('comment', '')
            )
        
        return Response({'success': True, 'message': 'Обмен завершен'})
    
    def perform_create(self, serializer):
        """Дополнительная логика при создании предложения"""
        # Логика уже реализована в сериализаторе
        pass
