from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
    verbose_name = 'Уведомления'

    def ready(self):
        """Подключение сигналов при инициализации приложения"""
        import apps.notifications.signals
