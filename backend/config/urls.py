"""
Основные URL конфигурации для проекта Faida Group.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from rest_framework_simplejwt.views import TokenRefreshView
from apps.api.views import CustomTokenObtainPairView

urlpatterns = [
    # Админка Django
    path('admin/', admin.site.urls),

    # API эндпоинты
    path('api/', include('apps.api.urls')),

    # Платежи YooKassa
    path('api/payments/', include('apps.payments.urls')),

    # Djoser endpoints (регистрация, восстановление пароля)
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.urls.jwt')),

    # Документация API
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Настройка для обслуживания медиа файлов в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)