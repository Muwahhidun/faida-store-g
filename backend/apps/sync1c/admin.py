"""
Админка для синхронизации с 1С.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import SyncLog, SyncError, IntegrationSource
from .forms import IntegrationSourceAdminForm


class SyncErrorInline(admin.TabularInline):
    """Inline для ошибок синхронизации."""
    model = SyncError
    extra = 0
    readonly_fields = ('product_code', 'error_type', 'error_message', 'created_at')
    fields = ('product_code', 'error_type', 'error_message', 'created_at')
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(IntegrationSource)
class IntegrationSourceAdmin(admin.ModelAdmin):
    """Админка для источников данных 1С."""
    form = IntegrationSourceAdminForm
    list_display = ('name', 'code', 'is_active', 'show_on_site', 'created_at')
    list_filter = ('is_active', 'show_on_site')
    search_fields = ('name', 'code')
    
    fieldsets = (
        (None, {
            'fields': ('name', 'code', 'is_active', 'show_on_site')
        }),
        ('Пути к файлам', {
            'fields': ('json_file_path', 'media_dir_path'),
            'description': "Пути указываются относительно папки 'goods_data' в корне проекта."
        }),
        ('Правила по умолчанию', {
            'fields': ('default_price_type_name', 'default_warehouse_name'),
            'description': "Эти правила будут применяться ко всем товарам из этого источника, если у товара не заданы индивидуальные правила."
        }),
    )


@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    """Админка для логов синхронизации."""
    
    list_display = (
        'started_at', 'sync_type', 'status', 'progress_bar',
        'total_products', 'processed_products', 'created_products',
        'updated_products', 'errors_count', 'duration'
    )
    list_filter = ('sync_type', 'status', 'started_at')
    search_fields = ('message', 'error_details')
    readonly_fields = (
        'sync_type', 'started_at', 'finished_at', 'duration',
        'total_products', 'processed_products', 'created_products',
        'updated_products', 'errors_count', 'source_file_path',
        'source_file_size', 'source_file_modified', 'progress_bar'
    )
    
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'sync_type', 'status', 'progress_bar', 'message'
            )
        }),
        ('Статистика', {
            'fields': (
                'total_products', 'processed_products', 'created_products',
                'updated_products', 'errors_count'
            )
        }),
        ('Временные метки', {
            'fields': (
                'started_at', 'finished_at', 'duration'
            )
        }),
        ('Исходный файл', {
            'fields': (
                'source_file_path', 'source_file_size', 'source_file_modified'
            ),
            'classes': ('collapse',)
        }),
        ('Ошибки', {
            'fields': ('error_details',),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [SyncErrorInline]
    
    def progress_bar(self, obj):
        """Прогресс-бар выполнения синхронизации."""
        if obj.total_products == 0:
            return "—"
        
        percentage = obj.progress_percentage
        
        if obj.status == 'completed':
            color = '#28a745'  # зеленый
        elif obj.status == 'failed':
            color = '#dc3545'  # красный
        elif obj.status in ['started', 'in_progress']:
            color = '#007bff'  # синий
        else:
            color = '#6c757d'  # серый
        
        return format_html(
            '<div style="width: 100px; background-color: #e9ecef; border-radius: 4px;">'
            '<div style="width: {}%; height: 20px; background-color: {}; border-radius: 4px; '
            'text-align: center; line-height: 20px; color: white; font-size: 12px;">'
            '{}%</div></div>',
            percentage, color, percentage
        )
    progress_bar.short_description = "Прогресс"
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Разрешаем удаление только завершенных синхронизаций
        if obj and obj.status in ['completed', 'failed', 'cancelled']:
            return True
        return False


@admin.register(SyncError)
class SyncErrorAdmin(admin.ModelAdmin):
    """Админка для ошибок синхронизации."""
    
    list_display = (
        'sync_log', 'product_code', 'error_type', 'error_message_short', 'created_at'
    )
    list_filter = ('error_type', 'created_at', 'sync_log')
    search_fields = ('product_code', 'error_message', 'error_type')
    readonly_fields = ('sync_log', 'product_code', 'error_type', 'error_message', 'stack_trace', 'created_at')
    
    def error_message_short(self, obj):
        """Сокращенное сообщение об ошибке."""
        if len(obj.error_message) > 100:
            return obj.error_message[:100] + "..."
        return obj.error_message
    error_message_short.short_description = "Сообщение об ошибке"
    
    def has_add_permission(self, request):
        return False