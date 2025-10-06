/**
 * Глобальное состояние приложения с Zustand.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, CartItem, ProductListItem, Category } from '@/types';

// Состояние корзины
interface CartState {
  cart: Cart;
  addToCart: (product: ProductListItem, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalQuantity: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: {
        items: [],
        total_quantity: 0,
        total_price: 0,
      },

      addToCart: (product: ProductListItem, quantity = 1) => {
        set((state) => {
          const existingItem = state.cart.items.find(
            (item) => item.product.id === product.id
          );

          let newItems: CartItem[];

          if (existingItem) {
            // Обновляем количество существующего товара
            newItems = state.cart.items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            // Добавляем новый товар
            newItems = [
              ...state.cart.items,
              {
                product,
                quantity,
                price: product.price,
              },
            ];
          }

          const totalQuantity = newItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalPrice = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

          return {
            cart: {
              items: newItems,
              total_quantity: totalQuantity,
              total_price: totalPrice,
            },
          };
        });
      },

      removeFromCart: (productId: number) => {
        set((state) => {
          const newItems = state.cart.items.filter(
            (item) => item.product.id !== productId
          );

          const totalQuantity = newItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalPrice = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

          return {
            cart: {
              items: newItems,
              total_quantity: totalQuantity,
              total_price: totalPrice,
            },
          };
        });
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set((state) => {
          const newItems = state.cart.items.map((item) =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          );

          const totalQuantity = newItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalPrice = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

          return {
            cart: {
              items: newItems,
              total_quantity: totalQuantity,
              total_price: totalPrice,
            },
          };
        });
      },

      clearCart: () => {
        set({
          cart: {
            items: [],
            total_quantity: 0,
            total_price: 0,
          },
        });
      },

      getTotalPrice: () => {
        const state = get();
        return state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTotalQuantity: () => {
        const state = get();
        return state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

// Состояние фильтров
interface FilterState {
  selectedCategory: Category | null;
  priceRange: [number, number];
  searchQuery: string;
  sortBy: string;
  onlyInStock: boolean;
  setSelectedCategory: (category: Category | null) => void;
  setPriceRange: (range: [number, number]) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: string) => void;
  setOnlyInStock: (inStock: boolean) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      selectedCategory: null,
      priceRange: [0, 10000],
      searchQuery: '',
      sortBy: '-created_at',
      onlyInStock: false,

      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setPriceRange: (range) => set({ priceRange: range }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSortBy: (sort) => set({ sortBy: sort }),
      setOnlyInStock: (inStock) => set({ onlyInStock: inStock }),

      clearFilters: () => set({
        selectedCategory: null,
        priceRange: [0, 10000],
        searchQuery: '',
        sortBy: '-created_at',
        onlyInStock: false,
      }),
    }),
    {
      name: 'filter-storage',
    }
  )
);

// Состояние UI
interface UIState {
  sidebarOpen: boolean;
  cartOpen: boolean;
  searchOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleCart: () => void;
  toggleSearch: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: false,
  cartOpen: false,
  searchOpen: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCartOpen: (open) => set({ cartOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleCart: () => set((state) => ({ cartOpen: !state.cartOpen })),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
}));