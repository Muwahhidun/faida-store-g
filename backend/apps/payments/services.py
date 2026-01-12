"""
Сервис для работы с YooKassa API.
"""

import logging
import uuid
from decimal import Decimal
from django.conf import settings
from django.utils import timezone

from yookassa import Configuration, Payment as YooPayment, Refund as YooRefund

from .models import Payment, PaymentSettings, Refund

logger = logging.getLogger(__name__)


class YooKassaService:
    """
    Сервис для создания и обработки платежей через YooKassa.
    """

    def __init__(self):
        """Инициализация конфигурации YooKassa из БД или переменных окружения."""
        creds = PaymentSettings.get_credentials()
        Configuration.account_id = creds['shop_id']
        Configuration.secret_key = creds['secret_key']

    @staticmethod
    def is_available() -> bool:
        """Проверяет, доступна ли платёжная система."""
        return PaymentSettings.is_configured()

    def create_payment(self, order, return_url: str) -> dict:
        """
        Создать платёж в YooKassa и вернуть URL для оплаты.

        Args:
            order: Объект заказа
            return_url: URL для возврата после оплаты

        Returns:
            dict с payment_id и confirmation_url
        """
        if not self.is_available():
            raise ValueError("Платёжная система не настроена")

        try:
            # Создаём уникальный ключ идемпотентности
            idempotence_key = str(uuid.uuid4())

            # Создаём платёж в YooKassa
            yoo_payment = YooPayment.create({
                "amount": {
                    "value": str(order.total_amount),
                    "currency": "RUB"
                },
                "confirmation": {
                    "type": "redirect",
                    "return_url": return_url
                },
                "capture": True,  # Автоматическое подтверждение платежа
                "description": f"Заказ №{order.order_number} в магазине Faida Group",
                "metadata": {
                    "order_id": str(order.id),
                    "order_number": order.order_number
                },
                "receipt": {
                    "customer": {
                        "email": order.customer_email or (order.user.email if order.user else None),
                        "phone": order.customer_phone
                    },
                    "items": self._build_receipt_items(order)
                }
            }, idempotence_key)

            logger.info(f"Создан платёж YooKassa: {yoo_payment.id} для заказа {order.order_number}")

            # Сохраняем платёж в БД
            payment = Payment.objects.create(
                order=order,
                yookassa_id=yoo_payment.id,
                status='pending',
                amount=order.total_amount,
                confirmation_url=yoo_payment.confirmation.confirmation_url
            )

            return {
                'payment_id': yoo_payment.id,
                'confirmation_url': yoo_payment.confirmation.confirmation_url,
                'status': yoo_payment.status
            }

        except Exception as e:
            logger.error(f"Ошибка создания платежа YooKassa для заказа {order.order_number}: {e}")
            raise

    def _build_receipt_items(self, order) -> list:
        """
        Формирует список товаров для чека (54-ФЗ).
        """
        items = []
        for item in order.items.all():
            items.append({
                "description": item.product.name[:128],  # Максимум 128 символов
                "quantity": str(item.quantity),
                "amount": {
                    "value": str(item.price),
                    "currency": "RUB"
                },
                "vat_code": 1,  # НДС не облагается (для упрощённой системы)
                "payment_subject": "commodity",
                "payment_mode": "full_payment"
            })
        return items

    def process_webhook(self, data: dict) -> bool:
        """
        Обработать webhook от YooKassa.

        Args:
            data: Данные webhook запроса

        Returns:
            True если обработка успешна
        """
        try:
            from yookassa.domain.notification import WebhookNotification
            notification = WebhookNotification(data)

            # Определяем тип события
            event_type = notification.event

            # Обработка событий платежа
            if event_type.startswith('payment.'):
                return self._process_payment_webhook(notification)

            # Обработка событий возврата
            elif event_type.startswith('refund.'):
                return self._process_refund_webhook(notification)

            logger.warning(f"Неизвестный тип события webhook: {event_type}")
            return True

        except Exception as e:
            logger.error(f"Ошибка обработки webhook YooKassa: {e}")
            return False

    def _process_payment_webhook(self, notification) -> bool:
        """Обрабатывает webhook событие платежа."""
        payment_data = notification.object

        logger.info(f"Получен webhook YooKassa: {notification.event} для платежа {payment_data.id}")

        # Находим платёж в БД
        try:
            payment = Payment.objects.get(yookassa_id=payment_data.id)
        except Payment.DoesNotExist:
            logger.error(f"Платёж {payment_data.id} не найден в БД")
            return False

        # Обновляем статус платежа
        old_status = payment.status
        payment.status = payment_data.status

        if payment_data.payment_method:
            payment.payment_method_type = payment_data.payment_method.type

        # Если платёж успешен
        if payment_data.status == 'succeeded' and payment_data.paid:
            payment.paid = True
            payment.paid_at = timezone.now()

            # Обновляем статус заказа на "confirmed"
            order = payment.order
            order.status = 'confirmed'
            order.save(update_fields=['status'])

            logger.info(f"Заказ {order.order_number} подтверждён после оплаты")

            # Отправляем уведомление
            self._send_payment_notification(order, payment)

        # Если платёж отменён
        elif payment_data.status == 'canceled':
            payment.paid = False
            logger.info(f"Платёж {payment_data.id} отменён")

        payment.save()

        logger.info(f"Платёж {payment_data.id} обновлён: {old_status} -> {payment.status}")
        return True

    def _process_refund_webhook(self, notification) -> bool:
        """Обрабатывает webhook событие возврата."""
        refund_data = notification.object

        logger.info(f"Получен webhook YooKassa: {notification.event} для возврата {refund_data.id}")

        # Находим возврат в БД
        try:
            refund = Refund.objects.get(yookassa_id=refund_data.id)
        except Refund.DoesNotExist:
            logger.error(f"Возврат {refund_data.id} не найден в БД")
            return False

        # Обновляем статус возврата
        old_status = refund.status
        refund.status = refund_data.status
        refund.save()

        logger.info(f"Возврат {refund_data.id} обновлён: {old_status} -> {refund.status}")
        return True

    def _send_payment_notification(self, order, payment):
        """Отправляет уведомление об успешной оплате."""
        try:
            from apps.notifications.services import NotificationDispatcher
            from apps.core.models import SiteSettings

            context = {
                'order_number': order.order_number,
                'customer_name': order.customer_name,
                'customer_phone': order.customer_phone,
                'email': order.customer_email or (order.user.email if order.user else None),
                'total_amount': f"{order.total_amount} ₽",
                'payment_method': 'Онлайн оплата',
                'site_url': SiteSettings.get_effective_site_url(),
            }

            # Можно добавить отдельный тип уведомления payment_success
            # Пока используем изменение статуса заказа (уже отправляется через signal)

        except Exception as e:
            logger.error(f"Ошибка отправки уведомления об оплате: {e}")

    def get_payment_info(self, payment_id: str) -> dict:
        """
        Получить информацию о платеже из YooKassa.
        """
        try:
            yoo_payment = YooPayment.find_one(payment_id)
            return {
                'id': yoo_payment.id,
                'status': yoo_payment.status,
                'paid': yoo_payment.paid,
                'amount': yoo_payment.amount.value,
                'payment_method': yoo_payment.payment_method.type if yoo_payment.payment_method else None
            }
        except Exception as e:
            logger.error(f"Ошибка получения информации о платеже {payment_id}: {e}")
            raise

    def create_refund(self, payment: Payment, amount: Decimal, reason: str = '', user=None) -> dict:
        """
        Создать возврат платежа.

        Args:
            payment: Объект платежа
            amount: Сумма возврата
            reason: Причина возврата
            user: Пользователь, инициировавший возврат

        Returns:
            dict с информацией о возврате
        """
        if not payment.paid:
            raise ValueError("Невозможно сделать возврат для неоплаченного заказа")

        available = payment.available_for_refund
        if amount > available:
            raise ValueError(f"Сумма возврата ({amount}) превышает доступную ({available})")

        if amount <= 0:
            raise ValueError("Сумма возврата должна быть больше 0")

        try:
            # Создаём уникальный ключ идемпотентности
            idempotence_key = str(uuid.uuid4())

            # Создаём возврат в YooKassa
            yoo_refund = YooRefund.create({
                "payment_id": payment.yookassa_id,
                "amount": {
                    "value": str(amount),
                    "currency": "RUB"
                },
                "description": reason or f"Возврат по заказу №{payment.order.order_number}"
            }, idempotence_key)

            logger.info(f"Создан возврат YooKassa: {yoo_refund.id} на сумму {amount} ₽")

            # Сохраняем возврат в БД
            refund = Refund.objects.create(
                payment=payment,
                yookassa_id=yoo_refund.id,
                amount=amount,
                status=yoo_refund.status,
                reason=reason,
                created_by=user
            )

            return {
                'refund_id': yoo_refund.id,
                'status': yoo_refund.status,
                'amount': str(amount)
            }

        except Exception as e:
            logger.error(f"Ошибка создания возврата для платежа {payment.yookassa_id}: {e}")
            raise

    def get_refund_info(self, refund_id: str) -> dict:
        """
        Получить информацию о возврате из YooKassa.
        """
        try:
            yoo_refund = YooRefund.find_one(refund_id)
            return {
                'id': yoo_refund.id,
                'status': yoo_refund.status,
                'amount': yoo_refund.amount.value,
                'payment_id': yoo_refund.payment_id
            }
        except Exception as e:
            logger.error(f"Ошибка получения информации о возврате {refund_id}: {e}")
            raise
