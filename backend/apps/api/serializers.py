"""
Сериализаторы для API.
"""

from rest_framework import serializers
from apps.products.models import Product, ProductImage
from apps.categories.models import Category
from apps.core.models import SiteSettings
from apps.sync1c.models import IntegrationSource, SyncLog
from apps.users.models import User


class ProductImageSerializer(serializers.ModelSerializer):
    """Сериализатор для изображений товара."""
    
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text', 'is_main', 'order')


class IntegrationSourceSerializer(serializers.ModelSerializer):
    import_status_display = serializers.CharField(source='get_import_status_display', read_only=True)

    class Meta:
        model = IntegrationSource
        fields = (
            'id', 'name', 'code', 'is_active', 'show_on_site',
            'json_file_path', 'media_dir_path',
            'default_price_type', 'default_price_type_name',
            'default_warehouse', 'default_warehouse_name',
            'import_status', 'import_status_display', 'last_import_started', 'last_import_completed',
            'import_error_message', 'auto_sync_enabled', 'data_sync_interval', 'last_data_sync',
            'next_data_sync', 'full_sync_interval', 'last_full_sync', 'next_full_sync', 'last_error_time'
        )


class CategoryManagementSerializer(serializers.ModelSerializer):
    """Сериализатор для управления категориями в админ-панели."""
    products_count = serializers.ReadOnlyField()
    category_visible_name = serializers.ReadOnlyField()
    sources = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            'id', 'name', 'display_name', 'category_visible_name', 'parent', 'is_active', 'is_visible_on_site',
            'products_count', 'order', 'sources', 'children'
        )

    def get_sources(self, obj):
        """Получаем список источников, из которых есть товары в этой категории."""
        from apps.sync1c.models import IntegrationSource
        
        # Получаем уникальные источники товаров в этой категории
        source_ids = obj.products.values_list('source_id', flat=True).distinct()
        sources = IntegrationSource.objects.filter(id__in=source_ids).values('id', 'name', 'code')
        
        return list(sources)
    
    def get_children(self, obj):
        """Получаем дочерние категории."""
        children = obj.children.all()
        return CategoryManagementSerializer(children, many=True, context=self.context).data


class ProductManagementSerializer(serializers.ModelSerializer):
    """Сериализатор для управления товарами в админ-панели."""
    category = CategoryManagementSerializer(read_only=True)
    source_name = serializers.CharField(source='source.name', read_only=True)
    source_code = serializers.CharField(source='source.code', read_only=True)
    main_image = ProductImageSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    
    # Поля для визуальной индикации видимости
    is_category_visible = serializers.SerializerMethodField()
    is_source_visible = serializers.SerializerMethodField()
    visibility_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = (
            'id', 'code', 'name', 'article', 'price', 'currency', 'unit',
            'in_stock', 'stock_quantity', 'is_visible_on_site',
            'category', 'source_name', 'source_code', 'brand',
            'main_image', 'images', 'created_at', 'updated_at',
            # Новые поля для управления остатками
            'use_default_stock_settings', 'stock_display_style', 'low_stock_threshold',
            # Поля для визуальной индикации видимости
            'is_category_visible', 'is_source_visible', 'visibility_status'
        )
    
    def get_is_category_visible(self, obj):
        """Проверяет видимость категории товара."""
        return obj.category.is_visible_on_site if obj.category else True
    
    def get_is_source_visible(self, obj):
        """Проверяет видимость источника товара."""
        return obj.source.is_active and obj.source.show_on_site if obj.source else True
    
    def get_visibility_status(self, obj):
        """Возвращает статус видимости товара с детальной информацией."""
        from apps.core.models import SiteSettings
        
        # Получаем настройки сайта
        site_settings = SiteSettings.load()
        min_stock = site_settings.min_stock_for_display
        
        # Проверяем различные условия видимости
        status = {
            'is_visible_to_users': False,
            'reasons': []
        }
        
        # Проверка товара
        if not obj.is_visible_on_site:
            status['reasons'].append({
                'type': 'product',
                'message': 'Товар отключен',
                'field': 'is_visible_on_site'
            })
        
        # Проверка категории
        if obj.category and not obj.category.is_visible_on_site:
            status['reasons'].append({
                'type': 'category',
                'message': f'Категория "{obj.category.name}" скрыта',
                'field': 'category.is_visible_on_site'
            })
        
        # Проверка источника
        if obj.source:
            if not obj.source.is_active:
                status['reasons'].append({
                    'type': 'source',
                    'message': f'Источник "{obj.source.name}" неактивен',
                    'field': 'source.is_active'
                })
            elif not obj.source.show_on_site:
                status['reasons'].append({
                    'type': 'source',
                    'message': f'Источник "{obj.source.name}" скрыт с сайта',
                    'field': 'source.show_on_site'
                })
        
        # Проверка остатков
        if obj.stock_quantity < min_stock:
            status['reasons'].append({
                'type': 'stock',
                'message': f'Остаток ({obj.stock_quantity}) меньше минимального ({min_stock})',
                'field': 'stock_quantity'
            })
        
        # Определяем итоговую видимость
        status['is_visible_to_users'] = len(status['reasons']) == 0
        
        return status


class SiteSettingsSerializer(serializers.ModelSerializer):
    """Сериализатор для настроек сайта."""
    
    class Meta:
        model = SiteSettings
        fields = [
            'min_stock_for_display', 'default_stock_display_style', 
            'default_low_stock_threshold', 'show_stock_quantities_globally'
        ]




class CategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий."""

    products_count = serializers.ReadOnlyField()
    category_visible_name = serializers.ReadOnlyField()  # Название для отображения

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'display_name', 'category_visible_name', 'slug',
            'description', 'parent', 'image', 'products_count', 'is_active'
        ]


class ProductListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка товаров (упрощенный)."""
    
    category = CategorySerializer(read_only=True)
    main_image = ProductImageSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)  # Добавляем все изображения
    is_available = serializers.ReadOnlyField()
    tags_list = serializers.ReadOnlyField()
    barcodes_list = serializers.ReadOnlyField()  # Добавляем список штрихкодов
    
    # Добавляем поле для статуса остатков
    stock_status = serializers.SerializerMethodField()
    
    def get_stock_status(self, obj):
        """Получить статус остатков товара."""
        return obj.get_stock_status()
    
    class Meta:
        model = Product
        fields = [
            'id', 'code', 'article', 'name', 'category', 'price', 'currency', 'unit',
            'in_stock', 'stock_quantity', 'brand', 'weight', 'main_image', 'images',
            'is_available', 'tags_list', 'barcodes_list', 'stock_status', 'created_at'
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детального просмотра товара."""
    
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    is_available = serializers.ReadOnlyField()
    tags_list = serializers.ReadOnlyField()
    barcodes_list = serializers.ReadOnlyField()  # Добавляем список штрихкодов
    related_products = ProductListSerializer(many=True, read_only=True)
    
    # Добавляем новые поля для детальной информации
    retail_price = serializers.ReadOnlyField()
    internet_price = serializers.ReadOnlyField()
    main_warehouse_stock = serializers.ReadOnlyField()
    all_warehouses_stock = serializers.ReadOnlyField()
    
    # Добавляем поле для статуса остатков
    stock_status = serializers.SerializerMethodField()
    
    # Добавляем информацию об источнике и его настройках
    source_settings = serializers.SerializerMethodField()
    
    def get_stock_status(self, obj):
        """Получить статус остатков товара."""
        return obj.get_stock_status()
    
    def get_source_settings(self, obj):
        """Получить настройки источника товара для выделения активных цен и складов."""
        if obj.source:
            return {
                'id': obj.source.id,
                'name': obj.source.name,
                'code': obj.source.code,
                'default_price_type_name': obj.source.default_price_type_name,
                'default_warehouse_name': obj.source.default_warehouse_name,
            }
        return None
    
    class Meta:
        model = Product
        fields = [
            'id', 'code', 'article', 'name', 'category', 'price', 'currency', 'unit',
            'in_stock', 'stock_quantity', 'description', 'brand', 'weight',
            'composition', 'shelf_life', 'storage_conditions',
            'seo_title', 'seo_description',
            'tags_list', 'barcodes_list', 'images', 'related_products', 'is_available',
            # Новые поля
            'is_weighted', 'unit_weight', 'prices_data', 'stocks_data',
            'retail_price', 'internet_price', 'main_warehouse_stock', 'all_warehouses_stock',
            'stock_status', 'source_settings', 'created_at', 'updated_at'
        ]


class CategoryDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детального просмотра категории."""

    children = CategorySerializer(many=True, read_only=True)
    products_count = serializers.ReadOnlyField()
    category_visible_name = serializers.ReadOnlyField()  # Название для отображения

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'display_name', 'category_visible_name', 'slug',
            'description', 'parent', 'children', 'image', 'seo_title',
            'seo_description', 'products_count', 'is_active',
            'created_at', 'updated_at'
        ]


class SyncLogSerializer(serializers.ModelSerializer):
    """Сериализатор для логов синхронизации."""
    
    source_name = serializers.CharField(source='source.name', read_only=True)
    source_code = serializers.CharField(source='source.code', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    sync_type_display = serializers.CharField(source='get_sync_type_display', read_only=True)
    duration_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = SyncLog
        fields = [
            'id', 'source', 'source_name', 'source_code', 'sync_type', 'sync_type_display',
            'status', 'status_display', 'started_at', 'finished_at', 'duration', 'duration_formatted',
            'total_products', 'processed_products', 'created_products', 'updated_products',
            'errors_count', 'source_file_path', 'source_file_size', 'source_file_modified',
            'message', 'error_details', 'progress_percentage'
        ]
    
    def get_duration_formatted(self, obj):
        """Форматированная длительность."""
        if obj.duration:
            total_seconds = int(obj.duration.total_seconds())
            minutes = total_seconds // 60
            seconds = total_seconds % 60
            if minutes > 0:
                return f"{minutes} мин {seconds} сек"
            else:
                return f"{seconds} сек"
        return None


# JWT Token Serializer с добавлением роли пользователя
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Кастомный сериализатор для JWT токена.
    Добавляет информацию о роли пользователя в токен.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Добавляем информацию о пользователе в токен
        token['role'] = user.role if hasattr(user, 'role') else 'user'
        token['username'] = user.username

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Обновляем last_login при успешной аутентификации
        from django.utils import timezone
        self.user.last_login = timezone.now()
        self.user.save(update_fields=['last_login'])

        return data


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для пользователей (управление в админ-панели)."""

    role_display = serializers.CharField(source='get_role_display', read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'role', 'role_display', 'is_active', 'is_staff', 'is_superuser',
            'date_joined', 'last_login', 'password'
        )
        read_only_fields = ('id', 'date_joined', 'last_login', 'is_staff', 'is_superuser')

    def create(self, validated_data):
        """Создание нового пользователя с хешированным паролем."""
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        """Обновление пользователя с возможностью смены пароля."""
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance