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
    NotificationLog,
    RuleContactTemplate
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


class RuleContactTemplateSerializer(serializers.ModelSerializer):
    """Сериализатор связи контакт-шаблон."""
    contact = NotificationContactSerializer(read_only=True)
    template = NotificationTemplateSerializer(read_only=True)
    contact_id = serializers.IntegerField(write_only=True)
    template_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = RuleContactTemplate
        fields = ('id', 'rule', 'contact', 'template', 'contact_id', 'template_id')


class NotificationRuleSerializer(serializers.ModelSerializer):
    """Сериализатор правил отправки."""
    notification_type = serializers.SerializerMethodField()
    channel = serializers.SerializerMethodField()
    contacts = NotificationContactSerializer(many=True, read_only=True)
    contact_templates = serializers.SerializerMethodField()

    class Meta:
        model = NotificationRule
        fields = ('id', 'notification_type', 'channel', 'is_enabled', 'contacts', 'contact_templates', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')

    def get_notification_type(self, obj):
        """Вернуть вложенный объект типа уведомления."""
        return {
            'id': obj.notification_type.id,
            'code': obj.notification_type.code,
            'name': obj.notification_type.name,
            'description': obj.notification_type.description,
        }

    def get_channel(self, obj):
        """Вернуть вложенный объект канала."""
        return {
            'id': obj.channel.id,
            'code': obj.channel.code,
            'name': obj.channel.name,
            'icon': obj.channel.icon,
        }

    def get_contact_templates(self, obj):
        """Вернуть назначенные шаблоны для контактов."""
        contact_templates = RuleContactTemplate.objects.filter(rule=obj).select_related('contact', 'template')
        return [
            {
                'contact_id': ct.contact.id,
                'template_id': ct.template.id if ct.template else None,
                'template_name': ct.template.name if ct.template else 'По умолчанию'
            }
            for ct in contact_templates
        ]


class NotificationLogSerializer(serializers.ModelSerializer):
    """Сериализатор логов уведомлений."""
    notification_type_name = serializers.CharField(source='notification_type.name', read_only=True)
    channel_name = serializers.CharField(source='channel.name', read_only=True)
    contact_name = serializers.CharField(source='contact.name', read_only=True)

    class Meta:
        model = NotificationLog
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
