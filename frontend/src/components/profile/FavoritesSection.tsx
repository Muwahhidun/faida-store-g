import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaTrash, FaShoppingCart, FaExclamationTriangle, FaEyeSlash, FaBoxOpen } from 'react-icons/fa';
import { HeartIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ProductImage from '../ProductImage';

interface FavoriteProduct {
  id: number;
  name: string;
  price: number;
  currency: string;
  images: Array<{ id: number; image: string; display_order: number }>;
  in_stock: boolean;
  stock_quantity: number;
  category?: { id: number; name: string; slug: string };
  is_available: boolean;
  unavailable_reason?: string;
}

const STORAGE_KEY = 'product_favorites';

const FavoritesSection: React.FC = () => {
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем ID избранных из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const ids = JSON.parse(saved) as number[];
        setFavoriteIds(ids);
      }
    } catch {
      setFavoriteIds([]);
    }
  }, []);

  // Загружаем товары по ID
  useEffect(() => {
    const fetchFavorites = async () => {
      if (favoriteIds.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/products/favorites/?ids=${favoriteIds.join(',')}`
        );
        if (!response.ok) {
          throw new Error('Ошибка загрузки избранных товаров');
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Ошибка загрузки избранного:', error);
        toast.error('Не удалось загрузить избранные товары');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [favoriteIds]);

  const removeFromFavorites = (productId: number) => {
    const newIds = favoriteIds.filter(id => id !== productId);
    setFavoriteIds(newIds);
    setProducts(products.filter(p => p.id !== productId));

    // Сохраняем в localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
    } catch (error) {
      console.error('Ошибка сохранения избранного:', error);
    }

    toast.success('Товар удалён из избранного');
  };

  const clearAllFavorites = () => {
    if (!confirm('Вы уверены, что хотите очистить всё избранное?')) {
      return;
    }

    setFavoriteIds([]);
    setProducts([]);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Ошибка очистки избранного:', error);
    }

    toast.success('Избранное очищено');
  };

  const getUnavailableLabel = (reason?: string) => {
    switch (reason) {
      case 'hidden':
        return 'Товар скрыт';
      case 'source_hidden':
        return 'Временно недоступен';
      case 'out_of_stock':
        return 'Нет в наличии';
      case 'low_stock':
        return 'Мало на складе';
      default:
        return 'Недоступен';
    }
  };

  const getUnavailableIcon = (reason?: string) => {
    switch (reason) {
      case 'hidden':
      case 'source_hidden':
        return <FaEyeSlash className="w-4 h-4" />;
      case 'out_of_stock':
      case 'low_stock':
        return <FaBoxOpen className="w-4 h-4" />;
      default:
        return <FaExclamationTriangle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Загрузка избранного...</span>
      </div>
    );
  }

  if (favoriteIds.length === 0) {
    return (
      <div className="text-center py-12">
        <HeartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Избранное пусто</h3>
        <p className="text-gray-500 mb-6">
          Добавляйте понравившиеся товары в избранное, нажимая на сердечко в каталоге
        </p>
        <Link
          to="/products"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <FaShoppingCart className="w-4 h-4 mr-2" />
          Перейти в каталог
        </Link>
      </div>
    );
  }

  // Разделяем товары на доступные и недоступные
  const availableProducts = products.filter(p => p.is_available);
  const unavailableProducts = products.filter(p => !p.is_available);

  // Находим ID товаров, которые были удалены из базы (есть в favoriteIds, но нет в products)
  const productIds = new Set(products.map(p => p.id));
  const deletedIds = favoriteIds.filter(id => !productIds.has(id));

  return (
    <div className="space-y-6">
      {/* Заголовок с кнопкой очистки */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaHeart className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Избранные товары ({favoriteIds.length})
          </h2>
        </div>
        {favoriteIds.length > 0 && (
          <button
            onClick={clearAllFavorites}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FaTrash className="w-3 h-3" />
            Очистить всё
          </button>
        )}
      </div>

      {/* Предупреждение о удалённых товарах */}
      {deletedIds.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">
                {deletedIds.length} {deletedIds.length === 1 ? 'товар был удалён' : 'товаров были удалены'} из каталога
              </p>
              <button
                onClick={() => {
                  const newIds = favoriteIds.filter(id => productIds.has(id));
                  setFavoriteIds(newIds);
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
                  toast.success('Удалённые товары убраны из избранного');
                }}
                className="text-sm text-yellow-700 hover:text-yellow-900 underline mt-1"
              >
                Убрать их из избранного
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Доступные товары */}
      {availableProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {availableProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onRemove={() => removeFromFavorites(product.id)}
            />
          ))}
        </div>
      )}

      {/* Недоступные товары */}
      {unavailableProducts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <FaExclamationTriangle className="w-4 h-4 text-orange-500" />
            Недоступные товары ({unavailableProducts.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {unavailableProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onRemove={() => removeFromFavorites(product.id)}
                unavailableLabel={getUnavailableLabel(product.unavailable_reason)}
                unavailableIcon={getUnavailableIcon(product.unavailable_reason)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ProductCardProps {
  product: FavoriteProduct;
  onRemove: () => void;
  unavailableLabel?: string;
  unavailableIcon?: React.ReactNode;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onRemove,
  unavailableLabel,
  unavailableIcon
}) => {
  const isUnavailable = !product.is_available;
  const mainImage = product.images?.[0]?.image;

  return (
    <div className={`relative bg-white rounded-lg border ${isUnavailable ? 'border-gray-200 opacity-75' : 'border-gray-200'} overflow-hidden group hover:shadow-md transition-shadow`}>
      {/* Бейдж недоступности */}
      {isUnavailable && unavailableLabel && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
          {unavailableIcon}
          {unavailableLabel}
        </div>
      )}

      {/* Кнопка удаления */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 z-10 p-2 bg-white/90 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full shadow-sm transition-colors"
        title="Удалить из избранного"
      >
        <FaTrash className="w-3.5 h-3.5" />
      </button>

      {/* Изображение */}
      <Link to={isUnavailable ? '#' : `/products/${product.id}`} className={isUnavailable ? 'pointer-events-none' : ''}>
        <div className="aspect-square bg-gray-100 overflow-hidden">
          <ProductImage
            src={mainImage}
            alt={product.name}
            className={`w-full h-full object-cover ${isUnavailable ? 'grayscale' : 'group-hover:scale-105'} transition-transform duration-200`}
          />
        </div>
      </Link>

      {/* Информация о товаре */}
      <div className="p-3">
        <Link
          to={isUnavailable ? '#' : `/products/${product.id}`}
          className={isUnavailable ? 'pointer-events-none' : ''}
        >
          <h3 className={`text-sm font-medium ${isUnavailable ? 'text-gray-500' : 'text-gray-900 hover:text-primary-600'} line-clamp-2 mb-1 transition-colors`}>
            {product.name}
          </h3>
        </Link>

        {product.category && (
          <p className="text-xs text-gray-400 mb-2 truncate">
            {product.category.name}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold ${isUnavailable ? 'text-gray-400' : 'text-primary-600'}`}>
            {product.price.toLocaleString('ru-RU')} {product.currency === 'RUB' ? '₽' : product.currency}
          </span>

          {!isUnavailable && product.in_stock && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              В наличии
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesSection;
