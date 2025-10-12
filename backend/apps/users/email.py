"""
Кастомные email классы для Djoser, которые используют систему уведомлений.
"""

from djoser import email as djoser_email


class PasswordResetEmail(djoser_email.PasswordResetEmail):
    """
    Email для восстановления пароля.
    Использует шаблон templates/email/password_reset.html
    """
    template_name = 'email/password_reset.html'


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
