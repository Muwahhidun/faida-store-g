import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaShoppingBag, FaMapMarkerAlt, FaSignOutAlt, FaHeart } from 'react-icons/fa';
import { Toast } from '../components/Toast';
import { ProfileSection } from '../components/profile/ProfileSection';
import AddressesSection from '../components/profile/AddressesSection';
import OrdersSection from '../components/profile/OrdersSection';
import FavoritesSection from '../components/profile/FavoritesSection';

/**
 * Личный кабинет пользователя
 * Структура аналогична админ-панели с табами
 */
const ProfilePage: React.FC = () => {
    const navigate = useNavigate();

    // Получаем вкладку из URL hash
    const getInitialTab = (): 'profile' | 'orders' | 'addresses' | 'favorites' => {
        const hash = window.location.hash.slice(1);
        if (hash === 'orders' || hash === 'addresses' || hash === 'profile' || hash === 'favorites') {
            return hash;
        }
        return 'profile';
    };

    const [selectedTab, setSelectedTab] = useState<'profile' | 'orders' | 'addresses' | 'favorites'>(getInitialTab());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Данные пользователя
    const [userData, setUserData] = useState<any>(null);

    // Обновление hash в URL при смене таба
    useEffect(() => {
        window.location.hash = selectedTab;
    }, [selectedTab]);

    // Загрузка данных пользователя
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const { profileApi } = await import('../api/client');
                const data = await profileApi.getMe();
                setUserData(data);
            } catch (err) {
                setError('Не удалось загрузить данные профиля');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new Event('authChanged'));
        navigate('/');
    };

    const handleUserDataUpdate = (field: string, value: string) => {
        setUserData((prev: any) => ({ ...prev, [field]: value }));
    };

    const showError = (message: string) => {
        setError(message);
    };

    const showSuccess = (message: string) => {
        setSuccess(message);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600">Загрузка профиля...</p>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h2>
                    <p className="text-gray-600 mb-4">Не удалось загрузить данные профиля</p>
                    <button
                        onClick={() => navigate('/')}
                        className="btn btn-primary"
                    >
                        На главную
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <h1 className="text-xl font-bold text-gray-900">Личный кабинет</h1>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <FaSignOutAlt />
                            <span>Выйти</span>
                        </button>
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setSelectedTab('profile')}
                            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                selectedTab === 'profile'
                                    ? 'border-blue-600 text-secondary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <FaUser className="w-4 h-4" />
                            <span>Профиль</span>
                        </button>
                        <button
                            onClick={() => setSelectedTab('orders')}
                            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                selectedTab === 'orders'
                                    ? 'border-green-600 text-success-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <FaShoppingBag className="w-4 h-4" />
                            <span>Мои заказы</span>
                        </button>
                        <button
                            onClick={() => setSelectedTab('addresses')}
                            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                selectedTab === 'addresses'
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <FaMapMarkerAlt className="w-4 h-4" />
                            <span>Адреса доставки</span>
                        </button>
                        <button
                            onClick={() => setSelectedTab('favorites')}
                            className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                selectedTab === 'favorites'
                                    ? 'border-red-500 text-red-500'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <FaHeart className="w-4 h-4" />
                            <span>Избранное</span>
                        </button>
                    </div>
                </div>

                {/* Контент табов */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    {selectedTab === 'profile' && (
                        <ProfileSection
                            userData={userData}
                            onUpdate={handleUserDataUpdate}
                            showSuccess={showSuccess}
                            showError={showError}
                        />
                    )}

                    {selectedTab === 'orders' && (
                        <OrdersSection />
                    )}

                    {selectedTab === 'addresses' && (
                        <AddressesSection />
                    )}

                    {selectedTab === 'favorites' && (
                        <FavoritesSection />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
