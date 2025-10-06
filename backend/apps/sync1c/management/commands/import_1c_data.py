"""
Django команда для импорта данных из 1С.
"""

from django.core.management.base import BaseCommand, CommandError
from apps.sync1c.services import ProductImporter
from apps.sync1c.models import IntegrationSource

class Command(BaseCommand):
    help = 'Импортирует товары из JSON файла 1С для указанного источника данных.'

    def add_arguments(self, parser):
        parser.add_argument(
            'source_code', 
            type=str, 
            help='Код источника данных (например, "pp"), который нужно импортировать.'
        )
        parser.add_argument(
            '--skip-media',
            action='store_true',
            help='Пропустить синхронизацию медиафайлов (только данные)'
        )

    def handle(self, *args, **options):
        source_code = options['source_code']
        skip_media = options['skip_media']
        
        sync_type = "быстрый (только данные)" if skip_media else "полный (данные + медиа)"
        self.stdout.write(self.style.SUCCESS(f"Запуск {sync_type} импорта для источника: {source_code}"))

        try:
            source = IntegrationSource.objects.get(code=source_code, is_active=True)
        except IntegrationSource.DoesNotExist:
            raise CommandError(f'Источник данных с кодом "{source_code}" не найден или неактивен.')

        importer = ProductImporter()
        
        try:
            sync_log = importer.import_from_source(source, skip_media=skip_media)
            
            self.stdout.write(self.style.SUCCESS(f"Импорт успешно завершен."))
            self.stdout.write(f"  Всего обработано: {sync_log.processed_products}")
            self.stdout.write(f"  Создано новых: {sync_log.created_products}")
            self.stdout.write(f"  Обновлено существующих: {sync_log.updated_products}")
            self.stdout.write(f"  Ошибок: {sync_log.errors_count}")

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Произошла критическая ошибка во время импорта: {e}"))
            # Можно добавить дополнительное логирование или уведомления