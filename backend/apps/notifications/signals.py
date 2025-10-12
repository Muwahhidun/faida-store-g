"""
Django сигналы для интеграции системных событий с системой уведомлений.
"""

from django.dispatch import receiver
from django.db.models.signals import post_save
from django.contrib.auth import get_user_model
from djoser.signals import user_registered
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
    try:
        # Формируем список товаров
        items_list = []
        for item in instance.items.all():
            items_list.append(f"{item.product_name or (item.product.name if item.product else 'Товар')} x {item.quantity}")

        base_context = {
            'order_number': instance.order_number,
            'customer_name': instance.customer_name,
            'customer_phone': instance.customer_phone,
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
            # Используем специальный трюк: сравниваем с базой данных
            try:
                from apps.orders.models import Order
                old_instance = Order.objects.get(pk=instance.pk)
                if old_instance.status != instance.status:
                    logger.info(f"🔔 Статус заказа {instance.order_number} изменен: {old_instance.status} → {instance.status}")
                    context = {
                        **base_context,
                        'old_status': old_instance.get_status_display(),
                        'new_status': instance.get_status_display(),
                        'status': instance.get_status_display(),
                    }
                    NotificationDispatcher.send_notification('order_status_changed', context)
            except sender.DoesNotExist:
                pass

    except Exception as e:
        logger.error(f"❌ Ошибка отправки уведомления о заказе: {e}")
