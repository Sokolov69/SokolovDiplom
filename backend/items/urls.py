from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ItemViewSet, ItemImageViewSet, ItemConditionViewSet, 
    ItemStatusViewSet, ItemTagViewSet, FavoriteViewSet
)

# Создаем основной роутер для предметов
item_router = DefaultRouter()
item_router.register(r'', ItemViewSet)

# Роутер для оставшихся вспомогательных объектов
auxiliary_router = DefaultRouter()
auxiliary_router.register(r'images', ItemImageViewSet, basename='image')
auxiliary_router.register(r'favorites', FavoriteViewSet, basename='favorite')

# Создаем дополнительные пути для специфических API эндпоинтов
extra_patterns = [
    # Получение изображений для конкретного предмета
    path('<int:pk>/images/', ItemViewSet.as_view({'get': 'images'}), name='item-images'),
    
    # Загрузка нового изображения для предмета
    path('<int:pk>/upload-image/', ItemViewSet.as_view({'post': 'upload_image'}), name='item-upload-image'),
    
    # Удаление изображения предмета
    path('<int:pk>/delete-image/', ItemViewSet.as_view({'delete': 'delete_image'}), name='item-delete-image'),
    
    # Установка основного изображения
    path('images/<int:pk>/set-primary/', ItemImageViewSet.as_view({'post': 'set_primary'}), name='image-set-primary'),
]

urlpatterns = [
    # Основные маршруты для предметов
    path('', include(item_router.urls)),
    
    # Маршруты для оставшихся вспомогательных объектов
    path('', include(auxiliary_router.urls)),
    
    # Дополнительные маршруты
    path('', include(extra_patterns)),
] 