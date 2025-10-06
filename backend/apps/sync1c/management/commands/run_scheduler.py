"""
Команда планировщика автоматической синхронизации.
Запускает синхронизацию по расписанию для всех активных источников.
"""

import time
import logging
import threading
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.utils import timezone
from apps.sync1c.models import IntegrationSource

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Запускает планировщик автоматической синхронизации'

    def add_arguments(self, parser):
        parser.add_argument(
            '--check-interval',
            type=int,
            default=30,
            help='Интервал проверки расписания в секундах (по умолчанию: 30)'
        )
        parser.add_argument(
            '--once',
            action='store_true',
            help='Выполнить одну проверку и завершить работу'
        )

    def handle(self, *args, **options):
        check_interval = options['check_interval']
        run_once = options['once']
        
        self.stdout.write(
            self.style.SUCCESS(f'🚀 Планировщик синхронизации запущен (проверка каждые {check_interval} сек)')
        )
        
        try:
            if run_once:
                self.check_and_run_syncs()
            else:
                self.run_scheduler_loop(check_interval)
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('⏹️ Планировщик остановлен пользователем'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Ошибка планировщика: {e}'))
            logger.exception('Ошибка в планировщике синхронизации')

    def run_scheduler_loop(self, check_interval):
        """Основной цикл планировщика."""
        while True:
            try:
                self.check_and_run_syncs()
                time.sleep(check_interval)
            except Exception as e:
                logger.exception(f'Ошибка в цикле планировщика: {e}')
                time.sleep(check_interval)

    def check_and_run_syncs(self):
        """Проверяет расписание и запускает синхронизацию."""
        now = timezone.now()
        
        # Получаем все источники с включенной автосинхронизацией
        sources = IntegrationSource.objects.filter(
            auto_sync_enabled=True,
            is_active=True
        )
        
        for source in sources:
            try:
                # Проверяем быструю синхронизацию (только данные)
                if source.is_data_sync_due() and not source.is_syncing:
                    self.start_data_sync(source)
                
                # Проверяем полную синхронизацию (данные + медиа)
                elif source.is_full_sync_due() and not source.is_syncing:
                    self.start_full_sync(source)
                    
            except Exception as e:
                logger.exception(f'Ошибка при проверке источника {source.code}: {e}')
                # Записываем ошибку в источник
                source.import_status = 'failed'
                source.import_error_message = str(e)
                source.last_error_time = now
                source.save()

    def start_data_sync(self, source):
        """Запускает быструю синхронизацию данных."""
        self.stdout.write(
            self.style.SUCCESS(f'⚡ Запуск быстрой синхронизации для источника "{source.name}"')
        )
        
        # Обновляем статус
        source.import_status = 'running_data'
        source.last_import_started = timezone.now()
        source.import_error_message = None
        source.save()
        
        # Запускаем в отдельном потоке
        thread = threading.Thread(
            target=self.run_sync_command,
            args=(source, True)  # True = skip_media
        )
        thread.daemon = True
        thread.start()

    def start_full_sync(self, source):
        """Запускает полную синхронизацию."""
        self.stdout.write(
            self.style.SUCCESS(f'🖼️ Запуск полной синхронизации для источника "{source.name}"')
        )
        
        # Обновляем статус
        source.import_status = 'running_full'
        source.last_import_started = timezone.now()
        source.import_error_message = None
        source.save()
        
        # Запускаем в отдельном потоке
        thread = threading.Thread(
            target=self.run_sync_command,
            args=(source, False)  # False = включая медиа
        )
        thread.daemon = True
        thread.start()

    def run_sync_command(self, source, skip_media):
        """Выполняет команду синхронизации."""
        try:
            # Строим аргументы команды
            command_args = [source.code]
            if skip_media:
                command_args.append('--skip-media')
            
            # Выполняем команду импорта
            call_command('import_1c_data', *command_args)
            
            # Обновляем статус успеха
            source.refresh_from_db()
            source.import_status = 'completed'
            source.last_import_completed = timezone.now()
            
            if skip_media:
                source.last_data_sync = timezone.now()
                source.schedule_next_data_sync()
                sync_type = 'быстрая'
            else:
                source.last_full_sync = timezone.now()
                source.schedule_next_full_sync()
                # При полной синхронизации также обновляем время данных
                source.last_data_sync = timezone.now()
                source.schedule_next_data_sync()
                sync_type = 'полная'
            
            source.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ {sync_type.capitalize()} синхронизация "{source.name}" завершена')
            )
            
        except Exception as e:
            # Обновляем статус ошибки
            source.refresh_from_db()
            source.import_status = 'failed'
            source.import_error_message = str(e)
            source.last_error_time = timezone.now()
            source.save()
            
            logger.exception(f'Ошибка синхронизации источника {source.code}: {e}')
            self.stdout.write(
                self.style.ERROR(f'❌ Ошибка синхронизации "{source.name}": {e}')
            )
