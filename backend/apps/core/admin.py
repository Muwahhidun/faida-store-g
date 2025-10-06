from django.contrib import admin
from .models import SiteSettings

# Используем django-solo для удобного управления Singleton моделью
# Если solo не установлен, можно использовать простой admin.ModelAdmin
try:
    from solo.admin import SingletonModelAdmin
    admin.site.register(SiteSettings, SingletonModelAdmin)
except ImportError:
    @admin.register(SiteSettings)
    class SiteSettingsAdmin(admin.ModelAdmin):
        
        def has_add_permission(self, request):
            # Запрещаем добавление новых записей, если одна уже есть
            return not SiteSettings.objects.exists()

        def has_delete_permission(self, request, obj=None):
            # Запрещаем удаление записи
            return False
