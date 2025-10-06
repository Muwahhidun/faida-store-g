"""
Команда для сброса статуса импорта источников данных.
"""

from django.core.management.base import BaseCommand
from apps.sync1c.models import IntegrationSource


class Command(BaseCommand):
    help = 'Сбросить статус импорта для всех источников или конкретного источника'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            type=str,
            help='Код источника для сброса (например: opt, pp). Если не указан, сбросит все источники.',
        )

    def handle(self, *args, **options):
        source_code = options.get('source')
        
        if source_code:
            try:
                source = IntegrationSource.objects.get(code=source_code)
                self.reset_source_status(source)
                self.stdout.write(
                    self.style.SUCCESS(f'Статус импорта для источника "{source.name}" ({source.code}) сброшен.')
                )
            except IntegrationSource.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Источник с кодом "{source_code}" не найден.')
                )
        else:
            sources = IntegrationSource.objects.filter(import_status='running')
            count = 0
            for source in sources:
                self.reset_source_status(source)
                count += 1
            
            if count > 0:
                self.stdout.write(
                    self.style.SUCCESS(f'Статус импорта сброшен для {count} источников.')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('Нет источников со статусом "running".')
                )

    def reset_source_status(self, source):
        """Сбросить статус импорта для источника."""
        source.import_status = 'idle'
        source.import_error_message = None
        source.save()
        
        self.stdout.write(f'  - {source.name} ({source.code}): статус сброшен на "idle"')
