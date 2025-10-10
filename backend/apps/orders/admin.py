"""
Админка для заказов.
"""

from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """
    Inline для отображения товаров в заказе.
    """
    model = OrderItem
    extra = 0
    readonly_fields = ('subtotal',)
    fields = ('product', 'price', 'quantity', 'subtotal')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """
    Админка для заказов.
    """
    list_display = (
        'order_number',
        'customer_name',
        'customer_phone',
        'status',
        'total_amount',
        'payment_method',
        'created_at',
    )
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = (
        'order_number',
        'customer_name',
        'customer_phone',
        'customer_email',
    )
    readonly_fields = ('order_number', 'created_at', 'updated_at')
    inlines = [OrderItemInline]

    fieldsets = (
        ('Информация о заказе', {
            'fields': ('order_number', 'user', 'status', 'total_amount')
        }),
        ('Контактная информация', {
            'fields': ('customer_name', 'customer_phone', 'customer_email')
        }),
        ('Доставка', {
            'fields': ('delivery_address', 'comment')
        }),
        ('Оплата', {
            'fields': ('payment_method',)
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """
    Админка для товаров в заказе.
    """
    list_display = ('order', 'product', 'price', 'quantity', 'subtotal')
    list_filter = ('order__created_at',)
    search_fields = ('order__order_number', 'product__name')
    readonly_fields = ('subtotal',)
