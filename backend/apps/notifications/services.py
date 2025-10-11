"""
Сервисы для отправки уведомлений.
"""

import requests
import logging
from typing import List, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class WhatsAppService:
    """
    Сервис для отправки WhatsApp сообщений через Green API.
    """

    def __init__(self, instance_id: str, api_token: str):
        self.instance_id = instance_id
        self.api_token = api_token
        self.base_url = f"https://api.green-api.com/waInstance{instance_id}"

    def send_message(self, phone_number: str, message: str) -> dict:
        """
        Отправить текстовое сообщение в WhatsApp.

        Args:
            phone_number: Номер телефона в формате 79285575774 (без +)
            message: Текст сообщения

        Returns:
            dict: Ответ от API
        """
        url = f"{self.base_url}/sendMessage/{self.api_token}"

        # Убираем все лишнее из номера
        clean_phone = phone_number.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')

        payload = {
            "chatId": f"{clean_phone}@c.us",
            "message": message
        }

        try:
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            result = response.json()
            logger.info(f"WhatsApp сообщение отправлено на {phone_number}: {result}")
            return result
        except requests.exceptions.RequestException as e:
            logger.error(f"Ошибка отправки WhatsApp сообщения на {phone_number}: {e}")
            return {"error": str(e)}

    def send_message_to_multiple(self, phone_numbers: List[str], message: str) -> List[dict]:
        """
        Отправить сообщение нескольким получателям.

        Args:
            phone_numbers: Список номеров телефонов
            message: Текст сообщения

        Returns:
            list: Список ответов от API
        """
        results = []
        for phone in phone_numbers:
            result = self.send_message(phone, message)
            results.append({
                'phone': phone,
                'result': result
            })
        return results

    def check_state_instance(self) -> dict:
        """
        Проверить состояние инстанса.

        Returns:
            dict: Информация о состоянии инстанса
        """
        url = f"{self.base_url}/getStateInstance/{self.api_token}"

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Ошибка проверки состояния Green API инстанса: {e}")
            return {"error": str(e)}


def send_new_order_notification_whatsapp(order):
    """
    Отправить WhatsApp уведомление о новом заказе всем активным операторам.

    Args:
        order: Объект заказа (Order model)
    """
    from apps.notifications.models import NotificationSettings, WhatsAppOperator

    # Получаем настройки
    settings_obj = NotificationSettings.load()

    # Проверяем, включены ли WhatsApp уведомления
    if not settings_obj.enable_whatsapp_notifications:
        logger.info("WhatsApp уведомления отключены в настройках")
        return

    # Проверяем, нужно ли уведомлять о новых заказах
    if not settings_obj.notify_on_new_order:
        logger.info("Уведомления о новых заказах отключены")
        return

    # Получаем активных операторов
    operators = WhatsAppOperator.objects.filter(is_active=True)
    if not operators.exists():
        logger.warning("Нет активных WhatsApp операторов для отправки уведомлений")
        return

    # Создаем сервис WhatsApp
    whatsapp = WhatsAppService(
        instance_id=settings_obj.green_api_instance_id,
        api_token=settings_obj.green_api_token
    )

    # Формируем сообщение
    message = format_new_order_message(order)

    # Отправляем всем операторам
    phone_numbers = [op.get_formatted_phone() for op in operators]
    results = whatsapp.send_message_to_multiple(phone_numbers, message)

    logger.info(f"Отправлено {len(results)} WhatsApp уведомлений о заказе #{order.order_number}")
    return results


def format_new_order_message(order) -> str:
    """
    Форматировать сообщение о новом заказе для WhatsApp.

    Args:
        order: Объект заказа

    Returns:
        str: Отформатированное сообщение
    """
    # Формируем список товаров
    items_text = ""
    for item in order.items.all():
        items_text += f"• {item.product_name or item.product.name} x {item.quantity} = {item.subtotal} ₽\n"

    # Формируем полное сообщение
    message = f"""🔔 *НОВЫЙ ЗАКАЗ #{order.order_number}*

👤 *Клиент:* {order.customer_name}
📱 *Телефон:* {order.customer_phone}

🛒 *Товары:*
{items_text}
💰 *Итого:* {order.total_amount} ₽

📍 *Адрес доставки:*
{order.delivery_address}
"""

    if order.delivery_comment:
        message += f"\n📝 *Примечание к адресу:*\n{order.delivery_comment}\n"

    if order.comment:
        message += f"\n💬 *Комментарий:*\n{order.comment}\n"

    message += f"\n🔗 Перейти к заказу: http://localhost:5173/panel#orders"

    return message
