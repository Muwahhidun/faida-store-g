/**
 * Компонент шапки сайта.
 */

import React, { useEffect, useState, Fragment } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaCog, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { Menu, Transition } from '@headlessui/react';
import { useCart } from '../contexts/CartContext';

interface UserData {
    role: 'user' | 'moderator' | 'admin';
    username: string;
}

const Header: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const { getTotalItems } = useCart();
    const navigate = useNavigate();

    // Функция для декодирования JWT токена
    const decodeToken = (token: string): UserData | null => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    };

    // Функция для проверки состояния авторизации
    const checkAuthStatus = () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            setIsAuthenticated(true);
            const decoded = decodeToken(token);
            setUserData(decoded);
        } else {
            setIsAuthenticated(false);
            setUserData(null);
        }
    };

    useEffect(() => {
        // Проверяем при загрузке
        checkAuthStatus();

        // Слушаем изменения в localStorage
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token') {
                checkAuthStatus();
            }
        };

        // Слушаем кастомное событие для обновления состояния авторизации
        const handleAuthChange = () => {
            checkAuthStatus();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('authChanged', handleAuthChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authChanged', handleAuthChange);
        };
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Логотип */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">F</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">Faida Group</span>
                    </Link>
                    
                    {/* Навигация */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'nav-link-active' : ''}`
                            }
                        >
                            О компании
                        </NavLink>
                        <NavLink
                            to="/products"
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'nav-link-active' : ''}`
                            }
                        >
                            Каталог
                        </NavLink>
                        <NavLink
                            to="/news"
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'nav-link-active' : ''}`
                            }
                        >
                            Новости
                        </NavLink>
                        <NavLink
                            to="/contacts"
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'nav-link-active' : ''}`
                            }
                        >
                            Контакты
                        </NavLink>
                        <NavLink
                            to="/jobs"
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'nav-link-active' : ''}`
                            }
                        >
                            Вакансии
                        </NavLink>
                    </nav>

                    {/* Действия */}
                    <div className="flex items-center space-x-4">
                        {/* Dropdown меню пользователя */}
                        {isAuthenticated && userData ? (
                            <Menu as="div" className="relative">
                                <Menu.Button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                    {/* Аватар с инициалами */}
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                        {userData.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden sm:inline">{userData.username}</span>
                                    <FaChevronDown className="w-3 h-3 text-gray-500" />
                                </Menu.Button>

                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                >
                                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
                                        <div className="px-4 py-3">
                                            <p className="text-sm text-gray-500">Вы вошли как</p>
                                            <p className="text-sm font-semibold text-gray-900 truncate">{userData.username}</p>
                                        </div>

                                        <div className="py-1">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link
                                                        to="/profile"
                                                        className={`${
                                                            active ? 'bg-gray-100' : ''
                                                        } flex items-center px-4 py-2 text-sm text-gray-700`}
                                                    >
                                                        <FaUser className="mr-3 w-4 h-4 text-gray-400" />
                                                        Личный кабинет
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                            {(userData.role === 'admin' || userData.role === 'moderator') && (
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to="/panel"
                                                            className={`${
                                                                active ? 'bg-gray-100' : ''
                                                            } flex items-center px-4 py-2 text-sm text-gray-700`}
                                                        >
                                                            <FaCog className="mr-3 w-4 h-4 text-gray-400" />
                                                            Панель управления
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                            )}
                                        </div>

                                        <div className="py-1">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => {
                                                            localStorage.removeItem('access_token');
                                                            localStorage.removeItem('refresh_token');
                                                            window.dispatchEvent(new Event('authChanged'));
                                                            navigate('/');
                                                        }}
                                                        className={`${
                                                            active ? 'bg-gray-100' : ''
                                                        } flex items-center w-full px-4 py-2 text-sm text-red-600`}
                                                    >
                                                        <FaSignOutAlt className="mr-3 w-4 h-4" />
                                                        Выйти
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        </div>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        ) : (
                            <Link
                                to="/login"
                                className="btn btn-primary btn-sm"
                            >
                                Войти
                            </Link>
                        )}

                        {/* Корзина (всегда справа) */}
                        <Link
                            to="/cart"
                            className="relative p-3 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 group"
                        >
                            <FaShoppingCart
                                size={22}
                                className="transition-transform duration-200 group-hover:scale-110"
                            />
                            {getTotalItems() > 0 && (
                                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg ring-2 ring-white transform transition-all duration-200 hover:scale-110 animate-pulse">
                                    {getTotalItems() > 99 ? '99+' : getTotalItems()}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;