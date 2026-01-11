
"""
Сигналы для приложения пользователей.
"""
import logging
from django.contrib.auth.tokens import default_token_generator
from django.db.models.signals import post_save
from django.dispatch import receiver
from djoser import utils

from apps.notifications.services import NotificationDispatcher
from apps.core.models import SiteSettings
from .models import User

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def handle_new_user_registration(sender, instance, created, **kwargs):
    """
    Обработчик, который срабатывает после сохранения пользователя.
    Если пользователь только что создан:
    1. Принудительно устанавливает is_active=False.
    2. Отправляет письмо для активации.
    """
    if created:
        logger.info(f"Пользователь {instance.username} только что создан. Запускаю процесс деактивации и отправки письма.")

        # 1. Принудительная деактивация
        # Мы делаем это здесь, чтобы гарантировать, что пользователь неактивен,
        # независимо от того, что происходит в сериализаторе или менеджере.
        instance.is_active = False
        instance.save(update_fields=['is_active'])
        logger.info(f"Пользователь {instance.username} принудительно деактивирован.")

        # 2. Отправка письма активации
        try:
            logger.info(f"Отправка письма активации для пользователя: {instance.username}")

            # Генерируем токен активации
            uid = utils.encode_uid(instance.pk)
            token = default_token_generator.make_token(instance)

            # Формируем URL активации из настроек сайта
            site_url = SiteSettings.get_effective_site_url()
            activation_url = f"{site_url}/activate/{uid}/{token}"

            context = {
                'username': instance.username,
                'email': instance.email,
                'first_name': instance.first_name or 'Пользователь',
                'full_name': instance.get_full_name() or instance.username,
                'activation_url': activation_url,
                'site_url': site_url,
            }

            # Отправляем уведомления через систему правил
            # 1. Письмо активации самому пользователю
            NotificationDispatcher.send_notification('user_activation', context)
            logger.info(f"Письмо активации для {instance.username} успешно отправлено.")

            # 2. Уведомление администратору о новой регистрации
            NotificationDispatcher.send_notification('user_registration', context)
            logger.info(f"Уведомление о регистрации {instance.username} отправлено администраторам.")

        except Exception as e:
            logger.error(f"Ошибка при отправке уведомлений для {instance.username}: {e}")

