from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import TradeStatus, TradeOffer, TradeOfferItem
from items.models import Item, ItemCondition, ItemStatus
from categories.models import Category

User = get_user_model()


class TradeStatusAPITest(APITestCase):
    """Тесты для API статусов обменов"""
    
    def setUp(self):
        """Настройка тестовых данных"""
        # Создаем статусы
        self.pending_status = TradeStatus.objects.create(
            name='pending', description='Ожидает ответа', order=1
        )
        self.accepted_status = TradeStatus.objects.create(
            name='accepted', description='Принято', order=2
        )
    
    def test_get_statuses_list(self):
        """Тест получения списка статусов"""
        url = reverse('trade-status-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['name'], 'pending')


class TradeOfferAPITest(APITestCase):
    """Тесты для API предложений обмена"""
    
    def setUp(self):
        """Настройка тестовых данных"""
        # Создаем пользователей
        self.user1 = User.objects.create_user(
            username='user1', email='user1@test.com', password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2', email='user2@test.com', password='testpass123'
        )
        
        # Создаем статусы
        self.pending_status = TradeStatus.objects.create(
            name='pending', description='Ожидает ответа', order=1
        )
        self.accepted_status = TradeStatus.objects.create(
            name='accepted', description='Принято', order=2
        )
        self.rejected_status = TradeStatus.objects.create(
            name='rejected', description='Отклонено', order=3
        )
        self.completed_status = TradeStatus.objects.create(
            name='completed', description='Завершено', order=4
        )
        self.cancelled_status = TradeStatus.objects.create(
            name='cancelled', description='Отменено', order=5
        )
        
        # Создаем категорию
        self.category = Category.objects.create(
            name='Тестовая категория', slug='test-category'
        )
        
        # Создаем состояние и статус предметов
        self.item_condition = ItemCondition.objects.create(
            name='Новый', order=1
        )
        self.item_status = ItemStatus.objects.create(
            name='available', order=1
        )
        
        # Создаем предметы
        self.item1 = Item.objects.create(
            title='Предмет 1', description='Описание 1',
            owner=self.user1, category=self.category,
            condition=self.item_condition, status=self.item_status
        )
        self.item2 = Item.objects.create(
            title='Предмет 2', description='Описание 2',
            owner=self.user1, category=self.category,
            condition=self.item_condition, status=self.item_status
        )
        self.item3 = Item.objects.create(
            title='Предмет 3', description='Описание 3',
            owner=self.user2, category=self.category,
            condition=self.item_condition, status=self.item_status
        )
        
        # Получаем токены для аутентификации
        self.token1 = RefreshToken.for_user(self.user1).access_token
        self.token2 = RefreshToken.for_user(self.user2).access_token
    
    def test_create_trade_offer(self):
        """Тест создания предложения обмена"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        
        url = reverse('trade-offer-list')
        data = {
            'receiver_id': self.user2.id,
            'message': 'Хочу обменяться',
            'initiator_items': [self.item1.id, self.item2.id],
            'receiver_items': [self.item3.id]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['initiator']['id'], self.user1.id)
        self.assertEqual(response.data['receiver']['id'], self.user2.id)
        self.assertEqual(response.data['status']['name'], 'pending')
        self.assertEqual(len(response.data['initiator_items']), 2)
        self.assertEqual(len(response.data['receiver_items']), 1)
    
    def test_unauthorized_access(self):
        """Тест доступа без аутентификации"""
        url = reverse('trade-offer-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED) 