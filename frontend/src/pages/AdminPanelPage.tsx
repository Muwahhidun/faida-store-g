import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaCog, FaSave, FaSync, FaExclamationTriangle, FaCheckCircle, FaDatabase, FaList, FaTags, FaPowerOff,
    FaHourglassHalf, FaPlay, FaHistory, FaTimes, FaSpinner, FaEye, FaEyeSlash, FaChevronDown, FaChevronRight,
    FaExpandArrowsAlt, FaCompressArrowsAlt, FaSlidersH, FaCogs, FaPlus, FaTrash, FaEdit
} from 'react-icons/fa';
import { Helmet } from 'react-helmet';
import { Switch } from '@headlessui/react';

// Создаем экземпляр axios для API
const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api',
});

// Добавляем перехватчик для автоматического добавления токена в заголовки
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Добавляем перехватчик ошибок для отладки
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers
        });
        return Promise.reject(error);
    }
);

interface Source {
    id: number;
    name: string;
    is_active: boolean;
    show_on_site: boolean;
    default_price_type_name: string;
    default_warehouse_name: string;
    import_status: 'idle' | 'running' | 'completed' | 'failed' | 'running_data' | 'running_full';
    import_status_display: string;
    last_import_started: string | null;
    last_import_completed: string | null;
    import_error_message: string | null;
    auto_sync_enabled: boolean;
    data_sync_interval: number;
    last_data_sync: string | null;
    next_data_sync: string | null;
    full_sync_interval: number;
    last_full_sync: string | null;
    next_full_sync: string | null;
    last_error_time: string | null;
}

interface AvailableOptions {
    price_types: string[];
    warehouse_names: string[];
}

interface Category {
    id: number;
    name: string;
    parent: number | null;
    is_active: boolean;
    is_visible_on_site: boolean;
    products_count: number;
    order: number;
    sources: Array<{
        id: number;
        name: string;
        code: string;
    }>;
    children?: Category[];
}

interface Product {
    id: number;
    code: string;
    name: string;
    article: string;
    price: string;
    currency: string;
    unit: string;
    in_stock: boolean;
    stock_quantity: number;
    is_visible_on_site: boolean;
    category: Category;
    source_name: string;
    source_code: string;
    brand: string;
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
    created_at: string;
    updated_at: string;
    // Поля для настроек остатков
    use_default_stock_settings?: boolean;
    stock_display_style?: string;
    low_stock_threshold?: number;
    // Поля для визуальной индикации видимости
    is_category_visible?: boolean;
    is_source_visible?: boolean;
    visibility_status?: {
        is_visible_to_users: boolean;
        reasons: Array<{
            type: 'product' | 'category' | 'source' | 'stock';
            message: string;
            field: string;
        }>;
    };
}

// Компонент модального окна настроек остатков товара
interface ProductStockSettingsModalProps {
    product: Product;
    onClose: () => void;
    onSave: (data: {
        use_default_stock_settings: boolean;
        stock_display_style: string;
        low_stock_threshold: number;
    }) => void;
    globalSettings: {
        default_stock_display_style: string;
        default_low_stock_threshold: number;
        show_stock_quantities_globally: boolean;
    };
}

const ProductStockSettingsModal: React.FC<ProductStockSettingsModalProps> = ({
    product,
    onClose,
    onSave,
    globalSettings
}) => {
    const [useDefaultSettings, setUseDefaultSettings] = useState(product.use_default_stock_settings ?? true);
    const [stockDisplayStyle, setStockDisplayStyle] = useState(product.stock_display_style || 'detailed_status');
    const [lowStockThreshold, setLowStockThreshold] = useState(product.low_stock_threshold || 5);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            use_default_stock_settings: useDefaultSettings,
            stock_display_style: stockDisplayStyle,
            low_stock_threshold: lowStockThreshold
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                {/* Заголовок */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FaSlidersH className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Настройки остатков товара
                            </h2>
                            <p className="text-sm text-gray-600 truncate max-w-md">
                                {product.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Содержимое */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Переключатель общих/индивидуальных настроек */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Использовать общие настройки сайта
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Если включено, будут использоваться настройки из "Настройки сайта"
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={useDefaultSettings}
                                    onChange={(e) => setUseDefaultSettings(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>
                    </div>

                    {/* Предварительный просмотр общих настроек */}
                    {useDefaultSettings && (
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="text-sm font-medium text-blue-900 mb-3">Текущие общие настройки:</h4>
                            <div className="space-y-2 text-sm text-blue-800">
                                <div>Показ остатков: <strong>{globalSettings.show_stock_quantities_globally ? 'Включен' : 'Отключен'}</strong></div>
                                <div>Стиль: <strong>
                                    {globalSettings.default_stock_display_style === 'exact' ? 'Точное количество' :
                                     globalSettings.default_stock_display_style === 'status' ? 'Простой статус' : 'Детальный статус'}
                                </strong></div>
                                <div>Порог "мало": <strong>{globalSettings.default_low_stock_threshold}</strong></div>
                            </div>
                        </div>
                    )}

                    {/* Индивидуальные настройки */}
                    {!useDefaultSettings && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Стиль отображения остатков
                                </label>
                                <select
                                    value={stockDisplayStyle}
                                    onChange={(e) => setStockDisplayStyle(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="exact">Показывать точное количество</option>
                                    <option value="status">Показывать статус (В наличии / Нет)</option>
                                    <option value="detailed_status">Показывать детальный статус (В наличии / Мало / Нет)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Порог "Мало на складе"
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={lowStockThreshold}
                                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    При остатке меньше этого значения товар будет считаться "мало"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Кнопки */}
                    <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                        >
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Компонент индикатора видимости товара
interface VisibilityIndicatorProps {
    product: Product;
    categories: Category[];
    sources: Source[];
    minStock: number;
}

const VisibilityIndicator: React.FC<VisibilityIndicatorProps> = ({ product, categories, sources, minStock }) => {
    // Пересчитываем статус видимости на основе текущего состояния
    const calculateVisibilityStatus = () => {
        const reasons: Array<{
            type: 'product' | 'category' | 'source' | 'stock';
            message: string;
            field: string;
        }> = [];

        // Проверка товара
        if (!product.is_visible_on_site) {
            reasons.push({
                type: 'product',
                message: 'Товар отключен',
                field: 'is_visible_on_site'
            });
        }

        // Проверка категории с каскадной логикой родителей
        const findCategoryByName = (categories: Category[], name: string): Category | null => {
            for (const category of categories) {
                if (category.name === name) {
                    return category;
                }
                if (category.children) {
                    const found = findCategoryByName(category.children, name);
                    if (found) return found;
                }
            }
            return null;
        };

        const findCategoryById = (categories: Category[], id: number): Category | null => {
            for (const category of categories) {
                if (category.id === id) {
                    return category;
                }
                if (category.children) {
                    const found = findCategoryById(category.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        // Функция для получения всех родителей категории
        const getCategoryParents = (category: Category): Category[] => {
            const parents: Category[] = [];
            let currentParentId = category.parent;
            
            while (currentParentId) {
                const parentCategory = findCategoryById(categories, currentParentId);
                if (parentCategory) {
                    parents.push(parentCategory);
                    currentParentId = parentCategory.parent;
                } else {
                    break;
                }
            }
            
            return parents;
        };

        // Проверка категории: используем непосредственно объект категории из продукта
        if (product.category) {
            // Проверяем саму категорию
            if (!product.category.is_visible_on_site) {
                reasons.push({
                    type: 'category',
                    message: `Категория "${product.category.name}" скрыта`,
                    field: 'category.is_visible_on_site'
                });
            } else {
                // Проверяем всех родителей
                const parents = getCategoryParents(product.category);
                const hiddenParent = parents.find(parent => !parent.is_visible_on_site);
                
                if (hiddenParent) {
                    reasons.push({
                        type: 'category',
                        message: `Скрыта родительская категория "${hiddenParent.name}"`,
                        field: 'category.parent.is_visible_on_site'
                    });
                }
            }
        }

        // Проверка источника (получаем из текущих данных sources)
        const currentSource = sources.find(src => src.name === product.source_name);
        if (currentSource) {
            if (!currentSource.is_active) {
                reasons.push({
                    type: 'source',
                    message: `Источник "${currentSource.name}" неактивен`,
                    field: 'source.is_active'
                });
            } else if (!currentSource.show_on_site) {
                reasons.push({
                    type: 'source',
                    message: `Источник "${currentSource.name}" скрыт с сайта`,
                    field: 'source.show_on_site'
                });
            }
        }

        // Проверка остатков (используем текущее значение minStock)
        if (product.stock_quantity < minStock) {
            reasons.push({
                type: 'stock',
                message: `Остаток (${product.stock_quantity}) меньше минимального (${minStock})`,
                field: 'stock_quantity'
            });
        }

        return {
            is_visible_to_users: reasons.length === 0,
            reasons
        };
    };

    const visibilityStatus = calculateVisibilityStatus();
    
    if (visibilityStatus.is_visible_to_users) {
        return (
            <div className="flex items-center space-x-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Видим пользователям
                </span>
            </div>
        );
    }

    const getCategoryReasons = () => visibilityStatus.reasons.filter(r => r.type === 'category');
    const getSourceReasons = () => visibilityStatus.reasons.filter(r => r.type === 'source');
    const getProductReasons = () => visibilityStatus.reasons.filter(r => r.type === 'product');
    const getStockReasons = () => visibilityStatus.reasons.filter(r => r.type === 'stock');

    const categoryReasons = getCategoryReasons();
    const sourceReasons = getSourceReasons();
    const productReasons = getProductReasons();
    const stockReasons = getStockReasons();

    return (
        <div className="space-y-1">
            {/* Основной индикатор */}
            <div className="flex items-center space-x-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Скрыт от пользователей
                </span>
            </div>
            
            {/* Детальные бейджи по причинам */}
            <div className="flex flex-wrap gap-1">
                {categoryReasons.map((reason, index) => {
                    const isParentCategory = reason.field === 'category.parent.is_visible_on_site';
                    const badgeText = isParentCategory ? 'Скрыт родитель' : 'Скрыта категория';
                    const badgeColor = isParentCategory ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800';
                    
                    return (
                        <span 
                            key={`category-${index}`}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${badgeColor}`}
                            title={reason.message}
                        >
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                {isParentCategory ? (
                                    // Иконка для родительской категории (стрелка вверх)
                                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                ) : (
                                    // Обычная иконка категории
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                )}
                            </svg>
                            {badgeText}
                        </span>
                    );
                })}
                
                {sourceReasons.map((reason, index) => (
                    <span 
                        key={`source-${index}`}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800"
                        title={reason.message}
                    >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15.586 13H14a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        Отключен источник
                    </span>
                ))}
                
                {productReasons.map((reason, index) => (
                    <span 
                        key={`product-${index}`}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        title={reason.message}
                    >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                        Отключен товар
                    </span>
                ))}
                
                {stockReasons.map((reason, index) => (
                    <span 
                        key={`stock-${index}`}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                        title={reason.message}
                    >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Мало на складе
                    </span>
                ))}
            </div>
            
            {/* Детальный tooltip при наведении */}
            {visibilityStatus.reasons.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                    Причины: {visibilityStatus.reasons.map(r => r.message).join(', ')}
                </div>
            )}
        </div>
    );
};

const AdminPanelPage: React.FC = () => {
    const navigate = useNavigate();
    const [minStock, setMinStock] = useState<number>(0);
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [saveLoading, setSaveLoading] = useState<boolean>(false);
    
    // Новые состояния для настроек остатков
    const [defaultStockDisplayStyle, setDefaultStockDisplayStyle] = useState<string>('detailed_status');
    const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState<number>(5);
    const [showStockQuantitiesGlobally, setShowStockQuantitiesGlobally] = useState<boolean>(true);
    const [availableOptions, setAvailableOptions] = useState<AvailableOptions>({ price_types: [], warehouse_names: [] });
    const [editingSource, setEditingSource] = useState<Source | null>(null);
    const [loadingOptions, setLoadingOptions] = useState<boolean>(false);
    // Состояния для разделенных модальных окон
    const [showPriceWarehouseModal, setShowPriceWarehouseModal] = useState(false);
    const [showAutoSyncModal, setShowAutoSyncModal] = useState(false);
    const [editingPriceWarehouse, setEditingPriceWarehouse] = useState<Source | null>(null);
    const [editingAutoSync, setEditingAutoSync] = useState<Source | null>(null);
    const [importingSourceId, setImportingSourceId] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
    const [productSearchTerm, setProductSearchTerm] = useState<string>('');
    const [productFilters, setProductFilters] = useState({
        is_visible_on_site: '',
        in_stock: '',
        source: '',
        category: '',
        use_default_stock_settings: '',
        ordering: '-updated_at'
    });
    const [productPagination, setProductPagination] = useState({
        page: 1,
        total_pages: 1,
        count: 0,
        next: null,
        previous: null
    });
    const [selectedTab, setSelectedTab] = useState<'settings' | 'sources' | 'categories' | 'products'>('settings');
    const [dataLoaded, setDataLoaded] = useState(false);
    const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    // Состояние для модального окна логов
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [selectedSourceForLogs, setSelectedSourceForLogs] = useState<Source | null>(null);
    const [syncLogs, setSyncLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    
    // Состояние для удаления источника
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [deletingSource, setDeletingSource] = useState<Source | null>(null);
    
    // Состояние для создания источника
    const [showCreateSourceModal, setShowCreateSourceModal] = useState(false);
    const [newSource, setNewSource] = useState<Partial<Source>>({
        name: '',
        code: '',
        is_active: true,
        show_on_site: true,
        json_file_path: '',
        media_dir_path: '',
    });
    
    // Состояние для редактирования источника
    const [showEditSourceModal, setShowEditSourceModal] = useState(false);

    // Состояние для сворачивания категорий
    const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set());
    
    // Состояние для модального окна настроек остатков товара
    const [showProductStockModal, setShowProductStockModal] = useState(false);
    const [editingProductStock, setEditingProductStock] = useState<Product | null>(null);

    // Функция для получения плоского списка категорий с иерархией
    const getFlattenedCategories = (categories: Category[], level: number = 0): Array<{id: number, name: string, level: number}> => {
        const result: Array<{id: number, name: string, level: number}> = [];
        
        categories.forEach(category => {
            result.push({
                id: category.id,
                name: category.name,
                level: level
            });
            
            if (category.children && category.children.length > 0) {
                result.push(...getFlattenedCategories(category.children, level + 1));
            }
        });
        
        return result;
    };

    // Функция для подсчета активных фильтров
    const getActiveFiltersCount = () => {
        let count = 0;
        if (productSearchTerm.trim()) count++;
        if (productFilters.source) count++;
        if (productFilters.category) count++;
        if (productFilters.is_visible_on_site) count++;
        if (productFilters.in_stock) count++;
        if (productFilters.use_default_stock_settings) count++;
        return count;
    };

    // Функции для управления сворачиванием категорий
    const toggleCategoryCollapse = (categoryId: number) => {
        setCollapsedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const expandAllCategories = () => {
        setCollapsedCategories(new Set());
    };

    const collapseAllCategories = () => {
        const allCategoryIds = new Set<number>();
        const collectIds = (cats: Category[]) => {
            cats.forEach(cat => {
                if (cat.children && cat.children.length > 0) {
                    allCategoryIds.add(cat.id);
                    collectIds(cat.children);
                }
            });
        };
        collectIds(categories);
        setCollapsedCategories(allCategoryIds);
    };

    const fetchSources = async () => {
        try {
            const sourcesResponse = await apiClient.get('/sources/');
            const sourcesData = Array.isArray(sourcesResponse.data) 
                ? sourcesResponse.data 
                : sourcesResponse.data.results || [];
            
            // Проверяем изменились ли данные (простая проверка по статусам)
            const currentStatuses = sources.map(s => `${s.id}:${s.import_status}`).join(',');
            const newStatuses = sourcesData.map(s => `${s.id}:${s.import_status}`).join(',');
            
            if (currentStatuses !== newStatuses) {
                console.log('Статусы источников изменились, обновляем состояние');
                setSources(sourcesData);
            }
        } catch (err) {
            console.error('Ошибка загрузки источников:', err);
        }
    };

    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const categoriesResponse = await apiClient.get('/categories-management/');
            const categoriesData = Array.isArray(categoriesResponse.data) 
                ? categoriesResponse.data 
                : categoriesResponse.data.results || [];
            setCategories(categoriesData);
        } catch (err) {
            console.error('Ошибка загрузки категорий:', err);
        } finally {
            setLoadingCategories(false);
        }
    };

    useEffect(() => {
        if (dataLoaded) return; // Предотвращаем повторные загрузки
        
        const fetchAllData = async () => {
            console.log('Начинаем загрузку данных...');
            
            // Загружаем настройки
            try {
                console.log('Загружаем настройки...');
                const settingsResponse = await apiClient.get('/settings/1/');
                console.log('Настройки загружены:', settingsResponse.data);
                setMinStock(settingsResponse.data.min_stock_for_display);
                setDefaultStockDisplayStyle(settingsResponse.data.default_stock_display_style || 'detailed_status');
                setDefaultLowStockThreshold(settingsResponse.data.default_low_stock_threshold || 5);
                setShowStockQuantitiesGlobally(settingsResponse.data.show_stock_quantities_globally !== false);
            } catch (err) {
                console.error('Ошибка загрузки настроек:', err);
                setError('Не удалось загрузить настройки. Возможно, у вас нет прав доступа.');
            }

            // Загружаем источники
            try {
                console.log('Загружаем источники...');
                const sourcesResponse = await apiClient.get('/sources/');
                console.log('Источники загружены:', sourcesResponse.data);
                const sourcesData = Array.isArray(sourcesResponse.data) 
                    ? sourcesResponse.data 
                    : sourcesResponse.data.results || [];
                setSources(sourcesData);
            } catch (err) {
                console.error('Ошибка загрузки источников:', err);
                setError('Не удалось загрузить источники данных.');
            }

            // Загружаем категории
            try {
                console.log('Загружаем категории...');
                const categoriesResponse = await apiClient.get('/categories-management/');
                console.log('Категории загружены:', categoriesResponse.data);
                const categoriesData = Array.isArray(categoriesResponse.data) 
                    ? categoriesResponse.data 
                    : categoriesResponse.data.results || [];
                setCategories(categoriesData);
            } catch (err) {
                console.error('Ошибка загрузки категорий:', err);
                setError('Не удалось загрузить категории.');
            }

            // Загружаем счетчик товаров (только для отображения количества на вкладке)
            try {
                console.log('Загружаем счетчик товаров...');
                // Используем минимальный запрос для получения счетчика
                const productsCountResponse = await apiClient.get('/products-management/?page=1&limit=1');
                console.log('Счетчик товаров загружен:', productsCountResponse.data);
                if (productsCountResponse.data.count !== undefined) {
                    setProductPagination(prev => ({
                        ...prev,
                        count: productsCountResponse.data.count,
                        total_pages: Math.ceil(productsCountResponse.data.count / 24)
                    }));
                }
            } catch (err) {
                console.error('Ошибка загрузки счетчика товаров:', err);
                // Не показываем ошибку пользователю, так как это не критично
            }
            
            setLoading(false);
            setDataLoaded(true); // Помечаем что данные загружены
            console.log('Загрузка данных завершена');
        };

        fetchAllData();
    }, [dataLoaded]);

    // Периодическое обновление статусов импорта
    useEffect(() => {
        if (loading || sources.length === 0) return;

        const hasRunningImports = sources.some(source => isSourceSyncing(source));
        
        if (hasRunningImports && !statusIntervalRef.current) {
            console.log('Запускаем интервал для отслеживания статусов синхронизации');
            statusIntervalRef.current = setInterval(() => {
                console.log('Обновляем статусы источников...');
                fetchSources();
            }, 3000); // Обновляем каждые 3 секунды
        } else if (!hasRunningImports && statusIntervalRef.current) {
            console.log('Все синхронизации завершены, останавливаем мониторинг');
            clearInterval(statusIntervalRef.current);
            statusIntervalRef.current = null;
        }

        // Cleanup при размонтировании компонента
        return () => {
            if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
                statusIntervalRef.current = null;
            }
        };
    }, [sources, loading]); // Возвращаем sources в зависимости, но теперь с защитой через ref

    const handleSaveSettings = async () => {
        setError('');
        setSuccess('');
        setSaveLoading(true);
        try {
            // Отправляем PATCH на конкретный объект с ID=1
            await apiClient.patch(`/settings/1/`, {
                min_stock_for_display: minStock,
                default_stock_display_style: defaultStockDisplayStyle,
                default_low_stock_threshold: defaultLowStockThreshold,
                show_stock_quantities_globally: showStockQuantitiesGlobally,
            });
            setSuccess('Настройки сайта успешно сохранены!');
        } catch (err) {
            setError('Ошибка при сохранении настроек сайта.');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleSourceToggle = async (source: Source) => {
        setError('');
        setSuccess('');
        try {
            const updatedSource = { ...source, show_on_site: !source.show_on_site };
            await apiClient.patch(`/sources/${source.id}/`, {
                show_on_site: updatedSource.show_on_site,
            });

            // Обновляем состояние на фронтенде
            setSources(sources.map(s => s.id === source.id ? updatedSource : s));
            setSuccess(`Источник "${source.name}" успешно обновлен.`);

        } catch (err) {
            setError('Ошибка при обновлении источника.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Уведомляем Header об изменении состояния авторизации
        window.dispatchEvent(new Event('authChanged'));
        
        navigate('/login');
    };

    // Новые обработчики для разделенных модальных окон
    const handleEditPriceWarehouse = async (source: Source) => {
        setEditingPriceWarehouse({ ...source });
        setShowPriceWarehouseModal(true);
        setLoadingOptions(true);
        
        try {
            // Загружаем опции только для этого источника
            const optionsResponse = await apiClient.get(`/available-options/?source_id=${source.id}`);
            setAvailableOptions(optionsResponse.data);
        } catch (err) {
            setError('Не удалось загрузить доступные варианты цен и складов.');
            setAvailableOptions({ price_types: [], warehouse_names: [] });
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleEditAutoSync = (source: Source) => {
        setEditingAutoSync({ ...source });
        setShowAutoSyncModal(true);
    };


    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running':
            case 'running_data':
            case 'running_full':
                return <FaSpinner className="w-3 h-3 animate-spin text-blue-600" />;
            case 'completed':
                return <FaCheckCircle className="w-3 h-3 text-green-600" />;
            case 'failed':
                return <FaExclamationTriangle className="w-3 h-3 text-red-600" />;
            default:
                return <FaHourglassHalf className="w-3 h-3 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running':
            case 'running_data':
            case 'running_full':
                return 'text-blue-600';
            case 'completed':
                return 'text-green-600';
            case 'failed':
                return 'text-red-600';
            default:
                return 'text-gray-500';
        }
    };

    const formatLastImport = (dateString: string | null) => {
        if (!dateString) return 'Никогда';
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isSourceSyncing = (source: Source) => {
        return source.import_status === 'running' || 
               source.import_status === 'running_data' || 
               source.import_status === 'running_full';
    };

    const handleShowLogs = async (source: Source) => {
        setSelectedSourceForLogs(source);
        setShowLogsModal(true);
        setLoadingLogs(true);
        
        try {
            const response = await apiClient.get(`/sync-logs/?source_id=${source.id}&ordering=-started_at`);
            setSyncLogs(response.data.results || response.data || []);
        } catch (err) {
            console.error('Ошибка загрузки логов:', err);
            setError('Не удалось загрузить логи синхронизации');
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleCloseLogsModal = () => {
        setShowLogsModal(false);
        setSelectedSourceForLogs(null);
        setSyncLogs([]);
    };

    const handleEditProductStock = (product: Product) => {
        setEditingProductStock(product);
        setShowProductStockModal(true);
    };

    const handleCloseProductStockModal = () => {
        setShowProductStockModal(false);
        setEditingProductStock(null);
    };

    const handleSaveProductStock = async (productData: {
        use_default_stock_settings: boolean;
        stock_display_style: string;
        low_stock_threshold: number;
    }) => {
        if (!editingProductStock) return;

        setError('');
        setSuccess('');
        
        try {
            await apiClient.patch(`/products-management/${editingProductStock.id}/`, productData);
            
            // Обновляем товар в списке
            setProducts(products.map(p => 
                p.id === editingProductStock.id 
                    ? { ...p, ...productData }
                    : p
            ));
            
            setSuccess(`Настройки товара "${editingProductStock.name}" успешно сохранены.`);
            handleCloseProductStockModal();
        } catch (err) {
            console.error('Ошибка сохранения настроек товара:', err);
            setError('Не удалось сохранить настройки товара.');
        }
    };

    const handleImportData = async (source: Source, syncType: 'full' | 'quick' = 'full') => {
        setError('');
        setSuccess('');
        setImportingSourceId(source.id);
        
        try {
            const endpoint = syncType === 'quick' ? 'quick_sync' : 'import_data';
            const response = await apiClient.post(`/sources/${source.id}/${endpoint}/`);
            
            if (response.data.success) {
                const syncTypeLabel = syncType === 'quick' ? 'Быстрая синхронизация' : 'Полная синхронизация';
                setSuccess(`${syncTypeLabel} запущена: ${response.data.message}`);
                // Немедленно обновляем список источников
                fetchSources();
            } else {
                setError(response.data.message);
            }
        } catch (err: any) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Ошибка при запуске синхронизации.');
            }
        } finally {
            setImportingSourceId(null);
        }
    };

    const handleResetStatus = async (source: Source) => {
        setError('');
        setSuccess('');
        
        try {
            const response = await apiClient.post(`/sources/${source.id}/reset_status/`);
            
            if (response.data.success) {
                setSuccess(response.data.message);
                // Немедленно обновляем список источников
                fetchSources();
            } else {
                setError(response.data.message);
            }
        } catch (err: any) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Ошибка при сбросе статуса импорта.');
            }
        }
    };

    const handleApplySettings = async () => {
        if (!editingSource) return;
        
        setError('');
        setSuccess('');
        setSaveLoading(true);
        
        try {
            const response = await apiClient.post(`/sources/${editingSource.id}/apply_settings/`);
            
            if (response.data.success) {
                setSuccess(response.data.message);
                // Обновляем список источников
                fetchSources();
            } else {
                setError(response.data.message);
            }
        } catch (err: any) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Ошибка при применении настроек.');
            }
        } finally {
            setSaveLoading(false);
        }
    };

    const fetchProducts = async (page: number = 1, search: string = '', filters: any = {}) => {
        try {
            setLoadingProducts(true);
            const PAGE_SIZE = 24;
            const params: any = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
            
            if (search.trim()) {
                params.search = search.trim();
            }
            
            // Добавляем фильтры
            Object.keys(filters).forEach(key => {
                if (filters[key] && key !== 'ordering') {
                    params[key] = filters[key];
                }
            });
            
            if (filters.ordering) {
                params.ordering = filters.ordering;
            }
            
            const productsResponse = await apiClient.get('/products-management/', { params });
            const data = productsResponse.data;
            
            if (data.results) {
                // Пагинированный ответ
                setProducts(data.results);
                setProductPagination({
                    page: page,
                    total_pages: Math.max(1, Math.ceil(data.count / PAGE_SIZE)),
                    count: data.count,
                    next: data.next,
                    previous: data.previous
                });
            } else {
                // Непагинированный ответ (fallback)
                setProducts(Array.isArray(data) ? data : []);
                setProductPagination({
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
            setLoadingProducts(false);
        }
    };

    const handleCategoryToggle = async (category: Category) => {
        setError('');
        setSuccess('');
        
        try {
            const updatedCategory = { ...category, is_visible_on_site: !category.is_visible_on_site };
            await apiClient.patch(`/categories-management/${category.id}/`, {
                is_visible_on_site: updatedCategory.is_visible_on_site,
            });

            // Обновляем состояние на фронтенде - нужно обновить в иерархической структуре
            const updateCategoryInTree = (categories: Category[]): Category[] => {
                return categories.map(c => {
                    if (c.id === category.id) {
                        return updatedCategory;
                    } else if (c.children && c.children.length > 0) {
                        return { ...c, children: updateCategoryInTree(c.children) };
                    }
                    return c;
                });
            };
            
            setCategories(updateCategoryInTree(categories));
            setSuccess(`Категория "${category.name}" ${updatedCategory.is_visible_on_site ? 'включена' : 'скрыта'}.`);

        } catch (err) {
            setError('Ошибка при обновлении категории.');
        }
    };

    const getCategoriesGroupedBySources = () => {
        const grouped: { [key: string]: Category[] } = {};
        
        // Собираем все категории (включая дочерние) в плоский список
        const getAllCategories = (categories: Category[]): Category[] => {
            const allCategories: Category[] = [];
            categories.forEach(category => {
                allCategories.push(category);
                if (category.children && category.children.length > 0) {
                    allCategories.push(...getAllCategories(category.children));
                }
            });
            return allCategories;
        };
        
        const allCategories = getAllCategories(categories);
        
        allCategories.forEach(category => {
            if (category.sources.length === 0) {
                // Категории без товаров
                if (!grouped['no_source']) {
                    grouped['no_source'] = [];
                }
                grouped['no_source'].push(category);
            } else {
                // Группируем по источникам
                category.sources.forEach(source => {
                    const key = `${source.code} (${source.name})`;
                    if (!grouped[key]) {
                        grouped[key] = [];
                    }
                    // Проверяем, чтобы не добавить категорию дважды, если у неё несколько источников
                    if (!grouped[key].find(c => c.id === category.id)) {
                        grouped[key].push(category);
                    }
                });
            }
        });
        
        return grouped;
    };

    const renderCategoryTree = (category: Category, level: number = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isCollapsed = collapsedCategories.has(category.id);
        
        return (
            <div key={category.id}>
                {/* Родительская категория */}
                <div
                    className={`flex items-center justify-between p-2 rounded hover:bg-gray-100 transition-colors duration-200 ${
                        level === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                    style={{ marginLeft: `${level * 20}px` }}
                >
                    <div className="flex items-center space-x-3">
                        {/* Кнопка сворачивания/разворачивания */}
                        {hasChildren ? (
                            <button
                                onClick={() => toggleCategoryCollapse(category.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title={isCollapsed ? 'Развернуть' : 'Свернуть'}
                            >
                                {isCollapsed ? (
                                    <FaChevronRight className="w-3 h-3" />
                                ) : (
                                    <FaChevronDown className="w-3 h-3" />
                                )}
                            </button>
                        ) : (
                            <div className="w-5 h-5" /> // Пустое место для выравнивания
                        )}
                        
                        <div className={`w-2 h-2 rounded-full ${
                            category.is_visible_on_site ? 'bg-purple-500' : 'bg-gray-300'
                        }`}></div>
                        <div>
                            <span className={`text-sm font-medium ${
                                level === 0 ? 'text-gray-900' : 'text-gray-700'
                            } ${
                                category.is_active ? '' : 'text-gray-400'
                            }`}>
                                {level > 0 && '└ '}{category.name}
                                {hasChildren && (
                                    <span className="ml-2 text-xs text-gray-400">
                                        ({category.children.length})
                                    </span>
                                )}
                            </span>
                            <div className="text-xs text-gray-500">
                                Товаров: {category.products_count}
                                {!category.is_active && ' (неактивна)'}
                                {category.sources.length > 1 && ` • Источников: ${category.sources.length}`}
                            </div>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={category.is_visible_on_site}
                            onChange={() => handleCategoryToggle(category)}
                            className="sr-only peer"
                            disabled={!category.is_active}
                        />
                        <div className={`w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                            category.is_active ? 'peer-checked:bg-purple-600' : 'opacity-50 cursor-not-allowed'
                        }`}></div>
                    </label>
                </div>
                
                {/* Дочерние категории */}
                {!isCollapsed && category.children && category.children.map(child => renderCategoryTree(child, level + 1))}
            </div>
        );
    };

    const getCategoriesGroupedBySourcesHierarchical = () => {
        const grouped: { [key: string]: Category[] } = {};
        
        // Функция для получения всех источников из категории и её подкатегорий
        const getCategorySources = (category: Category): Array<{id: number; name: string; code: string}> => {
            let allSources = [...category.sources];
            if (category.children) {
                category.children.forEach(child => {
                    allSources.push(...getCategorySources(child));
                });
            }
            // Убираем дубликаты
            const uniqueSources = allSources.filter((source, index, self) => 
                index === self.findIndex(s => s.id === source.id)
            );
            return uniqueSources;
        };
        
        categories.forEach(category => {
            const categorySources = getCategorySources(category);
            
            if (categorySources.length === 0) {
                // Категории без товаров
                if (!grouped['no_source']) {
                    grouped['no_source'] = [];
                }
                grouped['no_source'].push(category);
            } else {
                // Группируем по источникам
                categorySources.forEach(source => {
                    const key = `${source.code} (${source.name})`;
                    if (!grouped[key]) {
                        grouped[key] = [];
                    }
                    // Проверяем, чтобы не добавить категорию дважды
                    if (!grouped[key].find(c => c.id === category.id)) {
                        grouped[key].push(category);
                    }
                });
            }
        });
        
        return grouped;
    };

    const handleProductToggle = async (product: Product) => {
        setError('');
        setSuccess('');
        
        try {
            const updatedProduct = { ...product, is_visible_on_site: !product.is_visible_on_site };
            await apiClient.patch(`/products-management/${product.id}/`, {
                is_visible_on_site: updatedProduct.is_visible_on_site,
            });

            // Обновляем состояние на фронтенде
            setProducts(products.map(p => p.id === product.id ? updatedProduct : p));
            setSuccess(`Товар "${product.name}" ${updatedProduct.is_visible_on_site ? 'включен' : 'скрыт'}.`);

        } catch (err) {
            setError('Ошибка при обновлении товара.');
        }
    };

    const handleCreateSource = () => {
        setNewSource({
            name: '',
            code: '',
            is_active: true,
            show_on_site: true,
            json_file_path: '',
            media_dir_path: '',
        });
        setShowCreateSourceModal(true);
    };

    const handleCloseCreateSourceModal = () => {
        setShowCreateSourceModal(false);
    };

    const handleSaveNewSource = async () => {
        try {
            // Валидация
            if (!newSource.name || !newSource.code || !newSource.json_file_path || !newSource.media_dir_path) {
                setError('Все поля обязательны для заполнения.');
                return;
            }

            const response = await apiClient.post('/sources/', newSource);
            setSources([...sources, response.data]);
            setSuccess(`Источник "${response.data.name}" успешно создан.`);
            handleCloseCreateSourceModal();
        } catch (err: any) {
            console.error('Ошибка создания источника:', err);
            const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : 'Не удалось создать источник.';
            setError(`Ошибка: ${errorMessage}`);
        }
    };

    const isAnySourceSyncing = () => {
        return sources.some(isSourceSyncing);
    };

    const handleDeleteSource = (source: Source) => {
        setDeletingSource(source);
        setShowDeleteConfirmModal(true);
    };

    const confirmDeleteSource = async () => {
        if (!deletingSource) return;

        try {
            await apiClient.delete(`/sources/${deletingSource.id}/`);
            setSources(sources.filter(s => s.id !== deletingSource.id));
            setSuccess(`Источник "${deletingSource.name}" успешно удален.`);
            
            // Автоматически обновляем данные категорий и товаров
            fetchCategories();
            fetchProducts(1, productSearchTerm, productFilters);

        } catch (err) {
            console.error('Ошибка удаления источника:', err);
            setError('Не удалось удалить источник.');
        } finally {
            setShowDeleteConfirmModal(false);
            setDeletingSource(null);
        }
    };

    const handleEditSource = (source: Source) => {
        setEditingSource({ ...source });
        setShowEditSourceModal(true);
    };

    const handleCloseEditSourceModal = () => {
        setEditingSource(null);
        setShowEditSourceModal(false);
    };

    const handleUpdateSource = async () => {
        if (!editingSource) return;

        try {
            const response = await apiClient.patch(`/sources/${editingSource.id}/`, editingSource);
            setSources(sources.map(s => s.id === editingSource.id ? response.data : s));
            setSuccess(`Источник "${response.data.name}" успешно обновлен.`);
            handleCloseEditSourceModal();
        } catch (err: any)
        {
            console.error('Ошибка обновления источника:', err);
            const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : 'Не удалось обновить источник.';
            setError(`Ошибка: ${errorMessage}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner w-12 h-12 mx-auto mb-4"></div>
                    <p className="text-gray-600">Загрузка панели управления...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Хедер панели */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FaCog className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Панель управления</h1>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="btn btn-outline btn-sm flex items-center space-x-1 sm:space-x-2 flex-shrink-0"
                        >
                            <FaPowerOff className="w-4 h-4" />
                            <span className="hidden sm:inline">Выйти</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Основной контент */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Навигация по вкладкам */}
                <div className="mb-8">
                    <nav className="flex flex-wrap gap-2 sm:gap-4 lg:space-x-8 lg:flex-nowrap">
                        <button
                            onClick={() => setSelectedTab('settings')}
                            className={`py-2 px-3 sm:px-4 text-sm font-medium rounded-lg transition-colors flex-shrink-0 ${
                                selectedTab === 'settings'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <FaCog className="w-4 h-4 inline mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Настройки сайта</span>
                            <span className="sm:hidden">Настройки</span>
                        </button>
                        <button
                            onClick={() => setSelectedTab('sources')}
                            className={`py-2 px-3 sm:px-4 text-sm font-medium rounded-lg transition-colors flex-shrink-0 ${
                                selectedTab === 'sources'
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <FaDatabase className="w-4 h-4 inline mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Источники данных</span>
                            <span className="sm:hidden">Источники</span>
                        </button>
                        <button
                            onClick={() => setSelectedTab('categories')}
                            className={`py-2 px-3 sm:px-4 text-sm font-medium rounded-lg transition-colors flex-shrink-0 ${
                                selectedTab === 'categories'
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <FaList className="w-4 h-4 inline mr-1 sm:mr-2" />
                            Категории
                        </button>
                        <button
                            onClick={() => {
                                setSelectedTab('products');
                                if (products.length === 0) {
                                    fetchProducts(1, productSearchTerm, productFilters);
                                }
                                if (categories.length === 0) {
                                    fetchCategories();
                                }
                            }}
                            className={`py-2 px-3 sm:px-4 text-sm font-medium rounded-lg transition-colors flex-shrink-0 ${
                                selectedTab === 'products'
                                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <FaTags className="w-4 h-4 inline mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Товары ({productPagination.count})</span>
                            <span className="sm:hidden">Товары</span>
                        </button>
                    </nav>
                </div>

                {/* Контент вкладок */}
                <div className="space-y-8">
                    {/* Основные настройки */}
                    {selectedTab === 'settings' && (
                    <div className="card p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FaCog className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Настройки сайта</h2>
                                <p className="text-sm text-gray-600">Управление отображением товаров и остатков</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 mb-2">
                                    Минимальный остаток для показа
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        id="minStock"
                                        min="0"
                                        value={minStock}
                                        onChange={(e) => setMinStock(Number(e.target.value))}
                                        className="input"
                                        placeholder="Введите количество"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Товары с остатком меньше этого значения не будут показаны на сайте
                                </p>
                            </div>

                            {/* Новые настройки отображения остатков */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-md font-medium text-gray-900 mb-4">Настройки отображения остатков</h3>
                                
                                <div className="space-y-4">
                                    {/* Глобальное включение/отключение показа остатков */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">
                                                Показывать остатки на сайте
                                            </label>
                                            <p className="text-xs text-gray-500">
                                                Если отключено, остатки не будут показываться пользователям
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={showStockQuantitiesGlobally}
                                                onChange={(e) => setShowStockQuantitiesGlobally(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {/* Стиль отображения остатков по умолчанию */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Стиль отображения остатков по умолчанию
                                        </label>
                                        <select
                                            value={defaultStockDisplayStyle}
                                            onChange={(e) => setDefaultStockDisplayStyle(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="exact">Показывать точное количество</option>
                                            <option value="status">Показывать статус (В наличии / Нет)</option>
                                            <option value="detailed_status">Показывать детальный статус (В наличии / Мало / Нет)</option>
                                        </select>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Применяется ко всем товарам, использующим общие настройки
                                        </p>
                                    </div>

                                    {/* Порог "Мало на складе" по умолчанию */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Порог "Мало на складе" по умолчанию
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={defaultLowStockThreshold}
                                            onChange={(e) => setDefaultLowStockThreshold(Number(e.target.value))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Введите количество"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            При остатке меньше этого значения товар будет считаться "мало"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                disabled={saveLoading}
                                className={`w-full btn btn-primary flex items-center justify-center space-x-2 ${
                                    saveLoading ? 'opacity-75 cursor-not-allowed' : ''
                                }`}
                            >
                                {saveLoading ? (
                                    <>
                                        <FaSpinner className="w-4 h-4 animate-spin" />
                                        <span>Сохранение...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaSave className="w-4 h-4" />
                                        <span>Сохранить настройки сайта</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    )}

                    {/* Источники данных */}
                    {selectedTab === 'sources' && (
                    <div className="card p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                            <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FaDatabase className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-semibold text-gray-900">Источники данных</h2>
                                    <p className="text-sm text-gray-600 truncate">Управление отображением источников 1С</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCreateSource}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center space-x-2 flex-shrink-0"
                            >
                                <FaPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">Создать источник</span>
                                <span className="sm:hidden">Создать</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {sources.length === 0 ? (
                                <div className="text-center py-8">
                                    <FaDatabase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Источники данных не найдены</p>
                                </div>
                            ) : (
                                sources.map(source => (
                                    <div
                                        key={source.id}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 gap-3"
                                    >
                                        <div className="flex items-center space-x-3 min-w-0">
                                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                                source.show_on_site ? 'bg-green-500' : 'bg-gray-300'
                                            }`}></div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-gray-900">{source.name}</span>
                                                    {getStatusIcon(source.import_status)}
                                                    <span className={`text-xs font-medium ${getStatusColor(source.import_status)}`}>
                                                        {source.import_status_display}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Цена: {source.default_price_type_name || 'не выбрана'} | 
                                                    Склад: {source.default_warehouse_name || 'не выбран'}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Последний импорт: {formatLastImport(source.last_import_completed)}
                                                    {source.import_status === 'failed' && source.import_error_message && (
                                                        <div className="text-red-500 mt-1" title={source.import_error_message}>
                                                            Ошибка: {source.import_error_message.length > 50 
                                                                ? source.import_error_message.substring(0, 50) + '...' 
                                                                : source.import_error_message}
                                                        </div>
                                                    )}
                                                </div>
                                                {source.auto_sync_enabled && (
                                                    <div className="text-xs text-blue-600 mt-1 flex items-center space-x-1">
                                                        <FaHourglassHalf className="w-3 h-3" />
                                                        <span>
                                                            Автосинхронизация: данные каждые {source.data_sync_interval} мин, 
                                                            полная каждые {source.full_sync_interval} мин
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center sm:justify-start space-x-2 flex-shrink-0">
                                            {/* Настройки */}
                                            <button
                                                onClick={() => handleEditSource(source)}
                                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Редактировать источник"
                                                disabled={isAnySourceSyncing()}
                                            >
                                                <FaEdit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleEditPriceWarehouse(source)}
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                title="Настройки цен и складов"
                                                disabled={isAnySourceSyncing()}
                                            >
                                                <FaCogs className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleEditAutoSync(source)}
                                                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                                                title="Настройки автосинхронизации"
                                                disabled={isAnySourceSyncing()}
                                            >
                                                <FaPlay className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleShowLogs(source)}
                                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                                title="Посмотреть историю синхронизации"
                                            >
                                                <FaHistory className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSource(source)}
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                title="Удалить источник"
                                                disabled={isAnySourceSyncing()}
                                            >
                                                <FaTrash className="w-5 h-5" />
                                            </button>
                                            
                                            <span className="h-6 w-px bg-gray-200"></span>

                                            {/* Управление синхронизацией */}
                                            <button
                                                onClick={() => handleImportData(source, 'quick')}
                                                disabled={isSourceSyncing(source) || !source.show_on_site || isAnySourceSyncing()}
                                                className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Быстрая синхронизация (только данные)"
                                            >
                                                {importingSourceId === source.id && source.import_status === 'running_data'
                                                    ? <FaSpinner className="w-5 h-5 animate-spin text-yellow-600" />
                                                    : <FaPlus className="w-5 h-5" />
                                                }
                                            </button>
                                            <button
                                                onClick={() => handleImportData(source, 'full')}
                                                disabled={isSourceSyncing(source) || !source.show_on_site || isAnySourceSyncing()}
                                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Полная синхронизация (данные + изображения)"
                                            >
                                                {importingSourceId === source.id && source.import_status === 'running_full'
                                                    ? <FaSpinner className="w-5 h-5 animate-spin text-green-600" />
                                                    : <FaSync className="w-5 h-5" />
                                                }
                                            </button>
                                            {isSourceSyncing(source) && (
                                                <button
                                                    onClick={() => handleResetStatus(source)}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Сбросить статус импорта"
                                                >
                                                    <FaTimes className="w-5 h-5" />
                                                </button>
                                            )}
                                            
                                            <span className="h-6 w-px bg-gray-200"></span>

                                            {/* Переключатель */}
                                            <Switch
                                                checked={source.show_on_site}
                                                onChange={() => handleSourceToggle(source)}
                                                disabled={isAnySourceSyncing()}
                                                className={`${
                                                    source.show_on_site ? 'bg-blue-600' : 'bg-gray-200'
                                                } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
                                            >
                                                <span
                                                    className={`${
                                                        source.show_on_site ? 'translate-x-6' : 'translate-x-1'
                                                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                                                />
                                            </Switch>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    )}

                    {/* Управление категориями */}
                    {selectedTab === 'categories' && (
                    <div className="card p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                            <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FaList className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-semibold text-gray-900">Управление категориями</h2>
                                    <p className="text-sm text-gray-600 truncate">Отключение категорий от показа на сайте</p>
                                </div>
                            </div>
                            
                            {/* Кнопки управления сворачиванием */}
                            <div className="flex items-center justify-center sm:justify-start space-x-2 flex-shrink-0">
                                <button
                                    onClick={expandAllCategories}
                                    className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    title="Развернуть все категории"
                                >
                                    <FaExpandArrowsAlt className="w-4 h-4" />
                                    <span className="hidden sm:inline">Развернуть все</span>
                                </button>
                                <button
                                    onClick={collapseAllCategories}
                                    className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    title="Свернуть все категории"
                                >
                                    <FaCompressArrowsAlt className="w-4 h-4" />
                                    <span className="hidden sm:inline">Свернуть все</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {loadingCategories ? (
                                <div className="py-8 text-center">
                                    <FaSpinner className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
                                    <p className="text-gray-600">Загрузка категорий...</p>
                                </div>
                            ) : categories.length === 0 ? (
                                <div className="text-center py-8">
                                    <FaList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Категории не найдены</p>
                                </div>
                            ) : (
                                Object.entries(getCategoriesGroupedBySourcesHierarchical()).map(([sourceKey, categoryList]) => (
                                    <div key={sourceKey} className="border border-gray-200 rounded-lg p-3">
                                        {/* Заголовок группы */}
                                        <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
                                            <FaDatabase className="w-4 h-4 text-purple-600 mr-2" />
                                            <h4 className="font-medium text-gray-800">
                                                {sourceKey === 'no_source' ? 'Категории без товаров' : sourceKey}
                                            </h4>
                                            <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {categoryList.length} кат.
                                            </span>
                                        </div>
                                        
                                        {/* Иерархический список категорий */}
                                        <div className="space-y-1">
                                            {categoryList.map(category => renderCategoryTree(category))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    )}

                    {/* Управление товарами */}
                    {selectedTab === 'products' && (
                    <div className="space-y-6">
                        {/* Заголовок */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <FaTags className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Управление товарами</h2>
                                <p className="text-sm text-gray-600">
                                    Всего товаров: {productPagination.count} • Страница {productPagination.page} из {productPagination.total_pages}
                                </p>
                            </div>
                        </div>

                        {/* Панель фильтров */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Поиск */}
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Название, код, артикул..."
                                            value={productSearchTerm}
                                            onChange={(e) => setProductSearchTerm(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    fetchProducts(1, productSearchTerm, productFilters);
                                                }
                                            }}
                                            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                        />
                                        <button
                                            onClick={() => fetchProducts(1, productSearchTerm, productFilters)}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-600"
                                        >
                                            <FaSpinner className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Источник */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Источник</label>
                                    <select
                                        value={productFilters.source}
                                        onChange={(e) => {
                                            const newFilters = { ...productFilters, source: e.target.value };
                                            setProductFilters(newFilters);
                                            fetchProducts(1, productSearchTerm, newFilters);
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                        <option value="">Все источники</option>
                                        {sources.map(source => (
                                            <option key={source.id} value={source.id}>
                                                {source.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Категория */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
                                    <select
                                        value={productFilters.category}
                                        onChange={(e) => {
                                            const newFilters = { ...productFilters, category: e.target.value };
                                            setProductFilters(newFilters);
                                            fetchProducts(1, productSearchTerm, newFilters);
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                                        value={productFilters.is_visible_on_site}
                                        onChange={(e) => {
                                            const newFilters = { ...productFilters, is_visible_on_site: e.target.value };
                                            setProductFilters(newFilters);
                                            fetchProducts(1, productSearchTerm, newFilters);
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                        <option value="">Все товары</option>
                                        <option value="true">Видимые</option>
                                        <option value="false">Скрытые</option>
                                    </select>
                                </div>

                                {/* Настройки остатков */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Настройки остатков</label>
                                    <select
                                        value={productFilters.use_default_stock_settings}
                                        onChange={(e) => {
                                            const newFilters = { ...productFilters, use_default_stock_settings: e.target.value };
                                            setProductFilters(newFilters);
                                            fetchProducts(1, productSearchTerm, newFilters);
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                        <option value="">Все товары</option>
                                        <option value="true">Общие настройки</option>
                                        <option value="false">Индивидуальные настройки</option>
                                    </select>
                                </div>

                                {/* Сортировка */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Сортировка</label>
                                    <select
                                        value={productFilters.ordering}
                                        onChange={(e) => {
                                            const newFilters = { ...productFilters, ordering: e.target.value };
                                            setProductFilters(newFilters);
                                            fetchProducts(productPagination.page, productSearchTerm, newFilters);
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                        <option value="-updated_at">По дате обновления</option>
                                        <option value="name">По алфавиту: А-Я</option>
                                        <option value="-name">По алфавиту: Я-А</option>
                                        <option value="price">Цена: по возрастанию</option>
                                        <option value="-price">Цена: по убыванию</option>
                                    </select>
                                </div>

                                {/* Кнопка сброса фильтров */}
                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            const resetFilters = {
                                                is_visible_on_site: '',
                                                in_stock: '',
                                                source: '',
                                                category: '',
                                                use_default_stock_settings: '',
                                                ordering: '-updated_at'
                                            };
                                            setProductFilters(resetFilters);
                                            setProductSearchTerm('');
                                            fetchProducts(1, '', resetFilters);
                                        }}
                                        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                                    >
                                        Сбросить фильтры
                                        {getActiveFiltersCount() > 0 && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                {getActiveFiltersCount()}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Карточки товаров */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            {loadingProducts ? (
                                <div className="py-16 text-center">
                                    <FaSpinner className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
                                    <p className="text-gray-600">Загрузка товаров...</p>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-16">
                                    <FaSpinner className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">Товары не найдены</p>
                                    <p className="text-gray-400 text-sm">Попробуйте изменить фильтры или поисковый запрос</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                        {products.map(product => (
                                            <div
                                                key={product.id}
                                                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                                            >
                                                {/* Изображение */}
                                                <div className="relative h-40 bg-gray-50 overflow-hidden rounded-t-lg">
                                                    {product.main_image || (product.images?.length > 0) ? (
                                                        <img
                                                            src={product.main_image?.image || product.images[0].image}
                                                            alt={product.main_image?.alt_text || product.images[0]?.alt_text || product.name}
                                                            className="w-full h-full object-contain hover:object-cover transition-all duration-300 cursor-pointer"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.objectFit = 'contain';
                                                                target.style.backgroundColor = '#f3f4f6';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                                                            <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="text-xs text-gray-400">Нет изображения</span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Индикатор видимости */}
                                                    <div className="absolute top-2 right-2">
                                                        <div className={`w-4 h-4 rounded-full ${
                                                            product.is_visible_on_site ? 'bg-green-500' : 'bg-red-500'
                                                        }`}></div>
                                                    </div>
                                                </div>

                                                {/* Информация о товаре */}
                                                <div className="p-3">
                                                    <div className="mb-2">
                                                        <h3 className="text-sm font-medium text-gray-900 line-clamp-3 mb-1 leading-tight">
                                                            {product.name}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-1 mb-1">
                                                            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                                                                {product.code}
                                                            </span>
                                                            {product.article && (
                                                                <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-xs">
                                                                    {product.article}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-xs text-gray-500 space-y-1 mb-2">
                                                        <div className="truncate" title={product.category?.name}>
                                                            📁 {product.category?.name || 'Без категории'}
                                                        </div>
                                                        <div className="truncate" title={`${product.source_name} (${product.source_code})`}>
                                                            🏪 {product.source_name}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium text-emerald-600 text-sm">
                                                                {product.price} {product.currency}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                за {product.unit}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs">Остаток: <span className="font-medium">{product.stock_quantity}</span></span>
                                                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                                                product.in_stock 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {product.in_stock ? 'В наличии' : 'Нет'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Переключатель видимости */}
                                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                        <span className="text-xs font-medium text-gray-700">
                                                            Показывать на сайте
                                                        </span>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={product.is_visible_on_site}
                                                                onChange={() => handleProductToggle(product)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                                                        </label>
                                                    </div>
                                                    
                                                    {/* Индикатор видимости */}
                                                    <div className="pt-2 border-t border-gray-100 mt-2">
                                                        <VisibilityIndicator 
                                                            product={product} 
                                                            categories={categories} 
                                                            sources={sources} 
                                                            minStock={minStock} 
                                                        />
                                                    </div>
                                                    
                                                    {/* Кнопка настроек остатков */}
                                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                                                        <div className="flex items-center space-x-1">
                                                            <span className="text-xs font-medium text-gray-700">Настройки остатков</span>
                                                            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                {product.use_default_stock_settings ? 'Общие' : 'Свои'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleEditProductStock(product)}
                                                            className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
                                                            title="Настроить отображение остатков"
                                                        >
                                                            <FaSlidersH className="w-3 h-3" />
                                                            <span>{product.use_default_stock_settings ? 'Общие' : 'Свои'}</span>
                                                        </button>
                                                    </div>

                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Пагинация */}
                                    {productPagination.total_pages > 1 && (
                                        <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
                                            <div className="text-sm text-gray-700">
                                                Показано {products.length} из {productPagination.count} товаров
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => {
                                                        if (productPagination.page > 1) {
                                                            fetchProducts(productPagination.page - 1, productSearchTerm, productFilters);
                                                        }
                                                    }}
                                                    disabled={productPagination.page <= 1}
                                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Назад
                                                </button>
                                                
                                                <span className="px-3 py-2 text-sm font-medium text-gray-700">
                                                    {productPagination.page} / {productPagination.total_pages}
                                                </span>
                                                
                                                <button
                                                    onClick={() => {
                                                        if (productPagination.page < productPagination.total_pages) {
                                                            fetchProducts(productPagination.page + 1, productSearchTerm, productFilters);
                                                        }
                                                    }}
                                                    disabled={productPagination.page >= productPagination.total_pages}
                                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Вперед
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    )}
                </div>

                {/* Модальное окно редактирования источника */}
                {showEditSourceModal && editingSource && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <FaEdit className="w-5 h-5 mr-2 text-gray-600" />
                                    Редактирование источника данных
                                </h3>
                                <button
                                    onClick={handleCloseEditSourceModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="edit-source-name" className="block text-sm font-medium text-gray-700">Название источника</label>
                                    <input
                                        type="text"
                                        id="edit-source-name"
                                        value={editingSource.name}
                                        onChange={(e) => setEditingSource({ ...editingSource, name: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="edit-source-code" className="block text-sm font-medium text-gray-700">Код источника (нельзя изменить)</label>
                                    <input
                                        type="text"
                                        id="edit-source-code"
                                        value={editingSource.code}
                                        readOnly
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="edit-json-path" className="block text-sm font-medium text-gray-700">Путь к JSON файлу</label>
                                    <input
                                        type="text"
                                        id="edit-json-path"
                                        value={editingSource.json_file_path}
                                        onChange={(e) => setEditingSource({ ...editingSource, json_file_path: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="edit-media-path" className="block text-sm font-medium text-gray-700">Путь к папке с медиа</label>
                                    <input
                                        type="text"
                                        id="edit-media-path"
                                        value={editingSource.media_dir_path}
                                        onChange={(e) => setEditingSource({ ...editingSource, media_dir_path: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <label htmlFor="edit-is-active" className="text-sm font-medium text-gray-700 mr-3">Активен</label>
                                        <Switch
                                            checked={editingSource.is_active}
                                            onChange={(checked) => setEditingSource({ ...editingSource, is_active: checked })}
                                            className={`${editingSource.is_active ? 'bg-blue-600' : 'bg-gray-200'
                                                } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                        >
                                            <span
                                                className={`${editingSource.is_active ? 'translate-x-6' : 'translate-x-1'
                                                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                                            />
                                        </Switch>
                                    </div>
                                    <div className="flex items-center">
                                        <label htmlFor="edit-show-on-site" className="text-sm font-medium text-gray-700 mr-3">Показывать на сайте</label>
                                        <Switch
                                            checked={editingSource.show_on_site}
                                            onChange={(checked) => setEditingSource({ ...editingSource, show_on_site: checked })}
                                            className={`${editingSource.show_on_site ? 'bg-blue-600' : 'bg-gray-200'
                                                } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                        >
                                            <span
                                                className={`${editingSource.show_on_site ? 'translate-x-6' : 'translate-x-1'
                                                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                                            />
                                        </Switch>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={handleCloseEditSourceModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 mr-3"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleUpdateSource}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Уведомления */}
                {(error || success) && (
                    <div className="mt-8">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <FaTimes className="w-4 h-4" />
                                    <span>{error}</span>
                                </div>
                                <button
                                    onClick={() => setError('')}
                                    className="p-1 hover:bg-red-100 rounded transition-colors"
                                    title="Закрыть уведомление"
                                >
                                    <FaTimes className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <FaCheckCircle className="w-4 h-4" />
                                    <span>{success}</span>
                                </div>
                                <button
                                    onClick={() => setSuccess('')}
                                    className="p-1 hover:bg-green-100 rounded transition-colors"
                                    title="Закрыть уведомление"
                                >
                                    <FaTimes className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Модальное окно логов синхронизации */}
                {showLogsModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
                            {/* Заголовок модального окна */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <FaHistory className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            История синхронизации
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            Источник: {selectedSourceForLogs?.name} ({selectedSourceForLogs?.code})
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseLogsModal}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Содержимое модального окна */}
                            <div className="flex-1 overflow-hidden">
                                {loadingLogs ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="text-center">
                                            <FaSpinner className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
                                            <p className="text-gray-600">Загрузка логов...</p>
                                        </div>
                                    </div>
                                ) : syncLogs.length === 0 ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="text-center">
                                            <FaHistory className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">Логи синхронизации не найдены</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                                        <div className="space-y-4">
                                            {syncLogs.map((log: any) => (
                                                <div 
                                                    key={log.id} 
                                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-3 h-3 rounded-full ${
                                                                log.status === 'completed' ? 'bg-green-500' :
                                                                log.status === 'failed' ? 'bg-red-500' :
                                                                log.status === 'in_progress' ? 'bg-blue-500' :
                                                                'bg-gray-400'
                                                            }`}></div>
                                                            <div>
                                                                <span className="font-medium text-gray-900">
                                                                    {log.sync_type_display || log.sync_type}
                                                                </span>
                                                                <span className={`ml-2 text-sm font-medium ${
                                                                    log.status === 'completed' ? 'text-green-600' :
                                                                    log.status === 'failed' ? 'text-red-600' :
                                                                    log.status === 'in_progress' ? 'text-blue-600' :
                                                                    'text-gray-600'
                                                                }`}>
                                                                    {log.status_display || log.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(log.started_at).toLocaleString('ru-RU')}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">Длительность:</span>
                                                            <span className="ml-2 text-gray-900">
                                                                {log.duration_formatted || 'Не завершен'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Обработано:</span>
                                                            <span className="ml-2 text-gray-900">
                                                                {log.processed_products || 0} товаров
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Создано/Обновлено:</span>
                                                            <span className="ml-2 text-gray-900">
                                                                {log.created_products || 0} / {log.updated_products || 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    {log.message && (
                                                        <div className="mt-3 text-sm text-gray-700 bg-gray-100 rounded p-2">
                                                            {log.message}
                                                        </div>
                                                    )}
                                                    
                                                    {log.error_details && (
                                                        <div className="mt-3 text-sm text-red-700 bg-red-50 rounded p-2">
                                                            <strong>Ошибка:</strong> {log.error_details}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Модальное окно настроек цен и складов */}
                {showPriceWarehouseModal && editingPriceWarehouse && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <FaCogs className="w-5 h-5 mr-2 text-blue-600" />
                                    Настройки цен и складов - {editingPriceWarehouse.name}
                                </h3>
                                <button
                                    onClick={() => setShowPriceWarehouseModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <FaCogs className="w-5 h-5 text-blue-600 mr-2" />
                                        <span className="text-sm font-medium text-blue-800">
                                            Настройки применения цен и остатков
                                        </span>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Эти настройки определяют, какие цены и остатки показывать пользователям
                                    </p>
                                </div>

                                {loadingOptions ? (
                                    <div className="text-center py-8">
                                        <FaSpinner className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                                        <p className="text-gray-600">Загрузка доступных вариантов...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Тип цены по умолчанию
                                            </label>
                                            <select
                                                value={editingPriceWarehouse.default_price_type_name || ''}
                                                onChange={(e) => setEditingPriceWarehouse({
                                                    ...editingPriceWarehouse,
                                                    default_price_type_name: e.target.value
                                                })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Выберите тип цены</option>
                                                {availableOptions.price_types.map(priceType => (
                                                    <option key={priceType} value={priceType}>
                                                        {priceType}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Склад по умолчанию
                                            </label>
                                            <select
                                                value={editingPriceWarehouse.default_warehouse_name || ''}
                                                onChange={(e) => setEditingPriceWarehouse({
                                                    ...editingPriceWarehouse,
                                                    default_warehouse_name: e.target.value
                                                })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Выберите склад</option>
                                                {availableOptions.warehouse_names.map(warehouse => (
                                                    <option key={warehouse} value={warehouse}>
                                                        {warehouse}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={() => setShowPriceWarehouseModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Отмена
                                </button>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={async () => {
                                            if (!editingPriceWarehouse) return;
                                            try {
                                                await apiClient.patch(`/sources/${editingPriceWarehouse.id}/`, {
                                                    default_price_type_name: editingPriceWarehouse.default_price_type_name,
                                                    default_warehouse_name: editingPriceWarehouse.default_warehouse_name,
                                                });
                                                setSources(sources.map(s => s.id === editingPriceWarehouse.id ? editingPriceWarehouse : s));
                                                setSuccess(`Настройки цен и складов для "${editingPriceWarehouse.name}" сохранены.`);
                                                setShowPriceWarehouseModal(false);
                                            } catch (err) {
                                                setError('Ошибка при сохранении настроек.');
                                            }
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                                    >
                                        Сохранить
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!editingPriceWarehouse) return;
                                            try {
                                                await apiClient.post(`/sources/${editingPriceWarehouse.id}/apply_settings/`);
                                                setSuccess(`Настройки применены к товарам источника "${editingPriceWarehouse.name}".`);
                                            } catch (err) {
                                                setError('Ошибка при применении настроек.');
                                            }
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
                                    >
                                        Применить к товарам
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Модальное окно автосинхронизации */}
                {showAutoSyncModal && editingAutoSync && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <FaPlay className="w-5 h-5 mr-2 text-green-600" />
                                    Автосинхронизация - {editingAutoSync.name}
                                </h3>
                                <button
                                    onClick={() => setShowAutoSyncModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <FaPlay className="w-5 h-5 text-green-600 mr-2" />
                                        <span className="text-sm font-medium text-green-800">
                                            Настройки расписания синхронизации
                                        </span>
                                    </div>
                                    <p className="text-xs text-green-600 mt-1">
                                        Автоматическая синхронизация данных по расписанию
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">
                                                Включить автосинхронизацию
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Автоматическое обновление данных по расписанию
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editingAutoSync.auto_sync_enabled}
                                                onChange={(e) => setEditingAutoSync({
                                                    ...editingAutoSync,
                                                    auto_sync_enabled: e.target.checked
                                                })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                </div>

                                {editingAutoSync.auto_sync_enabled && (
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Интервал синхронизации данных (минуты)
                                            </label>
                                            <input
                                                type="number"
                                                min="5"
                                                value={editingAutoSync.data_sync_interval}
                                                onChange={(e) => setEditingAutoSync({
                                                    ...editingAutoSync,
                                                    data_sync_interval: parseInt(e.target.value)
                                                })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Интервал полной синхронизации (минуты)
                                            </label>
                                            <input
                                                type="number"
                                                min="30"
                                                value={editingAutoSync.full_sync_interval}
                                                onChange={(e) => setEditingAutoSync({
                                                    ...editingAutoSync,
                                                    full_sync_interval: parseInt(e.target.value)
                                                })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={() => setShowAutoSyncModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!editingAutoSync) return;
                                        try {
                                            await apiClient.patch(`/sources/${editingAutoSync.id}/`, {
                                                auto_sync_enabled: editingAutoSync.auto_sync_enabled,
                                                data_sync_interval: editingAutoSync.data_sync_interval,
                                                full_sync_interval: editingAutoSync.full_sync_interval,
                                            });
                                            setSources(sources.map(s => s.id === editingAutoSync.id ? editingAutoSync : s));
                                            setSuccess(`Настройки автосинхронизации для "${editingAutoSync.name}" сохранены.`);
                                            setShowAutoSyncModal(false);
                                        } catch (err) {
                                            setError('Ошибка при сохранении настроек автосинхронизации.');
                                        }
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Модальное окно настроек остатков товара */}
                {showProductStockModal && editingProductStock && (
                    <ProductStockSettingsModal
                        product={editingProductStock}
                        onClose={handleCloseProductStockModal}
                        onSave={handleSaveProductStock}
                        globalSettings={{
                            default_stock_display_style: defaultStockDisplayStyle,
                            default_low_stock_threshold: defaultLowStockThreshold,
                            show_stock_quantities_globally: showStockQuantitiesGlobally
                        }}
                    />
                )}

                {/* Модальное окно создания источника */}
                {showCreateSourceModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <FaPlus className="w-5 h-5 mr-2 text-green-600" />
                                    Создание нового источника данных
                                </h3>
                                <button
                                    onClick={handleCloseCreateSourceModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="source-name" className="block text-sm font-medium text-gray-700">Название источника</label>
                                    <input
                                        type="text"
                                        id="source-name"
                                        value={newSource.name}
                                        onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                        placeholder="Основная база ПП"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="source-code" className="block text-sm font-medium text-gray-700">Код источника</label>
                                    <input
                                        type="text"
                                        id="source-code"
                                        value={newSource.code}
                                        onChange={(e) => setNewSource({ ...newSource, code: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                        placeholder="pp"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="json-path" className="block text-sm font-medium text-gray-700">Путь к JSON файлу</label>
                                    <input
                                        type="text"
                                        id="json-path"
                                        value={newSource.json_file_path}
                                        onChange={(e) => setNewSource({ ...newSource, json_file_path: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                        placeholder="pp/export.json"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="media-path" className="block text-sm font-medium text-gray-700">Путь к папке с медиа</label>
                                    <input
                                        type="text"
                                        id="media-path"
                                        value={newSource.media_dir_path}
                                        onChange={(e) => setNewSource({ ...newSource, media_dir_path: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                        placeholder="pp/export_media"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <label htmlFor="is-active" className="text-sm font-medium text-gray-700 mr-3">Активен</label>
                                        <Switch
                                            checked={newSource.is_active ?? true}
                                            onChange={(checked) => setNewSource({ ...newSource, is_active: checked })}
                                            className={`${newSource.is_active ? 'bg-green-600' : 'bg-gray-200'
                                                } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                                        >
                                            <span
                                                className={`${newSource.is_active ? 'translate-x-6' : 'translate-x-1'
                                                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                                            />
                                        </Switch>
                                    </div>
                                    <div className="flex items-center">
                                        <label htmlFor="show-on-site" className="text-sm font-medium text-gray-700 mr-3">Показывать на сайте</label>
                                        <Switch
                                            checked={newSource.show_on_site ?? true}
                                            onChange={(checked) => setNewSource({ ...newSource, show_on_site: checked })}
                                            className={`${newSource.show_on_site ? 'bg-green-600' : 'bg-gray-200'
                                                } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                                        >
                                            <span
                                                className={`${newSource.show_on_site ? 'translate-x-6' : 'translate-x-1'
                                                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                                            />
                                        </Switch>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={handleCloseCreateSourceModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 mr-3"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleSaveNewSource}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Модальное окно подтверждения удаления */}
                {showDeleteConfirmModal && deletingSource && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Удалить источник
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Вы уверены, что хотите удалить источник "{deletingSource.name}"? Это действие необратимо.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    onClick={confirmDeleteSource}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Удалить
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirmModal(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanelPage;
