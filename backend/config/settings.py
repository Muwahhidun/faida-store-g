"""
Django настройки для проекта интернет-магазина Faida Group.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Базовая директория проекта
BASE_DIR = Path(__file__).resolve().parent.parent

# Настройки безопасности
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-this-in-production')
DEBUG = os.getenv('DEBUG', 'True').lower() in ['true', '1', 'yes', 'on']
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0').split(',')

# Приложения Django
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework.authtoken',  # Требуется для djoser
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'djoser',  # Регистрация и восстановление пароля
]

LOCAL_APPS = [
    'apps.users',  # Кастомная модель пользователя
    'apps.products',
    'apps.categories',
    'apps.sync1c',
    'apps.api',
    'apps.core',
    'apps.jobs',
    'apps.news',
    'apps.orders',  # Заказы
    'apps.notifications',  # Уведомления (Email, WhatsApp)
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# Кастомная модель пользователя
AUTH_USER_MODEL = 'users.User'

# Кастомные бэкенды аутентификации
AUTHENTICATION_BACKENDS = [
    'apps.users.backends.EmailOrUsernameBackend',  # Вход по email или username
    'django.contrib.auth.backends.ModelBackend',  # Стандартный бэкенд (fallback)
]

# Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# Шаблоны
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# База данных
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'faida_store'),
        'USER': os.getenv('DB_USER', 'faida_user'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'faida_password'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# Настройки Redis
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Кэширование
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL,
    }
}

# Валидация паролей
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Интернационализация
LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'
USE_I18N = True
USE_TZ = True

# Кодировка для правильного отображения кириллицы
DEFAULT_CHARSET = 'utf-8'
FILE_CHARSET = 'utf-8'

# Статические файлы и медиа
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'static'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Настройки для статических файлов в разработке
STATICFILES_DIRS = [
    BASE_DIR / 'staticfiles',
]

# Тип поля по умолчанию
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Настройки Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'PAGE_SIZE': 24,
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
}

# Настройки JWT токенов
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=30),  # 30 дней - пользователь не будет разлогиниваться месяц
    'REFRESH_TOKEN_LIFETIME': timedelta(days=90),  # 90 дней для refresh token
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Настройки CORS для фронтенда
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",
    "http://172.18.0.5:5173",  # Docker network
    "http://frontend:5173",   # Docker service name
]

CORS_ALLOW_CREDENTIALS = True

# Разрешить все хосты для Docker (временно)
CORS_ALLOW_ALL_ORIGINS = True

# Дополнительные заголовки CORS
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Дополнительные настройки CORS для медиа файлов
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_EXPOSE_HEADERS = [
    'Content-Disposition',
    'Content-Type',
]

# Настройки drf-spectacular (документация API)
SPECTACULAR_SETTINGS = {
    'TITLE': 'Faida Group Store API',
    'DESCRIPTION': 'API для интернет-магазина с интеграцией 1С',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# Настройки для работы с файлами из 1С
GOODS_DATA_DIR = BASE_DIR / 'goods_data'
SYNC_1C_SETTINGS = {
    'JSON_FILE_PATH': GOODS_DATA_DIR / 'pp' / 'export.json',
    'MEDIA_DIR_PATH': GOODS_DATA_DIR / 'pp' / 'export_media',
    'BATCH_SIZE': 100,  # Размер batch для импорта
    'AUTO_SYNC_INTERVAL': 300,  # Интервал автосинхронизации в секундах
}

# Настройки логирования
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'faida_store.log',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'sync1c': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Настройки загрузки файлов
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB в байтах
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB в байтах

# Настройки Email
# Используем кастомный backend, который берет настройки из админ-панели
EMAIL_BACKEND = 'apps.notifications.email_backend.NotificationEmailBackend'
DEFAULT_FROM_EMAIL = 'noreply@faida.ru'  # Fallback, если канал не настроен

# Настройки для email шаблонов (используется templated_mail)
DOMAIN = os.getenv('FRONTEND_URL', 'localhost:5173')
SITE_NAME = 'Faida Group'

# Настройки Djoser
DJOSER = {
    'LOGIN_FIELD': 'username',  # Логин по username (email тоже обязателен)
    'USER_CREATE_PASSWORD_RETYPE': True,  # Подтверждение пароля при регистрации
    'USERNAME_CHANGED_EMAIL_CONFIRMATION': False,
    'PASSWORD_CHANGED_EMAIL_CONFIRMATION': True,
    'SEND_CONFIRMATION_EMAIL': False,  # Не нужно, так как SEND_ACTIVATION_EMAIL включен
    'SEND_ACTIVATION_EMAIL': True,  # ✅ Активация через email ВКЛЮЧЕНА
    'SET_USERNAME_RETYPE': False,
    'SET_PASSWORD_RETYPE': True,
    # URL для фронтенда (не для API!)
    'DOMAIN': os.getenv('FRONTEND_URL', 'localhost:5173'),
    'SITE_NAME': 'Faida Group',
    'PROTOCOL': 'http',  # или 'https' для production
    'PASSWORD_RESET_CONFIRM_URL': 'password/reset/confirm/{uid}/{token}',
    'USERNAME_RESET_CONFIRM_URL': 'email/reset/confirm/{uid}/{token}',
    'ACTIVATION_URL': 'activate/{uid}/{token}',
    # Шаблоны email - используем кастомные классы с нашими шаблонами
    'EMAIL': {
        'password_reset': 'apps.users.email.PasswordResetEmail',
        'password_changed_confirmation': 'apps.users.email.PasswordChangedConfirmationEmail',
        'activation': 'apps.users.email.ActivationEmail',
        'confirmation': 'apps.users.email.ConfirmationEmail',
    },
    'SERIALIZERS': {
        'user_create': 'djoser.serializers.UserCreateSerializer',
        'user': 'djoser.serializers.UserSerializer',
        'current_user': 'djoser.serializers.UserSerializer',
        'password_reset': 'apps.users.serializers.CustomPasswordResetSerializer',
    },
    'PERMISSIONS': {
        'user': ['rest_framework.permissions.IsAuthenticated'],
        'user_list': ['rest_framework.permissions.IsAdminUser'],
    },
}