"""
Модели пользователей.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class User(AbstractUser):
    """
    Кастомная модель пользователя с полем роли.
    Поле role автоматически синхронизируется с is_staff и is_superuser.
    Email обязателен и уникален.
    Username может содержать только латинские буквы, цифры, _ и -.
    """

    ROLE_CHOICES = [
        ('user', 'Пользователь'),
        ('moderator', 'Модератор'),
        ('admin', 'Администратор'),
    ]

    # Валидатор для username - только латиница, цифры, _ и -
    username_validator = RegexValidator(
        regex=r'^[a-zA-Z0-9_-]+$',
        message='Имя пользователя может содержать только латинские буквы, цифры, символы подчеркивания (_) и дефисы (-).',
        code='invalid_username'
    )

    # Переопределяем username из AbstractUser с нашим валидатором
    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[username_validator],
        verbose_name='Имя пользователя',
        help_text='Обязательное поле. Не более 150 символов. Только латинские буквы, цифры и символы _-',
        error_messages={
            'unique': 'Пользователь с таким именем уже существует.',
        }
    )

    # Переопределяем email из AbstractUser, делаем его обязательным и уникальным
    email = models.EmailField(
        verbose_name='Email адрес',
        unique=True,
        error_messages={
            'unique': 'Пользователь с таким email уже существует.',
        }
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='user',
        verbose_name='Роль'
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Телефон'
    )

    # Указываем, что email обязателен
    REQUIRED_FIELDS = ['email']  # USERNAME_FIELD уже 'username' по умолчанию

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def save(self, *args, **kwargs):
        """
        Автоматическая синхронизация role с is_staff и is_superuser.
        - admin: is_staff=True, is_superuser=True
        - moderator: is_staff=True, is_superuser=False
        - user: is_staff=False, is_superuser=False
        """
        if self.role == 'admin':
            self.is_staff = True
            self.is_superuser = True
        elif self.role == 'moderator':
            self.is_staff = True
            self.is_superuser = False
        else:  # user
            self.is_staff = False
            self.is_superuser = False

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class DeliveryAddress(models.Model):
    """
    Модель адреса доставки пользователя с координатами.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='delivery_addresses',
        verbose_name='Пользователь'
    )

    # Основные поля адреса (заполняются автоматически с карты)
    full_address = models.CharField(
        max_length=500,
        verbose_name='Полный адрес'
    )
    city = models.CharField(
        max_length=100,
        verbose_name='Город'
    )
    street = models.CharField(
        max_length=200,
        verbose_name='Улица'
    )
    house = models.CharField(
        max_length=20,
        verbose_name='Номер дома'
    )

    # Дополнительные поля (пользователь вводит сам)
    apartment = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Квартира'
    )
    entrance = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='Подъезд'
    )
    floor = models.CharField(
        max_length=10,
        blank=True,
        verbose_name='Этаж'
    )
    comment = models.TextField(
        blank=True,
        verbose_name='Комментарий'
    )

    # Координаты (обязательные)
    # max_digits=11, decimal_places=8 дает точность ~1мм (вполне достаточно для адресов)
    # Пример: 42.86550099 (2 цифры до точки + 8 после = 10, с запасом 11)
    latitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        verbose_name='Широта'
    )
    longitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        verbose_name='Долгота'
    )

    # Метки
    label = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Метка адреса'
    )
    is_default = models.BooleanField(
        default=False,
        verbose_name='Основной адрес'
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
        verbose_name = 'Адрес доставки'
        verbose_name_plural = 'Адреса доставки'
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.full_address}"

    def save(self, *args, **kwargs):
        """
        Если адрес устанавливается как основной,
        снимаем флаг is_default со всех других адресов пользователя.
        """
        if self.is_default:
            DeliveryAddress.objects.filter(
                user=self.user,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)

        super().save(*args, **kwargs)
