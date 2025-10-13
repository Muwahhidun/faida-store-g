"""
API Views для системы уведомлений.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    NotificationCategory,
    NotificationChannel,
    NotificationType,
    NotificationTemplate,
    NotificationContact,
    NotificationRule,
    NotificationLog,
    RuleContactTemplate
)
from .serializers import (
    NotificationCategorySerializer,
    NotificationChannelSerializer,
    NotificationTypeSerializer,
    NotificationTemplateSerializer,
    NotificationContactSerializer,
    NotificationRuleSerializer,
    NotificationLogSerializer,
    RuleContactTemplateSerializer
)


class NotificationCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet для категорий уведомлений."""
    queryset = NotificationCategory.objects.all()
    serializer_class = NotificationCategorySerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None


class NotificationChannelViewSet(viewsets.ModelViewSet):
    """ViewSet для каналов уведомлений."""
    queryset = NotificationChannel.objects.all()
    serializer_class = NotificationChannelSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def destroy(self, request, *args, **kwargs):
        """Удаление канала с обработкой защищенных связей."""
        from django.db.models import ProtectedError

        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError as e:
            # Получаем информацию о связанных объектах
            protected_objects = []
            if hasattr(e, 'protected_objects'):
                for obj in list(e.protected_objects)[:5]:  # Показываем первые 5
                    protected_objects.append(str(obj))

            error_message = (
                'Невозможно удалить канал, так как к нему привязаны контакты или правила отправки. '
                'Сначала удалите или переназначьте связанные объекты.'
            )

            if protected_objects:
                error_message += f' Связанные объекты: {", ".join(protected_objects)}'

            return Response(
                {'error': error_message},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def update_settings(self, request, pk=None):
        """Обновление настроек канала."""
        channel = self.get_object()
        new_settings = request.data.get('settings', {})

        # Валидация обязательных полей в зависимости от типа канала
        if channel.code == 'email':
            required = ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'from_email']
            missing = [f for f in required if not new_settings.get(f)]
            if missing:
                return Response(
                    {'error': f'Отсутствуют обязательные поля: {", ".join(missing)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        elif channel.code == 'whatsapp':
            required = ['instance_id', 'api_token']
            missing = [f for f in required if not new_settings.get(f)]
            if missing:
                return Response(
                    {'error': f'Отсутствуют обязательные поля: {", ".join(missing)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        elif channel.code == 'telegram':
            required = ['bot_token']
            missing = [f for f in required if not new_settings.get(f)]
            if missing:
                return Response(
                    {'error': f'Отсутствуют обязательные поля: {", ".join(missing)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Сохраняем настройки
        channel.settings = new_settings
        channel.save()

        serializer = self.get_serializer(channel)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Тестирование подключения к каналу."""
        channel = self.get_object()

        if channel.code == 'email':
            from .services import EmailService

            settings = channel.settings
            smtp_host = settings.get('smtp_host')
            smtp_port = settings.get('smtp_port')
            smtp_username = settings.get('smtp_username')
            smtp_password = settings.get('smtp_password')
            from_email = settings.get('from_email')
            use_tls = settings.get('use_tls', True)

            if not all([smtp_host, smtp_port, smtp_username, smtp_password, from_email]):
                return Response(
                    {'error': 'Email не настроен (недостаточно параметров)'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            email_service = EmailService(
                smtp_host=smtp_host,
                smtp_port=int(smtp_port),
                smtp_username=smtp_username,
                smtp_password=smtp_password,
                from_email=from_email,
                use_tls=use_tls
            )
            result = email_service.test_connection()

            if 'error' in result:
                return Response({'success': False, 'error': result['error']})

            return Response({'success': True, 'data': result})

        elif channel.code == 'whatsapp':
            from .services import WhatsAppService

            settings = channel.settings
            instance_id = settings.get('instance_id')
            api_token = settings.get('api_token')

            if not instance_id or not api_token:
                return Response(
                    {'error': 'WhatsApp не настроен (нет instance_id или api_token)'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            whatsapp = WhatsAppService(instance_id=instance_id, api_token=api_token)
            result = whatsapp.check_state_instance()

            if 'error' in result:
                return Response({'success': False, 'error': result['error']})

            return Response({'success': True, 'data': result})

        elif channel.code == 'telegram':
            from .services import TelegramService

            settings = channel.settings
            bot_token = settings.get('bot_token')

            if not bot_token:
                return Response(
                    {'error': 'Telegram не настроен (нет bot_token)'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            telegram = TelegramService(bot_token=bot_token)
            result = telegram.get_bot_info()

            if 'error' in result:
                return Response({'success': False, 'error': result['error']})

            return Response({'success': True, 'data': result})

        return Response({'error': 'Тестирование для этого канала не реализовано'})

    @action(detail=False, methods=['post'], url_path='test-connection-preview')
    def test_connection_preview(self, request):
        """
        Тестирование подключения без создания канала.
        Используется при создании нового канала для проверки настроек.
        """
        channel_code = request.data.get('channel_code')
        settings = request.data.get('settings', {})

        if not channel_code:
            return Response(
                {'error': 'Не указан код канала (channel_code)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not settings:
            return Response(
                {'error': 'Не указаны настройки (settings)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Тестируем в зависимости от типа канала
        if channel_code == 'email':
            from .services import EmailService

            smtp_host = settings.get('smtp_host')
            smtp_port = settings.get('smtp_port')
            smtp_username = settings.get('smtp_username')
            smtp_password = settings.get('smtp_password')
            from_email = settings.get('from_email')
            use_tls = settings.get('use_tls', True)

            if not all([smtp_host, smtp_port, smtp_username, smtp_password, from_email]):
                return Response(
                    {'error': 'Недостаточно параметров для Email (требуются: smtp_host, smtp_port, smtp_username, smtp_password, from_email)'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            email_service = EmailService(
                smtp_host=smtp_host,
                smtp_port=int(smtp_port),
                smtp_username=smtp_username,
                smtp_password=smtp_password,
                from_email=from_email,
                use_tls=use_tls
            )
            result = email_service.test_connection()

            if 'error' in result:
                return Response({'success': False, 'error': result['error']})

            return Response({'success': True, 'data': result})

        elif channel_code == 'whatsapp':
            from .services import WhatsAppService

            instance_id = settings.get('instance_id')
            api_token = settings.get('api_token')

            if not instance_id or not api_token:
                return Response(
                    {'error': 'Недостаточно параметров для WhatsApp (требуются: instance_id, api_token)'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            whatsapp = WhatsAppService(instance_id=instance_id, api_token=api_token)
            result = whatsapp.check_state_instance()

            if 'error' in result:
                return Response({'success': False, 'error': result['error']})

            return Response({'success': True, 'data': result})

        elif channel_code == 'telegram':
            from .services import TelegramService

            bot_token = settings.get('bot_token')

            if not bot_token:
                return Response(
                    {'error': 'Недостаточно параметров для Telegram (требуется: bot_token)'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            telegram = TelegramService(bot_token=bot_token)
            result = telegram.get_bot_info()

            if 'error' in result:
                return Response({'success': False, 'error': result['error']})

            return Response({'success': True, 'data': result})

        return Response(
            {'error': f'Тестирование для канала "{channel_code}" не поддерживается'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def send_test(self, request, pk=None):
        """Отправка тестового сообщения через канал."""
        channel = self.get_object()

        # Получаем все активные контакты для типа этого канала
        contacts = NotificationContact.objects.filter(channel_type=channel.code, is_active=True)

        if not contacts.exists():
            return Response(
                {'error': f'Нет активных контактов для канала {channel.name}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        test_message = request.data.get('message', f'Тестовое сообщение от Faida Group Store через {channel.name}')

        results = []

        for contact in contacts:
            try:
                if channel.code == 'whatsapp':
                    from .services import WhatsAppService

                    settings = channel.settings
                    instance_id = settings.get('instance_id')
                    api_token = settings.get('api_token')

                    whatsapp = WhatsAppService(instance_id=instance_id, api_token=api_token)
                    result = whatsapp.send_message(contact.value, test_message)

                    if 'error' in result:
                        results.append({
                            'contact': contact.name,
                            'success': False,
                            'error': result['error']
                        })
                    else:
                        results.append({
                            'contact': contact.name,
                            'success': True,
                            'message_id': result.get('idMessage')
                        })

                elif channel.code == 'email':
                    from .services import EmailService

                    settings = channel.settings
                    email_service = EmailService(
                        smtp_host=settings.get('smtp_host'),
                        smtp_port=int(settings.get('smtp_port')),
                        smtp_username=settings.get('smtp_username'),
                        smtp_password=settings.get('smtp_password'),
                        from_email=settings.get('from_email'),
                        use_tls=settings.get('use_tls', True)
                    )
                    result = email_service.send_message(
                        to_email=contact.value,
                        subject='Тестовое уведомление - Faida Group Store',
                        message=test_message
                    )

                    if 'error' in result:
                        results.append({
                            'contact': contact.name,
                            'success': False,
                            'error': result['error']
                        })
                    else:
                        results.append({
                            'contact': contact.name,
                            'success': True
                        })

                elif channel.code == 'telegram':
                    from .services import TelegramService

                    settings = channel.settings
                    bot_token = settings.get('bot_token')

                    telegram = TelegramService(bot_token=bot_token)
                    result = telegram.send_message(contact.value, test_message)

                    if 'error' in result:
                        results.append({
                            'contact': contact.name,
                            'success': False,
                            'error': result['error']
                        })
                    else:
                        results.append({
                            'contact': contact.name,
                            'success': True,
                            'message_id': result.get('result', {}).get('message_id')
                        })

            except Exception as e:
                results.append({
                    'contact': contact.name,
                    'success': False,
                    'error': str(e)
                })

        success_count = sum(1 for r in results if r['success'])

        return Response({
            'success': success_count > 0,
            'total': len(results),
            'sent': success_count,
            'failed': len(results) - success_count,
            'results': results
        })


class NotificationTypeViewSet(viewsets.ModelViewSet):
    """ViewSet для типов уведомлений."""
    queryset = NotificationType.objects.select_related('category').all()
    serializer_class = NotificationTypeSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet для шаблонов уведомлений."""
    queryset = NotificationTemplate.objects.select_related('notification_type').all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    @action(detail=True, methods=['post'])
    def preview(self, request, pk=None):
        """Превью шаблона с подстановкой тестовых данных."""
        template = self.get_object()
        test_context = request.data.get('context', {})

        from .notification_service import NotificationService

        service = NotificationService()
        try:
            rendered = service._render_template(template.template, test_context)
            return Response({
                'success': True,
                'rendered': rendered
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class NotificationContactViewSet(viewsets.ModelViewSet):
    """ViewSet для контактов."""
    queryset = NotificationContact.objects.all()
    serializer_class = NotificationContactSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    @action(detail=True, methods=['post'])
    def send_test(self, request, pk=None):
        """Отправка тестового сообщения на контакт."""
        contact = self.get_object()

        # Получаем активный канал соответствующего типа
        try:
            channel = NotificationChannel.objects.get(code=contact.channel_type, is_active=True)
        except NotificationChannel.DoesNotExist:
            return Response(
                {'error': f'Нет активного канала типа {contact.get_channel_type_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        test_message = request.data.get('message', f'Тестовое сообщение от Faida Group Store')

        try:
            if contact.channel_type == 'whatsapp':
                from .services import WhatsAppService

                settings = channel.settings
                instance_id = settings.get('instance_id')
                api_token = settings.get('api_token')

                whatsapp = WhatsAppService(instance_id=instance_id, api_token=api_token)
                result = whatsapp.send_message(contact.value, test_message)

                if 'error' in result:
                    return Response({
                        'success': False,
                        'error': result['error']
                    }, status=status.HTTP_400_BAD_REQUEST)

                return Response({
                    'success': True,
                    'message_id': result.get('idMessage'),
                    'data': result
                })

            elif contact.channel_type == 'email':
                from .services import EmailService

                settings = channel.settings
                email_service = EmailService(
                    smtp_host=settings.get('smtp_host'),
                    smtp_port=int(settings.get('smtp_port')),
                    smtp_username=settings.get('smtp_username'),
                    smtp_password=settings.get('smtp_password'),
                    from_email=settings.get('from_email'),
                    use_tls=settings.get('use_tls', True)
                )
                result = email_service.send_message(
                    to_email=contact.value,
                    subject='Тестовое уведомление - Faida Group Store',
                    message=test_message
                )

                if 'error' in result:
                    return Response({
                        'success': False,
                        'error': result['error']
                    }, status=status.HTTP_400_BAD_REQUEST)

                return Response({
                    'success': True,
                    'data': result
                })

            elif contact.channel_type == 'telegram':
                from .services import TelegramService

                settings = channel.settings
                bot_token = settings.get('bot_token')

                telegram = TelegramService(bot_token=bot_token)
                result = telegram.send_message(contact.value, test_message)

                if 'error' in result:
                    return Response({
                        'success': False,
                        'error': result['error']
                    }, status=status.HTTP_400_BAD_REQUEST)

                return Response({
                    'success': True,
                    'message_id': result.get('result', {}).get('message_id'),
                    'data': result
                })

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'error': 'Тип канала не поддерживается'
        }, status=status.HTTP_400_BAD_REQUEST)


class NotificationRuleViewSet(viewsets.ModelViewSet):
    """ViewSet для правил отправки."""
    queryset = NotificationRule.objects.select_related(
        'notification_type', 'channel', 'default_template'
    ).prefetch_related('contacts').all()
    serializer_class = NotificationRuleSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def create(self, request, *args, **kwargs):
        """Создание правила с обработкой вложенных полей."""
        data = request.data.copy()

        # Извлекаем IDs для FK и M2M полей
        contact_ids = data.pop('contacts', []) if isinstance(data.get('contacts'), list) else []

        # Валидация: системные правила могут использовать только email каналы
        rule_type = data.get('rule_type', 'additional')
        if rule_type == 'system':
            try:
                channel = NotificationChannel.objects.get(id=data.get('channel'))
                if channel.code != 'email':
                    return Response(
                        {'error': 'Системные уведомления могут использовать только Email каналы'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except NotificationChannel.DoesNotExist:
                pass  # Ошибка будет обработана при создании

        # Создаем правило
        rule = NotificationRule.objects.create(
            name=data.get('name'),
            rule_type=rule_type,
            notification_type_id=data.get('notification_type'),
            channel_id=data.get('channel'),
            default_template_id=data.get('default_template') if data.get('default_template') else None,
            is_enabled=data.get('is_enabled', True)
        )

        # Назначаем контакты (только для дополнительных правил)
        # Для системных правил контакты игнорируются
        if rule_type == 'additional' and contact_ids:
            rule.contacts.set(contact_ids)

        serializer = self.get_serializer(rule)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Обновление правила с обработкой вложенных полей."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()

        # Извлекаем IDs для FK и M2M полей
        contact_ids = data.pop('contacts', None)

        # Валидация: если меняется rule_type на system или channel, проверяем ограничения
        new_rule_type = data.get('rule_type', instance.rule_type)
        new_channel_id = data.get('channel', instance.channel_id)

        if new_rule_type == 'system':
            try:
                channel = NotificationChannel.objects.get(id=new_channel_id)
                if channel.code != 'email':
                    return Response(
                        {'error': 'Системные уведомления могут использовать только Email каналы'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except NotificationChannel.DoesNotExist:
                pass  # Ошибка будет обработана при сохранении

        # Обновляем основные поля
        if 'name' in data:
            instance.name = data['name']
        if 'rule_type' in data:
            instance.rule_type = data['rule_type']
        if 'notification_type' in data:
            instance.notification_type_id = data['notification_type']
        if 'channel' in data:
            instance.channel_id = data['channel']
        if 'default_template' in data:
            instance.default_template_id = data['default_template'] if data['default_template'] else None
        if 'is_enabled' in data:
            instance.is_enabled = data['is_enabled']

        instance.save()

        # Обновляем контакты если они переданы (только для дополнительных правил)
        if contact_ids is not None:
            if instance.rule_type == 'additional':
                instance.contacts.set(contact_ids)
            else:
                # Для системных правил очищаем контакты
                instance.contacts.clear()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assign_contacts(self, request, pk=None):
        """Назначить контакты правилу."""
        rule = self.get_object()
        contact_ids = request.data.get('contact_ids', [])

        # Валидация: контакты должны иметь тот же тип, что и канал правила
        if contact_ids:
            invalid_contacts = NotificationContact.objects.filter(
                id__in=contact_ids
            ).exclude(channel_type=rule.channel.code)

            if invalid_contacts.exists():
                return Response(
                    {'error': 'Контакты должны иметь тот же тип, что и канал правила'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Назначаем контакты
        rule.contacts.set(contact_ids)

        # Возвращаем обновленное правило
        serializer = self.get_serializer(rule)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_enabled(self, request, pk=None):
        """Включить/выключить правило."""
        rule = self.get_object()
        rule.is_enabled = not rule.is_enabled
        rule.save()

        serializer = self.get_serializer(rule)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_test(self, request, pk=None):
        """Отправка тестового сообщения через правило."""
        rule = self.get_object()

        # Проверяем что правило активно
        if not rule.is_enabled:
            return Response(
                {'error': 'Правило отключено. Включите его перед тестированием.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем что канал активен
        if not rule.channel.is_active:
            return Response(
                {'error': f'Канал "{rule.channel.name}" отключен'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем наличие контактов
        contacts = rule.contacts.filter(is_active=True)
        if not contacts.exists():
            return Response(
                {'error': 'К правилу не привязаны активные контакты'},
                status=status.HTTP_400_BAD_REQUEST
            )

        test_message = request.data.get('message', f'Тестовое сообщение от Faida Group Store через правило "{rule.notification_type.name}"')

        results = []
        channel = rule.channel

        for contact in contacts:
            try:
                if channel.code == 'whatsapp':
                    from .services import WhatsAppService

                    settings = channel.settings
                    instance_id = settings.get('instance_id')
                    api_token = settings.get('api_token')

                    whatsapp = WhatsAppService(instance_id=instance_id, api_token=api_token)
                    result = whatsapp.send_message(contact.value, test_message)

                    if 'error' in result:
                        results.append({
                            'contact': contact.name,
                            'success': False,
                            'error': result['error']
                        })
                    else:
                        results.append({
                            'contact': contact.name,
                            'success': True,
                            'message_id': result.get('idMessage')
                        })

                elif channel.code == 'email':
                    from .services import EmailService

                    settings = channel.settings
                    email_service = EmailService(
                        smtp_host=settings.get('smtp_host'),
                        smtp_port=int(settings.get('smtp_port')),
                        smtp_username=settings.get('smtp_username'),
                        smtp_password=settings.get('smtp_password'),
                        from_email=settings.get('from_email'),
                        use_tls=settings.get('use_tls', True)
                    )
                    result = email_service.send_message(
                        to_email=contact.value,
                        subject='Тестовое уведомление - Faida Group Store',
                        message=test_message
                    )

                    if 'error' in result:
                        results.append({
                            'contact': contact.name,
                            'success': False,
                            'error': result['error']
                        })
                    else:
                        results.append({
                            'contact': contact.name,
                            'success': True
                        })

                elif channel.code == 'telegram':
                    from .services import TelegramService

                    settings = channel.settings
                    bot_token = settings.get('bot_token')

                    telegram = TelegramService(bot_token=bot_token)
                    result = telegram.send_message(contact.value, test_message)

                    if 'error' in result:
                        results.append({
                            'contact': contact.name,
                            'success': False,
                            'error': result['error']
                        })
                    else:
                        results.append({
                            'contact': contact.name,
                            'success': True,
                            'message_id': result.get('result', {}).get('message_id')
                        })

            except Exception as e:
                results.append({
                    'contact': contact.name,
                    'success': False,
                    'error': str(e)
                })

        success_count = sum(1 for r in results if r['success'])

        return Response({
            'success': success_count > 0,
            'total': len(results),
            'sent': success_count,
            'failed': len(results) - success_count,
            'results': results
        })

    @action(detail=True, methods=['post'], url_path='assign-template')
    def assign_template(self, request, pk=None):
        """Назначить шаблон конкретному контакту в правиле."""
        rule = self.get_object()
        contact_id = request.data.get('contact_id')
        template_id = request.data.get('template_id')  # Может быть None для сброса

        if not contact_id:
            return Response(
                {'error': 'Не указан contact_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверяем что контакт принадлежит этому правилу
        if not rule.contacts.filter(id=contact_id).exists():
            return Response(
                {'error': 'Контакт не принадлежит этому правилу'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Если template_id указан, проверяем что шаблон подходит
        if template_id:
            try:
                template = NotificationTemplate.objects.get(id=template_id)
                # Шаблон должен быть для того же типа уведомления и типа канала
                if template.notification_type != rule.notification_type or template.channel_type != rule.channel.code:
                    return Response(
                        {'error': 'Шаблон не подходит для этого правила (другой тип уведомления или тип канала)'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except NotificationTemplate.DoesNotExist:
                return Response(
                    {'error': 'Шаблон не найден'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Создаем или обновляем связь
        if template_id:
            RuleContactTemplate.objects.update_or_create(
                rule=rule,
                contact_id=contact_id,
                defaults={'template_id': template_id}
            )
        else:
            # Если template_id None, удаляем связь (будет использоваться шаблон по умолчанию)
            RuleContactTemplate.objects.filter(
                rule=rule,
                contact_id=contact_id
            ).delete()

        # Возвращаем обновленное правило
        serializer = self.get_serializer(rule)
        return Response(serializer.data)


class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для логов уведомлений (только чтение)."""
    queryset = NotificationLog.objects.select_related(
        'notification_type', 'channel', 'contact'
    ).all()
    serializer_class = NotificationLogSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None  # Отключаем пагинацию для логов

    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """Повторная отправка неудачного уведомления."""
        log = self.get_object()

        if log.status not in ['failed', 'retrying']:
            return Response(
                {'error': 'Можно повторить только неудачные уведомления'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Используем новую систему уведомлений вместо старой
            if log.channel.code == 'email':
                from .services import EmailService
                from django.conf import settings as django_settings

                recipient = log.contact.value if log.contact else log.recipient_value
                channel_settings = log.channel.settings

                email_service = EmailService(
                    smtp_host=channel_settings.get('smtp_host'),
                    smtp_port=int(channel_settings.get('smtp_port', 587)),
                    smtp_username=channel_settings.get('smtp_username'),
                    smtp_password=channel_settings.get('smtp_password'),
                    from_email=channel_settings.get('from_email'),
                    use_tls=channel_settings.get('use_tls', True)
                )

                result = email_service.send_message(
                    to_email=recipient,
                    subject=f'{log.notification_type.name} - Faida Group Store',
                    message=log.message
                )

                if 'error' in result:
                    raise Exception(result['error'])

            elif log.channel.code == 'whatsapp':
                from .services import WhatsAppService

                phone = log.contact.get_formatted_value() if log.contact else log.recipient_value
                channel_settings = log.channel.settings

                whatsapp = WhatsAppService(
                    instance_id=channel_settings.get('instance_id'),
                    api_token=channel_settings.get('api_token')
                )

                result = whatsapp.send_message(phone, log.message)

                if 'error' in result:
                    raise Exception(result['error'])

            log.mark_as_sent()

            return Response({
                'success': True,
                'message': 'Уведомление успешно отправлено'
            })

        except Exception as e:
            log.mark_as_failed(str(e), schedule_retry=False)

            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
