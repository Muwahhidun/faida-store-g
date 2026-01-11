"""
Кастомные email классы для Djoser, которые используют систему уведомлений.
"""

from djoser import email as djoser_email
from apps.notifications.signals import send_password_reset_notification
from apps.core.models import SiteSettings


def get_site_url():
    """
    Получить URL сайта из настроек (админ-панель имеет приоритет над переменными окружения).
    """
    return SiteSettings.get_effective_site_url()


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

        # Получаем URL сайта из настроек (вместо domain из Djoser)
        site_url = get_site_url()

        # Формируем полный URL для сброса пароля
        reset_url = f"{site_url}/password/reset/confirm/{uid}/{token}"

        # Отправляем через систему уведомлений
        send_password_reset_notification(user, reset_url)

        # НЕ вызываем super().send(), чтобы не отправлять через Django


class PasswordChangedConfirmationEmail(djoser_email.PasswordChangedConfirmationEmail):
    """
    Email подтверждения смены пароля.
    """
    template_name = 'email/password_changed_confirmation.html'

    def get_context_data(self):
        context = super().get_context_data()
        # Используем URL из настроек
        context['site_url'] = get_site_url()
        return context


class ActivationEmail(djoser_email.ActivationEmail):
    """
    Email активации аккаунта.
    """
    template_name = 'email/activation.html'

    def get_context_data(self):
        context = super().get_context_data()
        # Используем URL из настроек вместо domain из Djoser
        site_url = get_site_url()
        context['site_url'] = site_url
        # Переопределяем url чтобы использовать наш site_url
        uid = context.get('uid', '')
        token = context.get('token', '')
        context['url'] = f"{site_url}/activate/{uid}/{token}"
        return context


class ConfirmationEmail(djoser_email.ConfirmationEmail):
    """
    Email подтверждения регистрации.
    """
    template_name = 'email/confirmation.html'

    def get_context_data(self):
        context = super().get_context_data()
        # Используем URL из настроек
        context['site_url'] = get_site_url()
        return context
