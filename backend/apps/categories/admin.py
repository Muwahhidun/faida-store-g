"""
Админка для управления категориями.
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Админка для категорий."""
    
    list_display = (
        'name', 'code_category', 'parent', 'products_count', 'order', 
        'is_active', 'is_visible_on_site', 'created_at'
    )
    list_filter = ('is_active', 'is_visible_on_site', 'parent', 'created_at')
    search_fields = ('name', 'description')
    list_editable = ('order', 'is_active', 'is_visible_on_site')
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'slug', 'code_category', 'description', 'parent', 'order')
        }),
        ('Изображение', {
            'fields': ('image', 'image_preview'),
            'classes': ('collapse',)
        }),
        ('SEO', {
            'fields': ('seo_title', 'seo_description'),
            'classes': ('collapse',)
        }),
        ('Служебные поля', {
            'fields': ('is_active', 'is_visible_on_site', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'image_preview')
    
    def image_preview(self, obj):
        """Превью изображения категории."""
        if obj.image:
            return format_html(
                '<img src="{}" width="150" height="150" />',
                obj.image.url
            )
        return "Нет изображения"
    image_preview.short_description = "Превью изображения"
    
    def products_count(self, obj):
        """Количество товаров в категории."""
        return obj.products_count
    products_count.short_description = "Количество товаров"