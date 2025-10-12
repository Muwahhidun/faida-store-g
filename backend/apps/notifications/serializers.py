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

    def validate(self, attrs):
        """
        Проверить уникальность канала по ключевым параметрам.
        Для каждого типа канала проверяем уникальность своего ключевого поля.
        """
        code = attrs.get('code', getattr(self.instance, 'code', None))
        settings = attrs.get('settings', getattr(self.instance, 'settings', {}))

        if not code or not settings:
            return attrs

        # Определяем ключевое поле для проверки уникальности по типу канала
        key_field_map = {
            'email': 'smtp_username',  # Для email проверяем username (обычно это сам email)
            'whatsapp': 'instance_id',  # Для WhatsApp проверяем Instance ID
            'telegram': 'bot_token',    # Для Telegram проверяем Bot Token
        }

        key_field = key_field_map.get(code)
        if not key_field:
            return attrs  # Для неизвестных типов не проверяем

        key_value = settings.get(key_field)
        if not key_value:
            return attrs  # Если ключевого поля нет, не проверяем

        # Ищем существующий канал с такими же параметрами
        queryset = NotificationChannel.objects.filter(
            code=code,
            settings__contains={key_field: key_value}
        )

        # Если это обновление, исключаем текущий канал из проверки
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            existing_channel = queryset.first()
            error_messages = {
                'email': f'Канал Email с таким адресом уже существует: "{existing_channel.name}"',
                'whatsapp': f'Канал WhatsApp с таким Instance ID уже существует: "{existing_channel.name}"',
                'telegram': f'Канал Telegram с таким Bot Token уже существует: "{existing_channel.name}"',
            }
            raise serializers.ValidationError({
                'settings': error_messages.get(code, 'Канал с такими параметрами уже существует')
            })

        return attrs


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
    channel_type_display = serializers.CharField(source='get_channel_type_display', read_only=True)
    variables_help = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = NotificationTemplate
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_variables_help(self, obj):
        """Получить список доступных переменных из типа уведомления."""
        if obj.notification_type:
            return obj.notification_type.variables_help
        return {}

    def validate(self, attrs):
        """
        Проверка уникальности имени шаблона в рамках типа уведомления + типа канала.
        """
        notification_type = attrs.get('notification_type', getattr(self.instance, 'notification_type', None))
        channel_type = attrs.get('channel_type', getattr(self.instance, 'channel_type', None))
        name = attrs.get('name', getattr(self.instance, 'name', None))

        if notification_type and channel_type and name:
            # Ищем существующий шаблон с таким же именем
            queryset = NotificationTemplate.objects.filter(
                notification_type=notification_type,
                channel_type=channel_type,
                name=name
            )

            # Если это обновление, исключаем текущий шаблон из проверки
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)

            if queryset.exists():
                existing = queryset.first()
                raise serializers.ValidationError({
                    'name': f'Шаблон с названием "{name}" уже существует для этого типа уведомления и канала. Выберите другое название.'
                })

        return attrs


class NotificationContactSerializer(serializers.ModelSerializer):
    """Сериализатор контактов."""
    channel_type_display = serializers.CharField(source='get_channel_type_display', read_only=True)

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
    default_template = serializers.SerializerMethodField()
    contacts = NotificationContactSerializer(many=True, read_only=True)
    contact_templates = serializers.SerializerMethodField()

    class Meta:
        model = NotificationRule
        fields = ('id', 'name', 'rule_type', 'notification_type', 'channel', 'default_template', 'is_enabled', 'contacts', 'contact_templates', 'created_at', 'updated_at')
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

    def get_default_template(self, obj):
        """Вернуть информацию о шаблоне по умолчанию."""
        if obj.default_template:
            return {
                'id': obj.default_template.id,
                'name': obj.default_template.name,
                'channel_type': obj.default_template.channel_type,
            }

        # Если не указан явный шаблон, найти стандартный шаблон для этого типа уведомления и канала
        standard_template = NotificationTemplate.objects.filter(
            notification_type=obj.notification_type,
            channel_type=obj.channel.code,
            is_default=True
        ).first()

        if standard_template:
            return {
                'id': standard_template.id,
                'name': standard_template.name,
                'channel_type': standard_template.channel_type,
            }

        return None

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
