/**
 * Компонент кнопки добавления в корзину с счетчиком
 */

import React from 'react';
import { ShoppingCartIcon, PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCart } from '../contexts/CartContext';

interface Product {
  id: number;
  name: string;
  price: number | string;
  currency: string;
  in_stock: boolean;
  stock_quantity: number;
  unit: string;
  is_weighted: boolean;
  main_image?: string;
}

interface CartButtonProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CartButton: React.FC<CartButtonProps> = ({
  product,
  size = 'md',
  className = ''
}) => {
  const { addItem, updateQuantity, getItemQuantity, removeItem } = useCart();
  const quantity = getItemQuantity(product.id);

  const formatQuantity = (qty: number, unit: string) => {
    // Для штук - целое число
    if (unit === 'шт' || unit === 'шт.') {
      return Math.floor(qty).toString();
    }
    // Для веса (кг, г) - 3 знака после запятой
    if (unit === 'кг' || unit === 'г' || unit === 'кг.' || unit === 'г.') {
      return qty.toFixed(3);
    }
    // По умолчанию - 3 знака
    return qty.toFixed(3);
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      image: product.main_image,
      in_stock: product.in_stock,
      stock_quantity: product.stock_quantity,
      unit: product.unit,
      is_weighted: product.is_weighted,
    });
  };

  const handleIncrement = () => {
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = () => {
    updateQuantity(product.id, quantity - 1);
  };

  // Размеры для разных вариантов
  const sizeClasses = {
    sm: {
      button: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      counter: 'px-2 py-1 text-xs min-w-[50px]',
      counterButton: 'w-6 h-6',
      counterIcon: 'w-3 h-3',
    },
    md: {
      button: 'px-3 py-2 text-sm',
      icon: 'w-4 h-4',
      counter: 'px-2 py-2 text-sm min-w-[70px]',
      counterButton: 'w-8 h-8 flex-shrink-0',
      counterIcon: 'w-4 h-4',
    },
    lg: {
      button: 'px-6 py-3 text-base',
      icon: 'w-5 h-5',
      counter: 'px-4 py-3 text-base min-w-[90px]',
      counterButton: 'w-12 h-12 flex-shrink-0',
      counterIcon: 'w-5 h-5',
    },
  };

  const sizes = sizeClasses[size];

  // Проверка доступности товара
  const isAvailable = product.in_stock && product.stock_quantity > 0;

  if (!isAvailable) {
    return (
      <button
        disabled
        className={`flex items-center justify-center gap-2 bg-gray-100 text-gray-400 border border-gray-200 rounded-lg cursor-not-allowed ${sizes.button} ${className}`}
      >
        <ShoppingCartIcon className={sizes.icon} />
        Нет в наличии
      </button>
    );
  }

  if (quantity === 0) {
    // Кнопка "Добавить в корзину"
    return (
      <button
        onClick={handleAddToCart}
        className={`flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 rounded-lg transition-colors ${sizes.button} ${className}`}
      >
        <ShoppingCartIcon className={sizes.icon} />
        В корзину
      </button>
    );
  }

  // Счетчик с кнопками удаления, -, + 
  return (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={() => removeItem(product.id)}
        className={`flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 rounded-l-lg transition-colors ${sizes.counterButton} mr-1`}
        title="Удалить из корзины"
      >
        <TrashIcon className={sizes.counterIcon} />
      </button>
      
      <button
        onClick={handleDecrement}
        className={`flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-colors ${sizes.counterButton}`}
      >
        <MinusIcon className={sizes.counterIcon} />
      </button>
      
      <div className={`flex items-center justify-center bg-white border-t border-b border-gray-300 font-medium text-gray-900 ${sizes.counter}`}>
        {formatQuantity(quantity, product.unit)}
      </div>
      
      <button
        onClick={handleIncrement}
        disabled={quantity >= product.stock_quantity}
        className={`flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white border border-emerald-600 disabled:border-gray-300 rounded-r-lg transition-colors ${sizes.counterButton}`}
      >
        <PlusIcon className={sizes.counterIcon} />
      </button>
    </div>
  );
};

export default CartButton;
