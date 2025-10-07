"""
Админ-панель для пользователей.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


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
