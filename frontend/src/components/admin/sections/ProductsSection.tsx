import React, { useState, useEffect } from 'react';
import { FaTags, FaSpinner, FaSlidersH } from 'react-icons/fa';
import { Product, Category, Source, GlobalSettings } from '../../../types/admin';
import { adminClient } from '../../../api/adminClient';
import { VisibilityIndicator } from '../indicators/VisibilityIndicator';
import { ProductStockSettingsModal } from '../modals/ProductStockSettingsModal';

interface ProductsSectionProps {
    categories: Category[];
    sources: Source[];
    globalSettings: GlobalSettings;
    minStock: number;
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

/**
 * Секция управления товарами
 * Отображает список товаров с фильтрами, позволяет управлять видимостью и настройками
 */
export const ProductsSection: React.FC<ProductsSectionProps> = ({
    categories,
    sources,
    globalSettings,
    minStock,
    onError,
    onSuccess
}) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        source: '',
        category: '',
        is_visible_on_site: '',
        use_default_stock_settings: '',
        ordering: '-updated_at'
    });
    const [pagination, setPagination] = useState({
        page: 1,
        total_pages: 1,
        count: 0,
        next: null as string | null,
        previous: null as string | null
    });
    const [editingProductStock, setEditingProductStock] = useState<Product | null>(null);
    const [showProductStockModal, setShowProductStockModal] = useState(false);

    const fetchProducts = async (page: number = 1, search: string = '', currentFilters: any = {}) => {
        try {
            setLoading(true);
            const PAGE_SIZE = 24;
            const params: any = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };

            if (search.trim()) {
                params.search = search.trim();
            }

            Object.keys(currentFilters).forEach(key => {
                if (currentFilters[key] && key !== 'ordering') {
                    params[key] = currentFilters[key];
                }
            });

            if (currentFilters.ordering) {
                params.ordering = currentFilters.ordering;
            }

            const response = await adminClient.get('/products-management/', { params });
            const data = response.data;

            if (data.results) {
                setProducts(data.results);
                setPagination({
                    page: page,
                    total_pages: Math.max(1, Math.ceil(data.count / PAGE_SIZE)),
                    count: data.count,
                    next: data.next,
                    previous: data.previous
                });
            } else {
                setProducts(Array.isArray(data) ? data : []);
                setPagination({
                    page: 1,
                    total_pages: 1,
                    count: Array.isArray(data) ? data.length : 0,
                    next: null,
                    previous: null
                });
            }
        } catch (err) {
            console.error('Ошибка загрузки товаров:', err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(1, searchTerm, filters);
    }, []);

    const handleProductToggle = async (product: Product) => {
        try {
            const updatedProduct = { ...product, is_visible_on_site: !product.is_visible_on_site };
            await adminClient.patch(`/products-management/${product.id}/`, {
                is_visible_on_site: updatedProduct.is_visible_on_site,
            });
            setProducts(products.map(p => p.id === product.id ? updatedProduct : p));
            onSuccess(`Товар "${product.name}" ${updatedProduct.is_visible_on_site ? 'включен' : 'скрыт'}.`);
        } catch (err) {
            onError('Ошибка при обновлении товара.');
        }
    };

    const handleEditProductStock = (product: Product) => {
        setEditingProductStock(product);
        setShowProductStockModal(true);
    };

    const handleSaveProductStock = async (productData: {
        use_default_stock_settings: boolean;
        stock_display_style: string;
        low_stock_threshold: number;
    }) => {
        if (!editingProductStock) return;

        try {
            await adminClient.patch(`/products-management/${editingProductStock.id}/`, productData);
            setProducts(products.map(p =>
                p.id === editingProductStock.id
                    ? { ...p, ...productData }
                    : p
            ));
            onSuccess(`Настройки товара "${editingProductStock.name}" успешно сохранены.`);
            setShowProductStockModal(false);
            setEditingProductStock(null);
        } catch (err) {
            console.error('Ошибка сохранения настроек товара:', err);
            onError('Не удалось сохранить настройки товара.');
        }
    };

    const getFlattenedCategories = (cats: Category[], level: number = 0): Array<Category & { level: number }> => {
        const result: Array<Category & { level: number }> = [];
        cats.forEach(cat => {
            result.push({ ...cat, level });
            if (cat.children && cat.children.length > 0) {
                result.push(...getFlattenedCategories(cat.children, level + 1));
            }
        });
        return result;
    };

    return (
        <div className="card p-6">
            {/* Заголовок */}
            <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FaTags className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Управление товарами</h2>
                    <p className="text-sm text-gray-600">
                        Всего товаров: {pagination.count} • Страница {pagination.page} из {pagination.total_pages}
                    </p>
                </div>
            </div>

            {/* Панель фильтров */}
            <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Поиск */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
                        <input
                            type="text"
                            placeholder="Название, код, артикул..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    fetchProducts(1, searchTerm, filters);
                                }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                    </div>

                    {/* Источник */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Источник</label>
                        <select
                            value={filters.source}
                            onChange={(e) => {
                                const newFilters = { ...filters, source: e.target.value };
                                setFilters(newFilters);
                                fetchProducts(1, searchTerm, newFilters);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">Все источники</option>
                            {sources.map(source => (
                                <option key={source.id} value={source.id}>{source.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Категория */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
                        <select
                            value={filters.category}
                            onChange={(e) => {
                                const newFilters = { ...filters, category: e.target.value };
                                setFilters(newFilters);
                                fetchProducts(1, searchTerm, newFilters);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">Все категории</option>
                            {getFlattenedCategories(categories).map(category => (
                                <option key={category.id} value={category.id}>
                                    {'  '.repeat(category.level)}
                                    {category.level > 0 ? '└ ' : ''}
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Видимость */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Видимость</label>
                        <select
                            value={filters.is_visible_on_site}
                            onChange={(e) => {
                                const newFilters = { ...filters, is_visible_on_site: e.target.value };
                                setFilters(newFilters);
                                fetchProducts(1, searchTerm, newFilters);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">Все товары</option>
                            <option value="true">Видимые</option>
                            <option value="false">Скрытые</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Список товаров */}
            <div>
                {loading ? (
                    <div className="py-12 text-center">
                        <FaSpinner className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-3" />
                        <p className="text-gray-600">Загрузка товаров...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="py-12 text-center">
                        <FaTags className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Товары не найдены</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Товар</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Остаток</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Видимость</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {products.map(product => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-3">
                                                {product.main_image ? (
                                                    <img
                                                        src={product.main_image.image}
                                                        alt={product.main_image.alt_text || product.name}
                                                        className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                                        <FaTags className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                    <div className="text-xs text-gray-500">{product.code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{product.price} {product.currency}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{product.stock_quantity}</td>
                                        <td className="px-4 py-3">
                                            <VisibilityIndicator
                                                product={product}
                                                categories={categories}
                                                sources={sources}
                                                minStock={minStock}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleEditProductStock(product)}
                                                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-lg"
                                                    title="Настройки остатков"
                                                >
                                                    <FaSlidersH className="w-4 h-4" />
                                                </button>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={product.is_visible_on_site}
                                                        onChange={() => handleProductToggle(product)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                                                </label>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Пагинация */}
                {pagination.total_pages > 1 && (
                    <div className="px-4 py-3 border border-gray-200 rounded-lg mt-4 flex items-center justify-between bg-white">
                        <button
                            onClick={() => fetchProducts(pagination.page - 1, searchTerm, filters)}
                            disabled={!pagination.previous}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Назад
                        </button>
                        <span className="text-sm text-gray-700">
                            Страница {pagination.page} из {pagination.total_pages}
                        </span>
                        <button
                            onClick={() => fetchProducts(pagination.page + 1, searchTerm, filters)}
                            disabled={!pagination.next}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Вперёд
                        </button>
                    </div>
                )}
            </div>

            {/* Модальное окно настроек остатков */}
            {showProductStockModal && editingProductStock && (
                <ProductStockSettingsModal
                    product={editingProductStock}
                    onClose={() => {
                        setShowProductStockModal(false);
                        setEditingProductStock(null);
                    }}
                    onSave={handleSaveProductStock}
                    globalSettings={globalSettings}
                />
            )}
        </div>
    );
};
