/**
 * React Query хуки для работы с API.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
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
import { productsApi, categoriesApi, commonApi } from '@/api/client';

// Ключи для React Query
export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: ProductFilters) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.products.details(), id] as const,
    similar: (id: number) => [...queryKeys.products.all, 'similar', id] as const,
    popular: () => [...queryKeys.products.all, 'popular'] as const,
    featured: () => [...queryKeys.products.all, 'featured'] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters?: CategoryFilters) => [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.categories.details(), id] as const,
    tree: () => [...queryKeys.categories.all, 'tree'] as const,
    products: (id: number, filters?: ProductFilters) => 
      [...queryKeys.categories.all, 'products', id, filters] as const,
    stats: () => [...queryKeys.categories.all, 'stats'] as const,
  },
};

// Хуки для товаров
export const useProducts = (
  filters?: ProductFilters,
  options?: { enabled?: boolean }
): UseQueryResult<PaginatedResponse<ProductListItem>, ApiError> => {
  return useQuery({
    queryKey: queryKeys.products.list(filters || {}),
    queryFn: () => productsApi.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 минут
    cacheTime: 30 * 60 * 1000, // 30 минут
    enabled: options?.enabled !== false,
  });
};

export const useProduct = (
  id: number,
  options?: { enabled?: boolean }
): UseQueryResult<Product, ApiError> => {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsApi.getProduct(id),
    staleTime: 10 * 60 * 1000, // 10 минут
    cacheTime: 60 * 60 * 1000, // 1 час
    enabled: options?.enabled !== false && !!id,
  });
};

export const useSimilarProducts = (
  id: number,
  options?: { enabled?: boolean }
): UseQueryResult<ProductListItem[], ApiError> => {
  return useQuery({
    queryKey: queryKeys.products.similar(id),
    queryFn: () => productsApi.getSimilarProducts(id),
    staleTime: 15 * 60 * 1000, // 15 минут
    cacheTime: 60 * 60 * 1000, // 1 час
    enabled: options?.enabled !== false && !!id,
  });
};

export const usePopularProducts = (): UseQueryResult<ProductListItem[], ApiError> => {
  return useQuery({
    queryKey: queryKeys.products.popular(),
    queryFn: () => productsApi.getPopularProducts(),
    staleTime: 10 * 60 * 1000, // 10 минут
    cacheTime: 30 * 60 * 1000, // 30 минут
  });
};

export const useFeaturedProducts = (): UseQueryResult<ProductListItem[], ApiError> => {
  return useQuery({
    queryKey: queryKeys.products.featured(),
    queryFn: () => productsApi.getFeaturedProducts(),
    staleTime: 10 * 60 * 1000, // 10 минут
    cacheTime: 30 * 60 * 1000, // 30 минут
  });
};

// Хуки для категорий
export const useCategories = (
  filters?: CategoryFilters,
  options?: { enabled?: boolean }
): UseQueryResult<PaginatedResponse<Category>, ApiError> => {
  return useQuery({
    queryKey: queryKeys.categories.list(filters),
    queryFn: () => categoriesApi.getCategories(filters),
    staleTime: 15 * 60 * 1000, // 15 минут
    cacheTime: 60 * 60 * 1000, // 1 час
    enabled: options?.enabled !== false,
  });
};

export const useCategory = (
  id: number,
  options?: { enabled?: boolean }
): UseQueryResult<Category, ApiError> => {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoriesApi.getCategory(id),
    staleTime: 15 * 60 * 1000, // 15 минут
    cacheTime: 60 * 60 * 1000, // 1 час
    enabled: options?.enabled !== false && !!id,
  });
};

export const useCategoriesTree = (): UseQueryResult<Category[], ApiError> => {
  return useQuery({
    queryKey: queryKeys.categories.tree(),
    queryFn: () => categoriesApi.getCategoriesTree(),
    staleTime: 30 * 60 * 1000, // 30 минут
    cacheTime: 2 * 60 * 60 * 1000, // 2 часа
  });
};

export const useCategoryProducts = (
  categoryId: number,
  filters?: ProductFilters,
  options?: { enabled?: boolean }
): UseQueryResult<PaginatedResponse<ProductListItem>, ApiError> => {
  return useQuery({
    queryKey: queryKeys.categories.products(categoryId, filters),
    queryFn: () => categoriesApi.getCategoryProducts(categoryId, filters),
    staleTime: 5 * 60 * 1000, // 5 минут
    cacheTime: 30 * 60 * 1000, // 30 минут
    enabled: options?.enabled !== false && !!categoryId,
  });
};

export const useCategoriesStats = (): UseQueryResult<CategoryStats[], ApiError> => {
  return useQuery({
    queryKey: queryKeys.categories.stats(),
    queryFn: () => productsApi.getCategoriesStats(),
    staleTime: 15 * 60 * 1000, // 15 минут
    cacheTime: 60 * 60 * 1000, // 1 час
  });
};

// Хуки для общих операций
export const useApiHealth = (): UseQueryResult<boolean, ApiError> => {
  return useQuery({
    queryKey: ['api', 'health'],
    queryFn: () => commonApi.healthCheck(),
    staleTime: 2 * 60 * 1000, // 2 минуты
    cacheTime: 5 * 60 * 1000, // 5 минут
    retry: 3,
    retryDelay: 1000,
  });
};