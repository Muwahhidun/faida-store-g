# Интернет-магазин с интеграцией 1С

## Описание проекта
Создание современного интернет-магазина на базе Django с полной интеграцией с системой 1С для синхронизации товаров, цен и остатков.

## Технический стек
- **Backend**: Django 4.2+ с Django REST Framework
- **Frontend**: React.js с TypeScript + Vite
- **База данных**: PostgreSQL
- **Контейнеризация**: Docker + Docker Compose
- **Кэширование**: Redis
- **Веб-сервер**: Nginx
- **Обработка медиа**: Pillow для изображений
- **Стейт менеджмент**: Zustand или Redux Toolkit
- **Стилизация**: Tailwind CSS
- **UI компоненты**: Headless UI или Radix UI

## Архитектура проекта

### Структура директорий
```
/
├── backend/                 # Django приложение
│   ├── config/             # Настройки проекта
│   ├── apps/
│   │   ├── products/       # Управление товарами
│   │   ├── categories/     # Категории товаров
│   │   ├── sync1c/         # Синхронизация с 1С
│   │   └── api/           # API endpoints
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # React + Vite приложение
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Состояние приложения
│   │   ├── api/            # API клиент
│   │   ├── types/          # TypeScript типы
│   │   └── utils/          # Утилиты
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
├── .qoder/
│   └── goods/
│       └── pp/            # База данных "pp" из 1С
│           ├── export.json # Экспорт товаров
│           └── export_media/ # Медиа файлы
├── docker-compose.yml
└── nginx/
    └── nginx.conf
```

## Этапы разработки

### Этап 1: Инфраструктура и настройка
1. **Настройка Docker окружения**
   - Создание Dockerfile для Django
   - Настройка PostgreSQL и Redis
   - Конфигурация Nginx
   - Docker Compose для оркестрации

2. **Базовая настройка Django**
   - Создание проекта и приложений
   - Настройка базы данных
   - Конфигурация статических файлов и медиа
   - Настройка CORS для API

### Этап 2: Модели данных
1. **Модель Product (товар)**
   ```python
   class Product(models.Model):
       code = models.CharField(max_length=50, unique=True)  # Код из 1С
       name = models.CharField(max_length=255)
       category = models.ForeignKey('Category')
       price = models.DecimalField(max_digits=10, decimal_places=2)
       in_stock = models.BooleanField(default=True)
       stock_quantity = models.IntegerField(default=0)
       description = models.TextField()
       weight = models.CharField(max_length=50)
       brand = models.CharField(max_length=100)
       # ... другие поля из 1С
   ```

2. **Модель Category (категория)**
3. **Модель ProductImage (изображения товаров)**
4. **Модель SyncLog (логи синхронизации)**

### Этап 3: Интеграция с 1С
1. **Парсер JSON из 1С**
   - Чтение файла export.json
   - Валидация данных
   - Маппинг полей 1С на модели Django

2. **Синхронизация медиа файлов**
   - Импорт изображений из export_media/
   - Оптимизация изображений
   - Создание миниатюр

3. **Management команды Django**
   ```bash
   python manage.py import_1c_data
   python manage.py sync_media_files
   ```

### Этап 4: API разработка
1. **REST API endpoints**
   - `/api/products/` - список товаров с фильтрацией
   - `/api/products/{id}/` - детальная информация о товаре
   - `/api/categories/` - категории товаров
   - `/api/search/` - поиск по товарам

2. **Фильтрация и поиск**
   - Фильтр по категориям
   - Фильтр по цене
   - Фильтр по наличию
   - Полнотекстовый поиск

### Этап 5: Frontend разработка (React + Vite)
1. **Настройка Vite проекта**
   ```bash
   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install
   npm install @tanstack/react-query axios zustand
   npm install -D tailwindcss postcss autoprefixer
   npm install @headlessui/react @heroicons/react
   ```

2. **Конфигурация Vite**
   - Настройка proxy для API
   - Оптимизация сборки
   - Hot Module Replacement (HMR)
   - Настройка путей (path aliases)

3. **Компонентная архитектура**
   - Layout компоненты (шапка, подвал, навигация)
   - Карточки товаров (ProductCard)
   - Фильтры и поиск (SearchFilters)
   - Пагинация (Pagination)
   - Модальные окна (Modal)

4. **Каталог товаров**
   - Список товаров с lazy loading
   - Инфинитная прокрутка или пагинация
   - Оптимизация загрузки изображений
   - Отзывчивые сетки (CSS Grid/Flexbox)

5. **Страница товара**
   - Галерея с зумом и пролистыванием
   - Табы с описанием и характеристиками
   - Блок похожих товаров
   - SEO оптимизация (мета теги)

6. **Поиск и фильтрация**
   - Живой поиск (debounced search)
   - Многоуровневые фильтры
   - Сохранение состояния в URL
   - История поисков

7. **Производительность и оптимизация**
   - Code splitting по страницам
   - Ленивая загрузка компонентов
   - Оптимизация изображений (WebP, разные размеры)
   - Service Worker для PWA

### Этап 6: Автоматизация и мониторинг
1. **Автоматическая синхронизация**
   - Cron задачи для периодической синхронизации
   - Мониторинг изменений в файлах 1С

2. **Логирование и мониторинг**
   - Логи синхронизации
   - Уведомления об ошибках
   - Метрики производительности

## Особенности интеграции с 1С

### Структура данных из 1С
Из памяти проекта известно, что:
- Данные находятся в `.qoder/goods/pp/export.json`
- Медиа файлы в `.qoder/goods/pp/export_media/`
- Папки с медиа именуются по коду товара

### Алгоритм синхронизации
1. Мониторинг изменений в export.json
2. Парсинг и валидация новых данных
3. Обновление/создание записей в БД
4. Синхронизация медиа файлов
5. Очистка устаревших данных

## Развертывание

### Docker Compose
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: store_db
      POSTGRES_USER: store_user
      POSTGRES_PASSWORD: store_pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  backend:
    build: ./backend
    volumes:
      - ./.qoder/goods:/app/goods
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    volumes:
      - ./frontend/src:/app/src

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
      - frontend
```

## Следующие шаги
1. Создание базовой структуры проекта
2. Настройка Docker окружения
3. Создание Django моделей
4. Реализация импорта данных из 1С
5. Разработка API
6. Создание фронтенда

---
*Создано: 11.09.2025*  
*Статус: В разработке*