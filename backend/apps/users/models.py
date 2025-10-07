"""
Модели пользователей.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Кастомная модель пользователя с полем роли.
    Поле role автоматически синхронизируется с is_staff и is_superuser.
    """

    ROLE_CHOICES = [
        ('user', 'Пользователь'),
        ('moderator', 'Модератор'),
        ('admin', 'Администратор'),
    ]

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
