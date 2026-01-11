"""
Команда для сброса статуса импорта источников данных.
Используется для очистки зависших синхронизаций после перезапуска контейнера.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.sync1c.models import IntegrationSource, SyncLog


class Command(BaseCommand):
    help = 'Сбросить статус импорта для всех источников или конкретного источника'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            type=str,
            help='Код источника для сброса (например: opt, pp). Если не указан, сбросит все источники.',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Сбросить статус всех источников, независимо от текущего статуса.',
        )

    def handle(self, *args, **options):
        source_code = options.get('source')
        reset_all = options.get('all')

        if source_code:
            try:
                source = IntegrationSource.objects.get(code=source_code)
                self.reset_source_status(source)
                self.reset_sync_logs(source)
                self.stdout.write(
                    self.style.SUCCESS(f'Статус импорта для источника "{source.name}" ({source.code}) сброшен.')
                )
            except IntegrationSource.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Источник с кодом "{source_code}" не найден.')
                )
        else:
            # Фильтруем по статусам синхронизации
            if reset_all:
                sources = IntegrationSource.objects.all()
            else:
                # Ищем источники с активными статусами синхронизации
                sources = IntegrationSource.objects.filter(
                    import_status__in=['running_data', 'running_full']
                )

            count = 0
            for source in sources:
                self.reset_source_status(source)
                self.reset_sync_logs(source)
                count += 1

            if count > 0:
                self.stdout.write(
                    self.style.SUCCESS(f'Статус импорта сброшен для {count} источников.')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('Нет источников с активной синхронизацией.')
                )

        # Также сбрасываем все зависшие SyncLog без привязки к источнику
        orphan_logs = self.reset_orphan_sync_logs()
        if orphan_logs > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Отменено {orphan_logs} зависших записей синхронизации без источника.')
            )

    def reset_source_status(self, source):
        """Сбросить статус импорта для источника."""
        old_status = source.import_status
        source.import_status = 'idle'
        source.import_error_message = f'Синхронизация прервана (предыдущий статус: {old_status})'
        source.last_error_time = timezone.now()
        source.save()

        self.stdout.write(f'  - {source.name} ({source.code}): статус сброшен "{old_status}" → "idle"')

    def reset_sync_logs(self, source):
        """Сбросить статус зависших SyncLog для источника."""
        # Находим все незавершенные логи синхронизации для этого источника
        stuck_logs = SyncLog.objects.filter(
            source=source,
            status__in=['started', 'in_progress']
        )

        count = stuck_logs.count()
        if count > 0:
            stuck_logs.update(
                status='cancelled',
                message='Синхронизация отменена из-за перезапуска сервера',
                finished_at=timezone.now()
            )
            self.stdout.write(f'    Отменено {count} зависших записей синхронизации')

    def reset_orphan_sync_logs(self):
        """Сбросить зависшие SyncLog без привязки к источнику."""
        stuck_logs = SyncLog.objects.filter(
            status__in=['started', 'in_progress']
        )

        count = stuck_logs.count()
        if count > 0:
            stuck_logs.update(
                status='cancelled',
                message='Синхронизация отменена из-за перезапуска сервера',
                finished_at=timezone.now()
            )

        return count
