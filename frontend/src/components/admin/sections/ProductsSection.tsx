import React, { useState, useEffect } from 'react';
import { FaTags, FaSpinner, FaSlidersH, FaTimesCircle } from 'react-icons/fa';
import { Product, Category, Source, GlobalSettings } from '../../../types/admin';
import { adminClient } from '../../../api/adminClient';
import { VisibilityIndicator } from '../indicators/VisibilityIndicator';
import { ProductStockSettingsModal } from '../modals/ProductStockSettingsModal';
import { CustomSelect } from '../../CustomSelect';

interface ProductsSectionProps {
    categories: Category[];
    sources: Source[];
    globalSettings: GlobalSettings;
    minStock: number;
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
    onProductsCountChange?: (count: number) => void;
    initialProductsCount?: number;
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
    onSuccess,
    onProductsCountChange,
    initialProductsCount = 0
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
    const PAGE_SIZE = 24;
    const [pagination, setPagination] = useState({
        page: 1,
        total_pages: Math.max(1, Math.ceil(initialProductsCount / PAGE_SIZE)), // Вычисляем из начального значения
        count: initialProductsCount, // Используем начальное значение
        next: null as string | null,
        previous: null as string | null
    });
    const [editingProductStock, setEditingProductStock] = useState<Product | null>(null);
    const [showProductStockModal, setShowProductStockModal] = useState(false);

    /**
     * Форматирование количества в зависимости от единицы измерения
     * КГ - 3 знака после запятой, ШТ - целое число
     */
    const formatStockQuantity = (quantity: number | string, unit: string): string => {
        const num = Number(quantity);
        if (unit === 'кг') {
            return num.toFixed(3);
        }
        return Math.round(num).toString();
    };

    const fetchProducts = async (page: number = 1, search: string = '', currentFilters: any = {}) => {
        try {
            setLoading(true);
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
                // Обновляем счетчик товаров в родительском компоненте
                if (onProductsCountChange) {
                    onProductsCountChange(data.count);
                }
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
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                    <FaTags className="w-5 h-5 text-warning-600" />
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
                <div className="flex items-end gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                        <CustomSelect
                            value={filters.source}
                            onChange={(value) => {
                                const newFilters = { ...filters, source: value };
                                setFilters(newFilters);
                                fetchProducts(1, searchTerm, newFilters);
                            }}
                            options={[
                                { value: '', label: 'Все источники' },
                                ...sources.map(source => ({
                                    value: String(source.id),
                                    label: source.name
                                }))
                            ]}
                            label="Источник"
                        />
                    </div>

                    {/* Категория */}
                    <div>
                        <CustomSelect
                            value={filters.category}
                            onChange={(value) => {
                                const newFilters = { ...filters, category: value };
                                setFilters(newFilters);
                                fetchProducts(1, searchTerm, newFilters);
                            }}
                            options={[
                                { value: '', label: 'Все категории' },
                                ...getFlattenedCategories(categories).map(category => ({
                                    value: String(category.id),
                                    label: `${'└ '.repeat(category.level)}${category.name}`
                                }))
                            ]}
                            label="Категория"
                        />
                    </div>

                    {/* Статус товара */}
                    <div>
                        <CustomSelect
                            value={filters.is_visible_on_site}
                            onChange={(value) => {
                                const newFilters = { ...filters, is_visible_on_site: value };
                                setFilters(newFilters);
                                fetchProducts(1, searchTerm, newFilters);
                            }}
                            options={[
                                { value: '', label: 'Все' },
                                { value: 'true', label: 'Включен' },
                                { value: 'false', label: 'Выключен' }
                            ]}
                            label="Статус товара"
                        />
                    </div>

                    {/* Настройки остатков */}
                    <div>
                        <CustomSelect
                            value={filters.use_default_stock_settings}
                            onChange={(value) => {
                                const newFilters = { ...filters, use_default_stock_settings: value };
                                setFilters(newFilters);
                                fetchProducts(1, searchTerm, newFilters);
                            }}
                            options={[
                                { value: '', label: 'Все' },
                                { value: 'true', label: 'Общие' },
                                { value: 'false', label: 'Индивидуальные' }
                            ]}
                            label="Настройки остатков"
                        />
                    </div>
                    </div>

                    {/* Кнопка очистки фильтров */}
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            const clearedFilters = {
                                source: '',
                                category: '',
                                is_visible_on_site: '',
                                use_default_stock_settings: '',
                                ordering: '-updated_at'
                            };
                            setFilters(clearedFilters);
                            fetchProducts(1, '', clearedFilters);
                        }}
                        className="px-4 py-2 h-[42px] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                        title="Очистить все фильтры"
                    >
                        <FaTimesCircle className="w-4 h-4" />
                        Очистить фильтры
                    </button>
                </div>
            </div>

            {/* Список товаров */}
            <div>
                {loading ? (
                    <div className="py-12 text-center">
                        <FaSpinner className="w-8 h-8 text-warning-600 animate-spin mx-auto mb-3" />
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
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ед.</th>
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
                                        <td className="px-4 py-3 text-sm text-gray-900">{Number(product.price).toFixed(2)} {product.currency}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{formatStockQuantity(product.stock_quantity, product.unit)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">{product.unit}</td>
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
                                                <div className="flex flex-col items-center">
                                                    <button
                                                        onClick={() => handleEditProductStock(product)}
                                                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-100 rounded-lg"
                                                        title="Настройки остатков"
                                                    >
                                                        <FaSlidersH className="w-4 h-4" />
                                                    </button>
                                                    {product.use_default_stock_settings ? (
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-1" title="Используются общие настройки сайта">
                                                            Общие
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-primary-600 bg-purple-50 px-1.5 py-0.5 rounded mt-1" title="Используются индивидуальные настройки">
                                                            Индивид.
                                                        </span>
                                                    )}
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={product.is_visible_on_site}
                                                        onChange={() => handleProductToggle(product)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-warning-600"></div>
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
                    product={products.find(p => p.id === editingProductStock.id) || editingProductStock}
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
