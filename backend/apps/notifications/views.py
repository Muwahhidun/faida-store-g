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

    @action(detail=True, methods=['post'])
    def send_test(self, request, pk=None):
        """Отправка тестового сообщения через канал."""
        channel = self.get_object()

        # Получаем все активные контакты для этого канала
        contacts = NotificationContact.objects.filter(channel=channel, is_active=True)

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
    queryset = NotificationTemplate.objects.select_related('notification_type', 'channel').all()
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
    queryset = NotificationContact.objects.select_related('channel').all()
    serializer_class = NotificationContactSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None


class NotificationRuleViewSet(viewsets.ModelViewSet):
    """ViewSet для правил отправки."""
    queryset = NotificationRule.objects.select_related(
        'notification_type', 'channel'
    ).prefetch_related('contacts').all()
    serializer_class = NotificationRuleSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    @action(detail=True, methods=['post'])
    def assign_contacts(self, request, pk=None):
        """Назначить контакты правилу."""
        rule = self.get_object()
        contact_ids = request.data.get('contact_ids', [])

        # Валидация: контакты должны принадлежать тому же каналу
        if contact_ids:
            invalid_contacts = NotificationContact.objects.filter(
                id__in=contact_ids
            ).exclude(channel=rule.channel)

            if invalid_contacts.exists():
                return Response(
                    {'error': 'Контакты должны принадлежать тому же каналу что и правило'},
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
                # Шаблон должен быть для того же типа уведомления и канала
                if template.notification_type != rule.notification_type or template.channel != rule.channel:
                    return Response(
                        {'error': 'Шаблон не подходит для этого правила (другой тип уведомления или канал)'},
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
            from .notification_service import NotificationService

            service = NotificationService()

            # Пробуем отправить
            if log.channel.code == 'email':
                recipient = log.contact.value if log.contact else log.recipient_value
                service._send_email(to_email=recipient, subject='', message=log.message)

            elif log.channel.code == 'whatsapp':
                phone = log.contact.get_formatted_value() if log.contact else log.recipient_value
                service._send_whatsapp(
                    phone=phone,
                    message=log.message,
                    channel_settings=log.channel.settings
                )

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
