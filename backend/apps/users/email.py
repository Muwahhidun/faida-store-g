"""
Кастомные email классы для Djoser, которые используют систему уведомлений.
"""

from djoser import email as djoser_email
from apps.notifications.signals import send_password_reset_notification


class PasswordResetEmail(djoser_email.PasswordResetEmail):
    """
    Email для восстановления пароля.
    Использует систему уведомлений вместо Django шаблонов.
    """

    def send(self, to, *args, **kwargs):
        """
        Переопределяем метод send, чтобы использовать нашу систему уведомлений.
        """
        # Получаем пользователя и формируем URL для сброса пароля
        user = self.context.get('user')
        uid = self.context.get('uid')
        token = self.context.get('token')
        protocol = self.context.get('protocol', 'http')
        domain = self.context.get('domain')

        # Формируем полный URL для сброса пароля
        reset_url = f"{protocol}://{domain}/password/reset/confirm/{uid}/{token}"

        # Отправляем через систему уведомлений
        send_password_reset_notification(user, reset_url)

        # НЕ вызываем super().send(), чтобы не отправлять через Django


class PasswordChangedConfirmationEmail(djoser_email.PasswordChangedConfirmationEmail):
    """
    Email подтверждения смены пароля.
    """
    template_name = 'email/password_changed_confirmation.html'


class ActivationEmail(djoser_email.ActivationEmail):
    """
    Email активации аккаунта.
    """
    template_name = 'email/activation.html'


class ConfirmationEmail(djoser_email.ConfirmationEmail):
    """
    Email подтверждения регистрации.
    """
    template_name = 'email/confirmation.html'
