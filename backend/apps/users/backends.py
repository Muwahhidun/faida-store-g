"""
Кастомный бэкенд аутентификации для входа по email или username.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q


User = get_user_model()


class EmailOrUsernameBackend(ModelBackend):
    """
    Аутентификация по email или username.

    Пользователь может войти, указав:
    - username (shamil_abdullaev)
    - email (shamil@example.com)
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Попытка аутентификации пользователя.

        Args:
            request: HTTP запрос
            username: Может быть username или email
            password: Пароль пользователя

        Returns:
            User объект если аутентификация успешна, иначе None
        """
        if username is None or password is None:
            return None

        try:
            # Ищем пользователя по username или email (case-insensitive для email)
            user = User.objects.get(
                Q(username__iexact=username) | Q(email__iexact=username)
            )
        except User.DoesNotExist:
            # Выполняем hash пароля даже если пользователь не найден
            # (защита от timing attacks)
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            # Не должно произойти, т.к. username и email уникальны
            return None

        # Проверяем пароль
        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None

    def get_user(self, user_id):
        """
        Получить пользователя по ID.

        Args:
            user_id: ID пользователя

        Returns:
            User объект или None
        """
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

        return user if self.user_can_authenticate(user) else None
