/**
 * Детальная страница товара.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { ArrowLeftIcon, CogIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductImage from '../components/ProductImage';
import CartButton from '../components/CartButton';

interface ProductDetail {
  id: number;
  code: string;
  article: string;
  name: string;
  price: number | string;
  currency: string;
  unit: string;
  in_stock: boolean;
  stock_quantity: number;
  description: string;
  brand: string;
  weight: string;
  composition: string;
  shelf_life: string;
  storage_conditions: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  images: Array<{
    id: number;
    image: string;
    alt_text: string;
    is_main: boolean;
  }>;
  tags_list: string[];
  barcodes_list: string[];
  // Новые поля для детальной информации
  is_weighted: boolean;
  unit_weight: number | null;
  prices_data: Array<{
    ВидЦены: string;
    Цена: number;
    Валюта: string;
  }>;
  stocks_data: Array<{
    Склад: string;
    НаСкладе: number;
    ВРезерве: number;
    СвободныйОстаток: number;
  }>;
  retail_price: number | null;
  internet_price: number | null;
  main_warehouse_stock: {
    warehouse: string;
    total: number;
    reserved: number;
    available: number;
  } | null;
  all_warehouses_stock: Array<{
    warehouse: string;
    total: number;
    reserved: number;
    available: number;
  }>;
  is_available: boolean;
  stock_status?: {
    status: string;
    text: string;
    quantity: number | null;
  };
  source_settings?: {
    id: number;
    name: string;
    code: string;
    default_price_type_name: string;
    default_warehouse_name: string;
  };
}

const fetchProduct = async (id: string): Promise<ProductDetail> => {
  try {
    const response = await fetch(`http://localhost:8000/api/products/${id}/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка загрузки товара:', error);
    throw error;
  }
};

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [showAdminInfo, setShowAdminInfo] = useState(false);

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return (numPrice || 0).toFixed(2);
  };
  
  // Прокрутка к началу страницы при загрузке
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
    retry: 1,
    retryDelay: 1000,
  });

  // Сбрасываем выбранный индекс изображения при смене товара и устанавливаем основное изображение
  React.useEffect(() => {
    if (product && product.images && product.images.length > 0) {
      // Ищем индекс основного изображения (is_main=true)
      const mainImageIndex = product.images.findIndex(img => img.is_main);
      setSelectedImageIndex(mainImageIndex >= 0 ? mainImageIndex : 0);
    } else {
      setSelectedImageIndex(0);
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Загружаем товар..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Товар не найден</h2>
          <p className="text-gray-600 mb-4">Не удалось найти запрашиваемый товар.</p>
          <Link 
            to="/products" 
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Вернуться к каталогу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product.name}</title>
        <meta name="description" content={product.description || `${product.name} - халяль продукт от Faida Group`} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Хлебные крошки */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link to="/products" className="hover:text-emerald-600 transition-colors">
            Каталог
          </Link>
          {product.category && (
            <>
              <span>•</span>
              <span>{product.category.name}</span>
            </>
          )}
          <span>•</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        {/* Основной контент */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Изображения товара */}
          <div className="space-y-4">
            {product.images && product.images.length > 0 ? (
              <div className="grid gap-4">
                {/* Основное изображение */}
                <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
                  <ProductImage
                    src={product.images[selectedImageIndex]?.image || product.images[0].image}
                    alt={product.images[selectedImageIndex]?.alt_text || product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Миниатюры */}
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.map((image, index) => (
                      <div 
                        key={image.id} 
                        className={`aspect-square bg-gray-50 rounded-md overflow-hidden border-2 transition-colors cursor-pointer ${
                          selectedImageIndex === index 
                            ? 'border-emerald-500' 
                            : 'border-transparent hover:border-emerald-300'
                        }`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <ProductImage
                          src={image.image}
                          alt={image.alt_text || `${product.name} фото ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-400">Нет изображения</span>
                </div>
              </div>
            )}
          </div>

          {/* Информация о товаре */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="space-y-1 text-gray-600">
                <p>Код товара: {product.code}</p>
                {product.article && (
                  <p>Артикул: {product.article}</p>
                )}
                {product.category && (
                  <p>Категория: {product.category.name}</p>
                )}
              </div>
            </div>

            {/* Цена и наличие */}
            <div className="border-t border-b border-gray-200 py-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-3xl font-bold text-emerald-600">
                    {formatPrice(product.price)} {product.currency}
                  </span>
                  <span className="text-lg text-gray-500 ml-2">за {product.unit}</span>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.stock_status 
                    ? product.stock_status.status === 'in_stock' 
                      ? 'bg-green-100 text-green-800'
                      : product.stock_status.status === 'low_stock'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                    : product.is_available 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.stock_status 
                    ? product.stock_status.text
                    : product.is_available 
                    ? 'В наличии' 
                    : 'Нет в наличии'}
                </span>
              </div>



              <CartButton 
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  currency: product.currency,
                  in_stock: product.in_stock,
                  stock_quantity: product.stock_quantity,
                  unit: product.unit,
                  is_weighted: product.is_weighted,
                  main_image: product.images?.find(img => img.is_main)?.image
                }}
                size="lg"
                className="w-1/2"
              />
            </div>

            {/* Описание и характеристики */}
            <div className="space-y-6 pt-6 border-t border-gray-200">
              {/* Описание */}
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Описание</h3>
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {product.description}
                </div>
              </div>
            )}

            {/* Дополнительная информация */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.brand && (
                <div>
                  <span className="font-medium text-gray-900">Производитель:</span>
                  <span className="ml-2 text-gray-700">{product.brand}</span>
                </div>
              )}
              
              {product.is_weighted && (product.weight || product.unit_weight) && (
                <div>
                  <span className="font-medium text-gray-900">Вес:</span>
                  <span className="ml-2 text-gray-700">
                    {product.unit_weight ? `${product.unit_weight} кг` : product.weight}
                  </span>
                </div>
              )}
              
              {product.is_weighted && (
                <div className="sm:col-span-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                    Весовой товар
                  </span>
                </div>
              )}
            </div>

            {/* Кнопка админской информации */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowAdminInfo(!showAdminInfo)}
                className="w-full flex items-center justify-center px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 hover:bg-orange-100 transition-colors group"
              >
                <CogIcon className="w-5 h-5 mr-2" />
                <span className="font-medium">
                  {showAdminInfo ? 'Скрыть техническую информацию' : 'Показать техническую информацию'}
                </span>
                <svg 
                  className={`w-4 h-4 ml-2 transition-transform ${showAdminInfo ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Админская информация */}
            {showAdminInfo && (
              <div className="space-y-6 pt-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CogIcon className="w-5 h-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-800">
                      Техническая информация
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Данная информация предназначена для администраторов и модераторов
                  </p>
                </div>

            {/* Цены */}
            {product.prices_data && product.prices_data.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Цены</h3>
                <div className="space-y-3">
                  {product.prices_data.map((priceInfo, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        priceInfo.ВидЦены === product.source_settings?.default_price_type_name
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-semibold ${
                          priceInfo.ВидЦены === product.source_settings?.default_price_type_name
                            ? 'text-emerald-800' 
                            : 'text-gray-800'
                        }`}>
                          {priceInfo.ВидЦены}
                          {priceInfo.ВидЦены === product.source_settings?.default_price_type_name && ' (Показывается на сайте)'}
                        </h4>
                        {priceInfo.ВидЦены === product.source_settings?.default_price_type_name && (
                          <span className="text-xs text-emerald-600 font-medium">
                            Актуальная цена
                          </span>
                        )}
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${
                          priceInfo.ВидЦены === product.source_settings?.default_price_type_name
                            ? 'text-emerald-600' 
                            : 'text-gray-900'
                        }`}>
                          {priceInfo.Цена} {priceInfo.Валюта || 'RUB'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Остатки на складах */}
            {product.all_warehouses_stock && product.all_warehouses_stock.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Остатки на складах</h3>
                <div className="space-y-3">
                  {product.all_warehouses_stock.map((stockInfo, index) => {
                    const isMainWarehouse = stockInfo.warehouse === product.source_settings?.default_warehouse_name;
                    
                    return (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border-2 ${
                          isMainWarehouse 
                            ? 'border-emerald-500 bg-emerald-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-semibold ${
                            isMainWarehouse 
                              ? 'text-emerald-800' 
                              : 'text-gray-800'
                          }`}>
                            {stockInfo.warehouse}
                            {isMainWarehouse && ' (Показывается на сайте)'}
                          </h4>
                          {isMainWarehouse && (
                            <span className="text-xs text-emerald-600 font-medium">
                              Актуальный склад
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-medium text-gray-600">На складе</div>
                            <div className="text-lg font-bold text-gray-900">
                              {stockInfo.total.toFixed(3)} {product.unit}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-600">В резерве</div>
                            <div className="text-lg font-bold text-orange-600">
                              {stockInfo.reserved.toFixed(3)} {product.unit}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-600">Доступно</div>
                            <div className={`text-lg font-bold ${
                              stockInfo.available > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {stockInfo.available.toFixed(3)} {product.unit}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
              </div>
            )}
            </div>
          </div>
        </div>




        {/* Кнопка возврата */}
        <div className="mt-12 text-center">
          <Link 
            to="/products" 
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Вернуться к каталогу
          </Link>
        </div>
      </div>
    </>
  );
};

export default ProductDetailPage;