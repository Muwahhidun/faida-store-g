"""
Кастомные serializers для пользователей.
"""

from djoser.serializers import SendEmailResetSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class CustomPasswordResetSerializer(SendEmailResetSerializer):
    """
    Кастомный serializer для восстановления пароля.
    Честно сообщает, если email не найден (как GitHub).
    """

    def validate_email(self, value):
        """
        Проверяет, существует ли пользователь с таким email.
        Возвращает email в нижнем регистре для корректной работы.
        """
        # Приводим к нижнему регистру для проверки
        email = value.lower()

        # Проверяем, существует ли пользователь с таким email
        if not User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "Пользователь с таким email не найден. Проверьте правильность адреса или зарегистрируйтесь."
            )

        # Возвращаем email в нижнем регистре для корректной работы Djoser
        return email
