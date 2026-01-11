from django.db import models
from django.core.validators import MinValueValidator
import os

class SiteSettings(models.Model):
    """
    Модель для хранения глобальных настроек сайта.
    Использует паттерн Singleton, чтобы гарантировать наличие только одной записи.
    """
    # URL сайта для уведомлений
    site_url = models.CharField(
        max_length=255,
        default='',
        blank=True,
        verbose_name="URL сайта",
        help_text="Полный URL сайта для ссылок в уведомлениях (например: https://faida.ru). Если пусто, используется значение из переменной окружения FRONTEND_URL."
    )

    min_stock_for_display = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(0)],
        verbose_name="Минимальный остаток для показа",
        help_text="Товары с остатком МЕНЬШЕ этого значения не будут показаны на сайте."
    )
    
    # Глобальные настройки отображения остатков
    STOCK_DISPLAY_CHOICES = [
        ('exact', 'Показывать точное количество'),
        ('status', 'Показывать статус (В наличии / Нет)'),
        ('detailed_status', 'Показывать детальный статус (В наличии / Мало / Нет)'),
    ]
    
    default_stock_display_style = models.CharField(
        max_length=20,
        choices=STOCK_DISPLAY_CHOICES,
        default='detailed_status',
        verbose_name="Стиль отображения остатков по умолчанию",
        help_text="Как показывать наличие товаров на сайте по умолчанию"
    )
    
    default_low_stock_threshold = models.PositiveIntegerField(
        default=5,
        validators=[MinValueValidator(1)],
        verbose_name="Порог 'Мало на складе' по умолчанию",
        help_text="Количество, при котором товар будет считаться 'мало' по умолчанию"
    )
    
    show_stock_quantities_globally = models.BooleanField(
        default=True,
        verbose_name="Показывать остатки на сайте",
        help_text="Если отключено, остатки не будут показываться пользователям"
    )

    class Meta:
        verbose_name = "Настройки сайта"
        verbose_name_plural = "Настройки сайта"

    def save(self, *args, **kwargs):
        """
        Гарантирует, что всегда есть только один объект настроек.
        """
        self.pk = 1
        super(SiteSettings, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        """
        Загружает или создает единственный объект настроек.
        """
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def get_site_url(self):
        """
        Возвращает URL сайта. Если не указан в настройках, берет из переменной окружения.
        """
        if self.site_url:
            # Убираем trailing slash если есть
            return self.site_url.rstrip('/')
        # Fallback на переменную окружения
        env_url = os.getenv('FRONTEND_URL', 'localhost:5173')
        # Добавляем протокол если нет
        if not env_url.startswith('http'):
            env_url = f'http://{env_url}'
        return env_url.rstrip('/')

    @classmethod
    def get_effective_site_url(cls):
        """
        Статический метод для получения URL сайта без создания экземпляра.
        """
        settings = cls.load()
        return settings.get_site_url()
