#!/usr/bin/env python3

import os
import django
import sys

# Добавляем путь к проекту
sys.path.append('/app')

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.sync1c.models import IntegrationSource
from apps.sync1c.services import ProductImporter
import logging

# Настраиваем логирование для подробного вывода
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('sync1c')

def debug_import():
    try:
        # Получаем источник данных
        source = IntegrationSource.objects.get(code='pp')
        print(f"Найден источник: {source.name}")
        print(f"JSON файл: {source.json_file_path}")
        print(f"Медиа папка: {source.media_dir_path}")
        
        # Создаем импортер
        importer = ProductImporter()
        
        # Запускаем импорт только первого товара с изображениями для отладки
        print("\nНачинаем тестовый импорт...")
        sync_log = importer.import_from_source(source, skip_media=False)
        
        print(f"\nРезультат импорта:")
        print(f"Статус: {sync_log.status}")
        print(f"Обработано товаров: {sync_log.processed_products}")
        print(f"Создано товаров: {sync_log.created_products}")
        print(f"Обновлено товаров: {sync_log.updated_products}")
        print(f"Ошибок: {sync_log.errors_count}")
        
        # Проверим количество изображений после импорта
        from apps.products.models import ProductImage
        images_count = ProductImage.objects.count()
        print(f"Изображений в БД после импорта: {images_count}")
        
    except Exception as e:
        print(f"Ошибка при отладке импорта: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_import()
