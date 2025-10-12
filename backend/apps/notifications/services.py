"""
Сервисы для отправки уведомлений.
"""

import requests
import logging
from typing import List, Optional
from django.conf import settings
from django.core.mail import EmailMessage
from django.core.mail.backends.smtp import EmailBackend

logger = logging.getLogger(__name__)


class EmailService:
    """
    Сервис для отправки Email через SMTP с настраиваемыми параметрами.
    """

    def __init__(self, smtp_host: str, smtp_port: int, smtp_username: str,
                 smtp_password: str, from_email: str, use_tls: bool = True):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_username = smtp_username
        self.smtp_password = smtp_password
        self.from_email = from_email
        self.use_tls = use_tls
        self.use_ssl = smtp_port == 465  # SSL для порта 465

    def _get_friendly_error_message(self, error: Exception) -> str:
        """
        Преобразовать техническую ошибку SMTP в понятное сообщение.
        """
        error_str = str(error).lower()

        # SMTP коды ошибок и их расшифровка
        if '535' in error_str or 'authentication failed' in error_str:
            return "Ошибка аутентификации (535): Неверный логин или пароль. Для Mail.ru используйте 'Пароль для внешних приложений' (https://account.mail.ru/user/2-step-auth/passwords/)"

        elif '534' in error_str:
            return "Ошибка аутентификации (534): Требуется двухфакторная аутентификация. Создайте пароль для внешних приложений."

        elif '550' in error_str:
            return "Ошибка получателя (550): Email адрес не существует или заблокирован."

        elif '553' in error_str:
            return "Ошибка адреса (553): Неверный формат email адреса."

        elif '421' in error_str:
            return "Сервер недоступен (421): SMTP сервер временно не отвечает. Попробуйте позже."

        elif '554' in error_str:
            return "Транзакция отклонена (554): Сервер отклонил отправку. Проверьте настройки или репутацию домена."

        elif 'connection refused' in error_str:
            return "Соединение отклонено: Неверный хост или порт SMTP. Проверьте настройки."

        elif 'timed out' in error_str or 'timeout' in error_str:
            return "Таймаут соединения: Сервер не отвечает. Проверьте хост, порт и настройки TLS/SSL."

        elif 'ssl' in error_str or 'certificate' in error_str:
            return "Ошибка SSL/TLS: Проблема с сертификатом или настройками шифрования. Для порта 465 используйте SSL, для 587 - TLS."

        elif 'ascii' in error_str:
            return "Ошибка кодировки: Проверьте корректность введённых данных (возможно, лишние символы в пароле или username)."

        else:
            # Возвращаем оригинальную ошибку, если не распознали
            return f"Ошибка подключения: {error}"

    def send_message(self, to_email: str, subject: str, message: str, html_message: str = None) -> dict:
        """
        Отправить email сообщение.

        Args:
            to_email: Email получателя
            subject: Тема письма
            message: Текстовое содержимое
            html_message: HTML содержимое (опционально)

        Returns:
            dict: Результат отправки
        """
        try:
            # Создаём кастомный email backend с настройками из канала
            backend = EmailBackend(
                host=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_username,
                password=self.smtp_password,
                use_tls=self.use_tls and not self.use_ssl,
                use_ssl=self.use_ssl,
                fail_silently=False
            )

            # Создаём email сообщение
            email = EmailMessage(
                subject=subject,
                body=html_message if html_message else message,
                from_email=self.from_email,
                to=[to_email],
                connection=backend
            )

            if html_message:
                email.content_subtype = 'html'

            # Отправляем
            email.send()

            logger.info(f"Email отправлен на {to_email}")
            return {'success': True}

        except Exception as e:
            logger.error(f"Ошибка отправки Email на {to_email}: {e}")
            return {'error': str(e)}

    def test_connection(self) -> dict:
        """
        Проверить соединение с SMTP сервером.

        Returns:
            dict: Результат проверки
        """
        try:
            backend = EmailBackend(
                host=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_username,
                password=self.smtp_password,
                use_tls=self.use_tls and not self.use_ssl,
                use_ssl=self.use_ssl,
                fail_silently=False
            )
            backend.open()
            backend.close()

            logger.info(f"Uspeshnoe podklyuchenie k {self.smtp_host}:{self.smtp_port}")
            return {'success': True}

        except Exception as e:
            friendly_error = self._get_friendly_error_message(e)
            logger.error(f"Connection error to {self.smtp_host}:{self.smtp_port}: {e}")
            return {'error': friendly_error}


class TelegramService:
    """
    Сервис для отправки сообщений через Telegram Bot API.
    """

    def __init__(self, bot_token: str):
        self.bot_token = bot_token
        self.base_url = f"https://api.telegram.org/bot{bot_token}"

    def send_message(self, chat_id: str, message: str) -> dict:
        """
        Отправить текстовое сообщение в Telegram.

        Args:
            chat_id: ID чата (может быть username с @ или числовой ID)
            message: Текст сообщения

        Returns:
            dict: Ответ от API
        """
        url = f"{self.base_url}/sendMessage"

        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "HTML"  # Поддержка HTML форматирования
        }

        try:
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            result = response.json()

            if result.get('ok'):
                logger.info(f"Telegram сообщение отправлено в чат {chat_id}")
                return result
            else:
                error_msg = result.get('description', 'Unknown error')
                logger.error(f"Ошибка отправки Telegram сообщения в чат {chat_id}: {error_msg}")
                return {"error": error_msg}

        except requests.exceptions.RequestException as e:
            logger.error(f"Ошибка отправки Telegram сообщения в чат {chat_id}: {e}")
            return {"error": str(e)}

    def get_bot_info(self) -> dict:
        """
        Получить информацию о боте.

        Returns:
            dict: Информация о боте
        """
        url = f"{self.base_url}/getMe"

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            result = response.json()

            if result.get('ok'):
                return result.get('result', {})
            else:
                return {"error": result.get('description', 'Unknown error')}

        except requests.exceptions.RequestException as e:
            logger.error(f"Ошибка получения информации о Telegram боте: {e}")
            return {"error": str(e)}


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


class NotificationDispatcher:
    """
    Главный сервис для автоматической отправки уведомлений по правилам.
    """

    @staticmethod
    def send_notification(notification_type_code: str, context: dict):
        """
        Отправить уведомление по типу события.

        Args:
            notification_type_code: Код типа уведомления (user_registered, order_status_changed и т.д.)
            context: Контекстные данные для подстановки в шаблон (user, order и т.д.)
        """
        from .models import NotificationType, NotificationRule, NotificationLog

        try:
            # Находим тип уведомления
            notification_type = NotificationType.objects.filter(
                code=notification_type_code,
                is_enabled=True
            ).first()

            if not notification_type:
                logger.warning(f"Тип уведомления '{notification_type_code}' не найден или отключен")
                return

            # Находим все активные правила для этого типа
            rules = NotificationRule.objects.filter(
                notification_type=notification_type,
                is_enabled=True
            ).select_related('channel', 'default_template').prefetch_related('contacts')

            if not rules.exists():
                logger.info(f"Нет активных правил для типа уведомления '{notification_type_code}'")
                return

            # Для каждого правила отправляем уведомления
            for rule in rules:
                # Проверяем что канал активен
                if not rule.channel.is_active:
                    logger.warning(f"Канал '{rule.channel.name}' отключен, пропускаем")
                    continue

                # Определяем шаблон для использования
                template = rule.default_template
                if not template:
                    # Ищем стандартный шаблон
                    from .models import NotificationTemplate
                    template = NotificationTemplate.objects.filter(
                        notification_type=notification_type,
                        channel_type=rule.channel.code,
                        is_default=True
                    ).first()

                if not template:
                    logger.error(f"Не найден шаблон для правила '{rule.name}'")
                    continue

                # Рендерим шаблон с контекстом
                message = NotificationDispatcher._render_template(template.template, context)
                subject = NotificationDispatcher._render_template(template.subject, context) if template.subject else notification_type.name

                # Проверяем тип правила
                if rule.rule_type == 'system':
                    # Системное правило - отправить самому пользователю
                    user_email = context.get('email')
                    if not user_email:
                        logger.warning(f"Нет email в контексте для системного правила '{rule.name}'")
                        continue

                    try:
                        result = NotificationDispatcher._send_to_email(
                            channel=rule.channel,
                            email=user_email,
                            subject=subject,
                            message=message
                        )

                        # Логируем результат
                        NotificationLog.objects.create(
                            notification_type=notification_type,
                            channel=rule.channel,
                            contact=None,  # Для системных уведомлений contact отсутствует
                            recipient_value=user_email,
                            message=message,
                            status='sent' if result.get('success') else 'failed',
                            error_message=result.get('error')
                        )

                        if result.get('success'):
                            logger.info(f"Системное уведомление отправлено на {user_email} ({rule.channel.name})")
                        else:
                            logger.error(f"Ошибка отправки на {user_email}: {result.get('error')}")

                    except Exception as e:
                        logger.error(f"Ошибка отправки на {user_email}: {e}")
                        NotificationLog.objects.create(
                            notification_type=notification_type,
                            channel=rule.channel,
                            contact=None,
                            recipient_value=user_email,
                            message=message,
                            status='failed',
                            error_message=str(e)
                        )

                else:
                    # Дополнительное правило - отправить контактам из списка
                    # Получаем активные контакты
                    contacts = rule.contacts.filter(is_active=True)
                    if not contacts.exists():
                        logger.warning(f"Нет активных контактов для правила '{rule.name}'")
                        continue

                    # Отправляем каждому контакту
                    for contact in contacts:
                        try:
                            result = NotificationDispatcher._send_to_contact(
                                channel=rule.channel,
                                contact=contact,
                                subject=subject,
                                message=message
                            )

                            # Логируем результат
                            NotificationLog.objects.create(
                                notification_type=notification_type,
                                channel=rule.channel,
                                contact=contact,
                                recipient_value=contact.value,
                                message=message,
                                status='sent' if result.get('success') else 'failed',
                                error_message=result.get('error')
                            )

                            if result.get('success'):
                                logger.info(f"Уведомление отправлено: {contact.name} ({rule.channel.name})")
                            else:
                                logger.error(f"Ошибка отправки {contact.name}: {result.get('error')}")

                        except Exception as e:
                            logger.error(f"Ошибка отправки контакту {contact.name}: {e}")
                            NotificationLog.objects.create(
                                notification_type=notification_type,
                                channel=rule.channel,
                                contact=contact,
                                recipient_value=contact.value,
                                message=message,
                                status='failed',
                                error_message=str(e)
                            )

        except Exception as e:
            logger.error(f"Критическая ошибка в NotificationDispatcher: {e}")

    @staticmethod
    def _render_template(template_text: str, context: dict) -> str:
        """
        Рендерить шаблон с подстановкой переменных.

        Args:
            template_text: Текст шаблона с переменными {{variable}}
            context: Словарь с данными для подстановки

        Returns:
            str: Отрендеренный текст
        """
        result = template_text
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            result = result.replace(placeholder, str(value))
        return result

    @staticmethod
    def _send_to_email(channel, email: str, subject: str, message: str) -> dict:
        """
        Отправить email напрямую по адресу (для системных уведомлений).

        Args:
            channel: Объект NotificationChannel (должен быть email канал)
            email: Email адрес получателя
            subject: Тема сообщения
            message: Текст сообщения

        Returns:
            dict: Результат отправки
        """
        try:
            if channel.code != 'email':
                return {'error': f'Системные уведомления поддерживают только email канал, получен: {channel.code}'}

            settings = channel.settings
            email_service = EmailService(
                smtp_host=settings.get('smtp_host'),
                smtp_port=settings.get('smtp_port'),
                smtp_username=settings.get('smtp_username'),
                smtp_password=settings.get('smtp_password'),
                from_email=settings.get('from_email'),
                use_tls=settings.get('use_tls', True)
            )
            return email_service.send_message(
                to_email=email,
                subject=subject,
                message=message,
                html_message=message  # Предполагаем что шаблон может содержать HTML
            )

        except Exception as e:
            logger.error(f"Ошибка отправки email на {email}: {e}")
            return {'error': str(e)}

    @staticmethod
    def _send_to_contact(channel, contact, subject: str, message: str) -> dict:
        """
        Отправить сообщение через конкретный канал контакту.

        Args:
            channel: Объект NotificationChannel
            contact: Объект NotificationContact
            subject: Тема сообщения (для email)
            message: Текст сообщения

        Returns:
            dict: Результат отправки
        """
        try:
            if channel.code == 'email':
                settings = channel.settings
                email_service = EmailService(
                    smtp_host=settings.get('smtp_host'),
                    smtp_port=settings.get('smtp_port'),
                    smtp_username=settings.get('smtp_username'),
                    smtp_password=settings.get('smtp_password'),
                    from_email=settings.get('from_email'),
                    use_tls=settings.get('use_tls', True)
                )
                return email_service.send_message(
                    to_email=contact.value,
                    subject=subject,
                    message=message,
                    html_message=message  # Предполагаем что шаблон может содержать HTML
                )

            elif channel.code == 'whatsapp':
                settings = channel.settings
                whatsapp_service = WhatsAppService(
                    instance_id=settings.get('instance_id'),
                    api_token=settings.get('api_token')
                )
                return whatsapp_service.send_message(
                    phone_number=contact.value,
                    message=message
                )

            elif channel.code == 'telegram':
                settings = channel.settings
                telegram_service = TelegramService(
                    bot_token=settings.get('bot_token')
                )
                return telegram_service.send_message(
                    chat_id=contact.value,
                    message=message
                )

            else:
                return {'error': f'Неподдерживаемый тип канала: {channel.code}'}

        except Exception as e:
            logger.error(f"Ошибка отправки через {channel.code}: {e}")
            return {'error': str(e)}
