/**
 * Страница корзины товаров
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ShoppingCartIcon,
  TrashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useCart } from '../contexts/CartContext';
import ProductImage from '../components/ProductImage';
import CartButton from '../components/CartButton';
import { useSiteSettings } from '../hooks/api';
import OrderStepper from '../components/OrderStepper';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalItems,
    getTotalPrice
  } = useCart();

  // Получаем настройки сайта
  const { data: siteSettings } = useSiteSettings();

  // Состояние для модального окна подтверждения очистки корзины
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
  };

  const formatPrice = (price: number | string, currency: string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `${(numPrice || 0).toFixed(2)} ${currency}`;
  };

  const formatQuantity = (quantity: number | string, unit: string) => {
    const numQuantity = typeof quantity === 'string' ? parseFloat(quantity) : quantity;

    // Для штук - целое число
    if (unit === 'шт' || unit === 'шт.') {
      return Math.floor(numQuantity).toString();
    }

    // Для веса (кг, г) - показываем с точностью, но убираем лишние нули
    if (unit === 'кг' || unit === 'г' || unit === 'кг.' || unit === 'г.') {
      return numQuantity.toFixed(3).replace(/\.?0+$/, '');
    }

    // По умолчанию - если целое число, показываем без дробной части
    if (Number.isInteger(numQuantity)) {
      return numQuantity.toString();
    }

    // Для дробных - убираем лишние нули
    return numQuantity.toFixed(3).replace(/\.?0+$/, '');
  };

  /**
   * Форматирует статус наличия товара в зависимости от настроек сайта
   */
  const formatStockStatus = (inStock: boolean, stockQuantity: number, unit: string) => {
    // Если настройки еще не загружены, используем значение по умолчанию
    const displayStyle = siteSettings?.default_stock_display_style || 'detailed_status';
    const lowThreshold = siteSettings?.default_low_stock_threshold || 5;

    if (!inStock) {
      return 'Нет в наличии';
    }

    // Режим 'exact' - показываем точное количество
    if (displayStyle === 'exact') {
      return `В наличии (${formatQuantity(stockQuantity, unit)} ${unit})`;
    }

    // Режим 'status' - только статус без количества
    if (displayStyle === 'status') {
      return 'В наличии';
    }

    // Режим 'detailed_status' - детальный статус без количества
    if (displayStyle === 'detailed_status') {
      if (stockQuantity <= lowThreshold) {
        return 'Мало';
      }
      return 'В наличии';
    }

    // По умолчанию возвращаем простой статус
    return 'В наличии';
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <Helmet>
          <title>Корзина пуста</title>
        </Helmet>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingCartIcon className="w-16 sm:w-24 h-16 sm:h-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Корзина пуста
            </h1>
            <p className="text-gray-600 mb-8 text-lg">
              Добавьте товары в корзину, чтобы оформить заказ
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-secondary-500 text-primary-800 font-medium rounded-lg hover:bg-secondary-600 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Перейти к товарам
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <Helmet>
          <title>{`Корзина (${getTotalItems()} товаров)`}</title>
        </Helmet>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stepper */}
        <OrderStepper currentStep={1} />

        {/* Кнопка очистить корзину */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <TrashIcon className="w-5 h-5 mr-2" />
            Очистить корзину
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Список товаров */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Изображение товара */}
                  <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-lg overflow-hidden">
                    {item.image ? (
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <ShoppingCartIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Информация о товаре */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <Link
                          to={`/products/${item.id}`}
                          className="font-medium text-gray-900 hover:text-secondary-600 transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm mt-1">
                          <span className="text-primary-800 font-semibold">{formatPrice(item.price, item.currency)}</span>
                          <span className="text-gray-600"> за {item.unit}</span>
                        </p>
                        
                        {/* Статус наличия */}
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.in_stock
                              ? item.stock_quantity <= (siteSettings?.default_low_stock_threshold || 5)
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-success-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {formatStockStatus(item.in_stock, item.stock_quantity, item.unit)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Управление количеством */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-3">
                      <CartButton
                        product={{
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          currency: item.currency,
                          in_stock: item.in_stock,
                          stock_quantity: item.stock_quantity,
                          unit: item.unit,
                          is_weighted: item.is_weighted || false,
                          main_image: item.image
                        }}
                        size="md"
                      />

                      {/* Общая стоимость позиции */}
                      <div className="text-right sm:text-right">
                        <p className="text-lg font-bold text-primary-800">
                          {formatPrice((typeof item.price === 'string' ? parseFloat(item.price) : item.price) * item.quantity, item.currency)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.price, item.currency)} × {formatQuantity(item.quantity, item.unit)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Итоговая информация */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Итого
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Товары ({getTotalItems()})</span>
                  <span className="font-medium">
                    {formatPrice(getTotalPrice(), items[0]?.currency || 'RUB')}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Доставка</span>
                  <span className="font-medium text-success-600">Бесплатно</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">К оплате</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(getTotalPrice(), items[0]?.currency || 'RUB')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-secondary-500 text-white py-3 px-4 rounded-lg hover:bg-secondary-600 transition-colors font-medium"
                >
                  К оформлению
                </button>

                <Link
                  to="/products"
                  className="w-full block text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Продолжить покупки
                </Link>
              </div>

              {/* Дополнительная информация */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600 space-y-2">
                  <p>✓ Бесплатная доставка</p>
                  <p>✓ Возврат в течение 14 дней</p>
                  <p>✓ Гарантия качества</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Модальное окно подтверждения очистки корзины */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <TrashIcon className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Очистить корзину?
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                Вы уверены, что хотите удалить все товары из корзины? Это действие нельзя отменить.
              </p>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium w-full sm:w-auto"
                >
                  Отмена
                </button>
                <button
                  onClick={handleClearCart}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium w-full sm:w-auto"
                >
                  Очистить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
