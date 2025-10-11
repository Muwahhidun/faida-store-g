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
    NotificationLog
)
from .serializers import (
    NotificationCategorySerializer,
    NotificationChannelSerializer,
    NotificationTypeSerializer,
    NotificationTemplateSerializer,
    NotificationContactSerializer,
    NotificationRuleSerializer,
    NotificationLogSerializer
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
    def test_connection(self, request, pk=None):
        """Тестирование подключения к каналу."""
        channel = self.get_object()

        if channel.code == 'whatsapp':
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

        return Response({'error': 'Тестирование для этого канала не реализовано'})


class NotificationTypeViewSet(viewsets.ModelViewSet):
    """ViewSet для типов уведомлений."""
    queryset = NotificationType.objects.select_related('category').all()
    serializer_class = NotificationTypeSerializer
    permission_classes = [permissions.IsAdminUser]


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet для шаблонов уведомлений."""
    queryset = NotificationTemplate.objects.select_related('notification_type', 'channel').all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAdminUser]

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


class NotificationRuleViewSet(viewsets.ModelViewSet):
    """ViewSet для правил отправки."""
    queryset = NotificationRule.objects.select_related(
        'notification_type', 'channel'
    ).prefetch_related('contacts').all()
    serializer_class = NotificationRuleSerializer
    permission_classes = [permissions.IsAdminUser]


class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для логов уведомлений (только чтение)."""
    queryset = NotificationLog.objects.select_related(
        'notification_type', 'channel', 'contact'
    ).all()
    serializer_class = NotificationLogSerializer
    permission_classes = [permissions.IsAdminUser]

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
