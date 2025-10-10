import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingBag, FaBox, FaTruck, FaCheckCircle, FaTimesCircle, FaClock, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { ordersApi } from '@/api/client';
import { toast } from 'react-hot-toast';
import ProductImage from '../ProductImage';

const OrdersSection: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await ordersApi.getOrders();
      setOrders(data);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка загрузки заказов');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
      pending: {
        label: 'Ожидает подтверждения',
        icon: FaClock,
        color: 'text-yellow-700',
        bgColor: 'bg-white border-gray-200'
      },
      confirmed: {
        label: 'Подтвержден',
        icon: FaCheckCircle,
        color: 'text-blue-700',
        bgColor: 'bg-white border-gray-200'
      },
      processing: {
        label: 'Обрабатывается',
        icon: FaBox,
        color: 'text-purple-700',
        bgColor: 'bg-white border-gray-200'
      },
      shipping: {
        label: 'В доставке',
        icon: FaTruck,
        color: 'text-indigo-700',
        bgColor: 'bg-white border-gray-200'
      },
      delivered: {
        label: 'Доставлен',
        icon: FaCheckCircle,
        color: 'text-green-700',
        bgColor: 'bg-white border-gray-200'
      },
      cancelled: {
        label: 'Отменен',
        icon: FaTimesCircle,
        color: 'text-red-700',
        bgColor: 'bg-white border-gray-200'
      }
    };

    return statusMap[status] || statusMap.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number | string, currency: string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `${(numPrice || 0).toFixed(2)} ${currency}`;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash_on_delivery: 'Наличными при получении',
      card_on_delivery: 'Картой при получении'
    };
    return methods[method] || method;
  };

  const toggleOrderExpanded = (orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Загрузка заказов...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Мои заказы</h3>
        {orders.length > 0 && (
          <span className="text-sm text-gray-600">Всего заказов: {orders.length}</span>
        )}
      </div>

      {/* Список заказов */}
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">У вас пока нет заказов</p>
          <button
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={order.id}
                className={`p-6 border-2 rounded-lg ${statusInfo.bgColor} hover:shadow-md transition-shadow`}
              >
                {/* Шапка заказа */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Заказ №{order.order_number}
                      </h4>
                      <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{statusInfo.label}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Итого:</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatPrice(order.total_amount, 'RUB')}
                    </p>
                  </div>
                </div>

                {/* Информация о заказе */}
                <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex text-sm">
                    <span className="text-gray-600 w-40 flex-shrink-0">Получатель:</span>
                    <span className="text-gray-700">{order.customer_name}</span>
                  </div>

                  <div className="flex text-sm">
                    <span className="text-gray-600 w-40 flex-shrink-0">Телефон:</span>
                    <span className="text-gray-700">{order.customer_phone}</span>
                  </div>

                  <div className="flex text-sm">
                    <span className="text-gray-600 w-40 flex-shrink-0">Адрес доставки:</span>
                    <span className="text-gray-700">{order.delivery_address}</span>
                  </div>

                  {order.delivery_comment && (
                    <div className="flex text-sm">
                      <span className="text-gray-600 w-40 flex-shrink-0">Примечание:</span>
                      <span className="text-gray-700">{order.delivery_comment}</span>
                    </div>
                  )}

                  <div className="flex text-sm">
                    <span className="text-gray-600 w-40 flex-shrink-0">Оплата:</span>
                    <span className="text-gray-700">{getPaymentMethodLabel(order.payment_method)}</span>
                  </div>

                  {order.comment && (
                    <div className="flex text-sm">
                      <span className="text-gray-600 w-40 flex-shrink-0">Комментарий:</span>
                      <span className="text-gray-700">{order.comment}</span>
                    </div>
                  )}
                </div>

                {/* Товары в заказе */}
                <div className="mb-4">
                  <button
                    onClick={() => toggleOrderExpanded(order.id)}
                    className="w-full flex items-center justify-between text-sm text-gray-600 mb-2 hover:text-gray-900 transition-colors cursor-pointer py-2 px-3 rounded hover:bg-gray-50"
                  >
                    <span>Товары ({order.items?.length || 0})</span>
                    {expandedOrders.has(order.id) ? (
                      <FaChevronUp className="w-3 h-3" />
                    ) : (
                      <FaChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  {expandedOrders.has(order.id) && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Товар
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Количество
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Цена
                            </th>
                            <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Сумма
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {order.items?.map((item: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 w-12 h-12 bg-white rounded overflow-hidden border border-gray-200">
                                    {item.product_image ? (
                                      <ProductImage
                                        src={item.product_image}
                                        alt={item.product_name || 'Товар'}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                        <FaShoppingBag className="w-4 h-4 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">
                                      {item.product_name || `Товар #${item.product_id}`}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                                {item.quantity}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                                {formatPrice(item.price, 'RUB')}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                {formatPrice(item.quantity * parseFloat(item.price), 'RUB')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersSection;
