"""
Сериализаторы для API.
"""

from rest_framework import serializers
from apps.products.models import Product, ProductImage
from apps.categories.models import Category
from apps.core.models import SiteSettings
from apps.sync1c.models import IntegrationSource, SyncLog
from apps.users.models import User, DeliveryAddress
from apps.jobs.models import Job, JobMedia
from apps.news.models import News, NewsCategory, NewsMedia
from apps.orders.models import Order, OrderItem
# TODO: Обновить после миграции на новую систему уведомлений
# from apps.notifications.models import NotificationSettings, WhatsAppOperator


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


class DeliveryAddressSerializer(serializers.ModelSerializer):
    """Сериализатор для адресов доставки."""

    class Meta:
        model = DeliveryAddress
        fields = (
            'id', 'user', 'full_address', 'city', 'street', 'house',
            'apartment', 'entrance', 'floor', 'comment',
            'latitude', 'longitude', 'label', 'is_default',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')


class JobMediaSerializer(serializers.ModelSerializer):
    """Сериализатор для медиа-файлов вакансии."""

    class Meta:
        model = JobMedia
        fields = (
            'id', 'media_type', 'file', 'video_url', 'caption', 'display_order', 'created_at'
        )


class JobListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка вакансий."""

    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    preview_image = serializers.SerializerMethodField()

    def get_preview_image(self, obj):
        """Получить превью изображение."""
        return obj.get_preview_image_url()

    class Meta:
        model = Job
        fields = (
            'id', 'title', 'slug', 'short_description', 'employment_type',
            'employment_type_display', 'location', 'work_schedule', 'salary_from', 'salary_to',
            'is_active', 'is_closed', 'author_name', 'preview_image', 'created_at', 'updated_at'
        )


class JobDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детального просмотра вакансии."""

    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    media = JobMediaSerializer(many=True, read_only=True)

    class Meta:
        model = Job
        fields = (
            'id', 'title', 'slug', 'short_description', 'content', 'content_delta', 'preview_image',
            'employment_type', 'employment_type_display', 'location', 'work_schedule',
            'salary_from', 'salary_to', 'hr_email', 'hr_phone',
            'is_active', 'is_closed', 'author', 'author_name',
            'media', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'slug', 'author', 'created_at', 'updated_at')


class JobCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания и редактирования вакансии."""

    preview_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Job
        fields = (
            'slug', 'title', 'short_description', 'content', 'content_delta', 'preview_image',
            'employment_type', 'location', 'work_schedule', 'salary_from', 'salary_to',
            'hr_email', 'hr_phone', 'is_active', 'is_closed'
        )
        read_only_fields = ('slug',)

    def update(self, instance, validated_data):
        """
        Обновление вакансии с правильной обработкой изображения.
        Если preview_image не передан - сохраняем существующее.
        """
        # Если preview_image пришло как пустая строка - это команда удалить изображение
        if validated_data.get('preview_image') == '':
            if instance.preview_image:
                instance.preview_image.delete(save=False)
            validated_data['preview_image'] = None

        return super().update(instance, validated_data)


class NewsCategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий новостей."""

    class Meta:
        model = NewsCategory
        fields = ('id', 'name', 'slug', 'display_order')


class NewsMediaSerializer(serializers.ModelSerializer):
    """Сериализатор для медиа-файлов новости."""

    class Meta:
        model = NewsMedia
        fields = (
            'id', 'media_type', 'file', 'video_url', 'caption', 'display_order', 'created_at'
        )


class NewsListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка новостей."""

    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    preview_image = serializers.SerializerMethodField()

    def get_preview_image(self, obj):
        """Получить превью изображение."""
        return obj.get_preview_image_url()

    class Meta:
        model = News
        fields = (
            'id', 'title', 'slug', 'category', 'category_name', 'short_description',
            'preview_image', 'author_name', 'is_published', 'published_at',
            'views_count', 'created_at', 'updated_at'
        )


class NewsDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детального просмотра новости."""

    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    media = NewsMediaSerializer(many=True, read_only=True)

    class Meta:
        model = News
        fields = (
            'id', 'title', 'slug', 'category', 'category_name', 'short_description',
            'content', 'content_delta', 'preview_image', 'author', 'author_name',
            'is_published', 'published_at', 'views_count', 'media',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'slug', 'author', 'views_count', 'created_at', 'updated_at')


class NewsCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания и редактирования новости."""

    preview_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = News
        fields = (
            'slug', 'title', 'category', 'short_description', 'content', 'content_delta',
            'preview_image', 'is_published', 'published_at'
        )
        read_only_fields = ('slug',)

    def update(self, instance, validated_data):
        """
        Обновление новости с правильной обработкой изображения.
        Если preview_image не передан - сохраняем существующее.
        """
        # Если preview_image пришло как пустая строка - это команда удалить изображение
        if validated_data.get('preview_image') == '':
            if instance.preview_image:
                instance.preview_image.delete(save=False)
            validated_data['preview_image'] = None

        return super().update(instance, validated_data)


class OrderItemSerializer(serializers.ModelSerializer):
    """Сериализатор для товара в заказе."""

    product_name = serializers.CharField(source='product.name', read_only=True)
    product_article = serializers.CharField(source='product.article', read_only=True)
    product_image = serializers.SerializerMethodField()

    def get_product_image(self, obj):
        """Получить главное изображение товара."""
        if obj.product.main_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.main_image.image.url)
        return None

    class Meta:
        model = OrderItem
        fields = (
            'id', 'product', 'product_name', 'product_article', 'product_image',
            'price', 'quantity', 'subtotal'
        )
        read_only_fields = ('id', 'subtotal')


class OrderListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка заказов."""

    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    def get_items_count(self, obj):
        """Получить количество товаров в заказе."""
        return obj.items.count()

    def get_user(self, obj):
        """Получить информацию о пользователе."""
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'email': obj.user.email,
                'role': obj.user.role
            }
        return None

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'user', 'status', 'status_display',
            'customer_name', 'customer_phone', 'delivery_address', 'delivery_comment', 'comment',
            'payment_method', 'payment_method_display', 'total_amount',
            'items', 'items_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'order_number', 'user', 'created_at', 'updated_at')


class OrderDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детального просмотра заказа."""

    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'user', 'user_email', 'status', 'status_display',
            'customer_name', 'customer_phone', 'customer_email', 'delivery_address', 'delivery_comment',
            'comment', 'payment_method', 'payment_method_display', 'total_amount',
            'items', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'order_number', 'user', 'created_at', 'updated_at')


class OrderCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания заказа."""

    items = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        help_text="Список товаров в формате: [{'product_id': 1, 'quantity': 2}, ...]"
    )

    class Meta:
        model = Order
        fields = (
            'customer_name', 'customer_phone', 'customer_email',
            'delivery_address', 'delivery_comment', 'comment', 'payment_method', 'items'
        )

    def validate_items(self, value):
        """Валидация списка товаров."""
        if not value:
            raise serializers.ValidationError("Список товаров не может быть пустым")

        for item in value:
            if 'product_id' not in item:
                raise serializers.ValidationError("Каждый товар должен иметь product_id")
            if 'quantity' not in item:
                raise serializers.ValidationError("Каждый товар должен иметь quantity")
            if item['quantity'] <= 0:
                raise serializers.ValidationError("Количество должно быть больше 0")

        return value

    def create(self, validated_data):
        """Создание заказа с товарами."""
        items_data = validated_data.pop('items')
        user = self.context['request'].user

        # Вычисляем общую сумму заказа
        total_amount = 0
        order_items = []

        for item_data in items_data:
            try:
                product = Product.objects.get(id=item_data['product_id'])
            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    f"Товар с ID {item_data['product_id']} не найден"
                )

            # Проверяем наличие товара
            if not product.in_stock:
                raise serializers.ValidationError(
                    f"Товар '{product.name}' отсутствует в наличии"
                )

            quantity = item_data['quantity']
            price = product.price
            subtotal = price * quantity
            total_amount += subtotal

            order_items.append({
                'product': product,
                'price': price,
                'quantity': quantity,
                'subtotal': subtotal
            })

        # Создаем заказ
        order = Order.objects.create(
            user=user,
            total_amount=total_amount,
            **validated_data
        )

        # Создаем товары заказа
        for item_data in order_items:
            OrderItem.objects.create(
                order=order,
                **item_data
            )

        return order


# TODO: Обновить после миграции на новую систему уведомлений
# class NotificationSettingsSerializer(serializers.ModelSerializer):
#     """Сериализатор для настроек уведомлений."""
#
#     class Meta:
#         model = NotificationSettings
#         fields = (
#             'id', 'enable_email_notifications', 'admin_email',
#             'enable_whatsapp_notifications', 'green_api_instance_id', 'green_api_token',
#             'notify_on_new_order', 'notify_on_status_change',
#             'created_at', 'updated_at'
#         )
#         read_only_fields = ('id', 'created_at', 'updated_at')
#
#
# class WhatsAppOperatorSerializer(serializers.ModelSerializer):
#     """Сериализатор для операторов WhatsApp."""
#
#     class Meta:
#         model = WhatsAppOperator
#         fields = (
#             'id', 'name', 'phone_number', 'is_active',
#             'created_at', 'updated_at'
#         )
#         read_only_fields = ('id', 'created_at', 'updated_at')