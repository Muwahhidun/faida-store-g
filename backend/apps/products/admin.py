"""
Админка для управления товарами.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
import json
from .models import Product, ProductImage


class ProductImageInline(admin.TabularInline):
    """Inline для изображений товара."""
    model = ProductImage
    extra = 1
    fields = ('image', 'alt_text', 'is_main', 'order')
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="100" height="100" />', obj.image.url)
        return "Нет изображения"
    image_preview.short_description = "Превью"


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Админка для товаров."""
    
    list_display = (
        'name', 'code', 'category', 'price', 'currency', 
        'in_stock', 'stock_quantity', 'is_visible_on_site', 'source', 'last_sync_at'
    )
    list_filter = (
        'is_visible_on_site', 'in_stock', 'category', 'brand', 'source',
        'created_at', 'last_sync_at'
    )
    search_fields = ('name', 'code', 'description', 'tags')
    list_editable = ('is_visible_on_site', 'in_stock', 'stock_quantity')
    readonly_fields = (
        'code', 'created_at', 'updated_at', 'last_sync_at', 'sync_hash',
        'formatted_prices_data', 'formatted_stocks_data'
    )
    
    fieldsets = (
        ('Основная информация', {
            'fields': (
                'code', 'name', 'category', 'brand', 'description'
            )
        }),
        ('Цена и наличие', {
            'fields': (
                'price', 'currency', 'unit', 'in_stock', 'stock_quantity'
            )
        }),
        ('Данные из 1С (JSON)', {
            'fields': ('formatted_prices_data', 'formatted_stocks_data'),
            'classes': ('collapse',),
        }),
        ('Характеристики', {
            'fields': (
                'weight', 'composition', 'shelf_life', 'storage_conditions'
            ),
            'classes': ('collapse',)
        }),
        ('SEO', {
            'fields': (
                'seo_title', 'seo_description', 'tags'
            ),
            'classes': ('collapse',)
        }),
        ('Связанные товары', {
            'fields': ('related_products',),
            'classes': ('collapse',)
        }),
        ('Управление отображением на сайте', {
            'fields': (
                'selected_price_code', 
                'selected_stock_code', 
                'stock_display_style', 
                'low_stock_threshold'
            ),
        }),
        ('Служебные поля', {
            'fields': (
                'is_visible_on_site', 'created_at', 'updated_at',
                'last_sync_at', 'sync_hash'
            ),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ProductImageInline]
    
    def formatted_prices_data(self, obj):
        """Красивый вывод JSON с ценами."""
        formatted_json = json.dumps(obj.prices_data, indent=4, ensure_ascii=False)
        return mark_safe(f'<pre>{formatted_json}</pre>')
    formatted_prices_data.short_description = "Данные о ценах (JSON)"

    def formatted_stocks_data(self, obj):
        """Красивый вывод JSON с остатками."""
        formatted_json = json.dumps(obj.stocks_data, indent=4, ensure_ascii=False)
        return mark_safe(f'<pre>{formatted_json}</pre>')
    formatted_stocks_data.short_description = "Данные об остатках (JSON)"

    def main_image_preview(self, obj):
        """Превью основного изображения."""
        main_image = obj.main_image
        if main_image:
            return format_html(
                '<img src="{}" width="150" height="150" />',
                main_image.image.url
            )
        return "Нет основного изображения"
    main_image_preview.short_description = "Основное изображение"
    
    def get_queryset(self, request):
        """Оптимизированный queryset."""
        return super().get_queryset(request).select_related('category').prefetch_related('images')


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    """Админка для изображений товаров."""
    
    list_display = ('product', 'image_preview', 'alt_text', 'is_main', 'order')
    list_filter = ('is_main', 'created_at')
    search_fields = ('product__name', 'alt_text')
    list_editable = ('is_main', 'order')
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="100" height="100" />', obj.image.url)
        return "Нет изображения"
    image_preview.short_description = "Превью"