/**
 * Страница корзины товаров
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ShoppingCartIcon,
  TrashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useCart } from '../contexts/CartContext';
import ProductImage from '../components/ProductImage';
import CartButton from '../components/CartButton';

const CartPage: React.FC = () => {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    getTotalItems, 
    getTotalPrice 
  } = useCart();

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <Helmet>
          <title>Корзина пуста</title>
        </Helmet>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingCartIcon className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Корзина пуста
            </h1>
            <p className="text-gray-600 mb-8 text-lg">
              Добавьте товары в корзину, чтобы оформить заказ
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
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
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Корзина</h1>
            <p className="text-gray-600 mt-1">
              {getTotalItems()} {getTotalItems() === 1 ? 'товар' : 
               getTotalItems() < 5 ? 'товара' : 'товаров'} на сумму {formatPrice(getTotalPrice(), items[0]?.currency || 'RUB')}
            </p>
          </div>
          
          <button
            onClick={clearCart}
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
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start gap-4">
                  {/* Изображение товара */}
                  <div className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded-lg overflow-hidden">
                    {item.image ? (
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <ShoppingCartIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Информация о товаре */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <Link
                          to={`/products/${item.id}`}
                          className="font-medium text-gray-900 hover:text-emerald-600 transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatPrice(item.price, item.currency)} за {item.unit}
                        </p>
                        
                        {/* Статус наличия */}
                        <div className="mt-2">
                          {item.in_stock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              В наличии ({formatQuantity(item.stock_quantity, item.unit)} {item.unit})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Нет в наличии
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Управление количеством */}
                    <div className="flex items-center justify-between mt-4">
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
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(item.price * item.quantity, item.currency)}
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
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
                  <span className="font-medium text-green-600">Бесплатно</span>
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
                <button className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                  Оформить заказ
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
                  <p>✓ Бесплатная доставка от 2000 ₽</p>
                  <p>✓ Возврат в течение 14 дней</p>
                  <p>✓ Гарантия качества</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
