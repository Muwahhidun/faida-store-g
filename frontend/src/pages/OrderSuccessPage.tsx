import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaHome, FaShoppingBag, FaSpinner, FaClock, FaTimesCircle, FaCreditCard } from 'react-icons/fa';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';

interface PaymentStatus {
    payment_id: string | null;
    status: string;
    status_display: string;
    paid: boolean;
    amount?: string;
    paid_at?: string;
}

interface OrderInfo {
    id: number;
    order_number: string;
    status: string;
    payment_method: string;
    total_amount: string;
}

const OrderSuccessPage: React.FC = () => {
    const { orderNumber } = useParams<{ orderNumber: string }>();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
    const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const cartCleared = useRef(false);

    // Очищаем корзину при первом рендере страницы успеха
    useEffect(() => {
        if (!cartCleared.current) {
            clearCart();
            cartCleared.current = true;
        }
    }, [clearCart]);

    useEffect(() => {
        const fetchOrderAndPaymentStatus = async () => {
            const token = localStorage.getItem('access_token');
            if (!token || !orderNumber) {
                setIsLoading(false);
                return;
            }

            try {
                // Получаем информацию о заказе
                const ordersResponse = await axios.get('/api/orders/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const order = ordersResponse.data.results?.find(
                    (o: OrderInfo) => o.order_number === orderNumber
                );

                if (order) {
                    setOrderInfo(order);

                    // Если онлайн-оплата - проверяем статус платежа
                    if (order.payment_method === 'online') {
                        try {
                            const paymentResponse = await axios.get(
                                `/api/payments/status/${order.id}/`,
                                { headers: { 'Authorization': `Bearer ${token}` } }
                            );
                            setPaymentStatus(paymentResponse.data);
                        } catch (err) {
                            console.error('Ошибка получения статуса платежа:', err);
                        }
                    }
                }
            } catch (err) {
                console.error('Ошибка получения информации о заказе:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderAndPaymentStatus();

        // Для онлайн-оплаты обновляем статус каждые 5 секунд (webhook может прийти с задержкой)
        const interval = setInterval(() => {
            if (orderInfo?.payment_method === 'online' && paymentStatus?.status === 'pending') {
                fetchOrderAndPaymentStatus();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [orderNumber, orderInfo?.payment_method, paymentStatus?.status]);

    // Компонент статуса оплаты
    const PaymentStatusBadge = () => {
        if (!paymentStatus || !orderInfo?.payment_method) return null;
        if (orderInfo.payment_method !== 'online') return null;

        const getStatusConfig = () => {
            switch (paymentStatus.status) {
                case 'succeeded':
                    return {
                        icon: <FaCheckCircle className="h-5 w-5 text-green-500" />,
                        text: 'Оплачено',
                        bgColor: 'bg-green-50',
                        borderColor: 'border-green-200',
                        textColor: 'text-green-700'
                    };
                case 'pending':
                case 'waiting_for_capture':
                    return {
                        icon: <FaClock className="h-5 w-5 text-yellow-500" />,
                        text: 'Ожидает оплаты',
                        bgColor: 'bg-yellow-50',
                        borderColor: 'border-yellow-200',
                        textColor: 'text-yellow-700'
                    };
                case 'canceled':
                    return {
                        icon: <FaTimesCircle className="h-5 w-5 text-red-500" />,
                        text: 'Оплата отменена',
                        bgColor: 'bg-red-50',
                        borderColor: 'border-red-200',
                        textColor: 'text-red-700'
                    };
                default:
                    return {
                        icon: <FaCreditCard className="h-5 w-5 text-gray-500" />,
                        text: paymentStatus.status_display || 'Статус неизвестен',
                        bgColor: 'bg-gray-50',
                        borderColor: 'border-gray-200',
                        textColor: 'text-gray-700'
                    };
            }
        };

        const config = getStatusConfig();

        return (
            <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 mb-6`}>
                <div className="flex items-center justify-center space-x-2">
                    {config.icon}
                    <span className={`font-medium ${config.textColor}`}>{config.text}</span>
                </div>
                {paymentStatus.paid_at && (
                    <p className="text-sm text-gray-500 text-center mt-1">
                        {new Date(paymentStatus.paid_at).toLocaleString('ru-RU')}
                    </p>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
                <FaSpinner className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white shadow-2xl rounded-2xl p-8 text-center">
                    {/* Иконка успеха */}
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <FaCheckCircle className="h-12 w-12 text-green-600" />
                    </div>

                    {/* Заголовок */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Заказ оформлен!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Спасибо за ваш заказ
                    </p>

                    {/* Номер заказа */}
                    {orderNumber && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-gray-600 mb-1">Номер заказа</p>
                            <p className="text-2xl font-bold text-blue-600">{orderNumber}</p>
                        </div>
                    )}

                    {/* Статус оплаты для онлайн-платежей */}
                    <PaymentStatusBadge />

                    {/* Информация */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-semibold text-gray-900 mb-2">Что дальше?</h3>
                        <ul className="text-sm text-gray-600 space-y-2">
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Мы получили ваш заказ и начали его обработку</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>В ближайшее время с вами свяжется наш менеджер для подтверждения</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Вы можете отслеживать статус заказа в личном кабинете</span>
                            </li>
                        </ul>
                    </div>

                    {/* Кнопки действий */}
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                            <FaShoppingBag className="mr-2" />
                            Мои заказы
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                        >
                            <FaHome className="mr-2" />
                            На главную
                        </button>
                    </div>
                </div>

                {/* Дополнительная информация */}
                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Если у вас есть вопросы, свяжитесь с нами:</p>
                    <p className="mt-1 font-medium text-gray-900">
                        +7 (999) 123-45-67 • info@faida.ru
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessPage;
