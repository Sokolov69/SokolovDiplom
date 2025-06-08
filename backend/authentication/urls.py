from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, UserDetailView, PasswordChangeView,
    RoleViewSet, UserViewSet, UserActionLogViewSet
)

# Создаем роутер для ViewSets
router = DefaultRouter()
router.register(r'roles', RoleViewSet)
router.register(r'users', UserViewSet)
router.register(r'logs', UserActionLogViewSet)

urlpatterns = [
    # Аутентификация и профиль
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='user_detail'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
    
    # ViewSets URLs
    path('', include(router.urls)),
] 