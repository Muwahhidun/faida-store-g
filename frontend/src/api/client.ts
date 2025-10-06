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

// Интерцептор для обработки ошибок
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
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