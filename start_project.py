#!/usr/bin/env python
"""
Скрипт для запуска Docker контейнеров и тестирования импорта.
"""

import subprocess
import sys
import time
import os

def run_command(command, check=True):
    """Выполнение команды в shell."""
    print(f"🔧 Выполняем: {command}")
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    
    if result.stdout:
        print(result.stdout)
    
    if result.stderr and check:
        print(f"❌ Ошибка: {result.stderr}")
        if check:
            sys.exit(1)
    
    return result

def main():
    """Основная функция запуска."""
    
    print("🚀 Запуск Faida Group Store...")
    
    # 1. Проверяем наличие Docker
    print("\n1️⃣ Проверяем Docker...")
    try:
        run_command("docker --version")
        run_command("docker-compose --version")
    except:
        print("❌ Docker или Docker Compose не установлены!")
        sys.exit(1)
    
    # 2. Останавливаем старые контейнеры (если есть)
    print("\n2️⃣ Останавливаем старые контейнеры...")
    run_command("docker-compose down", check=False)
    
    # 3. Собираем и запускаем контейнеры
    print("\n3️⃣ Собираем и запускаем контейнеры...")
    run_command("docker-compose up --build -d")
    
    # 4. Ждем запуска базы данных
    print("\n4️⃣ Ждем запуска базы данных...")
    time.sleep(10)
    
    # 5. Выполняем миграции
    print("\n5️⃣ Выполняем миграции базы данных...")
    run_command("docker-compose exec backend python manage.py makemigrations")
    run_command("docker-compose exec backend python manage.py migrate")
    
    # 6. Создаем суперпользователя
    print("\n6️⃣ Создаем суперпользователя...")
    run_command(
        'docker-compose exec backend python manage.py shell -c "'
        'from django.contrib.auth import get_user_model; '
        'User = get_user_model(); '
        'User.objects.filter(username=\"admin\").exists() or '
        'User.objects.create_superuser(\"admin\", \"admin@faida.ru\", \"admin123\")'
        '"'
    )
    
    # 7. Импортируем тестовые данные
    print("\n7️⃣ Импортируем тестовые данные из 1С...")
    run_command("docker-compose exec backend python manage.py import_1c_data")
    
    # 8. Показываем информацию о запуске
    print("\n✅ Проект успешно запущен!")
    print("\n📍 Доступные адреса:")
    print("   🔥 Frontend (Vite): http://localhost:5173/")
    print("   🌐 Django Admin: http://localhost:8000/admin/")
    print("   📚 API Docs: http://localhost:8000/api/docs/")
    print("   🔗 API: http://localhost:8000/api/")
    print("\n🔑 Учетные данные админа:")
    print("   Логин: admin")
    print("   Пароль: admin123")
    
    print("\n📊 Для просмотра логов:")
    print("   docker-compose logs -f backend")
    print("   docker-compose logs -f frontend")
    
    print("\n🛑 Для остановки:")
    print("   docker-compose down")

if __name__ == "__main__":
    main()