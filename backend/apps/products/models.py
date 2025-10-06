"""
Модели для управления товарами.
"""

from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
import json


class Product(models.Model):
    """Модель товара из 1С."""
    
    # Основная информация
    code = models.CharField(
        max_length=50, 
        unique=True, 
        verbose_name="Код товара",
        help_text="Уникальный код товара из 1С"
    )
    article = models.CharField(
        max_length=100, 
        blank=True,
        verbose_name="Артикул",
        help_text="Артикул товара из 1С"
    )
    name = models.CharField(
        max_length=255, 
        verbose_name="Название товара"
    )
    barcodes = models.TextField(
        blank=True,
        verbose_name="Штрихкоды",
        help_text="Штрихкоды через запятую"
    )
    
    # Связи
    category = models.ForeignKey(
        'categories.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        verbose_name="Категория"
    )
    
    # Цена и наличие (основные для совместимости)
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Цена",
        help_text="Основная цена для отображения (обычно цена для интернет-магазина)"
    )
    currency = models.CharField(
        max_length=3, 
        default='RUB',
        verbose_name="Валюта"
    )
    unit = models.CharField(
        max_length=20, 
        default='шт',
        verbose_name="Единица измерения"
    )
    
    # Остатки (основные для совместимости)
    in_stock = models.BooleanField(
        default=True,
        verbose_name="В наличии"
    )
    stock_quantity = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        default=0,
        validators=[MinValueValidator(Decimal('0'))],
        verbose_name="Количество на складе",
        help_text="Основное количество для отображения (обычно свободный остаток)"
    )
    
    # Дополнительные характеристики товара из 1С
    is_weighted = models.BooleanField(
        default=False,
        verbose_name="Весовой товар"
    )
    unit_weight = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name="Вес единицы товара"
    )
    
    # JSON поля для детальной информации из 1С
    prices_data = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Данные о ценах",
        help_text="Массив с различными типами цен из 1С"
    )
    stocks_data = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Данные об остатках",
        help_text="Массив с остатками по складам из 1С"
    )
    
    # Описание и характеристики
    description = models.TextField(
        blank=True,
        verbose_name="Описание"
    )
    brand = models.CharField(
        max_length=100, 
        blank=True,
        verbose_name="Бренд"
    )
    weight = models.CharField(
        max_length=50, 
        blank=True,
        verbose_name="Вес"
    )
    composition = models.TextField(
        blank=True,
        verbose_name="Состав"
    )
    shelf_life = models.CharField(
        max_length=100, 
        blank=True,
        verbose_name="Срок годности"
    )
    storage_conditions = models.TextField(
        blank=True,
        verbose_name="Условия хранения"
    )
    
    # SEO поля
    seo_title = models.CharField(
        max_length=255, 
        blank=True,
        verbose_name="SEO заголовок"
    )
    seo_description = models.TextField(
        blank=True,
        verbose_name="SEO описание"
    )
    
    # Теги
    tags = models.TextField(
        blank=True,
        verbose_name="Теги",
        help_text="Теги через запятую"
    )
    
    # Связанные товары
    related_products = models.ManyToManyField(
        'self',
        blank=True,
        symmetrical=False,
        verbose_name="Связанные товары"
    )
    
    # Источник данных
    source = models.ForeignKey(
        'sync1c.IntegrationSource',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Источник данных 1С",
        help_text="Указывает, из какой базы 1С пришел этот товар."
    )
    
    # Управление отображением на сайте
    selected_price_code = models.CharField(
        max_length=100,
        blank=True, null=True,
        verbose_name="Код выбранной цены",
        help_text="Код вида цены из 1С, который будет основным на сайте."
    )
    selected_stock_code = models.CharField(
        max_length=100,
        blank=True, null=True,
        verbose_name="Код выбранного склада",
        help_text="Код склада из 1С, остатки которого будут основными на сайте."
    )
    
    # Настройки отображения остатков на сайте
    use_default_stock_settings = models.BooleanField(
        default=True,
        verbose_name="Использовать общие настройки остатков",
        help_text="Если включено, будут использоваться общие настройки сайта. Если выключено - индивидуальные настройки товара."
    )
    
    STOCK_DISPLAY_CHOICES = [
        ('exact', 'Показывать точное количество'),
        ('status', 'Показывать статус (В наличии / Нет)'),
        ('detailed_status', 'Показывать детальный статус (В наличии / Мало / Нет)'),
    ]
    stock_display_style = models.CharField(
        max_length=20,
        choices=STOCK_DISPLAY_CHOICES,
        default='detailed_status',
        verbose_name="Стиль отображения остатков (индивидуальный)",
        help_text="Как показывать наличие товара на сайте (действует только при отключенных общих настройках)."
    )
    low_stock_threshold = models.PositiveIntegerField(
        default=5,
        verbose_name="Порог 'Мало на складе' (индивидуальный)",
        help_text="Количество, при котором товар будет считаться 'мало' (действует только при отключенных общих настройках)."
    )
    
    # Служебные поля
    is_visible_on_site = models.BooleanField(
        default=True,
        verbose_name="Активен на сайте",
        help_text="Если флаг снят, товар не будет показан на публичной части сайта"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )
    
    # Поля для синхронизации с 1С
    last_sync_at = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name="Последняя синхронизация"
    )
    sync_hash = models.CharField(
        max_length=64, 
        blank=True,
        verbose_name="Хэш для синхронизации",
        help_text="MD5 хэш данных из 1С для отслеживания изменений"
    )
    
    class Meta:
        verbose_name = "Товар"
        verbose_name_plural = "Товары"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['in_stock', 'is_visible_on_site']),
            models.Index(fields=['category', 'in_stock']),
            models.Index(fields=['price']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    @property
    def is_available(self):
        """Проверка доступности товара."""
        return self.is_visible_on_site and self.in_stock and self.stock_quantity > 0
    
    @property
    def main_image(self):
        """Получить основное изображение товара."""
        return self.images.filter(is_main=True).first()
    
    @property
    def tags_list(self):
        """Получить список тегов."""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
        return []
    
    @property
    def barcodes_list(self):
        """Получить список штрихкодов."""
        if self.barcodes:
            return [barcode.strip() for barcode in self.barcodes.split(',') if barcode.strip()]
        return []
    
    @property
    def retail_price(self):
        """Получить розничную цену."""
        for price_info in self.prices_data:
            if price_info.get('ВидЦены') == 'Розница':
                return price_info.get('Цена', 0)
        return None
    
    @property
    def internet_price(self):
        """Получить цену для интернет-магазина."""
        for price_info in self.prices_data:
            if price_info.get('ВидЦены') == 'ДляИнтернетМагазина':
                return price_info.get('Цена', 0)
        return None
    
    @property
    def main_warehouse_stock(self):
        """Получить информацию об остатках на основном складе."""
        for stock_info in self.stocks_data:
            if stock_info.get('Склад') == 'Склад (№1)':
                return {
                    'warehouse': stock_info.get('Склад'),
                    'total': stock_info.get('НаСкладе', 0),
                    'reserved': stock_info.get('ВРезерве', 0),
                    'available': stock_info.get('СвободныйОстаток', 0)
                }
        return None
    
    @property
    def all_warehouses_stock(self):
        """Получить информацию об остатках на всех складах."""
        warehouses = []
        for stock_info in self.stocks_data:
            warehouses.append({
                'warehouse': stock_info.get('Склад'),
                'total': stock_info.get('НаСкладе', 0),
                'reserved': stock_info.get('ВРезерве', 0),
                'available': stock_info.get('СвободныйОстаток', 0)
            })
        return warehouses
    
    def get_effective_stock_display_style(self):
        """Получить эффективный стиль отображения остатков."""
        if self.use_default_stock_settings:
            from apps.core.models import SiteSettings
            site_settings = SiteSettings.load()
            return site_settings.default_stock_display_style
        return self.stock_display_style
    
    def get_effective_low_stock_threshold(self):
        """Получить эффективный порог 'мало на складе'."""
        if self.use_default_stock_settings:
            from apps.core.models import SiteSettings
            site_settings = SiteSettings.load()
            return site_settings.default_low_stock_threshold
        return self.low_stock_threshold
    
    def get_stock_status(self):
        """Получить статус остатков с учетом настроек."""
        display_style = self.get_effective_stock_display_style()
        threshold = self.get_effective_low_stock_threshold()
        
        if not self.in_stock or self.stock_quantity <= 0:
            return {'status': 'out_of_stock', 'text': 'Нет в наличии', 'quantity': 0}
        
        if display_style == 'exact':
            return {
                'status': 'in_stock', 
                'text': f'{self.stock_quantity} {self.unit}', 
                'quantity': self.stock_quantity
            }
        elif display_style == 'status':
            return {'status': 'in_stock', 'text': 'В наличии', 'quantity': None}
        elif display_style == 'detailed_status':
            if self.stock_quantity <= threshold:
                return {'status': 'low_stock', 'text': 'Мало', 'quantity': None}
            else:
                return {'status': 'in_stock', 'text': 'В наличии', 'quantity': None}
        
        # Fallback
        return {'status': 'in_stock', 'text': 'В наличии', 'quantity': None}


class ProductImage(models.Model):
    """Модель изображений товара."""
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name="Товар"
    )
    image = models.ImageField(
        upload_to='products/%Y/%m/',
        verbose_name="Изображение"
    )
    alt_text = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Alt текст"
    )
    is_main = models.BooleanField(
        default=False,
        verbose_name="Основное изображение"
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Порядок сортировки"
    )
    
    # Оригинальное имя файла из 1С
    original_filename = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Оригинальное имя файла"
    )
    
    # MD5 хэш исходного файла для отслеживания изменений
    file_hash = models.CharField(
        max_length=32,
        blank=True,
        verbose_name="MD5 хэш файла",
        help_text="MD5 хэш исходного файла для определения изменений"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    
    class Meta:
        verbose_name = "Изображение товара"
        verbose_name_plural = "Изображения товаров"
        ordering = ['-is_main', 'order', 'created_at']
        indexes = [
            models.Index(fields=['product', 'is_main']),
            models.Index(fields=['product', 'order']),
        ]
    
    def __str__(self):
        return f"Изображение для {self.product.name}"