"""
Админка для управления вакансиями.
"""

from django.contrib import admin
from .models import Job, JobMedia


class JobMediaInline(admin.TabularInline):
    """Inline для медиа-файлов вакансии."""
    model = JobMedia
    extra = 1
    fields = ('media_type', 'file', 'video_url', 'caption', 'display_order')


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    """Админка для вакансий."""

    list_display = ('title', 'employment_type', 'location', 'salary_range', 'is_active', 'is_closed', 'author', 'created_at')
    list_filter = ('employment_type', 'is_active', 'is_closed', 'location', 'created_at')
    search_fields = ('title', 'short_description', 'content')
    readonly_fields = ('slug', 'created_at', 'updated_at')
    inlines = [JobMediaInline]

    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'slug', 'short_description', 'content', 'preview_image')
        }),
        ('Детали вакансии', {
            'fields': ('employment_type', 'location', 'work_schedule', 'salary_from', 'salary_to')
        }),
        ('Контакты для откликов', {
            'fields': ('hr_email', 'hr_phone')
        }),
        ('Статус и мета', {
            'fields': ('is_active', 'is_closed', 'author', 'created_at', 'updated_at')
        }),
    )

    def salary_range(self, obj):
        """Отображение зарплатной вилки."""
        if obj.salary_from and obj.salary_to:
            return f"{obj.salary_from} - {obj.salary_to}"
        elif obj.salary_from:
            return f"от {obj.salary_from}"
        elif obj.salary_to:
            return f"до {obj.salary_to}"
        return "Не указана"
    salary_range.short_description = 'Зарплата'

    def save_model(self, request, obj, form, change):
        """Автоматически устанавливаем автора при создании."""
        if not change:  # Если это создание нового объекта
            obj.author = request.user
        super().save_model(request, obj, form, change)


@admin.register(JobMedia)
class JobMediaAdmin(admin.ModelAdmin):
    """Админка для медиа-файлов вакансий."""

    list_display = ('job', 'media_type', 'caption', 'display_order', 'created_at')
    list_filter = ('media_type', 'created_at')
    search_fields = ('job__title', 'caption')
    ordering = ('job', 'display_order', 'created_at')
