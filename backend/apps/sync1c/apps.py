"""
Конфигурация приложения Sync1C.
"""

import logging
from django.apps import AppConfig

logger = logging.getLogger('sync1c')


class Sync1CConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sync1c'
    verbose_name = 'Синхронизация с 1С'

    def ready(self):
        """
        Вызывается при запуске приложения.
        Автоматически сбрасывает зависшие синхронизации,
        которые могли остаться после перезапуска контейнера.
        """
        # Избегаем выполнения при автоперезагрузке Django
        import os
        if os.environ.get('RUN_MAIN') != 'true':
            return

        # Откладываем импорт моделей до момента их готовности
        from django.db import connection
        from django.db.utils import OperationalError, ProgrammingError

        try:
            # Проверяем, что таблицы существуют (миграции применены)
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT 1 FROM information_schema.tables WHERE table_name = 'sync1c_integrationsource'"
                )
                if not cursor.fetchone():
                    return

            self._cleanup_stuck_syncs()
        except (OperationalError, ProgrammingError):
            # Таблицы еще не созданы, пропускаем
            pass
        except Exception as e:
            logger.error(f"Ошибка при автоочистке зависших синхронизаций: {e}")

    def _cleanup_stuck_syncs(self):
        """Сбрасывает зависшие синхронизации."""
        from django.utils import timezone
        from .models import IntegrationSource, SyncLog

        # Сбрасываем источники с активными статусами
        stuck_sources = IntegrationSource.objects.filter(
            import_status__in=['running_data', 'running_full']
        )
        stuck_sources_count = stuck_sources.count()

        if stuck_sources_count > 0:
            for source in stuck_sources:
                old_status = source.import_status
                source.import_status = 'idle'
                source.import_error_message = f'Синхронизация прервана при запуске сервера (предыдущий статус: {old_status})'
                source.last_error_time = timezone.now()
                source.save()
                logger.info(f"Сброшен статус источника {source.name}: {old_status} → idle")

        # Сбрасываем зависшие логи синхронизации
        stuck_logs = SyncLog.objects.filter(
            status__in=['started', 'in_progress']
        )
        stuck_logs_count = stuck_logs.count()

        if stuck_logs_count > 0:
            stuck_logs.update(
                status='cancelled',
                message='Синхронизация отменена при запуске сервера',
                finished_at=timezone.now()
            )
            logger.info(f"Отменено {stuck_logs_count} зависших записей синхронизации")

        if stuck_sources_count > 0 or stuck_logs_count > 0:
            logger.info(
                f"Автоочистка завершена: {stuck_sources_count} источников, "
                f"{stuck_logs_count} логов синхронизации"
            )
