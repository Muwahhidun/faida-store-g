/**
 * Типы данных для интернет-магазина Faida Group.
 */

// Базовые типы
export interface BaseModel {
  id: number;
  created_at: string;
  updated_at: string;
}

// Пищевая ценность
export interface NutritionalValue {
  calories?: number;
  proteins?: number;
  fats?: number;
  carbohydrates?: number;
}

// Изображение товара
export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_main: boolean;
  order: number;
}

// Категория
export interface Category extends BaseModel {
  name: string;
  slug: string;
  description: string;
  parent?: number;
  children?: Category[];
  image?: string;
  seo_title: string;
  seo_description: string;
  products_count: number;
  is_active: boolean;
}

// Товар (краткая версия для списков)
export interface ProductListItem extends BaseModel {
  code: string;
  name: string;
  category?: Category;
  price: number;
  currency: string;
  unit: string;
  in_stock: boolean;
  stock_quantity: number;
  brand: string;
  weight: string;
  main_image?: ProductImage;
  is_available: boolean;
  tags_list: string[];
  stock_status?: {
    status: string;
    text: string;
    quantity: number | null;
  };
}

// Товар (полная версия для детального просмотра)
export interface Product extends ProductListItem {
  description: string;
  composition: string;
  shelf_life: string;
  storage_conditions: string;
  nutritional_value: NutritionalValue;
  seo_title: string;
  seo_description: string;
  images: ProductImage[];
  related_products: ProductListItem[];
}

// Фильтры для товаров
export interface ProductFilters {
  search?: string;
  category?: number;
  category_slug?: string;
  price_min?: number;
  price_max?: number;
  in_stock?: boolean;
  available?: boolean;
  brand?: string;
  tags?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// Фильтры для категорий
export interface CategoryFilters {
  search?: string;
  parent?: number;
  parent_only?: boolean;
  children_only?: boolean;
}

// Ответ API с пагинацией
export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Статистика по категориям
export interface CategoryStats {
  id: number;
  name: string;
  slug: string;
  products_count: number;
  available_count: number;
  avg_price: number;
}

// Корзина товаров (для будущего использования)
export interface CartItem {
  product: ProductListItem;
  quantity: number;
  price: number;
}

export interface Cart {
  items: CartItem[];
  total_quantity: number;
  total_price: number;
}

// Состояния загрузки
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

// Ошибки API
export interface ApiError {
  message: string;
  details?: Record<string, string[]>;
  status?: number;
}

// Хук состояния
export interface UseDataState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

// Параметры для React Query
export interface QueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

// Breadcrumb navigation
export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

// UI компоненты пропсы
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  className?: string;
}

export interface SelectProps {
  label?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}