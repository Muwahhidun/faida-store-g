"""
Админка для платежей.
"""

from django.contrib import admin
from .models import Payment, PaymentSettings, Refund


@admin.register(PaymentSettings)
class PaymentSettingsAdmin(admin.ModelAdmin):
    """Админка настроек платежей (singleton)."""

    list_display = ['__str__', 'is_enabled', 'test_mode', 'updated_at']

    fieldsets = (
        ('Учётные данные YooKassa', {
            'fields': ('shop_id', 'secret_key'),
            'description': 'Данные для подключения к API YooKassa'
        }),
        ('Настройки', {
            'fields': ('is_enabled', 'test_mode'),
        }),
        ('Безопасность', {
            'fields': ('webhook_secret',),
            'classes': ('collapse',),
            'description': 'Опционально: для проверки подписи webhook запросов'
        }),
    )

    def has_add_permission(self, request):
        """Только один объект настроек."""
        return not PaymentSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        """Запрещаем удаление."""
        return False


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Админка платежей."""

    list_display = [
        'yookassa_id',
        'order',
        'amount',
        'status',
        'paid',
        'payment_method_type',
        'refunded_amount',
        'created_at',
    ]
    list_filter = ['status', 'paid', 'payment_method_type', 'created_at']
    search_fields = ['yookassa_id', 'order__order_number']
    readonly_fields = [
        'yookassa_id',
        'order',
        'amount',
        'currency',
        'payment_method_type',
        'confirmation_url',
        'created_at',
        'updated_at',
        'paid_at',
        'refunded_amount_display',
        'available_for_refund_display',
    ]
    ordering = ['-created_at']

    fieldsets = (
        ('Основная информация', {
            'fields': ('order', 'yookassa_id', 'status', 'paid', 'paid_at')
        }),
        ('Сумма', {
            'fields': ('amount', 'currency', 'refunded_amount_display', 'available_for_refund_display')
        }),
        ('Детали оплаты', {
            'fields': ('payment_method_type', 'confirmation_url'),
            'classes': ('collapse',)
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def refunded_amount_display(self, obj):
        return f"{obj.refunded_amount} ₽"
    refunded_amount_display.short_description = 'Возвращено'

    def available_for_refund_display(self, obj):
        return f"{obj.available_for_refund} ₽"
    available_for_refund_display.short_description = 'Доступно к возврату'

    def has_add_permission(self, request):
        """Платежи создаются только через API."""
        return False


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    """Админка возвратов."""

    list_display = [
        'yookassa_id',
        'payment',
        'amount',
        'status',
        'reason_short',
        'created_by',
        'created_at',
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['yookassa_id', 'payment__yookassa_id', 'payment__order__order_number']
    readonly_fields = [
        'yookassa_id',
        'payment',
        'amount',
        'status',
        'reason',
        'created_by',
        'created_at',
        'updated_at',
    ]
    ordering = ['-created_at']

    def reason_short(self, obj):
        if len(obj.reason) > 50:
            return obj.reason[:50] + '...'
        return obj.reason or '—'
    reason_short.short_description = 'Причина'

    def has_add_permission(self, request):
        """Возвраты создаются только через API."""
        return False
