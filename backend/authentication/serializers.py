from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Role, UserActionLog

User = get_user_model()

class RoleSerializer(serializers.ModelSerializer):
    """
    Сериализатор для ролей пользователей
    """
    class Meta:
        model = Role
        fields = ('id', 'name', 'description', 'is_staff_role', 
                  'is_moderator_role', 'is_superuser_role', 'priority')
        read_only_fields = ('id',)

class UserSerializer(serializers.ModelSerializer):
    """
    Сериализатор для отображения данных пользователя
    """
    roles = RoleSerializer(many=True, read_only=True)
    highest_role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                  'roles', 'highest_role', 'is_banned', 'ban_expiry',
                  'last_activity', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'is_banned', 
                           'ban_expiry', 'last_activity')
    
    def get_highest_role(self, obj):
        highest = obj.highest_role
        if highest:
            return RoleSerializer(highest).data
        return None

class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для обновления данных пользователя
    """
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email')

class RegisterSerializer(serializers.ModelSerializer):
    """
    Сериализатор для регистрации новых пользователей
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 
                  'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class UserActionLogSerializer(serializers.ModelSerializer):
    """
    Сериализатор для логов действий пользователей
    """
    user_username = serializers.CharField(source='user.username', read_only=True)
    target_user_username = serializers.CharField(source='target_user.username', read_only=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    
    class Meta:
        model = UserActionLog
        fields = ('id', 'user', 'user_username', 'action_type', 'action_type_display',
                  'description', 'target_user', 'target_user_username', 
                  'entity_type', 'entity_id', 'ip_address', 'created_at')
        read_only_fields = ('id', 'created_at')

class PasswordChangeSerializer(serializers.Serializer):
    """
    Сериализатор для смены пароля
    """
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Новые пароли не совпадают"})
        return attrs 