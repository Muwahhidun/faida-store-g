"""
Конфигурация приложения Sync1C.
"""

from django.apps import AppConfig


class Sync1CConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sync1c'
    verbose_name = 'Синхронизация с 1С'