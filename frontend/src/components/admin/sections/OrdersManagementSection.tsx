import React, { useState, useEffect } from 'react';
import { FaShoppingBag, FaBox, FaTruck, FaCheckCircle, FaTimesCircle, FaClock, FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';
import { adminClient } from '@/api/adminClient';
import ProductImage from '../../ProductImage';
import { CustomSelect } from '../../CustomSelect';

interface OrdersManagementSectionProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const OrdersManagementSection: React.FC<OrdersManagementSectionProps> = ({
  onError,
  onSuccess,
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [expandedOrderDetails, setExpandedOrderDetails] = useState<Set<number>>(new Set());

  // Фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [changingStatus, setChangingStatus] = useState<number | null>(null);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await adminClient.get('/orders/');
      const ordersData = response.data.results || response.data;
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Ошибка загрузки заказов');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Фильтрация заказов
  useEffect(() => {
    let filtered = [...orders];

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Поиск по номеру заказа, имени или телефону
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_phone.includes(query)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchQuery]);

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
      pending: {
        label: 'Ожидает подтверждения',
        icon: FaClock,
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50 border-yellow-200'
      },
      confirmed: {
        label: 'Подтвержден',
        icon: FaCheckCircle,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50 border-blue-200'
      },
      processing: {
        label: 'Обрабатывается',
        icon: FaBox,
        color: 'text-purple-700',
        bgColor: 'bg-purple-50 border-purple-200'
      },
      shipping: {
        label: 'В доставке',
        icon: FaTruck,
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-50 border-indigo-200'
      },
      delivered: {
        label: 'Доставлен',
        icon: FaCheckCircle,
        color: 'text-green-700',
        bgColor: 'bg-green-50 border-green-200'
      },
      cancelled: {
        label: 'Отменен',
        icon: FaTimesCircle,
        color: 'text-red-700',
        bgColor: 'bg-red-50 border-red-200'
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

  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrderDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      setChangingStatus(orderId);
      await adminClient.patch(`/orders/${orderId}/`, { status: newStatus });

      // Обновляем локальное состояние
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      onSuccess('Статус заказа успешно изменен');
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Ошибка изменения статуса');
    } finally {
      setChangingStatus(null);
    }
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
      {/* Заголовок и фильтры */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Управление заказами</h3>
          <div className="text-sm text-gray-600">
            Показано: {filteredOrders.length} из {orders.length} заказов
          </div>
        </div>

        {/* Поиск и фильтры */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Поиск */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по номеру заказа, имени или телефону..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Фильтр по статусу */}
          <CustomSelect
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { value: 'all', label: 'Все статусы' },
              { value: 'pending', label: 'Ожидает подтверждения' },
              { value: 'confirmed', label: 'Подтвержден' },
              { value: 'processing', label: 'Обрабатывается' },
              { value: 'shipping', label: 'В доставке' },
              { value: 'delivered', label: 'Доставлен' },
              { value: 'cancelled', label: 'Отменен' }
            ]}
            label="Статус заказа"
          />
        </div>
      </div>

      {/* Список заказов */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FaShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchQuery || statusFilter !== 'all' ? 'Заказы не найдены' : 'Заказов пока нет'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={order.id}
                className="p-6 border-2 rounded-lg bg-white border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Шапка заказа (кликабельная) */}
                <div
                  onClick={() => toggleOrderDetails(order.id)}
                  className={`flex items-start justify-between mb-4 p-4 rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${statusInfo.bgColor}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Заказ №{order.order_number}
                      </h4>
                      <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border-2 ${statusInfo.bgColor} ${statusInfo.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{statusInfo.label}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Итого:</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatPrice(order.total_amount, 'RUB')}
                      </p>
                    </div>
                    {expandedOrderDetails.has(order.id) ? (
                      <FaChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <FaChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </div>

                {/* Детальная информация (раскрывается по клику) */}
                {expandedOrderDetails.has(order.id) && (
                  <>
                    {/* Информация о пользователе */}
                    {order.user && (
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <p className="text-sm text-gray-600">
                          Пользователь: <span className="font-medium text-gray-900">{order.user.username}</span> (ID: {order.user.id})
                        </p>
                        {order.user.email && (
                          <p className="text-sm text-gray-600">
                            Email: <span className="font-medium text-gray-900">{order.user.email}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Изменение статуса */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Изменить статус заказа:
                      </label>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={changingStatus === order.id}
                        className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">Ожидает подтверждения</option>
                        <option value="confirmed">Подтвержден</option>
                        <option value="processing">Обрабатывается</option>
                        <option value="shipping">В доставке</option>
                        <option value="delivered">Доставлен</option>
                        <option value="cancelled">Отменен</option>
                      </select>
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

                  {order.customer_email && (
                    <div className="flex text-sm">
                      <span className="text-gray-600 w-40 flex-shrink-0">Email:</span>
                      <span className="text-gray-700">{order.customer_email}</span>
                    </div>
                  )}

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
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOrderExpanded(order.id);
                    }}
                    className="w-full flex items-center justify-between mb-2 hover:text-gray-900 transition-colors cursor-pointer py-2 px-3 rounded hover:bg-gray-50"
                  >
                    <span className="text-lg font-semibold text-gray-900">Товары ({order.items?.length || 0})</span>
                    {expandedOrders.has(order.id) ? (
                      <FaChevronUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <FaChevronDown className="w-4 h-4 text-gray-600" />
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
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersManagementSection;
