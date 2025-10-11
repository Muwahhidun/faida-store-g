"""
Админка для системы уведомлений.
"""

from django.contrib import admin
from .models import NotificationSettings, WhatsAppOperator


@admin.register(NotificationSettings)
class NotificationSettingsAdmin(admin.ModelAdmin):
    """
    Админка для настроек уведомлений (singleton).
    """

    fieldsets = (
        ('Email настройки', {
            'fields': ('enable_email_notifications', 'admin_email')
        }),
        ('WhatsApp настройки (Green API)', {
            'fields': ('enable_whatsapp_notifications', 'green_api_instance_id', 'green_api_token')
        }),
        ('Настройки уведомлений о заказах', {
            'fields': ('notify_on_new_order', 'notify_on_status_change')
        }),
        ('Служебная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at')

    def has_add_permission(self, request):
        """
        Запрещаем создание новых записей (только одна запись должна существовать).
        """
        return not NotificationSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        """
        Запрещаем удаление единственной записи настроек.
        """
        return False


@admin.register(WhatsAppOperator)
class WhatsAppOperatorAdmin(admin.ModelAdmin):
    """
    Админка для операторов WhatsApp.
    """

    list_display = ('name', 'phone_number', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'phone_number')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'phone_number', 'is_active')
        }),
        ('Служебная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
