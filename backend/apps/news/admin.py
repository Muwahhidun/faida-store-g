from django.contrib import admin
from .models import News, NewsCategory, NewsMedia


class NewsMediaInline(admin.TabularInline):
    """Inline для медиа-файлов новости."""
    model = NewsMedia
    extra = 0
    fields = ('media_type', 'file', 'video_url', 'caption', 'display_order')


@admin.register(NewsCategory)
class NewsCategoryAdmin(admin.ModelAdmin):
    """Админка для категорий новостей."""
    list_display = ('name', 'slug', 'display_order')
    list_editable = ('display_order',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    """Админка для новостей."""
    list_display = (
        'title',
        'category',
        'author',
        'is_published',
        'published_at',
        'views_count',
        'created_at'
    )
    list_filter = ('is_published', 'category', 'created_at', 'published_at')
    search_fields = ('title', 'short_description', 'content')
    readonly_fields = ('slug', 'views_count', 'created_at', 'updated_at')
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'published_at'
    inlines = [NewsMediaInline]

    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'slug', 'category', 'author')
        }),
        ('Содержание', {
            'fields': ('short_description', 'content', 'content_delta', 'preview_image')
        }),
        ('Публикация', {
            'fields': ('is_published', 'published_at')
        }),
        ('Статистика', {
            'fields': ('views_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        """Автоматически устанавливаем автора при создании."""
        if not obj.pk:
            obj.author = request.user
        super().save_model(request, obj, form, change)


@admin.register(NewsMedia)
class NewsMediaAdmin(admin.ModelAdmin):
    """Админка для медиа-файлов новостей."""
    list_display = ('news', 'media_type', 'caption', 'display_order', 'created_at')
    list_filter = ('media_type', 'created_at')
    search_fields = ('news__title', 'caption')
    list_editable = ('display_order',)
