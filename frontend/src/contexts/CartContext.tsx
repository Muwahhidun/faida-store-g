/**
 * Контекст корзины для управления товарами
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: number;
  name: string;
  price: number | string;
  currency: string;
  quantity: number;
  image?: string;
  in_stock: boolean;
  stock_quantity: number;
  unit: string;
  is_weighted: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemQuantity: (productId: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart должен использоваться внутри CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // Инициализируем state из localStorage сразу (синхронно)
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('shopping_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        console.log('🔄 CartContext: Инициализация из localStorage. Товаров:', parsed.length);
        return parsed;
      }
      console.log('ℹ️ CartContext: Инициализация пустой корзины');
      return [];
    } catch (error) {
      console.error('❌ Ошибка загрузки корзины при инициализации:', error);
      return [];
    }
  });

  // Сохраняем корзину в localStorage при изменении
  useEffect(() => {
    try {
      console.log('💾 CartContext: Сохранение корзины в localStorage. Товаров:', items.length);
      localStorage.setItem('shopping_cart', JSON.stringify(items));
      console.log('✅ CartContext: Корзина сохранена');
    } catch (error) {
      console.error('❌ Ошибка сохранения корзины:', error);
    }
  }, [items]);

  const addItem = (product: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    console.log('➕ CartContext: Добавление товара:', product.name, 'количество:', quantity);
    setItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);

      if (existingItem) {
        // Товар уже в корзине, увеличиваем количество
        console.log('📦 CartContext: Товар уже в корзине, увеличиваем количество');
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock_quantity) }
            : item
        );
      } else {
        // Новый товар
        console.log('🆕 CartContext: Новый товар добавлен в корзину');
        return [...prev, { ...product, quantity: Math.min(quantity, product.stock_quantity) }];
      }
    });
  };

  const removeItem = (productId: number) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.min(quantity, item.stock_quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      return total + ((price || 0) * item.quantity);
    }, 0);
  };

  const getItemQuantity = (productId: number) => {
    const item = items.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getItemQuantity,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
