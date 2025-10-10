"""
API Views для интернет-магазина.
"""

from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.management import call_command
from django.utils import timezone
import threading
from rest_framework import permissions
from rest_framework.permissions import IsAdminUser, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Count, Avg, Prefetch
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers

from apps.products.models import Product, ProductImage
from apps.categories.models import Category
from apps.core.models import SiteSettings
from apps.sync1c.models import IntegrationSource, SyncLog
from apps.users.models import User, DeliveryAddress
from apps.jobs.models import Job, JobMedia
from apps.news.models import News, NewsCategory, NewsMedia
from .serializers import (
    ProductListSerializer, ProductDetailSerializer, ProductImageSerializer,
    CategorySerializer, CategoryDetailSerializer,
    SiteSettingsSerializer, IntegrationSourceSerializer, CategoryManagementSerializer,
    ProductManagementSerializer, SyncLogSerializer, UserSerializer, DeliveryAddressSerializer,
    JobListSerializer, JobDetailSerializer, JobCreateUpdateSerializer, JobMediaSerializer,
    NewsListSerializer, NewsDetailSerializer, NewsCreateUpdateSerializer, NewsCategorySerializer, NewsMediaSerializer
)
from .filters import ProductFilter, CategoryFilter


class IntegrationSourceViewSet(mixins.CreateModelMixin,
                               mixins.ListModelMixin,
                               mixins.UpdateModelMixin,
                               mixins.DestroyModelMixin,
                               viewsets.GenericViewSet):
    """
    ViewSet для управления источниками данных 1С.
    Позволяет получать список источников и обновлять их.
    Доступно только администраторам.
    """
    queryset = IntegrationSource.objects.all()
    serializer_class = IntegrationSourceSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None  # Отключаем пагинацию для простого списка

    @action(detail=True, methods=['post'])
    def import_data(self, request, pk=None):
        """
        Запускает полный импорт данных для конкретного источника (данные + медиа).
        """
        return self._run_sync(request, pk, skip_media=False, sync_type='running_full')

    @action(detail=True, methods=['post'])
    def quick_sync(self, request, pk=None):
        """
        Запускает быструю синхронизацию данных для конкретного источника (только данные).
        """
        return self._run_sync(request, pk, skip_media=True, sync_type='running_data')

    def _run_sync(self, request, pk, skip_media, sync_type):
        """Общий метод для запуска синхронизации."""
        source = self.get_object()
        
        if not source.is_active:
            return Response({
                'success': False,
                'message': f'Источник "{source.name}" неактивен. Синхронизация невозможна.'
            }, status=400)

        try:
            # Обновляем статус
            source.import_status = sync_type
            source.last_import_started = timezone.now()
            source.import_error_message = None
            source.save()
            
            # Запускаем импорт в отдельном потоке
            def run_import():
                try:
                    # Запускаем команду с нужными параметрами
                    if skip_media:
                        call_command('import_1c_data', source.code, '--skip-media')
                    else:
                        call_command('import_1c_data', source.code)
                    
                    # При успешном завершении обновляем статус
                    source.refresh_from_db()
                    source.import_status = 'completed'
                    source.last_import_completed = timezone.now()
                    source.import_error_message = None
                    
                    # Обновляем время последней синхронизации
                    if skip_media:
                        source.last_data_sync = timezone.now()
                        source.schedule_next_data_sync()
                    else:
                        source.last_full_sync = timezone.now()
                        source.schedule_next_full_sync()
                        # При полной синхронизации также обновляем время данных
                        source.last_data_sync = timezone.now()
                        source.schedule_next_data_sync()
                    
                    source.save()
                    
                except Exception as e:
                    # При ошибке обновляем статус и сохраняем сообщение об ошибке
                    source.refresh_from_db()
                    source.import_status = 'failed'
                    source.import_error_message = str(e)
                    source.last_error_time = timezone.now()
                    source.save()
                    print(f"Ошибка импорта для источника {source.code}: {e}")
            
            thread = threading.Thread(target=run_import)
            thread.daemon = True
            thread.start()
            
            sync_name = "быстрая синхронизация" if skip_media else "полная синхронизация"
            return Response({
                'success': True,
                'message': f'{sync_name.capitalize()} для источника "{source.name}" запущена в фоновом режиме.'
            })
            
        except Exception as e:
            # Если не удалось даже запустить импорт
            source.import_status = 'failed'
            source.import_error_message = str(e)
            source.last_error_time = timezone.now()
            source.save()
            
            return Response({
                'success': False,
                'message': f'Ошибка при запуске синхронизации: {str(e)}'
            }, status=500)

    @action(detail=True, methods=['post'])
    def reset_status(self, request, pk=None):
        """
        Сбрасывает статус импорта для конкретного источника.
        """
        source = self.get_object()

        try:
            source.import_status = 'idle'
            source.import_error_message = None
            source.save()

            return Response({
                'success': True,
                'message': f'Статус импорта для источника "{source.name}" сброшен.'
            })

        except Exception as e:
            return Response({
                'success': False,
                'message': f'Ошибка при сбросе статуса: {str(e)}'
            }, status=500)

    @action(detail=True, methods=['get'])
    def sync_logs(self, request, pk=None):
        """
        Возвращает историю синхронизации для конкретного источника.
        """
        source = self.get_object()

        # Получаем логи синхронизации для этого источника
        logs = SyncLog.objects.filter(source=source).order_by('-started_at')[:50]
        serializer = SyncLogSerializer(logs, many=True)

        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def available_options(self, request, pk=None):
        """
        Возвращает доступные типы цен и склады из JSON файла источника.
        """
        source = self.get_object()

        try:
            import json
            from pathlib import Path
            from django.conf import settings

            # Формируем путь к JSON файлу
            json_path = Path(settings.GOODS_DATA_DIR) / source.json_file_path

            if not json_path.exists():
                return Response({
                    'price_types': [],
                    'warehouses': []
                }, status=200)

            # Читаем JSON файл
            with open(json_path, 'r', encoding='utf-8-sig') as f:
                data = json.load(f)

            # Собираем уникальные виды цен и складов
            price_types_set = set()
            warehouses_set = set()

            for product in data:
                # Собираем виды цен
                for price in product.get('Цены', []):
                    price_type = price.get('ВидЦены')
                    price_code = price.get('КодЦены')
                    if price_type and price_code:
                        price_types_set.add((price_code, price_type))

                # Собираем склады
                for stock in product.get('Остатки', []):
                    warehouse = stock.get('Склад')
                    warehouse_code = stock.get('КодСклада')
                    if warehouse and warehouse_code:
                        warehouses_set.add((warehouse_code, warehouse))

            # Преобразуем в списки словарей
            price_types = [{'code': code, 'name': name} for code, name in sorted(price_types_set, key=lambda x: x[1])]
            warehouses = [{'code': code, 'name': name} for code, name in sorted(warehouses_set, key=lambda x: x[1])]

            return Response({
                'price_types': price_types,
                'warehouses': warehouses
            })

        except Exception as e:
            return Response({
                'price_types': [],
                'warehouses': [],
                'error': str(e)
            }, status=200)

    @action(detail=True, methods=['post'])
    def apply_settings(self, request, pk=None):
        """
        Применяет настройки цен и складов к существующим товарам без полного импорта.
        """
        source = self.get_object()
        
        try:
            from apps.products.models import Product
            from decimal import Decimal
            
            # Получаем все товары этого источника
            products = Product.objects.filter(source=source)
            updated_count = 0
            
            for product in products:
                # Пересчитываем цену и остатки на основе новых настроек
                new_price = None
                new_stock_quantity = 0
                new_in_stock = False
                
                # Обрабатываем цены
                if product.prices_data and isinstance(product.prices_data, list):
                    # Приоритет: настройка товара > настройка источника
                    target_price_type = product.selected_price_code or source.default_price_type_name
                    
                    if target_price_type:
                        for price_info in product.prices_data:
                            if isinstance(price_info, dict) and price_info.get('ВидЦены') == target_price_type:
                                new_price = Decimal(str(price_info.get('Цена', 0)))
                                break
                
                # Обрабатываем остатки
                if product.stocks_data and isinstance(product.stocks_data, list):
                    # Приоритет: настройка товара > настройка источника
                    target_warehouse = product.selected_stock_code or source.default_warehouse_name
                    
                    if target_warehouse:
                        for stock_info in product.stocks_data:
                            if isinstance(stock_info, dict) and stock_info.get('Склад') == target_warehouse:
                                available = stock_info.get('СвободныйОстаток', 0)
                                if available is None:
                                    available = stock_info.get('НаСкладе', 0) - stock_info.get('ВРезерве', 0)
                                new_stock_quantity = max(0, int(available or 0))
                                new_in_stock = new_stock_quantity > 0
                                break
                
                # Обновляем товар, если есть изменения
                update_fields = []
                if new_price is not None and product.price != new_price:
                    product.price = new_price
                    update_fields.append('price')
                
                if product.stock_quantity != new_stock_quantity:
                    product.stock_quantity = new_stock_quantity
                    update_fields.append('stock_quantity')
                
                if product.in_stock != new_in_stock:
                    product.in_stock = new_in_stock
                    update_fields.append('in_stock')
                
                if update_fields:
                    update_fields.append('updated_at')
                    product.save(update_fields=update_fields)
                    updated_count += 1
            
            return Response({
                'success': True,
                'message': f'Настройки применены к {updated_count} товарам источника "{source.name}".'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Ошибка при применении настроек: {str(e)}'
            }, status=500)

    def update(self, request, *args, **kwargs):
        """
        Переопределяем update для автоматического планирования синхронизации.
        """
        response = super().update(request, *args, **kwargs)
        
        # Если обновление прошло успешно и автосинхронизация включена
        if response.status_code == 200:
            source = self.get_object()
            if source.auto_sync_enabled:
                # Планируем следующие синхронизации
                source.schedule_next_data_sync()
                source.schedule_next_full_sync()
                source.save()
        
        return response

    def perform_destroy(self, instance):
        """
        Переопределяем удаление для "мягкого" удаления связанных данных.
        """
        # 1. Находим все товары, связанные с этим источником
        products_to_deactivate = Product.objects.filter(source=instance)
        
        # 2. Собираем категории, которые нужно будет проверить, ДО деактивации товаров
        # Используем select_related для оптимизации доступа к parent
        categories_to_check = Category.objects.filter(
            products__in=products_to_deactivate
        ).select_related('parent').distinct()
        
        # 3. Деактивируем (скрываем) товары
        products_to_deactivate.update(is_visible_on_site=False)
        
        # 4. Запускаем обновление видимости для всех затронутых категорий
        # Сначала обрабатываем самые глубоко вложенные категории
        sorted_categories = sorted(
            list(categories_to_check), 
            key=lambda c: len(c.get_ancestors()), 
            reverse=True
        )
        
        for category in sorted_categories:
            category.update_visibility()
                    
        # 5. Удаляем сам источник
        instance.delete()

    def destroy(self, request, *args, **kwargs):
        """
        Обрабатывает запрос на удаление с "мягким" удалением.
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CategoryManagementViewSet(mixins.ListModelMixin,
                                mixins.UpdateModelMixin,
                                viewsets.GenericViewSet):
    """
    ViewSet для управления категориями в админ-панели.
    Позволяет получать список всех категорий и обновлять их видимость.
    Доступно только администраторам.
    """
    serializer_class = CategoryManagementSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None  # Отключаем пагинацию
    
    def get_queryset(self):
        """Возвращает все категории для обновления, но только родительские для списка."""
        if self.action == 'list':
            # Для списка возвращаем только родительские категории с подкатегориями
            return Category.objects.filter(
                parent__isnull=True
            ).select_related('parent').prefetch_related('children').order_by('order', 'name')
        else:
            # Для обновления возвращаем все категории
            return Category.objects.all().select_related('parent').prefetch_related('children')


class ProductManagementViewSet(mixins.ListModelMixin,
                               mixins.UpdateModelMixin,
                               viewsets.GenericViewSet):
    """
    ViewSet для управления товарами в админ-панели.
    Позволяет получать список всех товаров и обновлять их видимость.
    Доступно только администраторам.
    """
    serializer_class = ProductManagementSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'code', 'article', 'brand']
    ordering_fields = ['name', 'price', 'created_at', 'updated_at']
    ordering = ['-updated_at']
    filterset_fields = ['is_visible_on_site', 'in_stock', 'category', 'source', 'use_default_stock_settings']
    
    def get_queryset(self):
        """Возвращает все товары, включая неактивные и скрытые."""
        return Product.objects.select_related('category', 'source').prefetch_related('images').all()


class SiteSettingsViewSet(mixins.ListModelMixin,
                          mixins.RetrieveModelMixin,
                          mixins.UpdateModelMixin,
                          viewsets.GenericViewSet):
    """
    ViewSet для управления настройками сайта.
    Позволяет только просматривать и обновлять единственный экземпляр настроек.
    Чтение доступно всем, изменение только администраторам.
    """
    queryset = SiteSettings.objects.all()
    serializer_class = SiteSettingsSerializer

    def get_permissions(self):
        """Разрешения: чтение для всех, изменение только для админов."""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]

    def get_object(self):
        # Возвращаем единственный экземпляр настроек
        obj, created = SiteSettings.objects.get_or_create(pk=1)
        return obj

    def list(self, request, *args, **kwargs):
        # Переопределяем list, чтобы всегда возвращать один объект, а не список
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        # Переопределяем retrieve, чтобы всегда возвращать единственный объект настроек
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для товаров.
    
    Поддерживает:
    - Список товаров с фильтрацией
    - Детальный просмотр товара
    - Поиск по товарам
    - Похожие товары
    - Популярные товары
    """
    
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'tags', 'brand', 'barcodes']
    ordering_fields = ['price', 'name', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Оптимизированный queryset для товаров.
        Показывает только активные товары из источников, у которых установлен
        флаг 'show_on_site', и остаток больше или равен глобальной настройке
        min_stock_for_display.

        Примечание: is_active источника контролирует только синхронизацию,
        а show_on_site контролирует видимость товаров на сайте.
        """
        # Загружаем настройки сайта
        site_settings = SiteSettings.load()
        min_stock = site_settings.min_stock_for_display

        return Product.objects.select_related(
            'category', 'source'
        ).prefetch_related(
            'images', 'related_products'
        ).filter(
            is_visible_on_site=True,  # Товар должен быть видимым
            source__show_on_site=True,  # Источник должен показываться на сайте
            category__is_active=True,
            category__is_visible_on_site=True,  # Категория должна быть видимой
            stock_quantity__gte=min_stock
        )
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия."""
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer
    
    # @method_decorator(cache_page(60 * 15))  # Кэш на 15 минут
    # @method_decorator(vary_on_headers('User-Agent'))
    def list(self, request, *args, **kwargs):
        """Список товаров без кэширования."""
        return super().list(request, *args, **kwargs)
    
    # @method_decorator(cache_page(60 * 30))  # Кэш на 30 минут
    def retrieve(self, request, *args, **kwargs):
        """Детальный просмотр товара без кэширования."""
        return super().retrieve(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def similar(self, request, pk=None):
        """Похожие товары."""
        product = self.get_object()
        
        # Ищем товары из той же категории или с похожими тегами
        similar_products = Product.objects.filter(
            Q(category=product.category) | 
            Q(tags__icontains=product.brand) |
            Q(brand=product.brand)
        ).exclude(
            id=product.id
        ).filter(
            is_visible_on_site=True, in_stock=True
        ).distinct()[:6]
        
        serializer = ProductListSerializer(similar_products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Популярные товары (в наличии)."""
        popular_products = self.get_queryset().filter(
            in_stock=True, stock_quantity__gt=0
        ).order_by('-stock_quantity', '-created_at')[:12]
        
        serializer = ProductListSerializer(popular_products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Рекомендуемые товары."""
        # Товары с хорошими остатками и недавно обновленные
        featured_products = self.get_queryset().filter(
            in_stock=True, 
            stock_quantity__gte=5
        ).order_by('-updated_at')[:8]
        
        serializer = ProductListSerializer(featured_products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories_stats(self, request):
        """Статистика по категориям."""
        stats = Category.objects.filter(
            is_active=True
        ).annotate(
            products_count=Count('products', filter=Q(products__is_visible_on_site=True)),
            available_count=Count('products', filter=Q(
                products__is_visible_on_site=True, 
                products__in_stock=True,
                products__stock_quantity__gt=0
            )),
            avg_price=Avg('products__price', filter=Q(products__is_visible_on_site=True))
        ).filter(products_count__gt=0)
        
        data = []
        for category in stats:
            data.append({
                'id': category.id,
                'name': category.name,
                'slug': category.slug,
                'products_count': category.products_count,
                'available_count': category.available_count,
                'avg_price': round(float(category.avg_price or 0), 2)
            })
        
        return Response(data)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для категорий.
    
    Поддерживает:
    - Список категорий
    - Детальный просмотр категории
    - Иерархическую структуру
    """
    
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CategoryFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'order', 'created_at']
    ordering = ['order', 'name']
    
    def get_queryset(self):
        """Оптимизированный queryset для категорий."""
        return Category.objects.prefetch_related('children').filter(
            is_active=True,
            is_visible_on_site=True
        )
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия."""
        if self.action == 'retrieve':
            return CategoryDetailSerializer
        return CategorySerializer
    
    # @method_decorator(cache_page(60 * 30))  # Кэш на 30 минут
    def list(self, request, *args, **kwargs):
        """Список категорий без кэширования."""
        return super().list(request, *args, **kwargs)
    
    # @method_decorator(cache_page(60 * 15))  # Кэш на 15 минут
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """
        Иерархическое дерево категорий.
        
        Логика видимости:
        - Показываются только категории с is_visible_on_site=True
        - Если родительская категория скрыта, её дочерние категории 
          поднимаются на уровень выше (становятся корневыми)
        - Это позволяет не потерять доступ к товарам при скрытии родителей
        """
        # УПРОЩЕННАЯ ЛОГИКА ДЛЯ БЫСТРОДЕЙСТВИЯ
        # Просто показываем видимые категории как есть, без сложной логики перемещения
        visible_categories = Category.objects.filter(
            is_active=True,
            is_visible_on_site=True
        ).select_related('parent').prefetch_related('children').order_by('order', 'name')
        
        def build_simple_tree(categories, parent_id=None):
            """Простое построение дерева видимых категорий."""
            result = []
            
            for category in categories:
                # Проверяем принадлежность к уровню
                if parent_id is None:
                    # Корневой уровень: категории без родителя или с видимым родителем
                    if category.parent_id is None or (category.parent and category.parent.is_visible_on_site):
                        if category.parent_id is None:  # Только настоящие корневые
                            category_data = CategorySerializer(category).data
                            
                            # Добавляем дочерние категории
                            children = build_simple_tree(categories, category.id)
                            if children:
                                category_data['children'] = children
                            
                            result.append(category_data)
                else:
                    # Дочерний уровень
                    if category.parent_id == parent_id:
                        category_data = CategorySerializer(category).data
                        
                        # Добавляем дочерние категории
                        children = build_simple_tree(categories, category.id)
                        if children:
                            category_data['children'] = children
                        
                        result.append(category_data)
            
            return result
        
        tree_data = build_simple_tree(visible_categories)
        return Response(tree_data)
    
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Товары категории."""
        category = self.get_object()
        
        # Получаем товары с учетом фильтров
        products_qs = Product.objects.filter(
            category=category, is_visible_on_site=True
        ).select_related('category').prefetch_related('images')
        
        # Применяем фильтры из запроса
        product_filter = ProductFilter(request.GET, queryset=products_qs)
        products = product_filter.qs
        
        # Пагинация
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class ProductImageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для изображений товаров.
    """
    
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Фильтрация изображений по товару."""
        queryset = ProductImage.objects.select_related('product')
        product_id = self.request.query_params.get('product_id', None)
        if product_id is not None:
            queryset = queryset.filter(product_id=product_id)
        return queryset


class AvailableOptionsAPIView(APIView):
    """
    API для получения доступных вариантов цен и складов из импортированных данных.
    Фильтрует данные по конкретному источнику, если указан параметр source_id.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Возвращает доступные варианты цен и складов."""
        source_id = request.query_params.get('source_id')
        
        # Фильтруем товары по источнику, если указан
        queryset = Product.objects.all()
        if source_id:
            try:
                source_id = int(source_id)
                queryset = queryset.filter(source_id=source_id)
            except (ValueError, TypeError):
                return Response({
                    'error': 'Неверный ID источника'
                }, status=400)
        
        # Получаем уникальные виды цен из отфильтрованных товаров
        all_prices_data = queryset.values_list('prices_data', flat=True)
        price_types = set()
        for price_list in all_prices_data:
            if isinstance(price_list, list):
                for price_info in price_list:
                    if isinstance(price_info, dict) and 'ВидЦены' in price_info:
                        price_types.add(price_info['ВидЦены'])

        # Получаем уникальные склады из отфильтрованных товаров
        all_stocks_data = queryset.values_list('stocks_data', flat=True)
        warehouse_names = set()
        for stock_list in all_stocks_data:
            if isinstance(stock_list, list):
                for stock_info in stock_list:
                    if isinstance(stock_info, dict) and 'Склад' in stock_info:
                        warehouse_names.add(stock_info['Склад'])

        return Response({
            'price_types': sorted(list(price_types)),
            'warehouse_names': sorted(list(warehouse_names)),
            'source_id': source_id  # Возвращаем ID источника для отладки
        })


class SyncLogViewSet(mixins.ListModelMixin, 
                     mixins.RetrieveModelMixin,
                     viewsets.GenericViewSet):
    """
    ViewSet для просмотра логов синхронизации.
    Позволяет получать список логов с фильтрацией по источнику и статусу.
    """
    serializer_class = SyncLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['started_at', 'finished_at', 'duration', 'processed_products']
    ordering = ['-started_at']  # По умолчанию сортируем по дате, новые сверху
    
    def get_queryset(self):
        """Возвращает отфильтрованный список логов."""
        queryset = SyncLog.objects.select_related('source').all()
        
        # Фильтрация по источнику
        source_id = self.request.query_params.get('source_id')
        if source_id:
            try:
                source_id = int(source_id)
                queryset = queryset.filter(source_id=source_id)
            except (ValueError, TypeError):
                pass
        
        # Фильтрация по статусу
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Фильтрация по типу синхронизации
        sync_type = self.request.query_params.get('sync_type')
        if sync_type:
            queryset = queryset.filter(sync_type=sync_type)
        
        # Фильтрация по дате (последние N дней)
        days = self.request.query_params.get('days')
        if days:
            try:
                days = int(days)
                from django.utils import timezone
                from datetime import timedelta
                since_date = timezone.now() - timedelta(days=days)
                queryset = queryset.filter(started_at__gte=since_date)
            except (ValueError, TypeError):
                pass

        return queryset


class UserManagementViewSet(mixins.ListModelMixin,
                            mixins.CreateModelMixin,
                            mixins.UpdateModelMixin,
                            mixins.DestroyModelMixin,
                            viewsets.GenericViewSet):
    """
    ViewSet для управления пользователями в админ-панели.
    Позволяет просматривать, создавать, обновлять и удалять пользователей.
    Доступно только администраторам.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'email', 'date_joined', 'last_login']
    ordering = ['-date_joined']
    filterset_fields = ['role', 'is_active']

    def get_queryset(self):
        """Возвращает всех пользователей."""
        return User.objects.all()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Получить данные текущего пользователя."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_profile(self, request):
        """Обновить данные профиля текущего пользователя."""
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        """Изменить пароль текущего пользователя."""
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response(
                {'error': 'Both current_password and new_password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully'})


# JWT Token View с кастомным сериализатором
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Кастомное view для получения JWT токена.
    Использует CustomTokenObtainPairSerializer для добавления роли пользователя в токен.
    """
    serializer_class = CustomTokenObtainPairSerializer


class DeliveryAddressViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления адресами доставки пользователя.
    Пользователь может просматривать только свои адреса.
    """
    serializer_class = DeliveryAddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Отключаем пагинацию для адресов

    def get_queryset(self):
        """Возвращает только адреса текущего пользователя."""
        return DeliveryAddress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Автоматически привязывает адрес к текущему пользователю."""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Установить адрес как основной."""
        address = self.get_object()

        # Снять is_default со всех адресов пользователя
        DeliveryAddress.objects.filter(
            user=request.user,
            is_default=True
        ).update(is_default=False)

        # Установить текущий адрес как основной
        address.is_default = True
        address.save()

        serializer = self.get_serializer(address)
        return Response(serializer.data)


class JobViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления вакансиями.

    Публичные действия (AllowAny):
    - list: Просмотр списка активных вакансий
    - retrieve: Детальный просмотр вакансии

    Действия для админов/модераторов:
    - create: Создание вакансии
    - update/partial_update: Редактирование вакансии
    - destroy: Удаление вакансии
    """
    permission_classes = [AllowAny]
    lookup_field = 'slug'  # Используем slug вместо pk для URL

    def get_queryset(self):
        """Возвращает вакансии в зависимости от прав пользователя."""
        user = self.request.user

        # Для админов и модераторов показываем все вакансии
        if user.is_authenticated and (user.role in ['admin', 'moderator']):
            return Job.objects.select_related('author').prefetch_related('media').all()

        # Для обычных пользователей только активные
        return Job.objects.filter(is_active=True).select_related('author').prefetch_related('media').all()

    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия."""
        if self.action == 'retrieve':
            return JobDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return JobCreateUpdateSerializer
        return JobListSerializer

    def get_permissions(self):
        """Настройка permissions в зависимости от действия."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Только админы и модераторы могут создавать/редактировать/удалять
            return [permissions.IsAuthenticated(), IsAdminOrModerator()]
        return [AllowAny()]

    def perform_create(self, serializer):
        """Автоматически привязываем автора при создании."""
        serializer.save(author=self.request.user)


class IsAdminOrModerator(permissions.BasePermission):
    """
    Разрешение только для администраторов и модераторов.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'moderator']
        )


class NewsCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления категориями новостей.
    Только для админов и модераторов.
    """
    queryset = NewsCategory.objects.all()
    serializer_class = NewsCategorySerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'slug'


class NewsViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления новостями.

    Публичные действия (AllowAny):
    - list: Просмотр списка опубликованных новостей
    - retrieve: Детальный просмотр новости

    Действия для админов/модераторов:
    - create: Создание новости
    - update/partial_update: Редактирование новости
    - destroy: Удаление новости
    """
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'short_description', 'content']
    ordering_fields = ['published_at', 'created_at', 'views_count']
    ordering = ['-published_at']

    def get_queryset(self):
        """Возвращает новости в зависимости от прав пользователя."""
        user = self.request.user

        # Для админов и модераторов показываем все новости
        if user.is_authenticated and (user.role in ['admin', 'moderator']):
            return News.objects.select_related('author', 'category').prefetch_related('media').all()

        # Для обычных пользователей только опубликованные
        return News.objects.filter(is_published=True).select_related('author', 'category').prefetch_related('media').all()

    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия."""
        if self.action == 'retrieve':
            return NewsDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return NewsCreateUpdateSerializer
        return NewsListSerializer

    def get_permissions(self):
        """Настройка permissions в зависимости от действия."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Только админы и модераторы могут создавать/редактировать/удалять
            return [permissions.IsAuthenticated(), IsAdminOrModerator()]
        return [AllowAny()]

    def perform_create(self, serializer):
        """Автоматически привязываем автора при создании."""
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        """Увеличиваем счетчик просмотров при просмотре новости."""
        instance = self.get_object()

        # Увеличиваем счетчик просмотров только для обычных пользователей
        if not (request.user.is_authenticated and request.user.role in ['admin', 'moderator']):
            instance.views_count += 1
            instance.save(update_fields=['views_count'])

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Получить популярные новости (топ-10 по просмотрам)."""
        popular_news = self.get_queryset().order_by('-views_count')[:10]
        serializer = self.get_serializer(popular_news, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Получить последние новости (топ-10)."""
        recent_news = self.get_queryset().order_by('-published_at')[:10]
        serializer = self.get_serializer(recent_news, many=True)
        return Response(serializer.data)