"""
Django сигналы для интеграции системных событий с системой уведомлений.
"""

from django.dispatch import receiver
from django.db.models.signals import post_save
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import transaction

from .services import NotificationDispatcher
from apps.core.models import SiteSettings
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


def get_site_url():
    """
    Получить URL сайта из настроек.
    """
    return SiteSettings.get_effective_site_url()


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
            'site_url': get_site_url(),
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
            'items_list': '\n'.join(items_list) if items_list else 'Нет товаров',
            'delivery_address': instance.delivery_address or 'Не указан',
            'delivery_comment': instance.delivery_comment or 'Не указано',
            'comment': instance.comment or 'Без комментариев',
            'site_url': get_site_url(),
        }

        if created:
            # Новый заказ - откладываем отправку до завершения транзакции,
            # чтобы OrderItems успели сохраниться
            order_id = instance.id

            def send_new_order_notification():
                from apps.orders.models import Order
                try:
                    # Перезагружаем заказ из БД, чтобы получить актуальные items
                    order = Order.objects.prefetch_related('items__product').get(id=order_id)

                    # Формируем список товаров заново
                    items_list = []
                    for item in order.items.all():
                        product_name = item.product.name if item.product else 'Товар'
                        items_list.append(f"• {product_name} x {item.quantity} = {item.subtotal} ₽")

                    # Обновляем контекст с актуальными данными
                    context = {
                        'order_number': order.order_number,
                        'customer_name': order.customer_name,
                        'customer_phone': order.customer_phone,
                        'email': order.customer_email or (order.user.email if order.user else None),
                        'total_amount': f"{order.total_amount} ₽",
                        'items_list': '\n'.join(items_list) if items_list else 'Нет товаров',
                        'delivery_address': order.delivery_address or 'Не указан',
                        'delivery_comment': order.delivery_comment or 'Не указано',
                        'comment': order.comment or 'Без комментариев',
                        'site_url': get_site_url(),
                    }

                    logger.info(f"🔔 Отправка уведомления о новом заказе: {order.order_number}")
                    NotificationDispatcher.send_notification('new_order', context)
                except Exception as e:
                    logger.error(f"❌ Ошибка отправки уведомления о новом заказе: {e}")

            transaction.on_commit(send_new_order_notification)
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