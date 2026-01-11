"""
Кастомные serializers для пользователей.
Все сообщения об ошибках на русском языке.
"""

from djoser.serializers import SendEmailResetSerializer, UserCreateSerializer as BaseUserCreateSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
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


class CustomUserCreateSerializer(BaseUserCreateSerializer):
    """
    Кастомный serializer для создания пользователя.
    Создает пользователя с is_active=False, требующего активации через email.
    Все сообщения об ошибках на русском языке.
    """

    default_error_messages = {
        'password_mismatch': 'Пароли не совпадают.',
        'cannot_create_user': 'Не удалось создать пользователя.',
    }

    def validate_username(self, value):
        """
        Проверяет уникальность username с русским сообщением.
        """
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "Пользователь с таким именем уже существует."
            )
        return value

    def validate_email(self, value):
        """
        Проверяет уникальность email с русским сообщением.
        """
        email = value.lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "Пользователь с таким email уже зарегистрирован."
            )
        return email

    def validate(self, attrs):
        """
        Валидация с русскими сообщениями об ошибках.
        """
        re_password = attrs.pop('re_password', None)

        # Проверяем совпадение паролей
        if re_password is not None and attrs.get('password') != re_password:
            self.fail('password_mismatch')

        # Валидация пароля через Django валидаторы
        # Создаем временного пользователя для проверки схожести с данными
        user = User(
            username=attrs.get('username', ''),
            email=attrs.get('email', ''),
            first_name=attrs.get('first_name', ''),
            last_name=attrs.get('last_name', ''),
        )

        password = attrs.get('password')
        if password:
            try:
                validate_password(password, user)
            except DjangoValidationError as e:
                raise serializers.ValidationError({'password': list(e.messages)})

        return attrs

    def perform_create(self, validated_data):
        """
        Создает пользователя с is_active=False.
        """
        # Устанавливаем is_active=False для новых пользователей
        validated_data['is_active'] = False
        return super().perform_create(validated_data)