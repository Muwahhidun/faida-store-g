"""
Админ-панель для пользователей.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, DeliveryAddress


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Админка для кастомной модели User.
    Поле role автоматически синхронизирует is_staff и is_superuser.
    """

    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name')

    # Переопределяем fieldsets, чтобы показать role вместо is_staff/is_superuser
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Личная информация', {'fields': ('first_name', 'last_name', 'email')}),
        ('Роль и права', {
            'fields': ('role', 'is_active'),
            'description': 'Поле "Роль" автоматически устанавливает is_staff и is_superuser'
        }),
        ('Важные даты', {'fields': ('last_login', 'date_joined')}),
        ('Группы и права (опционально)', {
            'fields': ('groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'role'),
        }),
    )

    readonly_fields = ('last_login', 'date_joined')


@admin.register(DeliveryAddress)
class DeliveryAddressAdmin(admin.ModelAdmin):
    """
    Админка для адресов доставки.
    """

    list_display = ('user', 'full_address', 'city', 'label', 'is_default', 'created_at')
    list_filter = ('is_default', 'city', 'label', 'created_at')
    search_fields = ('user__username', 'user__email', 'full_address', 'city', 'street')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Пользователь', {
            'fields': ('user',)
        }),
        ('Адрес с карты', {
            'fields': ('full_address', 'city', 'street', 'house', 'latitude', 'longitude')
        }),
        ('Дополнительная информация', {
            'fields': ('apartment', 'entrance', 'floor', 'comment')
        }),
        ('Метки', {
            'fields': ('label', 'is_default')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
