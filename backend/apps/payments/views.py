"""
API views для системы платежей YooKassa.
"""

import logging
from decimal import Decimal
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response

from apps.orders.models import Order
from apps.core.models import SiteSettings
from .services import YooKassaService
from .models import Payment, PaymentSettings, Refund

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def payment_availability(request):
    """
    Проверить доступность онлайн-оплаты.

    GET /api/payments/available/
    Response: {"available": true/false}
    """
    return Response({
        'available': PaymentSettings.is_configured()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    """
    Создать платёж для заказа.

    POST /api/payments/create/
    Body: {"order_id": 123}
    Response: {"confirmation_url": "https://yookassa.ru/..."}
    """
    order_id = request.data.get('order_id')

    if not order_id:
        return Response(
            {'error': 'Не указан ID заказа'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Проверяем доступность платёжной системы
    if not PaymentSettings.is_configured():
        return Response(
            {'error': 'Онлайн-оплата временно недоступна'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    try:
        # Находим заказ
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Заказ не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Проверяем, что заказ с онлайн-оплатой
    if order.payment_method != 'online':
        return Response(
            {'error': 'Этот заказ не требует онлайн-оплаты'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Проверяем, нет ли уже платежа
    if hasattr(order, 'payment') and order.payment:
        existing_payment = order.payment
        if existing_payment.status == 'succeeded':
            return Response(
                {'error': 'Заказ уже оплачен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Если платёж pending - возвращаем существующий URL
        if existing_payment.status == 'pending' and existing_payment.confirmation_url:
            return Response({
                'payment_id': existing_payment.yookassa_id,
                'confirmation_url': existing_payment.confirmation_url,
                'status': existing_payment.status
            })

    try:
        # Формируем return URL
        site_url = SiteSettings.get_effective_site_url()
        return_url = f"{site_url}/order-success/{order.order_number}"

        # Создаём платёж
        service = YooKassaService()
        result = service.create_payment(order, return_url)

        return Response(result, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Ошибка создания платежа: {e}")
        return Response(
            {'error': 'Ошибка создания платежа. Попробуйте позже.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])  # Webhook вызывается YooKassa без авторизации
def webhook(request):
    """
    Webhook для получения уведомлений от YooKassa.

    POST /api/payments/webhook/
    """
    try:
        # Логируем входящий запрос
        logger.info(f"Получен webhook от YooKassa: {request.data}")

        # Обрабатываем webhook
        service = YooKassaService()
        success = service.process_webhook(request.data)

        if success:
            return Response({'status': 'ok'}, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Ошибка обработки'},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        logger.error(f"Ошибка обработки webhook: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status(request, order_id):
    """
    Получить статус платежа для заказа.

    GET /api/payments/status/{order_id}/
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response(
            {'error': 'Заказ не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        payment = Payment.objects.get(order=order)
        refunds = payment.refunds.all()
        return Response({
            'payment_id': payment.yookassa_id,
            'status': payment.status,
            'status_display': payment.get_status_display_ru(),
            'paid': payment.paid,
            'amount': str(payment.amount),
            'paid_at': payment.paid_at.isoformat() if payment.paid_at else None,
            'refunded_amount': str(payment.refunded_amount),
            'available_for_refund': str(payment.available_for_refund),
            'refunds': [
                {
                    'id': r.id,
                    'amount': str(r.amount),
                    'status': r.status,
                    'status_display': r.get_status_display_ru(),
                    'reason': r.reason,
                    'created_at': r.created_at.isoformat()
                }
                for r in refunds
            ]
        })
    except Payment.DoesNotExist:
        return Response({
            'payment_id': None,
            'status': 'not_created',
            'status_display': 'Платёж не создан',
            'paid': False
        })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_refund(request):
    """
    Создать возврат платежа (частичный или полный).

    POST /api/payments/refund/
    Body: {"payment_id": 123, "amount": "100.00", "reason": "Причина возврата"}

    Примечание: payment_id - это ID заказа (order_id), платёж ищется по связи с заказом.
    """
    order_id = request.data.get('payment_id')  # Фронтенд отправляет order_id как payment_id
    amount = request.data.get('amount')
    reason = request.data.get('reason', '')

    if not order_id:
        return Response(
            {'error': 'Не указан ID заказа'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not amount:
        return Response(
            {'error': 'Не указана сумма возврата'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        amount = Decimal(str(amount))
    except:
        return Response(
            {'error': 'Некорректная сумма возврата'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Ищем платёж по order_id (связь через OneToOneField)
        payment = Payment.objects.get(order_id=order_id)
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Платёж для этого заказа не найден'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        service = YooKassaService()
        result = service.create_refund(payment, amount, reason, request.user)
        return Response(result, status=status.HTTP_201_CREATED)

    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Ошибка создания возврата: {e}")
        return Response(
            {'error': 'Ошибка создания возврата. Попробуйте позже.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# === Настройки платежей (для админ-панели) ===

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_payment_settings(request):
    """
    Получить настройки платежей.

    GET /api/payments/settings/
    """
    settings = PaymentSettings.load()
    return Response({
        'shop_id': settings.shop_id,
        'secret_key': '***' if settings.secret_key else '',  # Не показываем секретный ключ
        'is_enabled': settings.is_enabled,
        'test_mode': settings.test_mode,
        'webhook_secret': '***' if settings.webhook_secret else '',
        'is_configured': PaymentSettings.is_configured(),
        'updated_at': settings.updated_at.isoformat() if settings.updated_at else None
    })


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def update_payment_settings(request):
    """
    Обновить настройки платежей.

    PUT /api/payments/settings/
    Body: {"shop_id": "...", "secret_key": "...", "is_enabled": true, "test_mode": false}
    """
    settings = PaymentSettings.load()

    # Обновляем только переданные поля
    if 'shop_id' in request.data:
        settings.shop_id = request.data['shop_id']

    if 'secret_key' in request.data and request.data['secret_key'] != '***':
        settings.secret_key = request.data['secret_key']

    if 'is_enabled' in request.data:
        settings.is_enabled = request.data['is_enabled']

    if 'test_mode' in request.data:
        settings.test_mode = request.data['test_mode']

    if 'webhook_secret' in request.data and request.data['webhook_secret'] != '***':
        settings.webhook_secret = request.data['webhook_secret']

    settings.save()

    return Response({
        'message': 'Настройки сохранены',
        'is_configured': PaymentSettings.is_configured()
    })
