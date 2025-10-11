"""
Команда для инициализации начальных данных системы уведомлений.
"""

from django.core.management.base import BaseCommand
from apps.notifications.models import (
    NotificationCategory,
    NotificationChannel,
    NotificationType,
    NotificationTemplate,
    NotificationContact,
    NotificationRule
)


class Command(BaseCommand):
    help = 'Инициализация начальных данных для гибкой системы уведомлений'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Создание начальных данных для системы уведомлений...'))

        # 1. Категории
        category_orders, _ = NotificationCategory.objects.get_or_create(
            code='orders',
            defaults={
                'name': 'Заказы',
                'description': 'Уведомления связанные с заказами клиентов',
                'order': 1,
                'is_active': True
            }
        )

        category_system, _ = NotificationCategory.objects.get_or_create(
            code='system',
            defaults={
                'name': 'Системные',
                'description': 'Системные уведомления и оповещения',
                'order': 2,
                'is_active': True
            }
        )

        self.stdout.write('✓ Категории созданы')

        # 2. Каналы
        channel_email, _ = NotificationChannel.objects.get_or_create(
            code='email',
            defaults={
                'name': 'Email',
                'icon': 'FaEnvelope',
                'is_active': True,
                'settings': {}
            }
        )

        channel_whatsapp, _ = NotificationChannel.objects.get_or_create(
            code='whatsapp',
            defaults={
                'name': 'WhatsApp',
                'icon': 'FaWhatsapp',
                'is_active': True,
                'settings': {
                    'instance_id': '1103108965',
                    'api_token': '9a71dc1a5a274923967ab1cfe7dd56a976097823e41447eea1'
                }
            }
        )

        self.stdout.write('✓ Каналы созданы')

        # 3. Типы уведомлений
        type_new_order, _ = NotificationType.objects.get_or_create(
            code='new_order',
            defaults={
                'category': category_orders,
                'name': 'Новый заказ',
                'description': 'Уведомление при создании нового заказа',
                'is_enabled': True,
                'order': 1
            }
        )

        type_status_changed, _ = NotificationType.objects.get_or_create(
            code='order_status_changed',
            defaults={
                'category': category_orders,
                'name': 'Смена статуса заказа',
                'description': 'Уведомление при изменении статуса заказа',
                'is_enabled': True,
                'order': 2
            }
        )

        self.stdout.write('✓ Типы уведомлений созданы')

        # 4. Шаблоны
        # Email шаблон для нового заказа
        NotificationTemplate.objects.get_or_create(
            notification_type=type_new_order,
            channel=channel_email,
            defaults={
                'subject': 'Новый заказ №{{order_number}}',
                'template': '''Здравствуйте!

Получен новый заказ №{{order_number}}

Клиент: {{customer_name}}
Телефон: {{customer_phone}}
Сумма: {{total_amount}} ₽

Товары:
{{items_list}}

Адрес доставки:
{{delivery_address}}

{% if delivery_comment %}Примечание к адресу: {{delivery_comment}}{% endif %}

{% if comment %}Комментарий к заказу: {{comment}}{% endif %}''',
                'variables_help': {
                    'order_number': 'Номер заказа',
                    'customer_name': 'Имя клиента',
                    'customer_phone': 'Телефон клиента',
                    'total_amount': 'Сумма заказа',
                    'items_list': 'Список товаров',
                    'delivery_address': 'Адрес доставки',
                    'delivery_comment': 'Примечание к адресу (код домофона и т.д.)',
                    'comment': 'Комментарий к заказу'
                }
            }
        )

        # WhatsApp шаблон для нового заказа
        NotificationTemplate.objects.get_or_create(
            notification_type=type_new_order,
            channel=channel_whatsapp,
            defaults={
                'subject': '',
                'template': '''🔔 *НОВЫЙ ЗАКАЗ №{{order_number}}*

👤 *Клиент:* {{customer_name}}
📱 *Телефон:* {{customer_phone}}
💰 *Сумма:* {{total_amount}} ₽

🛒 *Товары:*
{{items_list}}

📍 *Адрес доставки:*
{{delivery_address}}

{% if delivery_comment %}📝 *Примечание к адресу:* {{delivery_comment}}

{% endif %}{% if comment %}💬 *Комментарий:* {{comment}}

{% endif %}🔗 Перейти к заказу: http://localhost:5173/panel#orders''',
                'variables_help': {
                    'order_number': 'Номер заказа',
                    'customer_name': 'Имя клиента',
                    'customer_phone': 'Телефон клиента',
                    'total_amount': 'Сумма заказа',
                    'items_list': 'Список товаров',
                    'delivery_address': 'Адрес доставки',
                    'delivery_comment': 'Примечание к адресу (код домофона и т.д.)',
                    'comment': 'Комментарий к заказу'
                }
            }
        )

        # Email шаблон для смены статуса
        NotificationTemplate.objects.get_or_create(
            notification_type=type_status_changed,
            channel=channel_email,
            defaults={
                'subject': 'Заказ №{{order_number}} - Статус изменен',
                'template': '''Здравствуйте, {{customer_name}}!

Статус вашего заказа №{{order_number}} изменен на: {{status_display}}

{% if status == 'confirmed' %}Ваш заказ подтвержден и принят в работу.{% endif %}
{% if status == 'processing' %}Ваш заказ находится в обработке.{% endif %}
{% if status == 'shipping' %}Ваш заказ отправлен! Ожидайте доставку.{% endif %}
{% if status == 'delivered' %}Ваш заказ доставлен. Спасибо за покупку!{% endif %}
{% if status == 'cancelled' %}Ваш заказ отменен.{% endif %}

С уважением,
Faida Group Store''',
                'variables_help': {
                    'order_number': 'Номер заказа',
                    'customer_name': 'Имя клиента',
                    'status': 'Код статуса (confirmed, processing, shipping, delivered, cancelled)',
                    'status_display': 'Статус на русском'
                }
            }
        )

        # WhatsApp шаблон для смены статуса
        NotificationTemplate.objects.get_or_create(
            notification_type=type_status_changed,
            channel=channel_whatsapp,
            defaults={
                'subject': '',
                'template': '''📦 *Заказ №{{order_number}}*

👤 {{customer_name}}

✅ *Статус изменен:* {{status_display}}

{% if status == 'confirmed' %}✨ Ваш заказ подтвержден!{% endif %}
{% if status == 'processing' %}⏳ Заказ в обработке{% endif %}
{% if status == 'shipping' %}🚚 Заказ отправлен!{% endif %}
{% if status == 'delivered' %}🎉 Заказ доставлен!{% endif %}
{% if status == 'cancelled' %}❌ Заказ отменен{% endif %}''',
                'variables_help': {
                    'order_number': 'Номер заказа',
                    'customer_name': 'Имя клиента',
                    'status': 'Код статуса',
                    'status_display': 'Статус на русском'
                }
            }
        )

        self.stdout.write('✓ Шаблоны созданы')

        # 5. Контакты
        contact_admin, _ = NotificationContact.objects.get_or_create(
            channel=channel_email,
            value='admin@faida.ru',
            defaults={
                'name': 'Администратор',
                'is_active': True
            }
        )

        contact_whatsapp, _ = NotificationContact.objects.get_or_create(
            channel=channel_whatsapp,
            value='+79285575774',
            defaults={
                'name': 'Менеджер WhatsApp',
                'is_active': True
            }
        )

        self.stdout.write('✓ Контакты созданы')

        # 6. Правила
        # Новый заказ -> Email админу
        rule1, _ = NotificationRule.objects.get_or_create(
            notification_type=type_new_order,
            channel=channel_email,
            defaults={'is_enabled': True}
        )
        rule1.contacts.add(contact_admin)

        # Новый заказ -> WhatsApp менеджеру
        rule2, _ = NotificationRule.objects.get_or_create(
            notification_type=type_new_order,
            channel=channel_whatsapp,
            defaults={'is_enabled': True}
        )
        rule2.contacts.add(contact_whatsapp)

        # Смена статуса -> Email клиенту (контакты пустые, заполнятся динамически)
        NotificationRule.objects.get_or_create(
            notification_type=type_status_changed,
            channel=channel_email,
            defaults={'is_enabled': True}
        )

        # Смена статуса -> WhatsApp клиенту (контакты пустые, заполнятся динамически)
        NotificationRule.objects.get_or_create(
            notification_type=type_status_changed,
            channel=channel_whatsapp,
            defaults={'is_enabled': True}
        )

        self.stdout.write('✓ Правила созданы')

        self.stdout.write(self.style.SUCCESS('\n✅ Инициализация завершена успешно!'))
        self.stdout.write(self.style.SUCCESS('\nТеперь вы можете:'))
        self.stdout.write('1. Зайти в админку: http://localhost:8000/admin/')
        self.stdout.write('2. Настроить дополнительные контакты')
        self.stdout.write('3. Редактировать шаблоны')
        self.stdout.write('4. Добавить новые типы уведомлений\n')
