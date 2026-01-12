"""
Модели для системы платежей через YooKassa.
"""

import os
from django.db import models
from django.core.cache import cache


class PaymentSettings(models.Model):
    """
    Singleton модель для хранения настроек YooKassa.
    Позволяет конфигурировать платёжную систему через админ-панель.
    """

    shop_id = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Shop ID',
        help_text='Идентификатор магазина в YooKassa'
    )
    secret_key = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Секретный ключ',
        help_text='Секретный ключ для API YooKassa'
    )
    is_enabled = models.BooleanField(
        default=False,
        verbose_name='Включить онлайн-оплату',
        help_text='Если выключено, кнопка онлайн-оплаты будет скрыта'
    )
    test_mode = models.BooleanField(
        default=True,
        verbose_name='Тестовый режим',
        help_text='Использовать тестовое окружение YooKassa'
    )
    webhook_secret = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Секрет для webhook',
        help_text='Опционально: для проверки подписи webhook запросов'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Последнее обновление'
    )

    class Meta:
        verbose_name = 'Настройки платежей'
        verbose_name_plural = 'Настройки платежей'

    def __str__(self):
        status = "включено" if self.is_enabled else "выключено"
        mode = "тест" if self.test_mode else "боевой"
        return f"Настройки YooKassa ({status}, {mode})"

    def save(self, *args, **kwargs):
        # Singleton: всегда используем pk=1
        self.pk = 1
        super().save(*args, **kwargs)
        # Очищаем кэш при сохранении
        cache.delete('payment_settings')

    @classmethod
    def load(cls):
        """Загружает настройки из БД или создает пустые."""
        cache_key = 'payment_settings'
        settings = cache.get(cache_key)
        if settings is None:
            settings, _ = cls.objects.get_or_create(pk=1)
            cache.set(cache_key, settings, 300)  # Кэш на 5 минут
        return settings

    @classmethod
    def get_credentials(cls):
        """
        Возвращает учётные данные YooKassa.
        Приоритет: БД > переменные окружения.
        """
        settings = cls.load()

        # Если настройки есть в БД - используем их
        if settings.shop_id and settings.secret_key:
            return {
                'shop_id': settings.shop_id,
                'secret_key': settings.secret_key,
                'is_enabled': settings.is_enabled,
                'test_mode': settings.test_mode,
            }

        # Fallback на переменные окружения
        return {
            'shop_id': os.getenv('YOOKASSA_SHOP_ID', ''),
            'secret_key': os.getenv('YOOKASSA_SECRET_KEY', ''),
            'is_enabled': bool(os.getenv('YOOKASSA_SHOP_ID')),
            'test_mode': True,
        }

    @classmethod
    def is_configured(cls):
        """Проверяет, настроена ли платёжная система."""
        creds = cls.get_credentials()
        return bool(creds['shop_id'] and creds['secret_key'] and creds['is_enabled'])


class Payment(models.Model):
    """
    Модель платежа через YooKassa.
    Хранит информацию о платеже и связывает его с заказом.
    """

    STATUS_CHOICES = [
        ('pending', 'Ожидает оплаты'),
        ('waiting_for_capture', 'Ожидает подтверждения'),
        ('succeeded', 'Успешно оплачен'),
        ('canceled', 'Отменён'),
    ]

    order = models.OneToOneField(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='payment',
        verbose_name='Заказ'
    )
    yookassa_id = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='ID платежа в YooKassa'
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Статус'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Сумма'
    )
    currency = models.CharField(
        max_length=3,
        default='RUB',
        verbose_name='Валюта'
    )
    paid = models.BooleanField(
        default=False,
        verbose_name='Оплачен'
    )
    payment_method_type = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Способ оплаты',
        help_text='bank_card, yoo_money, sbp и др.'
    )
    confirmation_url = models.URLField(
        max_length=500,
        blank=True,
        verbose_name='URL для оплаты'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )
    paid_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата оплаты'
    )

    class Meta:
        verbose_name = 'Платёж'
        verbose_name_plural = 'Платежи'
        ordering = ['-created_at']

    def __str__(self):
        return f"Платёж {self.yookassa_id} для заказа {self.order.order_number}"

    def get_status_display_ru(self):
        """Возвращает статус на русском."""
        status_dict = dict(self.STATUS_CHOICES)
        return status_dict.get(self.status, self.status)

    @property
    def refunded_amount(self):
        """Возвращает общую сумму возвратов."""
        return self.refunds.filter(status='succeeded').aggregate(
            total=models.Sum('amount')
        )['total'] or 0

    @property
    def available_for_refund(self):
        """Возвращает сумму, доступную для возврата."""
        if not self.paid:
            return 0
        return self.amount - self.refunded_amount


class Refund(models.Model):
    """
    Модель возврата платежа.
    Поддерживает частичные и полные возвраты.
    """

    STATUS_CHOICES = [
        ('pending', 'В обработке'),
        ('succeeded', 'Выполнен'),
        ('canceled', 'Отменён'),
    ]

    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='refunds',
        verbose_name='Платёж'
    )
    yookassa_id = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='ID возврата в YooKassa'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Сумма возврата'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Статус'
    )
    reason = models.TextField(
        blank=True,
        verbose_name='Причина возврата'
    )
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Создал'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Возврат'
        verbose_name_plural = 'Возвраты'
        ordering = ['-created_at']

    def __str__(self):
        return f"Возврат {self.amount} ₽ для платежа {self.payment.yookassa_id}"

    def get_status_display_ru(self):
        """Возвращает статус на русском."""
        status_dict = dict(self.STATUS_CHOICES)
        return status_dict.get(self.status, self.status)
