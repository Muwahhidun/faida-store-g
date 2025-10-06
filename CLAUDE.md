# CLAUDE.md

Этот файл предоставляет руководство для Claude Code (claude.ai/code) при работе с кодом в этом репозитории.

## Обзор проекта

**Faida Group Store** - Платформа электронной коммерции с интеграцией 1С для продажи халяльных продуктов. Full-stack приложение с Django REST API бэкендом и React/Vite фронтендом.

### Стек технологий

**Бэкенд:**
- Django 4.2.7 + Django REST Framework
- PostgreSQL 15 (база данных)
- Redis 7 (кэширование)
- JWT аутентификация (rest_framework_simplejwt)
- drf-spectacular (документация API)

**Фронтенд:**
- React 18 + TypeScript
- Vite 4 (сборщик)
- React Router v6
- TanStack Query (react-query)
- Zustand (управление состоянием)
- Tailwind CSS + Headless UI
- Axios (HTTP клиент)

**Инфраструктура:**
- Docker Compose (4 сервиса: db, redis, backend, frontend)
- Scheduler сервис для автоматической синхронизации с 1С

## Основные команды

### Операции с Docker

```bash
# Запустить все сервисы
docker-compose up

# Запустить в фоновом режиме
docker-compose up -d

# Собрать и запустить
docker-compose up --build

# Остановить сервисы
docker-compose down

# Просмотр логов
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Команды бэкенда (Django)

Все команды бэкенда выполняются внутри Docker контейнера:

```bash
# Выполнение команд управления Django
docker-compose exec backend python manage.py <команда>

# Миграции базы данных
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Создать суперпользователя
docker-compose exec backend python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@faida.ru', 'admin123')"

# Импорт данных из 1С
docker-compose exec backend python manage.py import_1c_data

# Запустить планировщик (автосинхронизация)
docker-compose exec backend python manage.py run_scheduler

# Сбросить статус импорта
docker-compose exec backend python manage.py reset_import_status

# Django shell
docker-compose exec backend python manage.py shell

# Собрать статические файлы
docker-compose exec backend python manage.py collectstatic --noinput
```

### Команды фронтенда

```bash
# Сервер разработки (запускается автоматически в Docker)
npm run dev

# Сборка для продакшена
npm run build

# Линтинг
npm run lint

# Предпросмотр production сборки
npm run preview
```

### Полная настройка проекта

Используйте автоматизированный скрипт:

```bash
python start_project.py
```

Этот скрипт выполняет:
1. Проверку версии Docker
2. Остановку старых контейнеров
3. Сборку и запуск контейнеров
4. Ожидание запуска базы данных
5. Выполнение миграций
6. Создание суперпользователя (admin/admin123)
7. Импорт тестовых данных из 1С

## Архитектура

### Структура бэкенда

```
backend/
├── apps/
│   ├── products/       # Модели товаров, админка
│   ├── categories/     # Иерархия категорий
│   ├── sync1c/         # Интеграция с 1С (сервис импорта, планировщик, модели)
│   ├── api/            # REST API (views, serializers, filters, URLs)
│   └── core/           # Настройки сайта, общие модели
├── config/
│   ├── settings.py     # Настройки Django
│   └── urls.py         # Корневая конфигурация URL
└── manage.py
```

**Основные модели:**
- `Product`: code (уникальный), name, price, stock_quantity, in_stock, category FK, images (через ProductImage), prices_data JSONField, stocks_data JSONField, source FK
- `ProductImage`: product FK, image FileField, file_hash (для дедупликации), display_order
- `Category`: code_1c (уникальный), name, slug, parent FK (самоссылающаяся иерархия), is_visible_on_site
- `IntegrationSource`: name, json_file_path, media_dir_path, is_active, show_on_site, auto_sync_enabled, import_status
- `SyncLog`: sync_type, status, source FK, временные метки, счетчики
- `SiteSettings`: Singleton модель для настроек всего сайта

**Интеграция с 1С:**
- Сервис `ProductImporter` в [apps/sync1c/services.py](backend/apps/sync1c/services.py)
- Импорт из JSON экспортов (поддержка UTF-8-sig BOM)
- Обработка иерархии категорий, товаров, изображений с дедупликацией на основе хэша
- Пакетная обработка (настраиваемый BATCH_SIZE)
- Медиа-файлы копируются из внешней директории (`data/goods/`)
- Поддержка нескольких источников через модель IntegrationSource
- Сервис планировщика выполняет автосинхронизацию через интервалы

**Структура API:**
- ViewSets: `ProductViewSet`, `CategoryViewSet`, `IntegrationSourceViewSet` и т.д.
- Пользовательские действия: `import_data`, `quick_sync`, `popular`, `bulk_update`
- Фильтрация: DjangoFilterBackend + кастомные ProductFilter, CategoryFilter
- Пагинация: LimitOffsetPagination (24 на страницу)
- Кэширование: Django cache framework с бэкендом Redis

### Структура фронтенда

```
frontend/src/
├── components/         # Переиспользуемые UI компоненты
│   ├── Layout.tsx      # Основная обертка layout
│   ├── Header.tsx      # Навигация, кнопка корзины
│   ├── Footer.tsx
│   ├── CategorySidebar.tsx
│   ├── ProductImage.tsx  # Изображение с fallback
│   └── CartButton.tsx
├── pages/             # Страницы маршрутов
│   ├── HomePage.tsx
│   ├── ProductsPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── CategoryPage.tsx
│   ├── CartPage.tsx
│   ├── AdminPanelPage.tsx
│   └── LoginPage.tsx
├── contexts/          # React Context провайдеры
│   └── CartContext.tsx
├── hooks/             # Кастомные React хуки
│   └── api.ts         # TanStack Query хуки
├── api/
│   └── client.ts      # Конфигурация Axios инстанса
├── store/
│   └── index.ts       # Zustand store
├── types/
│   └── index.ts       # TypeScript интерфейсы
└── App.tsx            # Корневой компонент с роутингом
```

**Управление состоянием:**
- TanStack Query для серверного состояния (товары, категории)
- Zustand для состояния корзины
- React Context для операций с корзиной
- JWT токен хранится в localStorage

**Маршрутизация:**
- `/` - HomePage (избранные товары)
- `/products` - ProductsPage (каталог с фильтрами)
- `/products/:id` - ProductDetailPage
- `/category/:slug` - CategoryPage (товары по категории)
- `/cart` - CartPage
- `/panel` - AdminPanelPage (защищенный маршрут, только админ)
- `/login` - LoginPage

### Поток данных

1. **Экспорт из 1С**: Внешняя система экспортирует JSON + изображения в `data/goods/{source_name}/`
2. **Синхронизация**: Планировщик или ручной запуск выполняет `ProductImporter.import_from_source()`
3. **Обработка**: Пакетный импорт создает/обновляет Categories → Products → ProductImages
4. **API**: Django REST API предоставляет данные с фильтрацией, пагинацией, кэшированием
5. **Фронтенд**: React получает данные через TanStack Query, рендерит с Tailwind UI

## Конфигурация

### Переменные окружения

Бэкенд (`docker-compose.yml` устанавливает их):
- `DEBUG=True`
- `DATABASE_URL=postgresql://faida_user:faida_password@db:5432/faida_store`
- `REDIS_URL=redis://redis:6379/0`
- `GOODS_DATA_PATH=/app/goods_data` (монтируется из `./data/goods`)
- `ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,backend,*`

Фронтенд:
- `VITE_API_URL=http://localhost:8000/api`

### Настройки Django

Ключевые настройки в [backend/config/settings.py](backend/config/settings.py):
- `SYNC_1C_SETTINGS`: JSON_FILE_PATH, MEDIA_DIR_PATH, BATCH_SIZE, AUTO_SYNC_INTERVAL
- `GOODS_DATA_DIR = BASE_DIR / 'goods_data'`
- `CORS_ALLOW_ALL_ORIGINS = True` (разработка)
- `REST_FRAMEWORK`: JWT auth, DjangoFilterBackend, LimitOffsetPagination
- `SIMPLE_JWT`: 30-дневные access токены, 90-дневные refresh токены
- `CACHES`: Redis бэкенд

### URL-адреса

- **Фронтенд**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin/ (admin/admin123)
- **API Docs**: http://localhost:8000/api/docs/

### База данных

PostgreSQL доступна по адресу `localhost:5432`:
- БД: `faida_store`
- Пользователь: `faida_user`
- Пароль: `faida_password`

## Важные замечания по реализации

1. **Формат данных 1С**: JSON массив с объектами товаров. Каждый товар имеет `Код` (code), `Наименование` (name), `Категория` (category), `Цены` (массив цен), `Остатки` (массив остатков), `Картинки` (массив изображений).

2. **Иерархия категорий**: Категории используют самоссылающийся FK с полем `parent`. Строится древовидная структура во фронтенде из плоского ответа API.

3. **Обработка изображений**:
   - Дедупликация через `file_hash` (MD5)
   - Исходные изображения копируются из внешнего монтирования
   - `ProductImage.display_order` для сортировки
   - Фронтенд имеет механизм fallback в компоненте ProductImage

4. **Мультиисточниковая архитектура**:
   - Может существовать несколько объектов `IntegrationSource`
   - Каждый имеет свой путь к JSON, путь к медиа, расписание синхронизации
   - Флаг `show_on_site` контролирует видимость
   - Товары связаны с источником через FK

5. **Типы синхронизации**:
   - Полная синхронизация: Импорт данных + медиа
   - Быстрая синхронизация: Только данные (быстрее, пропускает медиа)
   - Планировщик выполняет автосинхронизацию на включенных источниках

6. **Управление остатками**:
   - Товары имеют JSONField `stocks_data` с данными по каждому складу
   - `stock_quantity` - основное поле для отображения (обычно свободный остаток)
   - Настройки порога для всего сайта в singleton SiteSettings
   - Переопределение для отдельного товара через `use_default_stock_settings`

7. **Производительность API**:
   - Prefetch связанных данных (изображения, категория) в ViewSets
   - Redis кэширование для дорогих запросов
   - Пагинация предотвращает большие наборы результатов
   - Фильтрация снижает нагрузку на базу данных

8. **Производительность фронтенда**:
   - React Query кэширование (обычно 5 мин stale time)
   - Ленивая загрузка для маршрутов
   - Оптимизация изображений (ProductImage с error boundaries)
   - Intersection Observer для бесконечной прокрутки (если реализовано)

## Рабочий процесс разработки

1. **Добавление новых полей товара**:
   - Обновить модель `Product`
   - Создать миграцию: `docker-compose exec backend python manage.py makemigrations`
   - Применить: `docker-compose exec backend python manage.py migrate`
   - Обновить `ProductImporter._process_product()` в services.py
   - Обновить сериализаторы в `apps/api/serializers.py`
   - Обновить TypeScript типы фронтенда в `frontend/src/types/index.ts`

2. **Добавление новых эндпоинтов API**:
   - Добавить метод в ViewSet в `apps/api/views.py`
   - Использовать декоратор `@action` для кастомных эндпоинтов
   - Обновить сериализаторы при необходимости
   - Добавить хук фронтенда в `frontend/src/hooks/api.ts`

3. **Изменение импорта из 1С**:
   - Редактировать `ProductImporter` в `apps/sync1c/services.py`
   - Ключевые методы: `import_from_source()`, `_process_products_batch()`, `_process_product()`, `_process_category()`
   - Тестировать: `docker-compose exec backend python manage.py import_1c_data`
   - Проверить логи: `docker-compose logs -f backend`

4. **Изменения фронтенда**:
   - Компоненты автоматически перезагружаются с Vite HMR
   - Добавить новые страницы: создать в `pages/`, добавить маршрут в `App.tsx`
   - API запросы: использовать хуки TanStack Query, определенные в `hooks/api.ts`
   - Стилизация: утилиты Tailwind + компоненты Headless UI

## Устранение неполадок

**Импорт не работает:**
- Проверить существование файла: `ls -la ./data/goods/{source_name}/`
- Проверить формат JSON: `cat ./data/goods/{source_name}/export.json | head`
- Проверить логи: `docker-compose logs -f backend`
- Сбросить статус: `docker-compose exec backend python manage.py reset_import_status`

**Изображения не отображаются:**
- Проверить копирование медиа-файлов: `docker-compose exec backend ls /app/media/products/`
- Проверить настройки CORS в settings.py
- Проверить построение URL изображений во фронтенде в ProductImage.tsx
- Проверить консоль браузера на наличие 404

**Проблемы с базой данных:**
- Сброс: `docker-compose down -v` (удаляет тома!)
- Пересоздание: `docker-compose up -d db && sleep 5 && docker-compose exec backend python manage.py migrate`

**Фронтенд не подключается к API:**
- Проверить `VITE_API_URL` в docker-compose.yml
- Проверить CORS_ALLOWED_ORIGINS в settings.py
- Проверить работу бэкенда: `curl http://localhost:8000/api/`
