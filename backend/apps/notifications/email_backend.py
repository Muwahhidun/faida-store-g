"""
Кастомный email backend для интеграции с системой уведомлений.
Использует настройки каналов из админ-панели вместо settings.py
"""

import logging
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail import EmailMultiAlternatives
from .models import NotificationChannel, NotificationContact
from .services import EmailService

logger = logging.getLogger(__name__)


class NotificationEmailBackend(BaseEmailBackend):
    """
    Кастомный email backend, который использует настройки из админ-панели.
    """

    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self._email_service = None

    def _get_email_service(self):
        """
        Получить EmailService на основе настроек активного email канала.
        """
        if self._email_service is None:
            try:
                # Получаем первый активный email канал
                channel = NotificationChannel.objects.filter(
                    code='email',
                    is_active=True
                ).first()

                if not channel:
                    logger.error("Нет активного email канала в системе уведомлений")
                    return None

                logger.info(f"Используем email канал: {channel.name}")
                settings = channel.settings
                logger.info(f"Настройки SMTP: {settings.get('smtp_host')}:{settings.get('smtp_port')}")

                self._email_service = EmailService(
                    smtp_host=settings.get('smtp_host'),
                    smtp_port=int(settings.get('smtp_port', 465)),
                    smtp_username=settings.get('smtp_username'),
                    smtp_password=settings.get('smtp_password'),
                    from_email=settings.get('from_email'),
                    use_tls=settings.get('use_tls', True)
                )
            except Exception as e:
                logger.error(f"Ошибка инициализации EmailService: {e}")
                return None

        return self._email_service

    def send_messages(self, email_messages):
        """
        Отправить список email сообщений.
        """
        if not email_messages:
            logger.info("Нет сообщений для отправки")
            return 0

        logger.info(f"NotificationEmailBackend: получено {len(email_messages)} сообщений для отправки")

        email_service = self._get_email_service()
        if not email_service:
            logger.error("Email сервис не инициализирован")
            if not self.fail_silently:
                raise Exception("Email сервис не настроен")
            return 0

        num_sent = 0
        for message in email_messages:
            try:
                # Получаем получателей
                recipients = message.to
                logger.info(f"Отправка email: {message.subject} -> {recipients}")

                # Получаем тему и текст
                subject = message.subject
                body = message.body

                # Проверяем, есть ли HTML альтернатива
                html_message = None
                if hasattr(message, 'alternatives') and message.alternatives:
                    for content, mimetype in message.alternatives:
                        if mimetype == 'text/html':
                            html_message = content
                            break

                # Отправляем каждому получателю
                for recipient in recipients:
                    logger.info(f"Отправка на {recipient}...")
                    result = email_service.send_message(
                        to_email=recipient,
                        subject=subject,
                        message=body,
                        html_message=html_message
                    )

                    if 'error' not in result:
                        num_sent += 1
                        logger.info(f"✅ Email успешно отправлен на {recipient}")
                    else:
                        logger.error(f"❌ Ошибка отправки на {recipient}: {result['error']}")
                        if not self.fail_silently:
                            raise Exception(result['error'])

            except Exception as e:
                logger.error(f"Ошибка отправки email: {e}")
                if not self.fail_silently:
                    raise

        logger.info(f"Отправлено {num_sent} из {len(email_messages)} email")
        return num_sent
