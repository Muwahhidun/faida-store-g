"""
Кастомные валидаторы паролей с русскими сообщениями об ошибках.
"""

import re
from difflib import SequenceMatcher

from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import (
    CommonPasswordValidator as BaseCommonPasswordValidator,
    MinimumLengthValidator as BaseMinimumLengthValidator,
    NumericPasswordValidator as BaseNumericPasswordValidator,
    UserAttributeSimilarityValidator as BaseUserAttributeSimilarityValidator,
)


class MinimumLengthValidator(BaseMinimumLengthValidator):
    """
    Валидатор минимальной длины пароля с русским сообщением.
    """

    def __init__(self, min_length=8):
        self.min_length = min_length

    def validate(self, password, user=None):
        if len(password) < self.min_length:
            raise ValidationError(
                f"Пароль слишком короткий. Минимальная длина — {self.min_length} символов.",
                code='password_too_short',
                params={'min_length': self.min_length},
            )

    def get_help_text(self):
        return f"Пароль должен содержать не менее {self.min_length} символов."


class CommonPasswordValidator(BaseCommonPasswordValidator):
    """
    Валидатор распространённых паролей с русским сообщением.
    """

    def validate(self, password, user=None):
        if password.lower().strip() in self.passwords:
            raise ValidationError(
                "Этот пароль слишком распространённый. Придумайте более надёжный пароль.",
                code='password_too_common',
            )

    def get_help_text(self):
        return "Пароль не должен быть слишком распространённым."


class NumericPasswordValidator(BaseNumericPasswordValidator):
    """
    Валидатор, запрещающий полностью числовые пароли, с русским сообщением.
    """

    def validate(self, password, user=None):
        if password.isdigit():
            raise ValidationError(
                "Пароль не может состоять только из цифр.",
                code='password_entirely_numeric',
            )

    def get_help_text(self):
        return "Пароль не может состоять только из цифр."


class UserAttributeSimilarityValidator(BaseUserAttributeSimilarityValidator):
    """
    Валидатор схожести пароля с данными пользователя, с русским сообщением.
    """

    DEFAULT_USER_ATTRIBUTES = ('username', 'first_name', 'last_name', 'email')

    def __init__(self, user_attributes=DEFAULT_USER_ATTRIBUTES, max_similarity=0.7):
        self.user_attributes = user_attributes
        self.max_similarity = max_similarity

    def validate(self, password, user=None):
        if not user:
            return

        password_lower = password.lower()

        for attribute_name in self.user_attributes:
            value = getattr(user, attribute_name, None)
            if not value or not isinstance(value, str):
                continue

            value_lower = value.lower()

            # Для email берём только часть до @
            if attribute_name == 'email':
                value_lower = value_lower.split('@')[0]

            if not value_lower:
                continue

            # Проверяем схожесть
            if SequenceMatcher(a=password_lower, b=value_lower).quick_ratio() >= self.max_similarity:
                raise ValidationError(
                    self._get_error_message(attribute_name),
                    code='password_too_similar',
                    params={'verbose_name': attribute_name},
                )

            # Проверяем, содержится ли значение в пароле
            if value_lower in password_lower or password_lower in value_lower:
                raise ValidationError(
                    self._get_error_message(attribute_name),
                    code='password_too_similar',
                    params={'verbose_name': attribute_name},
                )

    def _get_error_message(self, attribute_name):
        """Возвращает русское сообщение об ошибке для конкретного атрибута."""
        messages = {
            'username': 'Пароль слишком похож на имя пользователя.',
            'first_name': 'Пароль слишком похож на ваше имя.',
            'last_name': 'Пароль слишком похож на вашу фамилию.',
            'email': 'Пароль слишком похож на ваш email.',
        }
        return messages.get(attribute_name, 'Пароль слишком похож на личную информацию.')

    def get_help_text(self):
        return "Пароль не должен быть похож на ваше имя, email или другую личную информацию."
