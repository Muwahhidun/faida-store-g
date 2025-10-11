"""
Гибкая модульная система уведомлений.
Поддержка различных категорий, типов, каналов и контактов.
"""

from django.db import models
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
import re


class NotificationCategory(models.Model):
    """
    Категории уведомлений (Заказы, Системные и т.д.).
    Можно добавлять новые категории через админку.
    """
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Код категории',
        help_text='Уникальный код для программного доступа (например: orders, system)'
    )
    name = models.CharField(
        max_length=200,
        verbose_name='Название категории',
        help_text='Отображаемое название (например: Заказы, Системные)'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Описание'
    )
    order = models.IntegerField(
        default=0,
        verbose_name='Порядок отображения'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активна'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Категория уведомлений'
        verbose_name_plural = 'Категории уведомлений'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class NotificationChannel(models.Model):
    """
    Каналы связи (Email, WhatsApp, Telegram, SMS и т.д.).
    Можно добавлять новые каналы.
    """
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Код канала',
        help_text='Уникальный код (например: email, whatsapp, telegram)'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Название канала'
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Класс иконки',
        help_text='Например: FaEnvelope, FaWhatsapp'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    # Настройки канала (SMTP для email, API ключи для мессенджеров)
    settings = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Настройки канала',
        help_text='JSON с настройками: SMTP, API ключи и т.д.'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Канал связи'
        verbose_name_plural = 'Каналы связи'
        ordering = ['name']

    def __str__(self):
        return self.name


class NotificationType(models.Model):
    """
    Типы уведомлений (Новый заказ, Смена статуса и т.д.).
    Привязаны к категориям.
    """
    category = models.ForeignKey(
        NotificationCategory,
        on_delete=models.CASCADE,
        related_name='notification_types',
        verbose_name='Категория'
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Код типа',
        help_text='Уникальный код (например: new_order, order_status_changed)'
    )
    name = models.CharField(
        max_length=200,
        verbose_name='Название',
        help_text='Отображаемое название (например: Новый заказ)'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Описание'
    )
    is_enabled = models.BooleanField(
        default=True,
        verbose_name='Включено',
        help_text='Глобальное включение/выключение этого типа уведомлений'
    )
    order = models.IntegerField(
        default=0,
        verbose_name='Порядок отображения'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Тип уведомления'
        verbose_name_plural = 'Типы уведомлений'
        ordering = ['category', 'order', 'name']

    def __str__(self):
        return f"{self.category.name} - {self.name}"


class NotificationTemplate(models.Model):
    """
    Шаблоны сообщений для каждого типа и канала.
    Один тип может иметь разные шаблоны для разных каналов.
    """
    notification_type = models.ForeignKey(
        NotificationType,
        on_delete=models.CASCADE,
        related_name='templates',
        verbose_name='Тип уведомления'
    )
    channel = models.ForeignKey(
        NotificationChannel,
        on_delete=models.CASCADE,
        related_name='templates',
        verbose_name='Канал'
    )
    subject = models.CharField(
        max_length=500,
        blank=True,
        verbose_name='Тема (для email)',
        help_text='Используется только для email'
    )
    template = models.TextField(
        verbose_name='Шаблон сообщения',
        help_text='Текст с переменными: {{order_number}}, {{customer_name}}, {{total_amount}} и т.д.'
    )
    variables_help = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Справка по переменным',
        help_text='JSON с описанием доступных переменных'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Шаблон уведомления'
        verbose_name_plural = 'Шаблоны уведомлений'
        unique_together = ('notification_type', 'channel')

    def __str__(self):
        return f"{self.notification_type.name} - {self.channel.name}"

    def get_template_variables(self):
        """
        Извлекает все переменные из шаблона вида {{variable_name}}.
        """
        pattern = r'\{\{(\w+)\}\}'
        return set(re.findall(pattern, self.template))

    def clean(self):
        """
        Валидация шаблона перед сохранением.
        Проверяет, что все переменные в шаблоне есть в справке.
        """
        super().clean()

        # Если справка по переменным пустая, пропускаем валидацию
        if not self.variables_help:
            return

        # Извлекаем переменные из шаблона
        template_vars = self.get_template_variables()

        # Извлекаем разрешенные переменные из справки
        allowed_vars = set(self.variables_help.keys())

        # Находим неизвестные переменные
        unknown_vars = template_vars - allowed_vars

        if unknown_vars:
            raise ValidationError({
                'template': f'Неизвестные переменные в шаблоне: {", ".join(sorted(unknown_vars))}. '
                           f'Разрешенные переменные: {", ".join(sorted(allowed_vars))}'
            })

    def save(self, *args, **kwargs):
        """Вызываем clean() перед сохранением."""
        self.full_clean()
        super().save(*args, **kwargs)


class NotificationContact(models.Model):
    """
    Контакты получателей уведомлений.
    """
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Номер телефона должен быть в формате: '+999999999'. До 15 цифр."
    )

    channel = models.ForeignKey(
        NotificationChannel,
        on_delete=models.CASCADE,
        related_name='contacts',
        verbose_name='Канал'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Имя контакта',
        help_text='Например: Администратор, Менеджер'
    )
    value = models.CharField(
        max_length=200,
        verbose_name='Значение',
        help_text='Email адрес или номер телефона'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Контакт для уведомлений'
        verbose_name_plural = 'Контакты для уведомлений'
        ordering = ['channel', 'name']

    def __str__(self):
        return f"{self.name} ({self.channel.name}): {self.value}"

    def get_formatted_value(self):
        """
        Возвращает отформатированное значение для отправки.
        Для WhatsApp убирает все символы кроме цифр.
        """
        if self.channel.code == 'whatsapp':
            return self.value.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        return self.value


class NotificationRule(models.Model):
    """
    Правила отправки уведомлений.
    Связывает тип уведомления с каналом и контактами.
    """
    notification_type = models.ForeignKey(
        NotificationType,
        on_delete=models.CASCADE,
        related_name='rules',
        verbose_name='Тип уведомления'
    )
    channel = models.ForeignKey(
        NotificationChannel,
        on_delete=models.CASCADE,
        related_name='rules',
        verbose_name='Канал'
    )
    is_enabled = models.BooleanField(
        default=True,
        verbose_name='Включено',
        help_text='Отправлять уведомления по этому каналу'
    )
    contacts = models.ManyToManyField(
        NotificationContact,
        related_name='rules',
        verbose_name='Контакты',
        help_text='Кому отправлять уведомления'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Правило отправки уведомления'
        verbose_name_plural = 'Правила отправки уведомлений'
        unique_together = ('notification_type', 'channel')

    def __str__(self):
        return f"{self.notification_type.name} → {self.channel.name}"


class NotificationLog(models.Model):
    """
    Лог отправленных уведомлений (опционально, для отладки и статистики).
    Поддерживает повторные попытки отправки при ошибках.
    """
    STATUS_CHOICES = [
        ('pending', 'Ожидает отправки'),
        ('sent', 'Отправлено'),
        ('failed', 'Ошибка'),
        ('retrying', 'Повторная попытка'),
    ]

    notification_type = models.ForeignKey(
        NotificationType,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Тип уведомления'
    )
    channel = models.ForeignKey(
        NotificationChannel,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Канал'
    )
    contact = models.ForeignKey(
        NotificationContact,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Контакт'
    )
    # Для уведомлений клиентам (не через NotificationContact)
    recipient_value = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Получатель',
        help_text='Email или телефон клиента (если не из контактов)'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Статус'
    )
    message = models.TextField(
        verbose_name='Сообщение',
        help_text='Отправленный текст'
    )
    error_message = models.TextField(
        blank=True,
        verbose_name='Сообщение об ошибке'
    )
    # Повторные попытки
    retry_count = models.IntegerField(
        default=0,
        verbose_name='Количество попыток'
    )
    max_retries = models.IntegerField(
        default=3,
        verbose_name='Максимум попыток',
        help_text='Максимальное количество повторных попыток при ошибке'
    )
    next_retry_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Следующая попытка',
        help_text='Время следующей попытки отправки'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Лог уведомления'
        verbose_name_plural = 'Логи уведомлений'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'next_retry_at']),  # Для поиска неудачных с запланированной повторной отправкой
        ]

    def __str__(self):
        recipient = self.contact or self.recipient_value
        return f"{self.notification_type} → {recipient} ({self.status})"

    def can_retry(self):
        """Проверяет, можно ли повторить отправку."""
        return self.status == 'failed' and self.retry_count < self.max_retries

    def mark_as_sent(self):
        """Помечает уведомление как успешно отправленное."""
        self.status = 'sent'
        self.error_message = ''
        self.next_retry_at = None
        self.save()

    def mark_as_failed(self, error_message: str, schedule_retry: bool = True):
        """
        Помечает уведомление как неудачное.

        Args:
            error_message: Текст ошибки
            schedule_retry: Планировать ли повторную попытку
        """
        from datetime import timedelta
        from django.utils import timezone

        self.status = 'failed'
        self.error_message = error_message
        self.retry_count += 1

        # Планируем повторную попытку если не превышен лимит
        if schedule_retry and self.can_retry():
            # Увеличиваем задержку с каждой попыткой: 5 мин, 15 мин, 30 мин
            delays = [5, 15, 30]
            delay_minutes = delays[min(self.retry_count - 1, len(delays) - 1)]
            self.next_retry_at = timezone.now() + timedelta(minutes=delay_minutes)
            self.status = 'retrying'

        self.save()
