# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- React Icons (иконки)
- React Helmet Async (управление meta-тегами)
- Quill / React Quill (WYSIWYG редактор)
- React Hot Toast (уведомления)
- React Intersection Observer (ленивая загрузка)

**Инфраструктура:**
- Docker Compose (5 сервисов: db, redis, backend, frontend, scheduler)
- Scheduler - отдельный контейнер для автоматической синхронизации с 1С

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
docker-compose logs -f scheduler

# Просмотр логов всех сервисов
docker-compose logs -f
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

Все команды фронтенда выполняются внутри Docker контейнера или локально в директории frontend/:

```bash
# Сервер разработки (запускается автоматически в Docker)
docker-compose exec frontend npm run dev
# или локально:
cd frontend && npm run dev

# Сборка для продакшена
docker-compose exec frontend npm run build
# или локально:
cd frontend && npm run build

# Линтинг
docker-compose exec frontend npm run lint

# Предпросмотр production сборки
docker-compose exec frontend npm run preview
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
│   │   └── management/commands/  # import_1c_data, run_scheduler, reset_import_status
│   ├── api/            # REST API (views, serializers, filters, URLs)
│   ├── users/          # Кастомная модель пользователя с ролями, адреса доставки
│   ├── jobs/           # Управление вакансиями с WYSIWYG редактором
│   ├── news/           # Управление новостями с WYSIWYG редактором
│   └── core/           # Настройки сайта, общие модели
├── config/
│   ├── settings.py     # Настройки Django
│   └── urls.py         # Корневая конфигурация URL
└── manage.py
```

**Основные модели:**

*Пользователи и аутентификация:*
- `User` (apps/users): Наследуется от AbstractUser, с полем role (user/moderator/admin). **Email уникален и обязателен**. Автоматически синхронизирует role с is_staff и is_superuser при сохранении
- `EmailOrUsernameBackend` (apps/users/backends.py): Кастомный бэкенд аутентификации - вход по email ИЛИ username (case-insensitive для email)
- `CustomPasswordResetSerializer`: Валидация email при восстановлении пароля с автоматическим приведением к нижнему регистру
- `DeliveryAddress`: Адреса доставки пользователей с координатами (latitude, longitude)

*Каталог товаров:*
- `Product`: code (уникальный), article, name, barcodes, price, currency, unit, stock_quantity, in_stock, category FK, images (через ProductImage), prices_data JSONField, stocks_data JSONField, source FK
- `ProductImage`: product FK, image FileField, file_hash MD5 (для дедупликации), display_order
- `Category`: code_1c (уникальный), name, slug, parent FK (самоссылающаяся иерархия), is_visible_on_site

*Интеграция с 1С:*
- `IntegrationSource`: name, json_file_path, media_dir_path, is_active, show_on_site, auto_sync_enabled, import_status
- `SyncLog`: sync_type (full/partial), status, source FK, временные метки, счетчики, errors

*Контент-менеджмент:*
- `Job`: title, slug, short_description, content (HTML), content_delta (Quill JSON), preview_image, employment_type, location, work_schedule, salary_from/to, hr_email, hr_phone, is_active, is_closed, author FK
- `JobMedia`: job FK, media_type (image/video), file, video_url, caption, display_order
- `News`: title, slug, category FK, preview_image, short_description, content (HTML), content_delta (Quill JSON), author FK, is_published, published_at, views_count
- `NewsCategory`: name, slug, display_order
- `NewsMedia`: news FK, media_type (image/video), file, video_url, caption, display_order

*Заказы:*
- `Order`: order_number (автогенерируемый ORD-YYYYMMDD-XXXX), user FK, status (pending/confirmed/processing/shipping/delivered/cancelled), customer_name, customer_phone, delivery_address, delivery_comment (примечание к адресу, например код домофона), comment (комментарий к заказу), payment_method, total_amount
- `OrderItem`: order FK, product FK, price (на момент заказа), quantity, subtotal

*Настройки:*
- `SiteSettings`: Singleton модель для настроек всего сайта (пороги остатков и т.д.)

**Интеграция с 1С:**
- Сервис `ProductImporter` в [apps/sync1c/services.py](backend/apps/sync1c/services.py)
- Импорт из JSON экспортов (поддержка UTF-8-sig BOM)
- Обработка иерархии категорий, товаров, изображений с дедупликацией на основе хэша
- Пакетная обработка (настраиваемый BATCH_SIZE)
- Медиа-файлы копируются из внешней директории (`data/goods/`)
- Поддержка нескольких источников через модель IntegrationSource
- Сервис планировщика выполняет автосинхронизацию через интервалы

**Структура API:**
- ViewSets: `ProductViewSet`, `CategoryViewSet`, `IntegrationSourceViewSet`, `UserViewSet`, `JobViewSet`, `NewsViewSet`
- Пользовательские действия (через @action декоратор):
  - `import_data` - запуск импорта из источника
  - `quick_sync` - быстрая синхронизация (без медиа)
  - `popular` - популярные товары
  - `bulk_update` - массовое обновление
- Фильтрация: DjangoFilterBackend + кастомные ProductFilter, CategoryFilter
- Поиск: SearchFilter для текстового поиска
- Сортировка: OrderingFilter
- Пагинация: LimitOffsetPagination (24 товара на страницу)
- Кэширование: Django cache framework с бэкендом Redis (декоратор @cache_page)
- Permissions: AllowAny для публичных эндпоинтов, IsAdminUser для административных

### Приложения для управления контентом

**Jobs (Вакансии) - apps/jobs:**
- Полноценная система публикации вакансий с WYSIWYG редактором Quill
- Модели: `Job`, `JobMedia`
- Поля: employment_type (full_time/part_time/remote/internship), location, work_schedule, диапазон зарплаты, контакты HR
- Автогенерация slug с поддержкой транслитерации кириллицы
- Превью изображения для списков вакансий
- Двойное хранение формата: HTML (content) + Quill Delta (content_delta) для сохранения форматирования
- Статусы: is_active (активна на сайте), is_closed (закрыта для откликов)

**News (Новости) - apps/news:**
- Система новостей/блога с категориями и WYSIWYG редактором
- Модели: `News`, `NewsCategory`, `NewsMedia`
- Функции: счетчик просмотров, планирование публикации, превью изображения
- Отслеживание автора, организация по категориям
- Двойное хранение формата: HTML + Quill Delta
- Автоматическая установка даты публикации при первой публикации

**Общие паттерны:**
- Оба используют JSON формат Quill Delta для редактирования форматированного текста
- Превью изображения для отображения в списках
- Автогенерация slug с проверкой уникальности (с fallback на UUID при необходимости)
- Управление дополнительными медиа через связанные модели (JobMedia, NewsMedia)
- Атрибуция автора через FK на User
- Поддержка изображений и видео (с URL или загрузка файла)

### Структура фронтенда

```
frontend/src/
├── components/         # Переиспользуемые UI компоненты
│   ├── Layout.tsx      # Основная обертка layout
│   ├── Header.tsx      # Навигация, кнопка корзины, dropdown меню пользователя
│   ├── Footer.tsx
│   ├── CategorySidebar.tsx
│   ├── ProductImage.tsx  # Изображение с fallback
│   ├── CartButton.tsx
│   ├── ProtectedRoute.tsx  # HOC для защищенных маршрутов
│   ├── ErrorBoundary.tsx
│   ├── LoadingSpinner.tsx
│   ├── RichTextEditor.tsx  # Quill WYSIWYG редактор для новостей/вакансий
│   ├── DeleteConfirmModal.tsx  # Переиспользуемое модальное окно
│   ├── CustomSelect.tsx  # Кастомный выпадающий список
│   ├── Toast.tsx       # Компонент всплывающих уведомлений
│   ├── admin/          # Компоненты для админ-панели
│   └── profile/        # Компоненты профиля пользователя
├── pages/             # Страницы маршрутов
│   ├── HomePage.tsx
│   ├── ProductsPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── CategoryPage.tsx
│   ├── CartPage.tsx
│   ├── AdminPanelPage.tsx
│   ├── ProfilePage.tsx
│   ├── LoginPage.tsx
│   ├── JobsPage.tsx
│   ├── JobDetailPage.tsx
│   ├── JobEditorPage.tsx  # Создание/редактирование вакансий
│   ├── NewsPage.tsx
│   ├── NewsDetailPage.tsx
│   ├── NewsEditorPage.tsx  # Создание/редактирование новостей
│   ├── ContactsPage.tsx
│   └── NotFoundPage.tsx
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
- TanStack Query для серверного состояния (товары, категории, вакансии, новости)
- Zustand для состояния корзины (с persist middleware для сохранения в localStorage)
- React Context для операций с корзиной
- JWT токен хранится в localStorage
- ProtectedRoute компонент для защищенных маршрутов

**Аутентификация и авторизация:**
- JWT-based аутентификация через rest_framework_simplejwt (30-дневные access токены)
- Роли пользователей: user, moderator, admin
- Автосинхронизация role с is_staff/is_superuser в модели User
- **Гибкая аутентификация**: вход по email ИЛИ username (case-insensitive)
- **Уникальность**: username и email уникальны, дубликаты блокируются на уровне БД
- Восстановление пароля через Djoser с красивыми HTML email-шаблонами
- Защищенные маршруты через ProtectedRoute компонент
- Компонент Header с dropdown меню пользователя (см. FaUser, FaCog, FaSignOutAlt иконки)

**Маршрутизация:**
- `/` - HomePage (избранные товары)
- `/products` - ProductsPage (каталог с фильтрами)
- `/products/:id` - ProductDetailPage
- `/category/:slug` - CategoryPage (товары по категории)
- `/cart` - CartPage
- `/login` - LoginPage (вход по email или username)
- `/register` - RegisterPage
- `/forgot-password` - ForgotPasswordPage
- `/password/reset/confirm/:uid/:token` - ResetPasswordPage
- `/panel` - AdminPanelPage (защищенный маршрут, требует аутентификации)
- `/profile` - ProfilePage (защищенный маршрут, требует аутентификации)
- `/jobs` - JobsPage (список вакансий)
- `/jobs/:slug` - JobDetailPage (детальная страница вакансии)
- `/jobs/new` - JobEditorPage (создание вакансии, защищенный маршрут)
- `/jobs/:slug/edit` - JobEditorPage (редактирование вакансии, защищенный маршрут)
- `/news` - NewsPage (список новостей)
- `/news/:slug` - NewsDetailPage (детальная страница новости)
- `/news/new` - NewsEditorPage (создание новости, защищенный маршрут)
- `/news/:slug/edit` - NewsEditorPage (редактирование новости, защищенный маршрут)
- `/contacts` - ContactsPage
- `/about` - AboutPage (страница о компании)

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
- `FRONTEND_URL=localhost:5173` (для ссылок в email)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_SSL`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` (опционально, для SMTP)

Фронтенд:
- `VITE_API_URL=http://localhost:8000/api`

### Настройки Django

Ключевые настройки в [backend/config/settings.py](backend/config/settings.py):
- `AUTH_USER_MODEL = 'users.User'` - кастомная модель пользователя
- `AUTHENTICATION_BACKENDS`: EmailOrUsernameBackend + ModelBackend
- `DOMAIN` и `SITE_NAME`: для правильных ссылок в email (используется templated_mail)
- `SYNC_1C_SETTINGS`: JSON_FILE_PATH, MEDIA_DIR_PATH, BATCH_SIZE, AUTO_SYNC_INTERVAL
- `GOODS_DATA_DIR = BASE_DIR / 'goods_data'`
- `CORS_ALLOW_ALL_ORIGINS = True` (разработка)
- `REST_FRAMEWORK`: JWT auth, DjangoFilterBackend, LimitOffsetPagination
- `SIMPLE_JWT`: 30-дневные access токены, 90-дневные refresh токены
- `CACHES`: Redis бэкенд
- `EMAIL_BACKEND`: SMTP или console (в зависимости от переменных окружения)
- `DJOSER`: настройки регистрации, восстановления пароля, email URL-ы
- `PASSWORD_RESET_TIMEOUT`: 259200 секунд (3 дня) - время жизни токена сброса пароля

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

7. **WYSIWYG редактор (Quill)**:
   - Используется для вакансий (Jobs) и новостей (News)
   - Двойное хранение: HTML для отображения + Quill Delta JSON для редактирования
   - Поле `content` содержит HTML
   - Поле `content_delta` содержит Quill Delta формат для сохранения форматирования
   - RichTextEditor компонент обрабатывает оба формата
   - Поддержка изображений, видео, форматирования текста

8. **Slug генерация**:
   - Автоматическая генерация slug из названия/заголовка
   - Транслитерация кириллицы в латиницу
   - Fallback на UUID если транслитерация невозможна
   - Автоматическая проверка уникальности с добавлением счетчика при дубликатах

9. **Производительность API**:
   - Prefetch связанных данных (изображения, категория) в ViewSets
   - Redis кэширование для дорогих запросов
   - Пагинация предотвращает большие наборы результатов
   - Фильтрация снижает нагрузку на базу данных

10. **Производительность фронтенда**:
    - React Query кэширование (обычно 5 мин stale time)
    - Ленивая загрузка для маршрутов
    - Оптимизация изображений (ProductImage с error boundaries)
    - Intersection Observer для бесконечной прокрутки (если реализовано)

11. **Email система**:
    - Кастомные HTML шаблоны в `backend/templates/email/`
    - Шаблон `password_reset.html`: красивое письмо на русском с градиентами, кнопками
    - Переменные контекста: `{{ user }}`, `{{ domain }}`, `{{ protocol }}`, `{{ url }}`, `{{ site_name }}`
    - Djoser автоматически использует кастомные шаблоны если они существуют
    - Email приводится к нижнему регистру в CustomPasswordResetSerializer для корректной работы

12. **Система аутентификации**:
    - **Username и email уникальны** - дубликаты блокируются на уровне БД
    - Вход по email или username через кастомный бэкенд `EmailOrUsernameBackend`
    - Case-insensitive поиск для email (admin@example.com = ADMIN@EXAMPLE.COM)
    - LoginPage показывает единое поле "Email или логин"
    - При регистрации email обязателен (`REQUIRED_FIELDS = ['email']`)
    - Djoser обрабатывает регистрацию, восстановление пароля, смену пароля

## Рабочий процесс разработки

1. **Добавление новых полей товара**:
   - Обновить модель `Product` в `apps/products/models.py`
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

5. **Работа с WYSIWYG контентом**:
   - Использовать компонент `RichTextEditor` для редактирования
   - При сохранении сохранять оба формата: HTML (content) и Quill Delta (content_delta)
   - Для отображения использовать HTML контент с `dangerouslySetInnerHTML`
   - Для редактирования загружать Quill Delta в редактор

6. **Добавление новых моделей контента**:
   - Создать модель с полями `content` (TextField) и `content_delta` (JSONField)
   - Добавить автогенерацию slug в методе `save()`
   - Создать сериализаторы для API
   - Добавить ViewSet с необходимыми permissions
   - Создать страницы списка, детальную и редактора во фронтенде

7. **Кастомизация email шаблонов**:
   - Создать файл в `backend/templates/email/{имя_шаблона}.html`
   - Djoser автоматически использует кастомные шаблоны (перекрывают стандартные)
   - Доступные шаблоны: `password_reset.html`, `activation.html`, `confirmation.html`, `password_changed_confirmation.html`
   - Использовать блоки `{% block subject %}`, `{% block text_body %}`, `{% block html_body %}`
   - Доступные переменные: `{{ user }}`, `{{ domain }}`, `{{ site_name }}`, `{{ protocol }}`, `{{ url }}`, `{{ uid }}`, `{{ token }}`
   - ВАЖНО: `domain` берется из `settings.DOMAIN`, НЕ из HTTP заголовка request.Host

8. **Работа с аутентификацией**:
   - Для входа пользователь может использовать email ИЛИ username
   - Email автоматически приводится к нижнему регистру
   - При изменении модели User учитывать уникальность username и email
   - Кастомный serializer для password reset должен возвращать email в нижнем регистре
   - Тестировать аутентификацию: `authenticate(username='admin@example.com', password='...')` и `authenticate(username='admin', password='...')`

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

**Проблемы с Quill редактором:**
- Убедиться, что Quill стили импортированы в компоненте
- Проверить формат сохраняемых данных (Delta должен быть валидным JSON)
- При загрузке контента проверить, что Delta корректно парсится
- Для загрузки изображений в редактор нужен отдельный обработчик

**Проблемы с восстановлением пароля:**
- Email не приходит: проверить `EMAIL_HOST` в переменных окружения и логи бэкенда
- Ссылка ведет на 8000 порт: проверить `FRONTEND_URL` в docker-compose.yml и `DOMAIN` в settings.py
- Ошибка при сбросе с разным регистром email: убедиться что CustomPasswordResetSerializer возвращает `email.lower()`
- Токен недействителен: проверить `PASSWORD_RESET_TIMEOUT` (по умолчанию 3 дня), токен одноразовый

**Проблемы с регистрацией:**
- Дубликат email: проверить уникальность email в модели User (`unique=True`)
- Дубликат username: username уже уникален по умолчанию в AbstractUser
- Создать миграцию после изменения полей: `makemigrations` → `migrate`
