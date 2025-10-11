"""
Центральный сервис для отправки уведомлений через гибкую систему.
Поддерживает multiple каналы (Email, WhatsApp, Telegram, etc.) и шаблоны.
"""

import logging
from typing import Dict, List, Optional, Any
from django.template import Context, Template
from django.core.mail import send_mail
from django.conf import settings

from .models import (
    NotificationType,
    NotificationChannel,
    NotificationRule,
    NotificationContact,
    NotificationTemplate,
    NotificationLog
)
from .services import WhatsAppService  # Сохраняем WhatsAppService

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Универсальный сервис для отправки уведомлений.

    Использование:
        service = NotificationService()
        service.send('new_order', context={
            'order_number': 'ORD-001',
            'customer_name': 'Иван',
            ...
        })
    """

    def send(self, notification_type_code: str, context: Dict[str, Any],
             recipient_email: Optional[str] = None, recipient_phone: Optional[str] = None) -> List[NotificationLog]:
        """
        Отправить уведомление по всем активным правилам.

        Args:
            notification_type_code: Код типа уведомления (например: 'new_order')
            context: Словарь с переменными для подстановки в шаблон
            recipient_email: Email клиента (опционально, для уведомлений клиентам)
            recipient_phone: Телефон клиента (опционально, для уведомлений клиентам)

        Returns:
            Список созданных логов уведомлений
        """
        logs = []

        try:
            # Получаем тип уведомления
            notification_type = NotificationType.objects.select_related('category').get(
                code=notification_type_code,
                is_enabled=True
            )
        except NotificationType.DoesNotExist:
            logger.error(f"Тип уведомления '{notification_type_code}' не найден или отключен")
            return logs

        # Получаем все активные правила для этого типа
        rules = NotificationRule.objects.filter(
            notification_type=notification_type,
            is_enabled=True,
            channel__is_active=True
        ).select_related('channel', 'notification_type').prefetch_related('contacts')

        if not rules.exists():
            logger.warning(f"Нет активных правил для уведомления '{notification_type_code}'")
            return logs

        # Для каждого правила отправляем уведомления
        for rule in rules:
            # Получаем шаблон для этого канала
            try:
                template = NotificationTemplate.objects.get(
                    notification_type=notification_type,
                    channel=rule.channel
                )
            except NotificationTemplate.DoesNotExist:
                logger.error(f"Шаблон для {notification_type_code} / {rule.channel.code} не найден")
                continue

            # Рендерим сообщение
            rendered_message = self._render_template(template.template, context)
            rendered_subject = self._render_template(template.subject, context) if template.subject else ''

            # Определяем список получателей
            recipients = []

            # Добавляем контакты из правила (для админов/менеджеров)
            for contact in rule.contacts.filter(is_active=True):
                recipients.append({
                    'contact': contact,
                    'value': contact.get_formatted_value(),
                    'recipient_value': None
                })

            # Добавляем клиента если указан
            if rule.channel.code == 'email' and recipient_email:
                recipients.append({
                    'contact': None,
                    'value': recipient_email,
                    'recipient_value': recipient_email
                })
            elif rule.channel.code == 'whatsapp' and recipient_phone:
                recipients.append({
                    'contact': None,
                    'value': recipient_phone,
                    'recipient_value': recipient_phone
                })

            # Дедупликация - убираем дубликаты по значению
            unique_recipients = {}
            for recipient in recipients:
                unique_recipients[recipient['value']] = recipient
            recipients = list(unique_recipients.values())

            # Отправляем каждому получателю
            for recipient in recipients:
                log = self._send_to_recipient(
                    channel=rule.channel,
                    notification_type=notification_type,
                    contact=recipient['contact'],
                    recipient_value=recipient['recipient_value'],
                    message=rendered_message,
                    subject=rendered_subject
                )
                logs.append(log)

        logger.info(f"Отправлено {len(logs)} уведомлений типа '{notification_type_code}'")
        return logs

    def _render_template(self, template_str: str, context: Dict[str, Any]) -> str:
        """
        Рендерит шаблон с подстановкой переменных.

        Args:
            template_str: Строка шаблона с переменными вида {{variable}}
            context: Словарь переменных

        Returns:
            Отрендеренная строка
        """
        if not template_str:
            return ''

        try:
            template = Template(template_str)
            return template.render(Context(context))
        except Exception as e:
            logger.error(f"Ошибка рендеринга шаблона: {e}")
            return template_str

    def _send_to_recipient(self, channel: NotificationChannel, notification_type: NotificationType,
                          contact: Optional[NotificationContact], recipient_value: Optional[str],
                          message: str, subject: str = '') -> NotificationLog:
        """
        Отправляет уведомление одному получателю.

        Args:
            channel: Канал отправки
            notification_type: Тип уведомления
            contact: Контакт (для админов/менеджеров) или None (для клиентов)
            recipient_value: Значение получателя (email или телефон клиента) или None
            message: Текст сообщения
            subject: Тема (для email)

        Returns:
            Лог уведомления
        """
        # Создаем лог
        log = NotificationLog.objects.create(
            notification_type=notification_type,
            channel=channel,
            contact=contact,
            recipient_value=recipient_value or '',
            status='pending',
            message=message
        )

        try:
            # Отправляем в зависимости от канала
            if channel.code == 'email':
                self._send_email(
                    to_email=contact.value if contact else recipient_value,
                    subject=subject,
                    message=message
                )
            elif channel.code == 'whatsapp':
                self._send_whatsapp(
                    phone=contact.get_formatted_value() if contact else recipient_value,
                    message=message,
                    channel_settings=channel.settings
                )
            else:
                raise NotImplementedError(f"Канал '{channel.code}' пока не поддерживается")

            # Помечаем как успешно отправленное
            log.mark_as_sent()

        except Exception as e:
            error_message = str(e)
            logger.error(f"Ошибка отправки {channel.code} уведомления: {error_message}")
            log.mark_as_failed(error_message, schedule_retry=True)

        return log

    def _send_email(self, to_email: str, subject: str, message: str):
        """Отправка Email."""
        from_email = settings.DEFAULT_FROM_EMAIL
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[to_email],
            fail_silently=False
        )
        logger.info(f"Email отправлен на {to_email}")

    def _send_whatsapp(self, phone: str, message: str, channel_settings: Dict):
        """Отправка WhatsApp через Green API."""
        instance_id = channel_settings.get('instance_id')
        api_token = channel_settings.get('api_token')

        if not instance_id or not api_token:
            raise ValueError("WhatsApp канал не настроен (нет instance_id или api_token)")

        whatsapp = WhatsAppService(instance_id=instance_id, api_token=api_token)
        result = whatsapp.send_message(phone_number=phone, message=message)

        if 'error' in result:
            raise Exception(result['error'])

        logger.info(f"WhatsApp отправлен на {phone}")

    def retry_failed_notifications(self):
        """
        Повторная отправка неудачных уведомлений.
        Вызывается периодически (например, через Celery или cron).
        """
        from django.utils import timezone

        # Находим уведомления готовые к повторной отправке
        failed_logs = NotificationLog.objects.filter(
            status='retrying',
            next_retry_at__lte=timezone.now()
        ).select_related('channel', 'notification_type', 'contact')

        logger.info(f"Найдено {failed_logs.count()} уведомлений для повторной отправки")

        for log in failed_logs:
            try:
                # Пробуем отправить снова
                if log.channel.code == 'email':
                    recipient = log.contact.value if log.contact else log.recipient_value
                    # Извлекаем subject из сообщения (если есть)
                    self._send_email(to_email=recipient, subject='', message=log.message)

                elif log.channel.code == 'whatsapp':
                    phone = log.contact.get_formatted_value() if log.contact else log.recipient_value
                    self._send_whatsapp(
                        phone=phone,
                        message=log.message,
                        channel_settings=log.channel.settings
                    )

                # Успешно отправлено
                log.mark_as_sent()
                logger.info(f"Успешно повторно отправлено уведомление #{log.id}")

            except Exception as e:
                # Снова ошибка - планируем следующую попытку
                error_message = str(e)
                logger.error(f"Повторная отправка уведомления #{log.id} провалилась: {error_message}")
                log.mark_as_failed(error_message, schedule_retry=True)


# Вспомогательная функция для быстрой отправки (совместимость со старым кодом)
def send_notification(notification_type_code: str, context: Dict[str, Any],
                     recipient_email: Optional[str] = None, recipient_phone: Optional[str] = None):
    """
    Быстрая функция для отправки уведомления.

    Args:
        notification_type_code: Код типа уведомления
        context: Контекст с переменными
        recipient_email: Email клиента (опционально)
        recipient_phone: Телефон клиента (опционально)
    """
    service = NotificationService()
    return service.send(
        notification_type_code=notification_type_code,
        context=context,
        recipient_email=recipient_email,
        recipient_phone=recipient_phone
    )
