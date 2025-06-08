"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers

# Импортируем напрямую ViewSets из приложения items
from items.views import ItemConditionViewSet, ItemStatusViewSet, ItemTagViewSet

# Создаем отдельные роутеры для каждого типа объектов
conditions_router = routers.DefaultRouter()
conditions_router.register(r'', ItemConditionViewSet)

statuses_router = routers.DefaultRouter()
statuses_router.register(r'', ItemStatusViewSet)

tags_router = routers.DefaultRouter()
tags_router.register(r'', ItemTagViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/categories/', include('categories.urls')),
    path('api/items/', include('items.urls')),
    path('api/profiles/', include('profiles.urls')),
    path('api/trades/', include('trades.urls')),
    path('api/messaging/', include('messaging.urls')),
    
    # Отдельные URL для вспомогательных объектов
    path('api/conditions/', include(conditions_router.urls)),
    path('api/statuses/', include(statuses_router.urls)),
    path('api/tags/', include(tags_router.urls)),
]

# Добавление статических и медиа URL только в режиме разработки
if settings.DEBUG and not settings.USE_S3:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
