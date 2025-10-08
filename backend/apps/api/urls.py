"""
URL маршруты для API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from .views import ProductViewSet, CategoryViewSet, ProductImageViewSet, SiteSettingsViewSet, IntegrationSourceViewSet, AvailableOptionsAPIView, CategoryManagementViewSet, ProductManagementViewSet, SyncLogViewSet, UserManagementViewSet, DeliveryAddressViewSet


# Создаем роутер для API
router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'images', ProductImageViewSet, basename='productimage')
router.register(r'settings', SiteSettingsViewSet, basename='settings')
router.register(r'sources', IntegrationSourceViewSet, basename='sources')
router.register(r'categories-management', CategoryManagementViewSet, basename='categories-management')
router.register(r'products-management', ProductManagementViewSet, basename='products-management')
router.register(r'sync-logs', SyncLogViewSet, basename='sync-logs')
router.register(r'users-management', UserManagementViewSet, basename='users-management')
router.register(r'delivery-addresses', DeliveryAddressViewSet, basename='delivery-addresses')


@api_view(['GET'])
@permission_classes([AllowAny])
def debug_products(request):
    """
    Debug endpoint для проверки товаров.
    """
    try:
        from apps.products.models import Product
        count = Product.objects.count()
        products = Product.objects.all()[:5]
        
        return Response({
            'status': 'success',
            'total_count': count,
            'sample_products': [
                {
                    'id': p.id,
                    'name': p.name,
                    'code': p.code,
                    'price': str(p.price),
                    'in_stock': p.in_stock
                } for p in products
            ]
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request, format=None):
    """
    Корневой endpoint API с информацией о доступных маршрутах.
    """
    return Response({
        'message': 'Добро пожаловать в API Faida Group Store!',
        'version': '1.0.0',
        'endpoints': {
            'products': {
                'list': '/api/products/',
                'detail': '/api/products/{id}/',
                'similar': '/api/products/{id}/similar/',
                'popular': '/api/products/popular/',
                'featured': '/api/products/featured/',
                'categories_stats': '/api/products/categories_stats/',
            },
            'categories': {
                'list': '/api/categories/',
                'detail': '/api/categories/{id}/',
                'tree': '/api/categories/tree/',
                'products': '/api/categories/{id}/products/',
            },
            'images': {
                'list': '/api/images/',
                'detail': '/api/images/{id}/',
            },
            'docs': {
                'swagger': '/api/docs/',
                'schema': '/api/schema/',
            }
        },
        'filters': {
            'products': {
                'price_min': 'Минимальная цена',
                'price_max': 'Максимальная цена',
                'category': 'ID категории',
                'category_slug': 'Slug категории',
                'in_stock': 'В наличии (true/false)',
                'available': 'Доступен для покупки (true/false)',
                'brand': 'Бренд (поиск по подстроке)',
                'tags': 'Теги (через запятую)',
                'search': 'Поиск по названию, описанию, тегам',
                'ordering': 'Сортировка (price, -price, name, -name, created, -created)',
            },
            'categories': {
                'parent': 'ID родительской категории',
                'parent_only': 'Только родительские категории (true/false)',
                'children_only': 'Только дочерние категории (true/false)',
            }
        }
    })


# URL маршруты
urlpatterns = [
    # Корневой endpoint
    path('', api_root, name='api-root'),
    
    # Debug endpoint
    path('debug/products/', debug_products, name='debug-products'),
    
    # Доступные опции для настроек
    path('available-options/', AvailableOptionsAPIView.as_view(), name='available-options'),
    
    # API маршруты через роутер
    path('', include(router.urls)),
    
    # Документация API
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]