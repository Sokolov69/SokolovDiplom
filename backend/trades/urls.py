from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TradeStatusViewSet, TradeOfferViewSet

# Создаем роутер для API
router = DefaultRouter()
router.register(r'statuses', TradeStatusViewSet, basename='trade-status')
router.register(r'offers', TradeOfferViewSet, basename='trade-offer')

urlpatterns = [
    path('', include(router.urls)),
] 