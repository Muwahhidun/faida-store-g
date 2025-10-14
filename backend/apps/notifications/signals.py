"""
Django сигналы для интеграции системных событий с системой уведомлений.
"""

from django.dispatch import receiver
from django.db.models.signals import post_save
from django.contrib.auth import get_user_model
from django.conf import settings
from djoser.signals import user_registered
from djoser import utils
from .services import NotificationDispatcher
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(user_registered)
def send_registration_notification(sender, user, request, **kwargs):
    """
    Отправка уведомления при регистрации нового пользователя.
    Срабатывает после успешной регистрации через Djoser.
    """
    try:
        logger.info(f"🔔 Сигнал регистрации получен для пользователя: {user.username}")

        context = {
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name or 'Пользователь',
            'last_name': user.last_name or '',
            'full_name': user.get_full_name() or user.username,
        }

        # Отправляем уведомление через новую систему правил
        NotificationDispatcher.send_notification('user_registration', context)

        logger.info(f"✅ Уведомление о регистрации обработано для {user.username}")
    except Exception as e:
        logger.error(f"❌ Ошибка отправки уведомления о регистрации: {e}")


@receiver(user_registered)
def send_activation_email_notification(sender, user, request, **kwargs):
    """
    Отправка письма с ссылкой активации при регистрации пользователя.
    Заменяет стандартную отправку Djoser, чтобы использовать нашу систему уведомлений.
    """
    try:
        logger.info(f"🔔 Отправка письма активации для пользователя: {user.username}")

        # Генерируем токен активации как это делает Djoser
        context_data = utils.encode_uid(user.pk)
        token = utils.default_token_generator.make_token(user)

        # Формируем URL активации
        activation_url = f"{settings.DJOSER['PROTOCOL']}://{settings.DJOSER['DOMAIN']}/{settings.DJOSER['ACTIVATION_URL'].format(uid=context_data, token=token)}"

        context = {
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name or 'Пользователь',
            'last_name': user.last_name or '',
            'full_name': user.get_full_name() or user.username,
            'activation_url': activation_url,
        }

        # Отправляем через нашу систему уведомлений
        NotificationDispatcher.send_notification('user_activation', context)

        logger.info(f"✅ Письмо активации отправлено для {user.username}")
    except Exception as e:
        logger.error(f"❌ Ошибка отправки письма активации: {e}")


def send_password_reset_notification(user, reset_url):
    """
    Отправка уведомления при сбросе пароля.
    Вызывается вручную из кастомного email класса Djoser.
    """
    try:
        context = {
            'username': user.username,
            'email': user.email,
            'reset_url': reset_url,
        }

        # Отправляем уведомление через новую систему правил
        NotificationDispatcher.send_notification('password_reset', context)

        logger.info(f"✅ Отправлено уведомление о сбросе пароля для {user.username}")
    except Exception as e:
        logger.error(f"❌ Ошибка отправки уведомления о сбросе пароля: {e}")


@receiver(post_save, sender='orders.Order')
def send_order_notifications(sender, instance, created, **kwargs):
    """
    Отправка уведомлений при создании заказа или изменении его статуса.
    """
    logger.info(f"[SIGNAL] send_order_notifications вызван для заказа {instance.order_number}, created={created}")
    try:
        # Формируем список товаров
        items_list = []
        for item in instance.items.all():
            product_name = item.product.name if item.product else 'Товар'
            items_list.append(f"{product_name} x {item.quantity}")

        # Определяем email пользователя (для системных уведомлений)
        user_email = instance.customer_email or (instance.user.email if instance.user else None)

        base_context = {
            'order_number': instance.order_number,
            'customer_name': instance.customer_name,
            'customer_phone': instance.customer_phone,
            'email': user_email,  # Добавляем email для системных уведомлений
            'total_amount': f"{instance.total_amount} ₽",
            'items_list': ', '.join(items_list) if items_list else 'Нет товаров',
            'delivery_address': instance.delivery_address or 'Не указан',
            'comment': instance.comment or 'Без комментариев',
        }

        if created:
            # Новый заказ
            logger.info(f"🔔 Новый заказ создан: {instance.order_number}")
            NotificationDispatcher.send_notification('new_order', base_context)
        else:
            # Проверяем изменение статуса
            # Используем _old_status который был сохранен в методе save() модели
            old_status = getattr(instance, '_old_status', None)
            if old_status and old_status != instance.status:
                logger.info(f"🔔 Статус заказа {instance.order_number} изменен: {old_status} → {instance.status}")
                # Получаем текстовое представление старого статуса
                status_dict = dict(instance.STATUS_CHOICES)
                old_status_display = status_dict.get(old_status, old_status)

                context = {
                    **base_context,
                    'old_status': old_status_display,
                    'new_status': instance.get_status_display(),
                    'status': instance.get_status_display(),
                }
                logger.info(f"[SIGNAL] Вызов NotificationDispatcher.send_notification для order_status_changed, context keys: {context.keys()}")
                NotificationDispatcher.send_notification('order_status_changed', context)

    except Exception as e:
        logger.error(f"❌ Ошибка отправки уведомления о заказе: {e}")
