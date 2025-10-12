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
        verbose_name='Код канала',
        help_text='Тип канала (например: email, whatsapp, telegram)'
    )
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Название канала',
        help_text='Уникальное название для идентификации канала'
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
    variables_help = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Доступные переменные',
        help_text='JSON с описанием переменных для этого типа уведомления. Например: {"order_number": "Номер заказа", "customer_name": "Имя клиента"}'
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
    Шаблоны сообщений для каждого типа и ТИПА канала (не конкретного канала).
    Шаблон привязан к типу канала (email, telegram, whatsapp), а не к конкретному экземпляру канала.
    Это позволяет создавать несколько каналов одного типа (например, несколько email-каналов)
    и все они будут использовать одни и те же шаблоны.
    """
    CHANNEL_TYPE_CHOICES = [
        ('telegram', 'Telegram'),
        ('whatsapp', 'WhatsApp'),
        ('email', 'Email'),
    ]

    notification_type = models.ForeignKey(
        NotificationType,
        on_delete=models.CASCADE,
        related_name='templates',
        verbose_name='Тип уведомления'
    )
    channel_type = models.CharField(
        max_length=50,
        choices=CHANNEL_TYPE_CHOICES,
        verbose_name='Тип канала',
        help_text='Тип канала (email, telegram, whatsapp)',
        db_index=True,
        default='email'  # Временный default для миграции
    )
    name = models.CharField(
        max_length=200,
        default='Стандартный',
        verbose_name='Название шаблона',
        help_text='Например: Стандартный, Подробный, Для VIP клиентов'
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
    is_default = models.BooleanField(
        default=False,
        verbose_name='Шаблон по умолчанию',
        help_text='Используется если для контакта не указан конкретный шаблон'
    )
    is_system = models.BooleanField(
        default=False,
        verbose_name='Системный шаблон',
        help_text='Системные шаблоны нельзя редактировать или удалять'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Шаблон уведомления'
        verbose_name_plural = 'Шаблоны уведомлений'
        ordering = ['notification_type', 'channel_type', 'name']
        # Ограничения уникальности
        constraints = [
            # Один шаблон по умолчанию на тип уведомления + тип канала
            models.UniqueConstraint(
                fields=['notification_type', 'channel_type'],
                condition=models.Q(is_default=True),
                name='unique_default_template_per_type_and_channel'
            ),
            # Уникальное имя шаблона в рамках типа уведомления + типа канала
            models.UniqueConstraint(
                fields=['notification_type', 'channel_type', 'name'],
                name='unique_template_name_per_type_and_channel'
            )
        ]

    def __str__(self):
        channel_display = dict(self.CHANNEL_TYPE_CHOICES).get(self.channel_type, self.channel_type)
        return f"{self.notification_type.name} - {channel_display} - {self.name}"

    def get_template_variables(self):
        """
        Извлекает все переменные из шаблона вида {{variable_name}}.
        """
        pattern = r'\{\{(\w+)\}\}'
        return set(re.findall(pattern, self.template))

    def clean(self):
        """
        Валидация шаблона перед сохранением.
        Проверяет, что все переменные в шаблоне есть в справке типа уведомления.
        """
        super().clean()

        # Если тип уведомления не задан или справка пустая, пропускаем валидацию
        if not self.notification_type or not self.notification_type.variables_help:
            return

        # Извлекаем переменные из шаблона
        template_vars = self.get_template_variables()

        # Извлекаем разрешенные переменные из типа уведомления
        allowed_vars = set(self.notification_type.variables_help.keys())

        # Находим неизвестные переменные
        unknown_vars = template_vars - allowed_vars

        if unknown_vars:
            raise ValidationError({
                'template': f'Неизвестные переменные в шаблоне: {", ".join(sorted(unknown_vars))}. '
                           f'Разрешенные переменные для типа "{self.notification_type.name}": {", ".join(sorted(allowed_vars))}'
            })

    def save(self, *args, **kwargs):
        """Вызываем clean() перед сохранением."""
        self.full_clean()
        super().save(*args, **kwargs)


class NotificationContact(models.Model):
    """
    Контакты получателей уведомлений.
    Привязаны к типу канала (telegram, whatsapp, email), а не к конкретному каналу.
    """
    CHANNEL_TYPE_CHOICES = [
        ('telegram', 'Telegram'),
        ('whatsapp', 'WhatsApp'),
        ('email', 'Email'),
    ]

    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Номер телефона должен быть в формате: '+999999999'. До 15 цифр."
    )

    name = models.CharField(
        max_length=100,
        verbose_name='Имя контакта',
        help_text='Например: Администратор, Менеджер'
    )
    channel_type = models.CharField(
        max_length=50,
        choices=CHANNEL_TYPE_CHOICES,
        verbose_name='Тип канала',
        help_text='Тип канала для отправки уведомлений',
        default='telegram'  # Временный default для миграции
    )
    value = models.CharField(
        max_length=200,
        verbose_name='Значение',
        help_text='Email адрес, номер телефона или username (для Telegram - @username или chat_id)'
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
        ordering = ['channel_type', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['channel_type', 'value'],
                name='unique_contact_per_channel_type'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.get_channel_type_display()}): {self.value}"

    def get_formatted_value(self):
        """
        Возвращает отформатированное значение для отправки.
        Для WhatsApp убирает все символы кроме цифр.
        """
        if self.channel_type == 'whatsapp':
            return self.value.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        return self.value


class NotificationRule(models.Model):
    """
    Правила отправки уведомлений.
    Связывает тип уведомления с каналом и контактами.
    """
    RULE_TYPE_CHOICES = [
        ('system', 'Системное'),
        ('additional', 'Дополнительное'),
    ]

    name = models.CharField(
        max_length=200,
        default='Правило',
        verbose_name='Название правила',
        help_text='Например: Отправка администратору, Уведомление менеджерам'
    )
    rule_type = models.CharField(
        max_length=20,
        choices=RULE_TYPE_CHOICES,
        default='additional',
        verbose_name='Тип правила',
        help_text='Системное - отправка самому пользователю, Дополнительное - отправка контактам из списка'
    )
    notification_type = models.ForeignKey(
        NotificationType,
        on_delete=models.CASCADE,
        related_name='rules',
        verbose_name='Тип уведомления'
    )
    channel = models.ForeignKey(
        NotificationChannel,
        on_delete=models.PROTECT,
        related_name='rules',
        verbose_name='Канал'
    )
    default_template = models.ForeignKey(
        'NotificationTemplate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rules_using_as_default',
        verbose_name='Шаблон по умолчанию',
        help_text='Шаблон, используемый для всех контактов этого правила (если не указан индивидуальный)'
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
        help_text='Кому отправлять уведомления',
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Правило отправки уведомления'
        verbose_name_plural = 'Правила отправки уведомлений'
        unique_together = ('notification_type', 'channel')

    def __str__(self):
        return self.name

    def clean(self):
        """
        Валидация правила перед сохранением.
        Проверяет, что все контакты имеют тот же тип канала, что и выбранный канал.
        """
        super().clean()

        # Если правило еще не сохранено (нет pk), пропускаем валидацию контактов
        # (они будут добавлены после сохранения через ManyToMany)
        if not self.pk:
            return

        # Проверяем соответствие типа канала и типов контактов
        channel_type = self.channel.code
        for contact in self.contacts.all():
            if contact.channel_type != channel_type:
                raise ValidationError(
                    f"Контакт '{contact.name}' имеет тип '{contact.get_channel_type_display()}', "
                    f"но выбранный канал '{self.channel.name}' имеет тип '{channel_type}'. "
                    f"Типы должны совпадать."
                )


class RuleContactTemplate(models.Model):
    """
    Дополнительная связь для назначения конкретного шаблона контакту в рамках правила.
    Если для контакта нет записи в этой таблице, используется шаблон по умолчанию.
    """
    rule = models.ForeignKey(
        NotificationRule,
        on_delete=models.CASCADE,
        related_name='contact_templates',
        verbose_name='Правило'
    )
    contact = models.ForeignKey(
        NotificationContact,
        on_delete=models.CASCADE,
        verbose_name='Контакт'
    )
    template = models.ForeignKey(
        NotificationTemplate,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='Шаблон',
        help_text='Если не указан, используется шаблон по умолчанию для этого типа уведомления и канала'
    )

    class Meta:
        verbose_name = 'Назначение шаблона контакту'
        verbose_name_plural = 'Назначения шаблонов контактам'
        unique_together = ('rule', 'contact')

    def __str__(self):
        return f"{self.rule} | {self.contact.name} → {self.template.name}"


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
        null=True,
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
