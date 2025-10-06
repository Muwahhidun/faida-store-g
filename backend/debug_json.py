#!/usr/bin/env python3

import os
import sys
import django
import json
from pathlib import Path

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.append('/app')
django.setup()

from django.conf import settings

# Читаем JSON файл импорта
json_file_path = settings.GOODS_DATA_DIR / 'pp' / 'export.json'

if json_file_path.exists():
    with open(json_file_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)
    
    print(f'Найдено товаров в JSON: {len(data)}')
    
    # Найдем товар с изображениями
    for product_data in data[:10]:  # Первые 10 товаров
        images = product_data.get('Изображения', [])
        if images:
            print(f'\n=== Товар: {product_data.get("Код", "НЕТ КОДА")} ===')
            print(f'Название: {product_data.get("Наименование", "НЕТ НАЗВАНИЯ")}')
            print(f'Изображения ({len(images)}):')
            for i, img in enumerate(images):
                if isinstance(img, str):
                    print(f'  {i}: (строка) "{img}"')
                elif isinstance(img, dict):
                    path = img.get('Путь', 'НЕТ ПУТИ')
                    is_main = img.get('Основное', False)
                    print(f'  {i}: (объект) Путь="{path}", Основное={is_main}')
                else:
                    print(f'  {i}: (неизвестный тип) {type(img)} = {img}')
            break
    else:
        print('❌ Не найдено товаров с изображениями в первых 10')
else:
    print(f'❌ JSON файл не найден: {json_file_path}')
