import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaSave, FaSpinner, FaCog, FaUndo, FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

interface PaymentSettings {
    shop_id: string;
    secret_key: string;
    is_enabled: boolean;
    webhook_secret: string;
    is_configured: boolean;
    updated_at: string | null;
}

interface PaymentInfo {
    id: number;
    yookassa_id: string;
    order_number: string;
    order_id: number;
    amount: string;
    status: string;
    status_display: string;
    paid: boolean;
    paid_at: string | null;
    refunded_amount: string;
    available_for_refund: string;
    created_at: string;
}

interface RefundModalProps {
    payment: PaymentInfo;
    onClose: () => void;
    onSuccess: () => void;
}

const RefundModal: React.FC<RefundModalProps> = ({ payment, onClose, onSuccess }) => {
    const [amount, setAmount] = useState(payment.available_for_refund);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('access_token');
            await axios.post(
                '/api/payments/refund/',
                { payment_id: payment.id, amount, reason },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            toast.success('Возврат успешно создан');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Ошибка создания возврата');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold mb-4">Возврат платежа</h3>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                    <p><strong>Заказ:</strong> {payment.order_number}</p>
                    <p><strong>Сумма платежа:</strong> {payment.amount} ₽</p>
                    <p><strong>Уже возвращено:</strong> {payment.refunded_amount} ₽</p>
                    <p><strong>Доступно к возврату:</strong> {payment.available_for_refund} ₽</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Сумма возврата (₽)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={payment.available_for_refund}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Причина возврата
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            rows={3}
                            placeholder="Опционально"
                        />
                    </div>

                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaUndo className="mr-2" />}
                            Оформить возврат
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const PaymentsSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'settings' | 'payments'>('settings');
    const [settings, setSettings] = useState<PaymentSettings | null>(null);
    const [payments, setPayments] = useState<PaymentInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refundPayment, setRefundPayment] = useState<PaymentInfo | null>(null);

    // Форма настроек
    const [shopId, setShopId] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [isEnabled, setIsEnabled] = useState(false);
    const [webhookSecret, setWebhookSecret] = useState('');

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get('/api/payments/settings/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSettings(response.data);
            setShopId(response.data.shop_id || '');
            setSecretKey(response.data.secret_key || '');
            setIsEnabled(response.data.is_enabled);
            setWebhookSecret(response.data.webhook_secret || '');
        } catch (err) {
            console.error('Ошибка загрузки настроек платежей:', err);
        }
    };

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem('access_token');
            // Получаем все заказы с онлайн-оплатой
            const ordersResponse = await axios.get('/api/orders/', {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { payment_method: 'online', limit: 100 }
            });

            const orders = ordersResponse.data.results || [];
            const paymentsData: PaymentInfo[] = [];

            for (const order of orders) {
                try {
                    const paymentResponse = await axios.get(
                        `/api/payments/status/${order.id}/`,
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    if (paymentResponse.data.payment_id) {
                        paymentsData.push({
                            id: order.id,
                            yookassa_id: paymentResponse.data.payment_id,
                            order_number: order.order_number,
                            order_id: order.id,
                            amount: paymentResponse.data.amount,
                            status: paymentResponse.data.status,
                            status_display: paymentResponse.data.status_display,
                            paid: paymentResponse.data.paid,
                            paid_at: paymentResponse.data.paid_at,
                            refunded_amount: paymentResponse.data.refunded_amount || '0',
                            available_for_refund: paymentResponse.data.available_for_refund || '0',
                            created_at: order.created_at
                        });
                    }
                } catch (err) {
                    // Пропускаем заказы без платежа
                }
            }

            setPayments(paymentsData);
        } catch (err) {
            console.error('Ошибка загрузки платежей:', err);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchSettings();
            await fetchPayments();
            setLoading(false);
        };
        loadData();
    }, []);

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('access_token');
            await axios.put(
                '/api/payments/settings/update/',
                {
                    shop_id: shopId,
                    secret_key: secretKey,
                    is_enabled: isEnabled,
                    webhook_secret: webhookSecret
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            toast.success('Настройки платежей сохранены');
            await fetchSettings();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Ошибка сохранения настроек');
        } finally {
            setSaving(false);
        }
    };

    const getStatusIcon = (status: string, paid: boolean) => {
        if (paid) return <FaCheckCircle className="text-green-500" />;
        if (status === 'canceled') return <FaTimesCircle className="text-red-500" />;
        if (status === 'pending') return <FaClock className="text-yellow-500" />;
        return <FaClock className="text-gray-500" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <FaSpinner className="animate-spin text-3xl text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="card p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FaCreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-primary-900">Платежи YooKassa</h2>
                        <p className="text-sm text-gray-600">Настройка онлайн-оплаты и управление возвратами</p>
                    </div>
                </div>

                {/* Статус подключения */}
                <div className={`p-3 rounded-lg ${settings?.is_configured ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-center">
                        {settings?.is_configured ? (
                            <>
                                <FaCheckCircle className="text-green-500 mr-2" />
                                <span className="text-green-700">
                                    YooKassa подключена {secretKey.startsWith('test_') || settings?.secret_key?.startsWith('test_') ? '(тестовый режим)' : '(боевой режим)'}
                                </span>
                            </>
                        ) : (
                            <>
                                <FaExclamationTriangle className="text-yellow-500 mr-2" />
                                <span className="text-yellow-700">YooKassa не настроена. Введите данные для подключения.</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Табы */}
            <div className="flex space-x-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'settings'
                            ? 'border-secondary-500 text-secondary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FaCog className="inline mr-2" />
                    Настройки
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'payments'
                            ? 'border-secondary-500 text-secondary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FaCreditCard className="inline mr-2" />
                    Платежи ({payments.length})
                </button>
            </div>

            {/* Настройки */}
            {activeTab === 'settings' && (
                <div className="card p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Shop ID
                        </label>
                        <input
                            type="text"
                            value={shopId}
                            onChange={(e) => setShopId(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Введите Shop ID из личного кабинета YooKassa"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Секретный ключ
                        </label>
                        <input
                            type="password"
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Введите секретный ключ"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Ключ не показывается после сохранения. Оставьте пустым, чтобы не менять.
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Включить онлайн-оплату
                            </label>
                            <p className="text-xs text-gray-500">
                                Если выключено, опция "Оплата онлайн" будет скрыта
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => setIsEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-secondary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                            <p className="text-sm text-blue-800">
                                <strong>Режим работы определяется автоматически:</strong>
                            </p>
                            <ul className="text-xs text-blue-700 mt-1 list-disc list-inside">
                                <li>Ключи вида <code className="bg-blue-100 px-1 rounded">test_...</code> → тестовый режим</li>
                                <li>Ключи вида <code className="bg-blue-100 px-1 rounded">live_...</code> → боевой режим</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-600 mb-2">
                            <strong>Webhook URL:</strong> <code className="bg-gray-100 px-2 py-1 rounded">https://ваш-домен.ru/api/payments/webhook/</code>
                        </p>
                        <p className="text-xs text-gray-500">
                            Добавьте этот URL в настройках YooKassa для получения уведомлений об оплате.
                        </p>
                    </div>

                    <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="w-full px-4 py-2 bg-secondary-500 text-primary-900 font-medium rounded-lg hover:bg-secondary-600 disabled:opacity-50 flex items-center justify-center"
                    >
                        {saving ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                        Сохранить настройки
                    </button>
                </div>
            )}

            {/* Список платежей */}
            {activeTab === 'payments' && (
                <div className="card overflow-hidden">
                    {payments.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <FaCreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Нет платежей</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Заказ</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Сумма</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Возвращено</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {payments.map((payment) => (
                                        <tr key={payment.yookassa_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <span className="font-medium">{payment.order_number}</span>
                                                <br />
                                                <span className="text-xs text-gray-500">{payment.yookassa_id}</span>
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {payment.amount} ₽
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-2">
                                                    {getStatusIcon(payment.status, payment.paid)}
                                                    <span>{payment.status_display}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {parseFloat(payment.refunded_amount) > 0 ? (
                                                    <span className="text-red-600">{payment.refunded_amount} ₽</span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('ru-RU') : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {/* Кнопка возврата (для оплаченных) */}
                                                {payment.paid && parseFloat(payment.available_for_refund) > 0 && (
                                                    <button
                                                        onClick={() => setRefundPayment(payment)}
                                                        className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                                                    >
                                                        <FaUndo className="mr-1" />
                                                        Возврат
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Модалка возврата */}
            {refundPayment && (
                <RefundModal
                    payment={refundPayment}
                    onClose={() => setRefundPayment(null)}
                    onSuccess={fetchPayments}
                />
            )}
        </div>
    );
};
