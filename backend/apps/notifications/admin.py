"""
Админка для гибкой системы уведомлений.
"""

from django.contrib import admin
from .models import (
    NotificationCategory,
    NotificationChannel,
    NotificationType,
    NotificationTemplate,
    NotificationContact,
    NotificationRule,
    NotificationLog
)


@admin.register(NotificationCategory)
class NotificationCategoryAdmin(admin.ModelAdmin):
    """Админка для категорий уведомлений."""
    list_display = ('name', 'code', 'order', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'code')
    ordering = ('order', 'name')


@admin.register(NotificationChannel)
class NotificationChannelAdmin(admin.ModelAdmin):
    """Админка для каналов связи."""
    list_display = ('name', 'code', 'icon', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'code')


@admin.register(NotificationType)
class NotificationTypeAdmin(admin.ModelAdmin):
    """Админка для типов уведомлений."""
    list_display = ('name', 'category', 'code', 'is_enabled', 'order', 'created_at')
    list_filter = ('category', 'is_enabled')
    search_fields = ('name', 'code')
    ordering = ('category', 'order', 'name')


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    """Админка для шаблонов уведомлений."""
    list_display = ('notification_type', 'channel_type', 'name', 'is_system', 'created_at')
    list_filter = ('channel_type', 'is_system', 'notification_type__category')
    search_fields = ('notification_type__name', 'name', 'template')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(NotificationContact)
class NotificationContactAdmin(admin.ModelAdmin):
    """Админка для контактов."""
    list_display = ('name', 'channel_type', 'value', 'is_active', 'created_at')
    list_filter = ('channel_type', 'is_active')
    search_fields = ('name', 'value')
    ordering = ('channel_type', 'name')


@admin.register(NotificationRule)
class NotificationRuleAdmin(admin.ModelAdmin):
    """Админка для правил отправки уведомлений."""
    list_display = ('name', 'notification_type', 'channel', 'is_enabled', 'created_at')
    list_filter = ('channel', 'is_enabled', 'notification_type__category')
    search_fields = ('name', 'notification_type__name', 'channel__name')
    filter_horizontal = ('contacts',)


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    """Админка для логов уведомлений."""
    list_display = ('notification_type', 'channel', 'get_recipient', 'status', 'retry_count', 'next_retry_at', 'created_at')
    list_filter = ('status', 'channel', 'notification_type__category', 'created_at')
    search_fields = ('message', 'error_message', 'recipient_value')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)

    fieldsets = (
        ('Основная информация', {
            'fields': ('notification_type', 'channel', 'contact', 'recipient_value', 'status')
        }),
        ('Сообщение', {
            'fields': ('message', 'error_message')
        }),
        ('Повторные попытки', {
            'fields': ('retry_count', 'max_retries', 'next_retry_at')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_recipient(self, obj):
        """Показываем контакт или значение получателя."""
        return obj.contact or obj.recipient_value
    get_recipient.short_description = 'Получатель'
