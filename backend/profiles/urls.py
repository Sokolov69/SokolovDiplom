from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserProfileViewSet, LocationViewSet, UserPreferenceViewSet

router = DefaultRouter()
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'preferences', UserPreferenceViewSet, basename='preference')

urlpatterns = [
    path('', include(router.urls)),
    path('profile/me/', UserProfileViewSet.as_view({'get': 'me'}), name='profile-me'),
    path('profile/public/<int:user_id>/', UserProfileViewSet.as_view({'get': 'public_profile'}), name='profile-public'),
    path('profile/avatar/', UserProfileViewSet.as_view({'post': 'avatar'}), name='profile-avatar'),
    path('locations/primary/', LocationViewSet.as_view({'get': 'primary'}), name='location-primary'),
] 