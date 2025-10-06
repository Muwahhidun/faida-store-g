# Faida Group Store - Интернет-магазин с интеграцией 1С

Современный интернет-магазин на Django + Vite с полной синхронизацией с системой 1С.

## 🚀 Быстрый старт

1. **Запуск проекта:**
   ```bash
   python start_project.py
   ```

2. **Ручной запуск (альтернатива):**
   ```bash
   # Запуск контейнеров
   docker-compose up --build -d
   
   # Миграции базы данных
   docker-compose exec backend python manage.py makemigrations
   docker-compose exec backend python manage.py migrate
   
   # Создание суперпользователя
   docker-compose exec backend python manage.py createsuperuser
   
   # Импорт данных из 1С
   docker-compose exec backend python manage.py import_1c_data
   ```

## 🏗️ Архитектура проекта

```
project/
├── backend/                 # Django приложение
│   ├── config/             # Настройки проекта
│   ├── apps/
│   │   ├── products/       # Управление товарами
│   │   ├── categories/     # Категории товаров
│   │   ├── sync1c/         # Синхронизация с 1С
│   │   └── api/           # REST API
│   └── requirements.txt
├── frontend/               # React + Vite приложение (планируется)
├── data/                   # Данные из 1С
│   └── goods/
│       └── pp/            # База данных "pp" из 1С
│           ├── export.json # Данные товаров
│           └── export_media/ # Изображения товаров
├── docker-compose.yml      # Оркестрация контейнеров
└── start_project.py       # Скрипт быстрого запуска
```

## 🐳 Сервисы Docker

- **backend** - Django приложение (порт 8000)
- **db** - PostgreSQL база данных (порт 5432)
- **redis** - Redis для кэширования (порт 6379)
- **frontend** - Vite dev server (порт 5173, планируется)
- **nginx** - Веб-сервер для production (порт 80)

## 📊 Доступные адреса

- **Django Admin:** http://localhost:8000/admin/
- **API Documentation:** http://localhost:8000/api/docs/
- **REST API:** http://localhost:8000/api/
- **Frontend:** http://localhost:5173/ (планируется)

## 🔧 Управление данными 1С

### Импорт товаров
```bash
# Полная синхронизация (данные + медиафайлы)
docker-compose exec backend python manage.py import_1c_data pp

# Быстрая синхронизация (только данные)
docker-compose exec backend python manage.py import_1c_data pp --skip-media

# Автоматический планировщик синхронизации
docker-compose exec backend python manage.py run_scheduler

# Разовая проверка планировщика
docker-compose exec backend python manage.py run_scheduler --once
```

### Интеллектуальная синхронизация
- **Быстрая синхронизация** - обновляет только цены, остатки, названия (без изображений)
- **Полная синхронизация** - включает обработку медиафайлов с оптимизацией
- **Автоматический планировщик** - настраиваемые интервалы для каждого типа синхронизации
- **Обработка удаленных товаров** - автоматическое скрытие товаров, удаленных из 1С
- **Оптимизация медиафайлов** - обновление только измененных изображений по MD5 хэшу
- **Проверки целостности** - валидация данных после каждой синхронизации

### Структура данных 1С
```json
{
  "database": "pp",
  "lastUpdate": "2025-09-11T12:00:00Z",
  "totalProducts": 3,
  "products": [
    {
      "id": "пп-ЦБ-00011341",
      "name": "Название товара",
      "category": "Категория",
      "price": 320.00,
      "inStock": true,
      "stockQuantity": 15,
      "description": "Описание товара",
      "nutritionalValue": {
        "calories": 280,
        "proteins": 18.5,
        "fats": 22.0,
        "carbohydrates": 1.2
      }
    }
  ]
}
```

## 🗄️ Модели данных

### Product (Товар)
- Код товара из 1С
- Название, описание, характеристики
- Цена, наличие, остатки
- Пищевая ценность
- SEO поля
- Связанные товары

### Category (Категория)
- Иерархическая структура
- SEO оптимизация
- Изображения категорий

### ProductImage (Изображения)
- Множественные изображения для товара
- Автоматическая оптимизация
- Основное изображение

### SyncLog (Логи синхронизации)
- Полная история импортов
- Статистика и ошибки
- Мониторинг производительности

## 📈 Мониторинг и логи

```bash
# Просмотр логов
docker-compose logs -f backend
docker-compose logs -f db

# Статус контейнеров
docker-compose ps

# Вход в контейнер
docker-compose exec backend bash
```

## 🛠️ Разработка

### Добавление новых полей товара
1. Обновите модель `Product` в `apps/products/models.py`
2. Обновите сервис импорта в `apps/sync1c/services.py`
3. Создайте и примените миграции

### Настройка синхронизации
Параметры синхронизации настраиваются в `backend/config/settings.py`:

```python
SYNC_1C_SETTINGS = {
    'JSON_FILE_PATH': GOODS_DATA_DIR / 'pp' / 'export.json',
    'MEDIA_DIR_PATH': GOODS_DATA_DIR / 'pp' / 'export_media',
    'BATCH_SIZE': 100,
    'AUTO_SYNC_INTERVAL': 300,
}
```

## 🔒 Безопасность

- Все переменные окружения в `.env`
- CORS настроен для фронтенда
- Валидация данных на уровне модели
- Логирование всех операций

## 📋 TODO

### ✅ Выполнено
- [x] React фронтенд с Vite
- [x] API для каталога товаров
- [x] Система поиска и фильтрации
- [x] Автоматическая синхронизация по расписанию
- [x] Интеллектуальная синхронизация с оптимизацией
- [x] Админ-панель для управления источниками данных
- [x] Обработка удаленных товаров/категорий
- [x] Оптимизация синхронизации медиафайлов

### 🚧 В разработке
- [ ] Корзина и оформление заказов
- [ ] Система уведомлений об изменениях
- [ ] Тесты покрытия
- [ ] CI/CD pipeline

## 👥 Команда

Разработано для Faida Group - качественные халяль продукты с доставкой.

---
*Последнее обновление: 11.09.2025*