"""
Модели для синхронизации с 1С.
"""

from django.db import models
from django.utils import timezone


class IntegrationSource(models.Model):
    """
    Модель для хранения информации об источнике данных 1С (например, база 'pp' или 'opt').
    """
    name = models.CharField(
        max_length=255,
        verbose_name="Название источника",
        help_text="Понятное название, например, 'Основная база ПП'"
    )
    code = models.SlugField(
        max_length=50,
        unique=True,
        verbose_name="Код источника",
        help_text="Короткий уникальный код, например, 'pp' или 'opt'"
    )
    json_file_path = models.CharField(
        max_length=500,
        verbose_name="Путь к JSON файлу",
        help_text="Относительный путь к файлу данных от папки 'goods_data'"
    )
    media_dir_path = models.CharField(
        max_length=500,
        verbose_name="Путь к папке с медиа",
        help_text="Относительный путь к папке с медиафайлами от 'goods_data'"
    )

    # Правила по умолчанию для этого источника (храним только коды)
    default_price_type = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Код вида цены по умолчанию",
        help_text="UUID кода цены из 1С"
    )
    default_warehouse = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Код склада по умолчанию",
        help_text="UUID кода склада из 1С"
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name="Активен",
        help_text="Источник будет использоваться для импорта только если он активен."
    )
    show_on_site = models.BooleanField(
        default=True,
        verbose_name="Показывать на сайте",
        help_text="Если флаг установлен, товары из этого источника будут видны покупателям."
    )
    
    # Статус импорта
    IMPORT_STATUS_CHOICES = [
        ('idle', 'Ожидание'),
        ('running_data', 'Синхронизация данных'),
        ('running_full', 'Полная синхронизация'),
        ('completed', 'Завершен'),
        ('failed', 'Ошибка'),
    ]
    
    import_status = models.CharField(
        max_length=20,
        choices=IMPORT_STATUS_CHOICES,
        default='idle',
        verbose_name="Статус импорта",
        help_text="Текущий статус импорта данных"
    )
    last_import_started = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Последний запуск импорта",
        help_text="Дата и время последнего запуска импорта"
    )
    last_import_completed = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Последнее завершение импорта",
        help_text="Дата и время последнего успешного завершения импорта"
    )
    import_error_message = models.TextField(
        blank=True,
        null=True,
        verbose_name="Сообщение об ошибке",
        help_text="Последнее сообщение об ошибке импорта"
    )
    last_error_time = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Время последней ошибки"
    )
    
    # Автоматическая синхронизация
    auto_sync_enabled = models.BooleanField(
        default=False,
        verbose_name="Автосинхронизация включена",
        help_text="Включить автоматическую синхронизацию по расписанию"
    )
    
    # Настройки быстрой синхронизации (только данные)
    data_sync_interval = models.PositiveIntegerField(
        default=5,
        verbose_name="Интервал синхронизации данных (минуты)",
        help_text="Как часто синхронизировать данные (цены, остатки, названия) без медиафайлов"
    )
    last_data_sync = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Последняя синхронизация данных"
    )
    next_data_sync = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Следующая синхронизация данных"
    )
    
    # Настройки полной синхронизации (данные + медиа)
    full_sync_interval = models.PositiveIntegerField(
        default=60,
        verbose_name="Интервал полной синхронизации (минуты)",
        help_text="Как часто выполнять полную синхронизацию включая медиафайлы"
    )
    last_full_sync = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Последняя полная синхронизация"
    )
    next_full_sync = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Следующая полная синхронизация"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )

    class Meta:
        verbose_name = "Источник данных 1С"
        verbose_name_plural = "Источники данных 1С"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

    @property
    def default_price_type_name(self):
        """Получает название типа цены из JSON файла по коду."""
        if not self.default_price_type:
            return ''

        try:
            import json
            from pathlib import Path
            from django.conf import settings

            json_path = Path(settings.GOODS_DATA_DIR) / self.json_file_path
            if json_path.exists():
                with open(json_path, 'r', encoding='utf-8-sig') as f:
                    data = json.load(f)

                for product in data:
                    for price in product.get('Цены', []):
                        if price.get('КодЦены') == self.default_price_type:
                            return price.get('ВидЦены', '')
        except Exception:
            pass

        return ''

    @property
    def default_warehouse_name(self):
        """Получает название склада из JSON файла по коду."""
        if not self.default_warehouse:
            return ''

        try:
            import json
            from pathlib import Path
            from django.conf import settings

            json_path = Path(settings.GOODS_DATA_DIR) / self.json_file_path
            if json_path.exists():
                with open(json_path, 'r', encoding='utf-8-sig') as f:
                    data = json.load(f)

                for product in data:
                    for stock in product.get('Остатки', []):
                        if stock.get('КодСклада') == self.default_warehouse:
                            return stock.get('Склад', '')
        except Exception:
            pass

        return ''

    def schedule_next_data_sync(self):
        """Планирует следующую синхронизацию данных."""
        from django.utils import timezone
        if self.auto_sync_enabled:
            self.next_data_sync = timezone.now() + timezone.timedelta(minutes=self.data_sync_interval)
            self.save(update_fields=['next_data_sync'])
    
    def schedule_next_full_sync(self):
        """Планирует следующую полную синхронизацию."""
        from django.utils import timezone
        if self.auto_sync_enabled:
            self.next_full_sync = timezone.now() + timezone.timedelta(minutes=self.full_sync_interval)
            self.save(update_fields=['next_full_sync'])
    
    def is_data_sync_due(self):
        """Проверяет, пора ли выполнять синхронизацию данных."""
        from django.utils import timezone
        return (
            self.auto_sync_enabled and
            self.next_data_sync and
            timezone.now() >= self.next_data_sync
        )
    
    def is_full_sync_due(self):
        """Проверяет, пора ли выполнять полную синхронизацию."""
        from django.utils import timezone
        return (
            self.auto_sync_enabled and
            self.next_full_sync and
            timezone.now() >= self.next_full_sync
        )
    
    @property
    def is_syncing(self):
        """Проверяет, выполняется ли сейчас синхронизация."""
        return self.import_status in ['running_data', 'running_full']


class SyncLog(models.Model):
    """Лог синхронизации с 1С."""
    
    SYNC_TYPES = [
        ('full', 'Полная синхронизация'),
        ('partial', 'Частичная синхронизация'),
        ('products', 'Только товары'),
        ('images', 'Только изображения'),
    ]
    
    STATUS_CHOICES = [
        ('started', 'Запущена'),
        ('in_progress', 'В процессе'),
        ('completed', 'Завершена'),
        ('failed', 'Ошибка'),
        ('cancelled', 'Отменена'),
    ]
    
    sync_type = models.CharField(
        max_length=20, 
        choices=[('full', 'Полная'), ('partial', 'Частичная')],
        default='full'
    )
    source = models.ForeignKey(
        IntegrationSource,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Источник данных"
    )
    status = models.CharField(
        max_length=20, 
        choices=[
            ('started', 'Запущена'),
            ('in_progress', 'В процессе'),
            ('completed', 'Завершена'),
            ('failed', 'Ошибка'),
            ('cancelled', 'Отменена'),
        ],
        default='started',
        verbose_name="Статус"
    )
    
    # Статистика
    total_products = models.IntegerField(
        default=0,
        verbose_name="Всего товаров"
    )
    processed_products = models.IntegerField(
        default=0,
        verbose_name="Обработано товаров"
    )
    created_products = models.IntegerField(
        default=0,
        verbose_name="Создано товаров"
    )
    updated_products = models.IntegerField(
        default=0,
        verbose_name="Обновлено товаров"
    )
    errors_count = models.IntegerField(
        default=0,
        verbose_name="Количество ошибок"
    )
    
    # Сообщения и ошибки
    message = models.TextField(
        blank=True,
        verbose_name="Сообщение"
    )
    error_details = models.TextField(
        blank=True,
        verbose_name="Детали ошибок"
    )
    
    # Временные метки
    started_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Время начала"
    )
    finished_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Время окончания"
    )
    duration = models.DurationField(
        null=True,
        blank=True,
        verbose_name="Длительность"
    )
    
    # Файлы
    source_file_path = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="Путь к исходному файлу"
    )
    source_file_size = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name="Размер исходного файла"
    )
    source_file_modified = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата изменения файла"
    )
    
    class Meta:
        verbose_name = "Лог синхронизации"
        verbose_name_plural = "Логи синхронизации"
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['status', 'started_at']),
            models.Index(fields=['sync_type', 'started_at']),
        ]
    
    def __str__(self):
        return f"Синхронизация {self.get_sync_type_display()} - {self.get_status_display()}"
    
    @property
    def progress_percentage(self):
        """Процент выполнения."""
        if self.total_products > 0:
            return round((self.processed_products / self.total_products) * 100, 2)
        return 0
    
    @property
    def is_running(self):
        """Проверка, запущена ли синхронизация."""
        return self.status in ['started', 'in_progress']


class SyncError(models.Model):
    """Ошибки синхронизации."""
    
    sync_log = models.ForeignKey(
        SyncLog,
        on_delete=models.CASCADE,
        related_name='errors',
        verbose_name="Лог синхронизации"
    )
    
    product_code = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Код товара"
    )
    
    error_type = models.CharField(
        max_length=100,
        verbose_name="Тип ошибки"
    )
    error_message = models.TextField(
        verbose_name="Сообщение об ошибке"
    )
    
    stack_trace = models.TextField(
        blank=True,
        verbose_name="Стек ошибки"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Время возникновения"
    )
    
    class Meta:
        verbose_name = "Ошибка синхронизации"
        verbose_name_plural = "Ошибки синхронизации"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Ошибка: {self.error_type} ({self.product_code})"