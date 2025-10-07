/**
 * Страница каталога товаров.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon, ChevronUpDownIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductImage from '../components/ProductImage';
import CategorySidebar from '../components/CategorySidebar';
import CartButton from '../components/CartButton';

interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
  currency: string;
  unit: string;
  in_stock: boolean;
  stock_quantity: number;
  description: string;
  brand: string;
  is_weighted: boolean;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  main_image?: {
    id: number;
    image: string;
    alt_text: string;
    is_main: boolean;
  };
  images: Array<{
    id: number;
    image: string;
    alt_text: string;
    is_main: boolean;
  }>;
  stock_status?: {
    status: string;
    text: string;
    quantity: number | null;
  };
}

interface ProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

// Загружает страницу товаров. Если pageOrUrl — строка, ожидается полный URL (из поля next/previous)
// Если число — рассчитываем offset исходя из PAGE_SIZE=24
const PAGE_SIZE = 24;
const fetchProducts = async (
  pageOrUrl: number | string = 1,
  categoryId: number | null = null,
  searchQuery = '',
  inStockOnly = false,
  sortBy = '',
  favoriteIds: number[] = []
): Promise<ProductsResponse> => {
  try {
    let url: string;
    if (typeof pageOrUrl === 'string') {
      url = pageOrUrl; // используем next/previous как есть
    } else {
      const offset = (pageOrUrl - 1) * PAGE_SIZE;
      url = `http://localhost:8000/api/products/?limit=${PAGE_SIZE}&offset=${offset}`;
      if (categoryId) {
        url += `&category=${categoryId}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      if (inStockOnly) {
        url += `&available=true`;
      }
      if (sortBy) {
        url += `&ordering=${sortBy}`;
      }
      if (favoriteIds.length > 0) {
        url += `&ids=${favoriteIds.join(',')}`;
      }
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка загрузки товаров:', error);
    throw error;
  }
};

const ProductsPage: React.FC = () => {
  // Сохраняем и восстанавливаем состояние фильтров
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(() => {
    try {
      const saved = sessionStorage.getItem('products_category_id');
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  });
  
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      return sessionStorage.getItem('products_search_query') || '';
    } catch {
      return '';
    }
  });
  
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(() => {
    try {
      return sessionStorage.getItem('products_search_query') || '';
    } catch {
      return '';
    }
  });
  
  // Сохраняем выбор тумблера "Есть в наличии" между перезагрузками
  const [inStockOnly, setInStockOnly] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('products_in_stock_only');
      if (saved === null) return true; // по умолчанию фильтр включен
      return saved === 'true';
    } catch {
      return true; // на случай ошибок доступа — включаем по умолчанию
    }
  });
  
  const [sortBy, setSortBy] = useState(() => {
    try {
      return sessionStorage.getItem('products_sort_by') || '';
    } catch {
      return '';
    }
  });

  // Избранные товары
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('product_favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(() => {
    try {
      return sessionStorage.getItem('products_favorites_only') === 'true';
    } catch {
      return false;
    }
  });

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Дебаунс для поиска (500мс задержка)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Отслеживание позиции мыши
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  const {
    data,
    isLoading,
    error,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['products', selectedCategoryId, debouncedSearchQuery, inStockOnly, sortBy, showFavoritesOnly, Array.from(favorites)],
    queryFn: ({ pageParam = 1 }) =>
      fetchProducts(
        pageParam as number | string, 
        selectedCategoryId, 
        debouncedSearchQuery, 
        inStockOnly, 
        sortBy,
        showFavoritesOnly ? Array.from(favorites) : []
      ),
    getNextPageParam: (lastPage) => lastPage?.next || undefined,
    retry: 1,
    retryDelay: 1000,
    staleTime: 30000,
  });

  // Сохраняем последнюю успешную выдачу, чтобы не моргала страница при смене категории
  const lastDataRef = useRef<any>(null);
  useEffect(() => {
    if (data) {
      lastDataRef.current = data;
    }
  }, [data]);

  const viewData = data ?? lastDataRef.current;

  // Сентинел для бесконечной подгрузки
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Не инициализируем наблюдатель, пока не пришла первая страница
    if (!loadMoreRef.current || !viewData) return;
    const el = loadMoreRef.current;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { rootMargin: '200px' });

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, viewData]);

  // Сброс страницы при смене категории, поиска или фильтра наличия
  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
  };
  
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategoryId(null);
    setSortBy('');
    setShowFavoritesOnly(false);
    // inStockOnly оставляем как есть, так как это предпочтение пользователя
  };

  const toggleFavorite = (productId: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  const toggleFavoritesFilter = () => {
    setShowFavoritesOnly(prev => !prev);
  };
  
  const handleInStockToggle = () => {
    setInStockOnly(prev => !prev);
  };

  // Пишем значение тумблера в localStorage при каждом изменении
  useEffect(() => {
    try {
      localStorage.setItem('products_in_stock_only', String(inStockOnly));
    } catch {}
  }, [inStockOnly]);

  // Сохраняем состояние фильтров в sessionStorage при изменении
  useEffect(() => {
    try {
      if (selectedCategoryId !== null) {
        sessionStorage.setItem('products_category_id', selectedCategoryId.toString());
      } else {
        sessionStorage.removeItem('products_category_id');
      }
    } catch (error) {
      console.error('Ошибка сохранения категории:', error);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    try {
      if (searchQuery) {
        sessionStorage.setItem('products_search_query', searchQuery);
      } else {
        sessionStorage.removeItem('products_search_query');
      }
    } catch (error) {
      console.error('Ошибка сохранения поискового запроса:', error);
    }
  }, [searchQuery]);

  useEffect(() => {
    try {
      if (sortBy) {
        sessionStorage.setItem('products_sort_by', sortBy);
      } else {
        sessionStorage.removeItem('products_sort_by');
      }
    } catch (error) {
      console.error('Ошибка сохранения сортировки:', error);
    }
  }, [sortBy]);

  // Сохраняем избранное в localStorage
  useEffect(() => {
    try {
      localStorage.setItem('product_favorites', JSON.stringify(Array.from(favorites)));
    } catch (error) {
      console.error('Ошибка сохранения избранного:', error);
    }
  }, [favorites]);

  // Сохраняем состояние фильтра "Только избранное"
  useEffect(() => {
    try {
      if (showFavoritesOnly) {
        sessionStorage.setItem('products_favorites_only', 'true');
      } else {
        sessionStorage.removeItem('products_favorites_only');
      }
    } catch (error) {
      console.error('Ошибка сохранения фильтра избранного:', error);
    }
  }, [showFavoritesOnly]);
  
  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  // Собираем плоский список товаров из страниц (всегда вызываем hooks до возможных ранних return)
  const flatProducts: Product[] = (viewData?.pages || []).flatMap((p: ProductsResponse) => p.results) as Product[];
  const uniqueProducts: Product[] = React.useMemo(() => {
    const map = new Map<number, Product>();
    flatProducts.forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    return Array.from(map.values());
  }, [flatProducts]);

  // Товары уже отфильтрованы на сервере, просто используем их
  const displayedProducts: Product[] = uniqueProducts;

  const totalCount: number = viewData?.pages?.[0]?.count ?? 0;

  if (isLoading && !viewData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Загружаем товары..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка загрузки</h2>
          <p className="text-gray-600">Не удалось загрузить товары. Попробуйте позже.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Каталог товаров</title>
        <meta name="description" content="Каталог халяль продуктов Faida Group - колбасы, деликатесы, мясные изделия" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Каталог товаров</h1>
          <p className="mt-2 text-gray-600">
            Найдено товаров: {totalCount}
          </p>
        </div>

        {/* Основной контент с боковой панелью */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Левая панель категорий */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <CategorySidebar
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={handleCategorySelect}
            />
          </div>

          {/* Основной контент */}
          <div className="flex-1">
            {/* Floating спиннер следует за курсором */}
            {isFetching && (
              <div 
                className="fixed z-50 pointer-events-none transition-all duration-150 ease-out"
                style={{
                  left: mousePosition.x + 15,
                  top: mousePosition.y - 15,
                  transform: 'translate(0, 0)'
                }}
              >
                <div className="bg-white shadow-lg rounded-full p-2 border border-gray-200">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                </div>
              </div>
            )}
            {/* Поиск и фильтры над карточками */}
            <div className="mb-6">
              {/* Поисковая строка - на всю ширину */}
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Поиск товаров..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm placeholder-gray-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Вторая строка: фильтры слева, сортировка справа */}
              <div className="mb-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  {/* Фильтры слева */}
                  <div className="flex flex-wrap gap-4 items-center">
                    {/* Тумблер "Есть в наличии" */}
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700">Есть в наличии</span>
                      <button
                        type="button"
                        onClick={handleInStockToggle}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 ${
                          inStockOnly ? 'bg-emerald-600' : 'bg-gray-200'
                        }`}
                        role="switch"
                        aria-checked={inStockOnly}
                      >
                        <span className="sr-only">Фильтр по наличию</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            inStockOnly ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    
                    {/* Тумблер "Только избранное" */}
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700">Избранное</span>
                      <button
                        type="button"
                        onClick={toggleFavoritesFilter}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 ${
                          showFavoritesOnly ? 'bg-pink-600' : 'bg-gray-200'
                        }`}
                        role="switch"
                        aria-checked={showFavoritesOnly}
                      >
                        <span className="sr-only">Показать только избранное</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showFavoritesOnly ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full min-w-[32px] text-center">
                        {favorites.size > 99 ? '99+' : favorites.size > 0 ? favorites.size : '0'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Сортировка справа */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">Сортировка:</span>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="">По умолчанию</option>
                        <option value="price">Цена: по возрастанию</option>
                        <option value="-price">Цена: по убыванию</option>
                        <option value="name">По алфавиту: А-Я</option>
                        <option value="-name">По алфавиту: Я-А</option>
                      </select>
                      <ChevronUpDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Третья строка: бейджи слева, кнопка очистки справа */}
              {(searchQuery || selectedCategoryId || sortBy || showFavoritesOnly || inStockOnly) && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  {/* Индикаторы активных фильтров слева */}
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    {searchQuery && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Поиск: "{searchQuery}"
                      </span>
                    )}
                    {sortBy && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Сортировка: {sortBy === 'price' ? 'Цена ↑' : sortBy === '-price' ? 'Цена ↓' : sortBy === 'name' ? 'А-Я' : 'Я-А'}
                      </span>
                    )}
                    {inStockOnly && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Только в наличии
                      </span>
                    )}
                  </div>
                  
                  {/* Кнопка очистки фильтров справа */}
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                  >
                    Очистить все фильтры
                  </button>
                </div>
              )}
            </div>
            {/* Товары */}
            {displayedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-fr">
                {displayedProducts.map((product: Product) => (
                  <Link 
                    key={product.id} 
                    to={`/products/${product.id}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full min-h-[400px] group"
                  >
                    <div className="relative w-full h-40 bg-gray-50 overflow-hidden p-3 flex items-center justify-center">
                      {product.main_image || (product.images?.length > 0) ? (
                        <div className="w-full h-full max-w-full max-h-full">
                          <ProductImage
                            src={product.main_image?.image || product.images[0].image}
                            alt={product.main_image?.alt_text || product.images[0]?.alt_text || product.name}
                            className="w-full h-full rounded-md"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-md border-2 border-dashed border-gray-200">
                          <div className="text-center">
                            <svg className="w-8 h-8 text-gray-300 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs text-gray-400">Нет фото</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Кнопка избранного */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(product.id);
                        }}
                        className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                          favorites.has(product.id)
                            ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                            : 'bg-white/80 text-gray-400 hover:bg-white hover:text-pink-500'
                        } shadow-sm hover:shadow-md`}
                        title={favorites.has(product.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
                      >
                        {favorites.has(product.id) ? (
                          <HeartIconSolid className="w-5 h-5" />
                        ) : (
                          <HeartIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    
                    <div className="p-3 flex-grow flex flex-col">
                      {/* Название товара - занимает доступное место сверху */}
                      <div className="flex-grow">
                        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-4 leading-tight">
                          {product.name}
                        </h3>
                      </div>
                      
                      {/* Все остальное прижато к низу */}
                      <div className="flex-shrink-0">
                        {product.brand && (
                          <p className="text-xs text-gray-500 mb-2">
                            {product.brand}
                          </p>
                        )}
                        
                        <div className="mb-3">
                          <div className="mb-1">
                            <span className="text-base font-bold text-emerald-600">
                              {product.price} {product.currency}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-500">
                              за {product.unit}
                            </span>
                            <span className={`text-xs ${
                              product.stock_status
                                ? product.stock_status.status === 'in_stock'
                                  ? 'text-green-600'
                                  : product.stock_status.status === 'low_stock'
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                                : product.in_stock
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {product.stock_status
                                ? product.stock_status.text
                                : product.in_stock
                                ? 'В наличии'
                                : 'Нет'}
                            </span>
                          </div>
                        </div>
                        
                        <div
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <CartButton 
                            product={{
                              ...product,
                              main_image: product.main_image?.image || (product.images?.length > 0 ? product.images[0].image : undefined)
                            }} 
                            size="md" 
                            className="w-full" 
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {showFavoritesOnly ? 'Нет избранных товаров' : 'Товары не найдены'}
                </h3>
                <p className="text-gray-600">
                  {showFavoritesOnly 
                    ? 'Добавьте товары в избранное, нажав на ❤️ на карточках товаров'
                    : 'Попробуйте изменить фильтры или обновить страницу'
                  }
                </p>
              </div>
            )}

            {/* Сентинел для бесконечной подгрузки - скрываем при фильтре избранного */}
            {!showFavoritesOnly && (
              <div ref={loadMoreRef} className="h-12 flex items-center justify-center text-sm text-gray-500">
                {isFetchingNextPage ? 'Загружаем ещё…' : hasNextPage ? 'Прокрутите ниже, чтобы загрузить ещё' : 'Больше товаров нет'}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductsPage;