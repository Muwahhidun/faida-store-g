import React, { useState, useEffect } from 'react';
import { FaShoppingBag, FaBox, FaTruck, FaCheckCircle, FaTimesCircle, FaClock, FaChevronDown, FaChevronUp, FaSearch, FaCalendarAlt, FaSpinner, FaChevronLeft, FaChevronRight, FaCopy } from 'react-icons/fa';
import { adminClient } from '@/api/adminClient';
import ProductImage from '../../ProductImage';
import { CustomSelect } from '../../CustomSelect';
import { CustomDatePicker } from '../../CustomDatePicker';

interface OrdersManagementSectionProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const PAGE_SIZE = 10;

const OrdersManagementSection: React.FC<OrdersManagementSectionProps> = ({
  onError,
  onSuccess,
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [expandedOrderDetails, setExpandedOrderDetails] = useState<Set<number>>(new Set());

  // Пагинация
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    count: 0,
  });

  // Фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortByAmount, setSortByAmount] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [changingStatus, setChangingStatus] = useState<number | null>(null);

  const loadOrders = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const params: any = {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      };

      // Добавляем фильтры в запрос
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (dateFrom) {
        params.date_from = dateFrom;
      }
      if (dateTo) {
        params.date_to = dateTo;
      }
      if (sortByAmount) {
        params.ordering = sortByAmount;
      }

      const response = await adminClient.get('/orders/', { params });
      const ordersData = response.data.results || response.data;
      const count = response.data.count || ordersData.length;

      setOrders(ordersData);
      setPagination({
        page,
        totalPages: Math.ceil(count / PAGE_SIZE),
        count,
      });
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Ошибка загрузки заказов');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(1);
  }, [statusFilter, searchQuery, dateFrom, dateTo, sortByAmount]);

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
      card_on_delivery: 'Картой при получении',
      online: 'Оплата онлайн'
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

  // Копирование названий товаров в буфер обмена
  const copyProductNames = async (items: any[]) => {
    try {
      const names = items.map(item => item.product_name || `Товар #${item.product_id}`).join('\n');
      await navigator.clipboard.writeText(names);
      onSuccess(`Скопировано ${items.length} названий товаров`);
    } catch (error) {
      onError('Ошибка копирования в буфер обмена');
    }
  };

  // Копирование количеств товаров в буфер обмена
  const copyProductQuantities = async (items: any[]) => {
    try {
      const quantities = items.map(item => item.quantity).join('\n');
      await navigator.clipboard.writeText(quantities);
      onSuccess(`Скопировано ${items.length} количеств`);
    } catch (error) {
      onError('Ошибка копирования в буфер обмена');
    }
  };

  return (
    <div className="space-y-4">
      {/* Заголовок и фильтры */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        {/* Заголовок */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
            <FaShoppingBag className="w-5 h-5 text-secondary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Управление заказами</h2>
            <p className="text-sm text-gray-600">
              Всего заказов: {pagination.count} • Страница {pagination.page} из {pagination.totalPages}
            </p>
          </div>
        </div>

        {/* Панель фильтров */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Поиск */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="По номеру, имени, телефону..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Статус заказа */}
            <div>
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

            {/* Сумма заказа */}
            <div>
              <CustomSelect
                value={sortByAmount}
                onChange={(value) => setSortByAmount(value)}
                options={[
                  { value: '', label: 'Без сортировки' },
                  { value: 'total_amount', label: 'По возрастанию' },
                  { value: '-total_amount', label: 'По убыванию' }
                ]}
                label="Сумма заказа"
              />
            </div>

            {/* Дата от */}
            <div>
              <CustomDatePicker
                value={dateFrom}
                onChange={setDateFrom}
                label="Дата от"
                placeholder="Выберите дату"
              />
            </div>

            {/* Дата до */}
            <div>
              <CustomDatePicker
                value={dateTo}
                onChange={setDateTo}
                label="Дата до"
                placeholder="Выберите дату"
              />
            </div>
          </div>

          {/* Кнопка очистки фильтров */}
          <button
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setSearchQuery('');
              setStatusFilter('all');
              setSortByAmount('');
            }}
            className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            title="Очистить все фильтры"
          >
            <FaTimesCircle className="w-4 h-4" />
            <span>Очистить фильтры</span>
          </button>
        </div>
      </div>

      {/* Список заказов */}
      {isLoading ? (
        <div className="py-12 text-center bg-white rounded-lg border border-gray-200">
          <FaSpinner className="w-8 h-8 text-secondary-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Загрузка заказов...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-lg border border-gray-200">
          <FaShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchQuery || statusFilter !== 'all' || dateFrom || dateTo ? 'Заказы не найдены' : 'Заказов пока нет'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
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
                  className={`flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 p-3 sm:p-4 rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${statusInfo.bgColor} gap-3`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                        Заказ №{order.order_number}
                      </h4>
                      <div className={`flex items-center space-x-1.5 px-2 sm:px-3 py-1 rounded-full border-2 ${statusInfo.bgColor} ${statusInfo.color} self-start sm:self-auto`}>
                        <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm font-medium">{statusInfo.label}</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/50">
                    <div className="sm:text-right">
                      <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Итого:</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">
                        {formatPrice(order.total_amount, 'RUB')}
                      </p>
                    </div>
                    {expandedOrderDetails.has(order.id) ? (
                      <FaChevronUp className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    ) : (
                      <FaChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
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
                      <div className="w-full md:w-64" onClick={(e) => e.stopPropagation()}>
                        <CustomSelect
                          value={order.status}
                          onChange={(value) => handleStatusChange(order.id, value)}
                          options={[
                            { value: 'pending', label: 'Ожидает подтверждения' },
                            { value: 'confirmed', label: 'Подтвержден' },
                            { value: 'processing', label: 'Обрабатывается' },
                            { value: 'shipping', label: 'В доставке' },
                            { value: 'delivered', label: 'Доставлен' },
                            { value: 'cancelled', label: 'Отменен' }
                          ]}
                          label="Изменить статус заказа:"
                          disabled={changingStatus === order.id}
                        />
                      </div>
                    </div>

                    {/* Информация о заказе */}
                    <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row text-sm gap-0.5 sm:gap-0">
                    <span className="text-gray-600 sm:w-40 flex-shrink-0 font-medium sm:font-normal">Получатель:</span>
                    <span className="text-gray-700">{order.customer_name}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row text-sm gap-0.5 sm:gap-0">
                    <span className="text-gray-600 sm:w-40 flex-shrink-0 font-medium sm:font-normal">Телефон:</span>
                    <span className="text-gray-700">{order.customer_phone}</span>
                  </div>

                  {order.customer_email && (
                    <div className="flex flex-col sm:flex-row text-sm gap-0.5 sm:gap-0">
                      <span className="text-gray-600 sm:w-40 flex-shrink-0 font-medium sm:font-normal">Email:</span>
                      <span className="text-gray-700">{order.customer_email}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row text-sm gap-0.5 sm:gap-0">
                    <span className="text-gray-600 sm:w-40 flex-shrink-0 font-medium sm:font-normal">Адрес доставки:</span>
                    <span className="text-gray-700 break-words">{order.delivery_address}</span>
                  </div>

                  {order.delivery_comment && (
                    <div className="flex flex-col sm:flex-row text-sm gap-0.5 sm:gap-0">
                      <span className="text-gray-600 sm:w-40 flex-shrink-0 font-medium sm:font-normal">Примечание:</span>
                      <span className="text-gray-700 break-words">{order.delivery_comment}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row text-sm gap-0.5 sm:gap-0">
                    <span className="text-gray-600 sm:w-40 flex-shrink-0 font-medium sm:font-normal">Оплата:</span>
                    <span className="text-gray-700">{getPaymentMethodLabel(order.payment_method)}</span>
                  </div>

                  {order.comment && (
                    <div className="flex flex-col sm:flex-row text-sm gap-0.5 sm:gap-0">
                      <span className="text-gray-600 sm:w-40 flex-shrink-0 font-medium sm:font-normal">Комментарий:</span>
                      <span className="text-gray-700 break-words">{order.comment}</span>
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
                            <th scope="col" className="px-3 py-3 text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyProductNames(order.items || []);
                                }}
                                className="flex items-center gap-2 text-xs font-medium text-secondary-600 uppercase tracking-wider hover:text-blue-800 transition-colors group"
                                title="Копировать названия товаров"
                              >
                                <FaCopy className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                                Товар
                              </button>
                            </th>
                            <th scope="col" className="px-3 py-3 text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyProductQuantities(order.items || []);
                                }}
                                className="flex items-center gap-2 text-xs font-medium text-secondary-600 uppercase tracking-wider hover:text-blue-800 transition-colors group"
                                title="Копировать количества"
                              >
                                <FaCopy className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                                Количество
                              </button>
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

      {/* Пагинация */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <button
            onClick={() => loadOrders(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Предыдущая</span>
          </button>

          <span className="text-xs sm:text-sm text-gray-600">
            {pagination.page} / {pagination.totalPages}
          </span>

          <button
            onClick={() => loadOrders(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="hidden sm:inline">Следующая</span>
            <FaChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdersManagementSection;
