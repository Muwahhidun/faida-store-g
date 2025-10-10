"""
Модели заказов.
"""

from django.db import models
from django.conf import settings
from apps.products.models import Product


class Order(models.Model):
    """
    Модель заказа.
    """

    STATUS_CHOICES = [
        ('pending', 'Ожидает обработки'),
        ('confirmed', 'Подтвержден'),
        ('processing', 'В обработке'),
        ('shipping', 'Отправлен'),
        ('delivered', 'Доставлен'),
        ('cancelled', 'Отменен'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('cash_on_delivery', 'Наличными при получении'),
        ('card_on_delivery', 'Картой при получении'),
    ]

    # Связь с пользователем
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Пользователь'
    )

    # Номер заказа (автоматически генерируется)
    order_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Номер заказа',
        editable=False
    )

    # Статус заказа
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Статус'
    )

    # Контактная информация
    customer_name = models.CharField(
        max_length=200,
        verbose_name='ФИО'
    )
    customer_phone = models.CharField(
        max_length=20,
        verbose_name='Телефон'
    )
    customer_email = models.EmailField(
        blank=True,
        verbose_name='Email'
    )

    # Адрес доставки
    delivery_address = models.TextField(
        verbose_name='Адрес доставки'
    )

    # Комментарий к заказу
    comment = models.TextField(
        blank=True,
        verbose_name='Комментарий'
    )

    # Способ оплаты
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default='cash_on_delivery',
        verbose_name='Способ оплаты'
    )

    # Сумма заказа
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Общая сумма'
    )

    # Временные метки
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        """
        Генерация номера заказа при создании.
        """
        if not self.order_number:
            # Генерируем номер заказа в формате ORD-YYYYMMDD-XXXX
            from django.utils import timezone
            today = timezone.now().strftime('%Y%m%d')

            # Получаем последний заказ за сегодня
            last_order = Order.objects.filter(
                order_number__startswith=f'ORD-{today}'
            ).order_by('-order_number').first()

            if last_order:
                # Извлекаем номер и увеличиваем
                last_number = int(last_order.order_number.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1

            self.order_number = f'ORD-{today}-{new_number:04d}'

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Заказ {self.order_number} - {self.customer_name}"


class OrderItem(models.Model):
    """
    Модель товара в заказе.
    """

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Заказ'
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,  # Защита от удаления товара, если он в заказе
        related_name='order_items',
        verbose_name='Товар'
    )

    # Сохраняем цену на момент заказа (может измениться в будущем)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Цена за единицу'
    )

    quantity = models.PositiveIntegerField(
        default=1,
        verbose_name='Количество'
    )

    # Итоговая сумма за этот товар
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Сумма'
    )

    class Meta:
        verbose_name = 'Товар в заказе'
        verbose_name_plural = 'Товары в заказе'

    def save(self, *args, **kwargs):
        """
        Автоматический расчет subtotal.
        """
        self.subtotal = self.price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
