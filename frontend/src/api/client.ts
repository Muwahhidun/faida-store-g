/**
 * API клиент для взаимодействия с Django backend.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  Product,
  ProductListItem,
  Category,
  ProductFilters,
  CategoryFilters,
  PaginatedResponse,
  CategoryStats,
  ApiError,
} from '@/types';

// Создаем экземпляр axios
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена авторизации
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: 'Произошла ошибка при выполнении запроса',
      status: error.response?.status,
    };

    if (error.response?.data) {
      const data = error.response.data as any;
      if (data.detail) {
        apiError.message = data.detail;
      } else if (data.message) {
        apiError.message = data.message;
      } else if (typeof data === 'string') {
        apiError.message = data;
      }

      if (data.errors) {
        apiError.details = data.errors;
      }
    } else if (error.message) {
      apiError.message = error.message;
    }

    // Сохраняем оригинальный объект ошибки для дебага
    (apiError as any).originalError = error;

    return Promise.reject(apiError);
  }
);

// API методы для товаров
export const productsApi = {
  // Получить список товаров
  getProducts: async (filters?: ProductFilters): Promise<PaginatedResponse<ProductListItem>> => {
    const response = await apiClient.get('/products/', { params: filters });
    return response.data;
  },

  // Получить товар по ID
  getProduct: async (id: number): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}/`);
    return response.data;
  },

  // Получить похожие товары
  getSimilarProducts: async (id: number): Promise<ProductListItem[]> => {
    const response = await apiClient.get(`/products/${id}/similar/`);
    return response.data;
  },

  // Получить популярные товары
  getPopularProducts: async (): Promise<ProductListItem[]> => {
    const response = await apiClient.get('/products/popular/');
    return response.data;
  },

  // Получить рекомендуемые товары
  getFeaturedProducts: async (): Promise<ProductListItem[]> => {
    const response = await apiClient.get('/products/featured/');
    return response.data;
  },

  // Получить статистику по категориям
  getCategoriesStats: async (): Promise<CategoryStats[]> => {
    const response = await apiClient.get('/products/categories_stats/');
    return response.data;
  },
};

// API методы для категорий
export const categoriesApi = {
  // Получить список категорий
  getCategories: async (filters?: CategoryFilters): Promise<PaginatedResponse<Category>> => {
    const response = await apiClient.get('/categories/', { params: filters });
    return response.data;
  },

  // Получить категорию по ID
  getCategory: async (id: number): Promise<Category> => {
    const response = await apiClient.get(`/categories/${id}/`);
    return response.data;
  },

  // Получить дерево категорий
  getCategoriesTree: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories/tree/');
    return response.data;
  },

  // Получить товары категории
  getCategoryProducts: async (
    id: number, 
    filters?: ProductFilters
  ): Promise<PaginatedResponse<ProductListItem>> => {
    const response = await apiClient.get(`/categories/${id}/products/`, { params: filters });
    return response.data;
  },
};

// API методы для профиля пользователя
export const profileApi = {
  // Получить данные текущего пользователя
  getMe: async (): Promise<any> => {
    const token = localStorage.getItem('access_token');
    const response = await apiClient.get('/users-management/me/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Обновить профиль текущего пользователя
  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  }): Promise<any> => {
    const token = localStorage.getItem('access_token');
    const response = await apiClient.patch('/users-management/update_profile/', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Изменить пароль
  changePassword: async (data: {
    current_password: string;
    new_password: string;
  }): Promise<any> => {
    const token = localStorage.getItem('access_token');
    const response = await apiClient.post('/users-management/change_password/', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

// API методы для адресов доставки
export const addressApi = {
  // Получить список адресов текущего пользователя
  getAddresses: async (): Promise<any[]> => {
    const token = localStorage.getItem('access_token');
    const response = await apiClient.get('/delivery-addresses/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Получить адрес по ID
  getAddress: async (id: number): Promise<any> => {
    const token = localStorage.getItem('access_token');
    const response = await apiClient.get(`/delivery-addresses/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Создать новый адрес
  createAddress: async (data: {
    full_address: string;
    city: string;
    street: string;
    house: string;
    apartment?: string;
    entrance?: string;
    floor?: string;
    comment?: string;
    latitude: number;
    longitude: number;
    label?: string;
    is_default?: boolean;
  }): Promise<any> => {
    const token = localStorage.getItem('access_token');
    const response = await apiClient.post('/delivery-addresses/', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Обновить адрес
  updateAddress: async (id: number, data: {
    full_address?: string;
    city?: string;
    street?: string;
    house?: string;
    apartment?: string;
    entrance?: string;
    floor?: string;
    comment?: string;
    latitude?: number;
    longitude?: number;
    label?: string;
    is_default?: boolean;
  }): Promise<any> => {
    const token = localStorage.getItem('access_token');
    const response = await apiClient.patch(`/delivery-addresses/${id}/`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Удалить адрес
  deleteAddress: async (id: number): Promise<void> => {
    const token = localStorage.getItem('access_token');
    await apiClient.delete(`/delivery-addresses/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Установить адрес как основной
  setDefaultAddress: async (id: number): Promise<any> => {
    const token = localStorage.getItem('access_token');
    const response = await apiClient.post(`/delivery-addresses/${id}/set_default/`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

// API методы для заказов
export const ordersApi = {
  // Получить список заказов текущего пользователя
  getOrders: async (): Promise<any[]> => {
    const token = localStorage.getItem('access_token');
    const response = await apiClient.get('/orders/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // API возвращает пагинированный ответ, извлекаем массив results
    return response.data.results || response.data;
  },

  // Получить заказ по ID
  getOrder: async (id: number): Promise<any> => {
    const token = localStorage.getItem('access_token');
    const response = await apiClient.get(`/orders/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Создать новый заказ
  createOrder: async (data: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_address: string;
    comment?: string;
    payment_method: 'cash_on_delivery' | 'card_on_delivery';
    items: Array<{
      product_id: number;
      quantity: number;
    }>;
  }): Promise<any> => {
    const token = localStorage.getItem('access_token');
    const response = await apiClient.post('/orders/', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

// API методы для настроек сайта
export const settingsApi = {
  // Получить настройки сайта
  getSiteSettings: async (): Promise<any> => {
    const response = await apiClient.get('/settings/');
    return response.data;
  },
};

// Общие API методы
export const commonApi = {
  // Получить информацию об API
  getApiInfo: async () => {
    const response = await apiClient.get('/');
    return response.data;
  },

  // Проверка здоровья API
  healthCheck: async (): Promise<boolean> => {
    try {
      await apiClient.get('/');
      return true;
    } catch {
      return false;
    }
  },
};

// Экспорт основного клиента
export default apiClient;