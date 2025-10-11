"""
Модели для системы уведомлений.
"""

from django.db import models
from django.core.validators import RegexValidator


class NotificationSettings(models.Model):
    """
    Singleton модель для хранения настроек уведомлений.
    Должна существовать только одна запись в таблице.
    """

    # Email настройки
    enable_email_notifications = models.BooleanField(
        default=True,
        verbose_name='Включить Email уведомления'
    )
    admin_email = models.EmailField(
        default='admin@faida.ru',
        verbose_name='Email администратора для уведомлений'
    )

    # WhatsApp настройки (Green API)
    enable_whatsapp_notifications = models.BooleanField(
        default=False,
        verbose_name='Включить WhatsApp уведомления'
    )
    green_api_instance_id = models.CharField(
        max_length=20,
        blank=True,
        default='1103108965',
        verbose_name='Green API Instance ID'
    )
    green_api_token = models.CharField(
        max_length=100,
        blank=True,
        default='9a71dc1a5a274923967ab1cfe7dd56a976097823e41447eea1',
        verbose_name='Green API Token'
    )

    # Настройки уведомлений о заказах
    notify_on_new_order = models.BooleanField(
        default=True,
        verbose_name='Уведомлять о новых заказах'
    )
    notify_on_status_change = models.BooleanField(
        default=True,
        verbose_name='Уведомлять при смене статуса заказа'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Настройки уведомлений'
        verbose_name_plural = 'Настройки уведомлений'

    def save(self, *args, **kwargs):
        """
        Гарантируем, что существует только одна запись.
        """
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """
        Запрещаем удаление единственной записи настроек.
        """
        pass

    @classmethod
    def load(cls):
        """
        Получить настройки (создать если не существуют).
        """
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Настройки уведомлений"


class WhatsAppOperator(models.Model):
    """
    Модель для хранения номеров операторов WhatsApp.
    """

    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Номер телефона должен быть в формате: '+999999999'. До 15 цифр."
    )

    name = models.CharField(
        max_length=100,
        verbose_name='Имя оператора'
    )
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        verbose_name='Номер телефона',
        help_text='Формат: +79285575774'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'WhatsApp оператор'
        verbose_name_plural = 'WhatsApp операторы'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.phone_number})"

    def get_formatted_phone(self):
        """
        Возвращает номер в формате для Green API (без +).
        Например: 79285575774
        """
        return self.phone_number.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
