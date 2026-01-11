"""
Команда для инициализации начальных данных системы уведомлений.
Обновлено под новую структуру моделей с channel_type.
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
        category_orders, _ = NotificationCategory.objects.update_or_create(
            code='orders',
            defaults={
                'name': 'Заказы',
                'description': 'Уведомления связанные с заказами клиентов',
                'order': 1,
                'is_active': True
            }
        )

        category_users, _ = NotificationCategory.objects.update_or_create(
            code='users',
            defaults={
                'name': 'Пользователи',
                'description': 'Уведомления о регистрации и аккаунтах пользователей',
                'order': 2,
                'is_active': True
            }
        )

        category_system, _ = NotificationCategory.objects.update_or_create(
            code='system',
            defaults={
                'name': 'Системные',
                'description': 'Системные уведомления и оповещения',
                'order': 3,
                'is_active': True
            }
        )

        self.stdout.write('✓ Категории созданы')

        # 2. Каналы
        channel_email, _ = NotificationChannel.objects.update_or_create(
            code='email',
            name='Email',
            defaults={
                'icon': 'FaEnvelope',
                'is_active': True,
                'settings': {}
            }
        )

        channel_whatsapp, _ = NotificationChannel.objects.update_or_create(
            code='whatsapp',
            name='WhatsApp',
            defaults={
                'icon': 'FaWhatsapp',
                'is_active': True,
                'settings': {}
            }
        )

        self.stdout.write('✓ Каналы созданы')

        # 3. Типы уведомлений

        # --- ЗАКАЗЫ ---
        type_new_order, _ = NotificationType.objects.update_or_create(
            code='new_order',
            defaults={
                'category': category_orders,
                'name': 'Новый заказ',
                'description': 'Уведомление при создании нового заказа',
                'is_enabled': True,
                'order': 1,
                'variables_help': {
                    'order_number': 'Номер заказа',
                    'customer_name': 'Имя клиента',
                    'customer_phone': 'Телефон клиента',
                    'email': 'Email клиента',
                    'total_amount': 'Сумма заказа',
                    'items_list': 'Список товаров',
                    'delivery_address': 'Адрес доставки',
                    'delivery_comment': 'Примечание к адресу',
                    'comment': 'Комментарий к заказу'
                }
            }
        )

        type_status_changed, _ = NotificationType.objects.update_or_create(
            code='order_status_changed',
            defaults={
                'category': category_orders,
                'name': 'Смена статуса заказа',
                'description': 'Уведомление при изменении статуса заказа',
                'is_enabled': True,
                'order': 2,
                'variables_help': {
                    'order_number': 'Номер заказа',
                    'customer_name': 'Имя клиента',
                    'email': 'Email клиента',
                    'old_status': 'Старый статус',
                    'new_status': 'Новый статус',
                    'status': 'Код статуса'
                }
            }
        )

        # --- ПОЛЬЗОВАТЕЛИ ---
        type_user_activation, _ = NotificationType.objects.update_or_create(
            code='user_activation',
            defaults={
                'category': category_users,
                'name': 'Активация аккаунта',
                'description': 'Письмо с ссылкой для активации аккаунта после регистрации',
                'is_enabled': True,
                'order': 1,
                'variables_help': {
                    'username': 'Логин пользователя',
                    'email': 'Email пользователя',
                    'first_name': 'Имя пользователя',
                    'full_name': 'Полное имя пользователя',
                    'activation_url': 'Ссылка для активации'
                }
            }
        )

        type_user_registration, _ = NotificationType.objects.update_or_create(
            code='user_registration',
            defaults={
                'category': category_users,
                'name': 'Новая регистрация',
                'description': 'Уведомление администраторам о регистрации нового пользователя',
                'is_enabled': True,
                'order': 2,
                'variables_help': {
                    'username': 'Логин пользователя',
                    'email': 'Email пользователя',
                    'first_name': 'Имя пользователя',
                    'full_name': 'Полное имя пользователя',
                    'activation_url': 'Ссылка для активации'
                }
            }
        )

        type_password_reset, _ = NotificationType.objects.update_or_create(
            code='password_reset',
            defaults={
                'category': category_users,
                'name': 'Сброс пароля',
                'description': 'Письмо со ссылкой для сброса пароля',
                'is_enabled': True,
                'order': 3,
                'variables_help': {
                    'username': 'Логин пользователя',
                    'email': 'Email пользователя',
                    'reset_url': 'Ссылка для сброса пароля'
                }
            }
        )

        self.stdout.write('✓ Типы уведомлений созданы')

        # 4. Шаблоны (используем channel_type вместо channel FK)
        # Используем update_or_create для обновления существующих шаблонов

        # --- ШАБЛОНЫ ДЛЯ ЗАКАЗОВ ---
        template_new_order_email, _ = NotificationTemplate.objects.update_or_create(
            notification_type=type_new_order,
            channel_type='email',
            name='Стандартный',
            defaults={
                'subject': 'Новый заказ №{{order_number}}',
                'template': '''Здравствуйте!

Получен новый заказ №{{order_number}}

Клиент: {{customer_name}}
Телефон: {{customer_phone}}
Email: {{email}}
Сумма: {{total_amount}}

Товары:
{{items_list}}

Адрес доставки: {{delivery_address}}
Примечание к адресу: {{delivery_comment}}
Комментарий к заказу: {{comment}}'''
            }
        )

        template_new_order_whatsapp, _ = NotificationTemplate.objects.update_or_create(
            notification_type=type_new_order,
            channel_type='whatsapp',
            name='Стандартный',
            defaults={
                'subject': '',
                'template': '''🔔 *НОВЫЙ ЗАКАЗ №{{order_number}}*

👤 *Клиент:* {{customer_name}}
📱 *Телефон:* {{customer_phone}}
💰 *Сумма:* {{total_amount}}

🛒 *Товары:*
{{items_list}}

📍 *Адрес:* {{delivery_address}}
📝 *Примечание:* {{delivery_comment}}
💬 *Комментарий:* {{comment}}'''
            }
        )

        template_status_email, _ = NotificationTemplate.objects.update_or_create(
            notification_type=type_status_changed,
            channel_type='email',
            name='Стандартный',
            defaults={
                'subject': 'Заказ №{{order_number}} - Статус изменен',
                'template': '''Здравствуйте, {{customer_name}}!

Статус вашего заказа №{{order_number}} изменен.

Предыдущий статус: {{old_status}}
Новый статус: {{new_status}}

С уважением,
Faida Group Store'''
            }
        )

        template_status_whatsapp, _ = NotificationTemplate.objects.update_or_create(
            notification_type=type_status_changed,
            channel_type='whatsapp',
            name='Стандартный',
            defaults={
                'subject': '',
                'template': '''📦 *Заказ №{{order_number}}*

👤 {{customer_name}}

✅ *Статус изменен:*
{{old_status}} → {{new_status}}'''
            }
        )

        # --- ШАБЛОНЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ---
        template_activation_email, _ = NotificationTemplate.objects.update_or_create(
            notification_type=type_user_activation,
            channel_type='email',
            name='Стандартный',
            defaults={
                'subject': 'Активация аккаунта - Faida Group Store',
                'template': '''<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
    <div style="background: linear-gradient(135deg, #0E1A3A 0%, #162956 100%); padding: 30px; text-align: center;">
        <h1 style="color: #F2C56D; margin: 0;">Faida Group Store</h1>
    </div>
    <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #0E1A3A;">Добро пожаловать, {{first_name}}!</h2>
        <p style="color: #333; line-height: 1.6;">
            Спасибо за регистрацию на нашем сайте. Для активации вашего аккаунта, пожалуйста, нажмите на кнопку ниже:
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{activation_url}}"
               style="background: linear-gradient(135deg, #F2C56D 0%, #D8AE64 100%);
                      color: #0E1A3A;
                      text-decoration: none;
                      padding: 15px 40px;
                      border-radius: 8px;
                      font-weight: bold;
                      display: inline-block;">
                Активировать аккаунт
            </a>
        </div>
        <p style="color: #666; font-size: 14px;">
            Если кнопка не работает, скопируйте и вставьте следующую ссылку в браузер:<br>
            <a href="{{activation_url}}" style="color: #0E1A3A;">{{activation_url}}</a>
        </p>
        <p style="color: #666; font-size: 14px;">
            Ваш логин: <strong>{{username}}</strong>
        </p>
    </div>
    <div style="background: #0E1A3A; padding: 20px; text-align: center;">
        <p style="color: #F2C56D; margin: 0; font-size: 12px;">
            © Faida Group Store. Все права защищены.
        </p>
    </div>
</div>'''
            }
        )

        template_registration_email, _ = NotificationTemplate.objects.update_or_create(
            notification_type=type_user_registration,
            channel_type='email',
            name='Стандартный',
            defaults={
                'subject': 'Новая регистрация на сайте',
                'template': '''Здравствуйте!

На сайте Faida Group Store зарегистрировался новый пользователь:

Логин: {{username}}
Email: {{email}}
Имя: {{full_name}}

Пользователь ожидает активации аккаунта.'''
            }
        )

        template_registration_whatsapp, _ = NotificationTemplate.objects.update_or_create(
            notification_type=type_user_registration,
            channel_type='whatsapp',
            name='Стандартный',
            defaults={
                'subject': '',
                'template': '''👤 *НОВАЯ РЕГИСТРАЦИЯ*

📧 Email: {{email}}
👤 Логин: {{username}}
📝 Имя: {{full_name}}

Пользователь ожидает активации.'''
            }
        )

        template_password_reset_email, _ = NotificationTemplate.objects.update_or_create(
            notification_type=type_password_reset,
            channel_type='email',
            name='Стандартный',
            defaults={
                'subject': 'Сброс пароля - Faida Group Store',
                'template': '''<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
    <div style="background: linear-gradient(135deg, #0E1A3A 0%, #162956 100%); padding: 30px; text-align: center;">
        <h1 style="color: #F2C56D; margin: 0;">Faida Group Store</h1>
    </div>
    <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #0E1A3A;">Сброс пароля</h2>
        <p style="color: #333; line-height: 1.6;">
            Вы запросили сброс пароля для аккаунта <strong>{{username}}</strong>.
            Для установки нового пароля нажмите на кнопку ниже:
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{reset_url}}"
               style="background: linear-gradient(135deg, #F2C56D 0%, #D8AE64 100%);
                      color: #0E1A3A;
                      text-decoration: none;
                      padding: 15px 40px;
                      border-radius: 8px;
                      font-weight: bold;
                      display: inline-block;">
                Сбросить пароль
            </a>
        </div>
        <p style="color: #666; font-size: 14px;">
            Если кнопка не работает, скопируйте ссылку в браузер:<br>
            <a href="{{reset_url}}" style="color: #0E1A3A;">{{reset_url}}</a>
        </p>
        <p style="color: #999; font-size: 12px;">
            Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
        </p>
    </div>
    <div style="background: #0E1A3A; padding: 20px; text-align: center;">
        <p style="color: #F2C56D; margin: 0; font-size: 12px;">
            © Faida Group Store. Все права защищены.
        </p>
    </div>
</div>'''
            }
        )

        self.stdout.write('✓ Шаблоны созданы')

        # 5. Контакты (используем channel_type)
        contact_admin, _ = NotificationContact.objects.update_or_create(
            channel_type='email',
            value='admin@faida.ru',
            defaults={
                'name': 'Администратор',
                'is_active': True
            }
        )

        self.stdout.write('✓ Контакты созданы')

        # 6. Правила (с обязательным default_template)

        # --- ПРАВИЛА ДЛЯ НОВОГО ЗАКАЗА ---
        # Системное правило - уведомление клиенту на email
        rule_new_order_system, created = NotificationRule.objects.update_or_create(
            notification_type=type_new_order,
            channel=channel_email,
            rule_type='system',
            defaults={
                'name': 'Уведомление клиенту о заказе',
                'default_template': template_new_order_email,
                'is_enabled': True
            }
        )

        # Дополнительное правило - уведомление админу на email
        rule_new_order_admin_email, created = NotificationRule.objects.update_or_create(
            notification_type=type_new_order,
            channel=channel_email,
            rule_type='additional',
            defaults={
                'name': 'Уведомление администратору о заказе (Email)',
                'default_template': template_new_order_email,
                'is_enabled': True
            }
        )
        rule_new_order_admin_email.contacts.add(contact_admin)

        # --- ПРАВИЛА ДЛЯ СМЕНЫ СТАТУСА ---
        # Системное правило - уведомление клиенту на email
        rule_status_system, created = NotificationRule.objects.update_or_create(
            notification_type=type_status_changed,
            channel=channel_email,
            rule_type='system',
            defaults={
                'name': 'Уведомление клиенту о статусе',
                'default_template': template_status_email,
                'is_enabled': True
            }
        )

        # --- ПРАВИЛА ДЛЯ АКТИВАЦИИ ---
        # Системное правило - письмо активации пользователю
        rule_activation_system, created = NotificationRule.objects.update_or_create(
            notification_type=type_user_activation,
            channel=channel_email,
            rule_type='system',
            defaults={
                'name': 'Письмо активации пользователю',
                'default_template': template_activation_email,
                'is_enabled': True
            }
        )

        # --- ПРАВИЛА ДЛЯ РЕГИСТРАЦИИ ---
        # Дополнительное правило - уведомление админу о новой регистрации
        rule_registration_admin, created = NotificationRule.objects.update_or_create(
            notification_type=type_user_registration,
            channel=channel_email,
            rule_type='additional',
            defaults={
                'name': 'Уведомление администратору о регистрации',
                'default_template': template_registration_email,
                'is_enabled': True
            }
        )
        rule_registration_admin.contacts.add(contact_admin)

        # --- ПРАВИЛА ДЛЯ СБРОСА ПАРОЛЯ ---
        # Системное правило - письмо со ссылкой сброса пароля
        rule_password_reset, created = NotificationRule.objects.update_or_create(
            notification_type=type_password_reset,
            channel=channel_email,
            rule_type='system',
            defaults={
                'name': 'Письмо сброса пароля',
                'default_template': template_password_reset_email,
                'is_enabled': True
            }
        )

        self.stdout.write('✓ Правила созданы')

        self.stdout.write(self.style.SUCCESS('\n✅ Инициализация завершена успешно!'))
        self.stdout.write(self.style.SUCCESS('\nСозданы следующие типы уведомлений:'))
        self.stdout.write('  - new_order (Новый заказ)')
        self.stdout.write('  - order_status_changed (Смена статуса заказа)')
        self.stdout.write('  - user_activation (Активация аккаунта)')
        self.stdout.write('  - user_registration (Новая регистрация)')
        self.stdout.write('  - password_reset (Сброс пароля)')
        self.stdout.write(self.style.SUCCESS('\nТеперь вы можете:'))
        self.stdout.write('1. Настроить SMTP в канале Email через админ-панель')
        self.stdout.write('2. Добавить контакты для получения уведомлений')
        self.stdout.write('3. Редактировать шаблоны сообщений\n')
