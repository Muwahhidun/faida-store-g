#!/usr/bin/env python
import os
import sys
import django

# Настройка Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.sync1c.models import IntegrationSource

print("=== Статус источников ===")
sources = IntegrationSource.objects.all()
for source in sources:
    print(f"Источник: {source.name} ({source.code})")
    print(f"  - Активен: {source.is_active}")
    print(f"  - Показывать на сайте: {source.show_on_site}")
    print(f"  - Статус импорта: {source.import_status}")
    print(f"  - Последний запуск: {source.last_import_started}")
    print(f"  - Последнее завершение: {source.last_import_completed}")
    print(f"  - Ошибка: {source.import_error_message}")
    print()
