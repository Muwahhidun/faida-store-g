import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCog, FaDatabase, FaList, FaTags, FaPowerOff, FaUsers, FaShoppingBag, FaBell } from 'react-icons/fa';
import { adminClient } from '../api/adminClient';
import { Source, Category, AvailableOptions } from '../types/admin';
import {
    SourcesSection,
    CategoriesSection,
    ProductsSection,
    SettingsSection,
    UsersSection,
    OrdersManagementSection
} from '../components/admin';
import { NotificationsSection } from '../components/admin/sections/NotificationsSection';
import { Toast } from '../components/Toast';

/**
 * Админ-панель - рефакторированная версия
 * Использует модульные секции вместо монолитного кода
 */
const AdminPanelPage: React.FC = () => {
    const navigate = useNavigate();

    // Получаем вкладку из URL hash или используем 'settings' по умолчанию
    const getInitialTab = (): 'settings' | 'sources' | 'categories' | 'products' | 'users' | 'orders' | 'notifications' => {
        const hash = window.location.hash.slice(1); // Убираем '#'
        if (hash === 'sources' || hash === 'categories' || hash === 'products' || hash === 'settings' || hash === 'users' || hash === 'orders' || hash === 'notifications') {
            return hash;
        }
        return 'settings';
    };

    // Основное состояние
    const [selectedTab, setSelectedTab] = useState<'settings' | 'sources' | 'categories' | 'products' | 'users' | 'orders' | 'notifications'>(getInitialTab());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Данные
    const [sources, setSources] = useState<Source[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [productsCount, setProductsCount] = useState<number>(0);
    const [usersCount, setUsersCount] = useState<number>(0);
    const [ordersCount, setOrdersCount] = useState<number>(0);
    const [availableOptions, setAvailableOptions] = useState<AvailableOptions>({ price_types: [], warehouses: [] });
    const [loadingCategories, setLoadingCategories] = useState(false);

    // Настройки
    const [minStock, setMinStock] = useState<number>(0);
    const [defaultStockDisplayStyle, setDefaultStockDisplayStyle] = useState<string>('detailed_status');
    const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState<number>(5);
    const [showStockQuantitiesGlobally, setShowStockQuantitiesGlobally] = useState<boolean>(true);

    // Ref для отслеживания статусов синхронизации
    const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Загрузка источников
    const fetchSources = async () => {
        try {
            const sourcesResponse = await adminClient.get('/sources/');
            const sourcesData = Array.isArray(sourcesResponse.data)
                ? sourcesResponse.data
                : sourcesResponse.data.results || [];

            // Всегда обновляем источники, чтобы получить свежие данные
            // (включая default_price_type_name и default_warehouse_name)
            setSources(sourcesData);
        } catch (err) {
            console.error('Ошибка загрузки источников:', err);
        }
    };

    // Загрузка категорий
    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const categoriesResponse = await adminClient.get('/categories-management/');
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

    // Загрузка количества товаров
    const fetchProductsCount = async () => {
        try {
            const productsResponse = await adminClient.get('/products-management/', {
                params: { limit: 1 } // Загружаем только 1 товар, нам нужен только count
            });
            const count = productsResponse.data.count || 0;
            setProductsCount(count);
        } catch (err) {
            console.error('Ошибка загрузки количества товаров:', err);
        }
    };

    // Загрузка количества пользователей
    const fetchUsersCount = async () => {
        try {
            const usersResponse = await adminClient.get('/users-management/', {
                params: { limit: 1 } // Загружаем только 1 пользователя, нам нужен только count
            });
            const count = usersResponse.data.count || 0;
            setUsersCount(count);
        } catch (err) {
            console.error('Ошибка загрузки количества пользователей:', err);
        }
    };

    // Загрузка количества заказов
    const fetchOrdersCount = async () => {
        try {
            const ordersResponse = await adminClient.get('/orders/', {
                params: { limit: 1 } // Загружаем только 1 заказ, нам нужен только count
            });
            const count = ordersResponse.data.count || 0;
            setOrdersCount(count);
        } catch (err) {
            console.error('Ошибка загрузки количества заказов:', err);
        }
    };

    // Загрузка настроек
    const fetchSettings = async () => {
        try {
            const settingsResponse = await adminClient.get('/settings/1/');
            setMinStock(settingsResponse.data.min_stock_for_display);
            setDefaultStockDisplayStyle(settingsResponse.data.default_stock_display_style || 'detailed_status');
            setDefaultLowStockThreshold(settingsResponse.data.default_low_stock_threshold || 5);
            setShowStockQuantitiesGlobally(settingsResponse.data.show_stock_quantities_globally !== false);
        } catch (err) {
            console.error('Ошибка загрузки настроек:', err);
            setError('Не удалось загрузить настройки. Возможно, у вас нет прав доступа.');
        }
    };

    // Начальная загрузка данных
    useEffect(() => {
        if (dataLoaded) return;

        const fetchAllData = async () => {
            setLoading(true);
            await fetchSettings();
            await fetchSources();
            await fetchCategories();
            await fetchProductsCount();
            await fetchUsersCount();
            await fetchOrdersCount();
            setLoading(false);
            setDataLoaded(true);
        };

        fetchAllData();
    }, [dataLoaded]);

    // Мониторинг статусов синхронизации
    useEffect(() => {
        if (loading) return;

        const hasRunningImports = sources.some(s =>
            s.import_status === 'running' ||
            s.import_status === 'running_data' ||
            s.import_status === 'running_full'
        );

        if (hasRunningImports && !statusIntervalRef.current) {
            statusIntervalRef.current = setInterval(() => {
                fetchSources();
            }, 3000);
        } else if (!hasRunningImports && statusIntervalRef.current) {
            clearInterval(statusIntervalRef.current);
            statusIntervalRef.current = null;
        }

        return () => {
            if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
                statusIntervalRef.current = null;
            }
        };
    }, [sources, loading]);

    // Обновление URL hash при изменении вкладки
    useEffect(() => {
        window.location.hash = selectedTab;
    }, [selectedTab]);

    // Выход
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new Event('authChanged'));
        navigate('/login');
    };

    // Обработчики ошибок и успехов
    const handleError = (message: string) => {
        setError(message);
        setSuccess('');
        setTimeout(() => setError(''), 5000);
    };

    const handleSuccess = (message: string) => {
        setSuccess(message);
        setError('');
        setTimeout(() => setSuccess(''), 5000);
    };

    return (
        <div className="min-h-screen bg-gray-50">
                {/* Шапка */}
                <div className="bg-white shadow-sm border-b border-gray-200">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between h-16">
                            <h1 className="text-xl font-bold text-gray-900">Панель управления</h1>
                        </div>
                    </div>
                </div>

                {/* Toast уведомления */}
                {error && (
                    <Toast
                        message={error}
                        type="error"
                        onClose={() => setError('')}
                    />
                )}
                {success && (
                    <Toast
                        message={success}
                        type="success"
                        onClose={() => setSuccess('')}
                    />
                )}

                {/* Основной контент */}
                <div className="container mx-auto px-4 py-6">
                    {/* Табы */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-x-auto">
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setSelectedTab('settings')}
                                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    selectedTab === 'settings'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <FaCog className="w-4 h-4" />
                                <span>Настройки сайта</span>
                            </button>
                            <button
                                onClick={() => setSelectedTab('sources')}
                                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    selectedTab === 'sources'
                                        ? 'border-green-600 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <FaDatabase className="w-4 h-4" />
                                <span>Источники ({sources.length})</span>
                            </button>
                            <button
                                onClick={() => setSelectedTab('categories')}
                                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    selectedTab === 'categories'
                                        ? 'border-purple-600 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <FaList className="w-4 h-4" />
                                <span>Категории ({categories.length})</span>
                            </button>
                            <button
                                onClick={() => setSelectedTab('products')}
                                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    selectedTab === 'products'
                                        ? 'border-orange-600 text-orange-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <FaTags className="w-4 h-4" />
                                <span>Товары ({productsCount})</span>
                            </button>
                            <button
                                onClick={() => setSelectedTab('users')}
                                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    selectedTab === 'users'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <FaUsers className="w-4 h-4" />
                                <span>Пользователи ({usersCount})</span>
                            </button>
                            <button
                                onClick={() => setSelectedTab('orders')}
                                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    selectedTab === 'orders'
                                        ? 'border-emerald-600 text-emerald-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <FaShoppingBag className="w-4 h-4" />
                                <span>Заказы ({ordersCount})</span>
                            </button>
                            <button
                                onClick={() => setSelectedTab('notifications')}
                                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    selectedTab === 'notifications'
                                        ? 'border-yellow-600 text-yellow-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <FaBell className="w-4 h-4" />
                                <span>Уведомления</span>
                            </button>
                        </div>
                    </div>

                    {/* Контент табов */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-gray-600">Загрузка данных...</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: selectedTab === 'settings' ? 'block' : 'none' }}>
                                <SettingsSection
                                    initialSettings={{
                                        minStock,
                                        defaultStockDisplayStyle,
                                        defaultLowStockThreshold,
                                        showStockQuantitiesGlobally
                                    }}
                                    onError={handleError}
                                    onSuccess={handleSuccess}
                                    onSettingsUpdate={fetchSettings}
                                />
                            </div>

                            <div style={{ display: selectedTab === 'sources' ? 'block' : 'none' }}>
                                <SourcesSection
                                    sources={sources}
                                    availableOptions={availableOptions}
                                    onSourcesUpdate={fetchSources}
                                    onError={handleError}
                                    onSuccess={handleSuccess}
                                />
                            </div>

                            <div style={{ display: selectedTab === 'categories' ? 'block' : 'none' }}>
                                <CategoriesSection
                                    categories={categories}
                                    sources={sources}
                                    loading={loadingCategories}
                                    onCategoriesUpdate={fetchCategories}
                                    onError={handleError}
                                    onSuccess={handleSuccess}
                                />
                            </div>

                            <div style={{ display: selectedTab === 'products' ? 'block' : 'none' }}>
                                <ProductsSection
                                    categories={categories}
                                    sources={sources}
                                    globalSettings={{
                                        default_stock_display_style: defaultStockDisplayStyle,
                                        default_low_stock_threshold: defaultLowStockThreshold,
                                        show_stock_quantities_globally: showStockQuantitiesGlobally
                                    }}
                                    minStock={minStock}
                                    onError={handleError}
                                    onSuccess={handleSuccess}
                                    onProductsCountChange={setProductsCount}
                                    initialProductsCount={productsCount}
                                />
                            </div>

                            <div style={{ display: selectedTab === 'users' ? 'block' : 'none' }}>
                                <UsersSection
                                    onError={handleError}
                                    onSuccess={handleSuccess}
                                    onUsersCountChange={setUsersCount}
                                />
                            </div>

                            <div style={{ display: selectedTab === 'orders' ? 'block' : 'none' }}>
                                <OrdersManagementSection
                                    onError={handleError}
                                    onSuccess={handleSuccess}
                                />
                            </div>

                            <div style={{ display: selectedTab === 'notifications' ? 'block' : 'none' }}>
                                <NotificationsSection />
                            </div>
                        </>
                    )}
                </div>
            </div>
    );
};

export default AdminPanelPage;
