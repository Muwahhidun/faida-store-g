"""
Сериализаторы для API уведомлений.
"""

from rest_framework import serializers
from .models import (
    NotificationCategory,
    NotificationChannel,
    NotificationType,
    NotificationTemplate,
    NotificationContact,
    NotificationRule,
    NotificationLog
)


class NotificationCategorySerializer(serializers.ModelSerializer):
    """Сериализатор категорий уведомлений."""

    class Meta:
        model = NotificationCategory
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class NotificationChannelSerializer(serializers.ModelSerializer):
    """Сериализатор каналов уведомлений."""

    class Meta:
        model = NotificationChannel
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class NotificationTypeSerializer(serializers.ModelSerializer):
    """Сериализатор типов уведомлений."""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = NotificationType
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Сериализатор шаблонов уведомлений."""
    notification_type_name = serializers.CharField(source='notification_type.name', read_only=True)
    channel_name = serializers.CharField(source='channel.name', read_only=True)

    class Meta:
        model = NotificationTemplate
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class NotificationContactSerializer(serializers.ModelSerializer):
    """Сериализатор контактов."""
    channel_name = serializers.CharField(source='channel.name', read_only=True)
    channel_icon = serializers.CharField(source='channel.icon', read_only=True)

    class Meta:
        model = NotificationContact
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class NotificationRuleSerializer(serializers.ModelSerializer):
    """Сериализатор правил отправки."""
    notification_type_name = serializers.CharField(source='notification_type.name', read_only=True)
    channel_name = serializers.CharField(source='channel.name', read_only=True)
    contacts_data = NotificationContactSerializer(source='contacts', many=True, read_only=True)

    class Meta:
        model = NotificationRule
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class NotificationLogSerializer(serializers.ModelSerializer):
    """Сериализатор логов уведомлений."""
    notification_type_name = serializers.CharField(source='notification_type.name', read_only=True)
    channel_name = serializers.CharField(source='channel.name', read_only=True)
    contact_name = serializers.CharField(source='contact.name', read_only=True)

    class Meta:
        model = NotificationLog
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
