"""
Management command для автоматической обработки повторных отправок неудавшихся уведомлений.
Запускается по расписанию (например, каждую минуту через cron или планировщик).
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.notifications.models import NotificationLog
from apps.notifications.notification_service import NotificationService


class Command(BaseCommand):
    help = 'Обрабатывает уведомления со статусом "retrying", время повтора которых наступило'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=50,
            help='Максимальное количество уведомлений для обработки за один запуск (по умолчанию 50)',
        )

    def handle(self, *args, **options):
        limit = options['limit']
        now = timezone.now()

        # Находим уведомления, готовые к повторной отправке
        retry_logs = NotificationLog.objects.filter(
            status='retrying',
            next_retry_at__lte=now
        ).select_related(
            'notification_type',
            'channel',
            'contact'
        ).order_by('next_retry_at')[:limit]

        if not retry_logs.exists():
            self.stdout.write(self.style.SUCCESS('Нет уведомлений для повторной отправки'))
            return

        self.stdout.write(f'Найдено {retry_logs.count()} уведомлений для повторной отправки')

        service = NotificationService()
        success_count = 0
        fail_count = 0

        for log in retry_logs:
            try:
                self.stdout.write(f'Повторная отправка #{log.id}: {log.notification_type.name} → {log.recipient_value}')

                # Повторная отправка
                if log.channel.code == 'whatsapp':
                    from apps.notifications.services import WhatsAppService
                    whatsapp = WhatsAppService(
                        instance_id=log.channel.settings.get('instance_id'),
                        api_token=log.channel.settings.get('api_token')
                    )
                    result = whatsapp.send_message(log.recipient_value, log.message)

                    if 'error' in result:
                        log.mark_as_failed(result['error'], schedule_retry=True)
                        self.stdout.write(self.style.ERROR(f'  ✗ Ошибка: {result["error"]}'))
                        fail_count += 1
                    else:
                        log.mark_as_sent(result.get('idMessage'))
                        self.stdout.write(self.style.SUCCESS(f'  ✓ Успешно отправлено'))
                        success_count += 1

                elif log.channel.code == 'email':
                    from django.core.mail import send_mail
                    from django.conf import settings

                    try:
                        send_mail(
                            subject=f"{log.notification_type.name} - Faida Group Store",
                            message=log.message,
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[log.recipient_value],
                            fail_silently=False,
                        )
                        log.mark_as_sent()
                        self.stdout.write(self.style.SUCCESS(f'  ✓ Email отправлен'))
                        success_count += 1
                    except Exception as e:
                        log.mark_as_failed(str(e), schedule_retry=True)
                        self.stdout.write(self.style.ERROR(f'  ✗ Ошибка email: {str(e)}'))
                        fail_count += 1

            except Exception as e:
                log.mark_as_failed(str(e), schedule_retry=True)
                self.stdout.write(self.style.ERROR(f'  ✗ Критическая ошибка: {str(e)}'))
                fail_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nОбработано: {success_count + fail_count} | Успешно: {success_count} | Ошибок: {fail_count}'
        ))
