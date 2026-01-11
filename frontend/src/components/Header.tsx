/**
 * Компонент шапки сайта.
 */

import React, { useEffect, useState, Fragment } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaCog, FaSignOutAlt, FaBars, FaTimes, FaHome, FaBoxOpen, FaNewspaper, FaPhone, FaBriefcase } from 'react-icons/fa';
import { Menu, Transition } from '@headlessui/react';
import { useCart } from '../contexts/CartContext';
import logoFullSvg from '../assets/logo-full.svg';
import BrandIcon from './BrandIcon';
import patternSvg from '../assets/pattern.svg';

interface UserData {
    role: 'user' | 'moderator' | 'admin';
    username: string;
}

const Header: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { getTotalItems } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    // Закрываем мобильное меню при изменении маршрута
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Блокируем скролл body когда мобильное меню открыто
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

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

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new Event('authChanged'));
        setIsMobileMenuOpen(false);
        navigate('/');
    };

    // Навигационные ссылки
    const navLinks = [
        { to: '/', label: 'О компании', icon: FaHome },
        { to: '/products', label: 'Каталог', icon: FaBoxOpen },
        { to: '/news', label: 'Новости', icon: FaNewspaper },
        { to: '/contacts', label: 'Контакты', icon: FaPhone },
        { to: '/jobs', label: 'Вакансии', icon: FaBriefcase },
    ];

    return (
        <header className="relative bg-primary-900 border-b-2 border-secondary-500 sticky top-0 z-50 shadow-lg">
            {/* Фирменный паттерн */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `url(${patternSvg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            ></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Кнопка мобильного меню */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden p-2 text-gray-300 hover:text-secondary-500 hover:bg-primary-800 rounded-lg transition-colors"
                        aria-label="Открыть меню"
                    >
                        <FaBars size={24} />
                    </button>

                    {/* Логотип */}
                    <Link to="/" className="flex items-center group">
                        <img
                            src={logoFullSvg}
                            alt="Faida Group Logo"
                            className="h-10 w-auto transform transition-transform group-hover:scale-110"
                        />
                    </Link>

                    {/* Навигация - скрыта на мобильных */}
                    <nav className="hidden md:flex items-center space-x-8" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    `text-sm font-medium transition-all duration-200 ${
                                        isActive
                                            ? 'text-secondary-500 border-b-2 border-secondary-500 pb-1'
                                            : 'text-gray-300 hover:text-secondary-500 hover:border-b-2 hover:border-secondary-500 hover:pb-1'
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Действия */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Dropdown меню пользователя - скрыто на мобильных */}
                        {isAuthenticated && userData ? (
                            <Menu as="div" className="relative hidden sm:block">
                                {({ open }) => (
                                    <>
                                        <Menu.Button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white hover:bg-primary-800 rounded-lg transition-colors">
                                            {/* Аватар с инициалами */}
                                            <div className="w-8 h-8 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center text-primary-900 font-semibold text-sm shadow-md">
                                                {userData.username.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="hidden sm:inline">{userData.username}</span>
                                            <BrandIcon direction={open ? 'right' : 'down'} className="w-3 h-3 text-gray-300" />
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
                                            <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>
                                                <div className="py-1">
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <Link
                                                                to="/profile"
                                                                className={`${
                                                                    active ? 'bg-primary-800 text-white' : 'text-gray-700'
                                                                } flex items-center px-4 py-2 text-sm transition-colors`}
                                                            >
                                                                <FaUser className={`mr-3 w-4 h-4 ${active ? 'text-secondary-500' : 'text-gray-400'}`} />
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
                                                                        active ? 'bg-primary-800 text-white' : 'text-gray-700'
                                                                    } flex items-center px-4 py-2 text-sm transition-colors`}
                                                                >
                                                                    <FaCog className={`mr-3 w-4 h-4 ${active ? 'text-secondary-500' : 'text-gray-400'}`} />
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
                                                                onClick={handleLogout}
                                                                className={`${
                                                                    active ? 'bg-red-50' : ''
                                                                } flex items-center w-full px-4 py-2 text-sm text-red-600 transition-colors`}
                                                            >
                                                                <FaSignOutAlt className="mr-3 w-4 h-4" />
                                                                Выйти
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                </div>
                                            </Menu.Items>
                                        </Transition>
                                    </>
                                )}
                            </Menu>
                        ) : (
                            <Link
                                to="/login"
                                className="hidden sm:block px-4 py-2 text-sm font-medium text-primary-900 bg-secondary-500 hover:bg-secondary-600 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                                Войти
                            </Link>
                        )}

                        {/* Корзина (всегда справа) */}
                        <Link
                            to="/cart"
                            className="relative p-3 text-gray-300 hover:text-secondary-500 hover:bg-primary-800 rounded-lg transition-all duration-200 group"
                        >
                            <FaShoppingCart
                                size={22}
                                className="transition-transform duration-200 group-hover:scale-110"
                            />
                            {getTotalItems() > 0 && (
                                <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-gradient-to-r from-secondary-500 to-secondary-600 text-primary-900 text-xs rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center font-bold shadow-lg ring-2 ring-primary-900 transform transition-all duration-200 hover:scale-110">
                                    {getTotalItems() > 99 ? '99+' : getTotalItems()}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Мобильное меню - Drawer */}
            <Transition show={isMobileMenuOpen} as={Fragment}>
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Overlay */}
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    </Transition.Child>

                    {/* Drawer */}
                    <Transition.Child
                        as={Fragment}
                        enter="transition ease-in-out duration-300 transform"
                        enterFrom="-translate-x-full"
                        enterTo="translate-x-0"
                        leave="transition ease-in-out duration-300 transform"
                        leaveFrom="translate-x-0"
                        leaveTo="-translate-x-full"
                    >
                        <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-primary-900 shadow-xl flex flex-col">
                            {/* Header мобильного меню */}
                            <div className="flex items-center justify-between p-4 border-b border-primary-800">
                                <img
                                    src={logoFullSvg}
                                    alt="Faida Group Logo"
                                    className="h-8 w-auto"
                                />
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-gray-300 hover:text-secondary-500 hover:bg-primary-800 rounded-lg transition-colors"
                                    aria-label="Закрыть меню"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            {/* Навигация */}
                            <nav className="flex-1 overflow-y-auto py-4" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>
                                {navLinks.map((link) => {
                                    const Icon = link.icon;
                                    return (
                                        <NavLink
                                            key={link.to}
                                            to={link.to}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={({ isActive }) =>
                                                `flex items-center px-6 py-3 text-base font-medium transition-colors ${
                                                    isActive
                                                        ? 'text-secondary-500 bg-primary-800 border-l-4 border-secondary-500'
                                                        : 'text-gray-300 hover:text-secondary-500 hover:bg-primary-800'
                                                }`
                                            }
                                        >
                                            <Icon className="w-5 h-5 mr-4" />
                                            {link.label}
                                        </NavLink>
                                    );
                                })}
                            </nav>

                            {/* Пользовательские действия */}
                            <div className="border-t border-primary-800 p-4">
                                {isAuthenticated && userData ? (
                                    <div className="space-y-2">
                                        {/* Информация о пользователе */}
                                        <div className="flex items-center px-2 py-3 mb-2">
                                            <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center text-primary-900 font-semibold shadow-md">
                                                {userData.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-white">{userData.username}</p>
                                                <p className="text-xs text-gray-400 capitalize">{userData.role}</p>
                                            </div>
                                        </div>

                                        <Link
                                            to="/profile"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 hover:text-secondary-500 hover:bg-primary-800 rounded-lg transition-colors"
                                        >
                                            <FaUser className="w-5 h-5 mr-3" />
                                            Личный кабинет
                                        </Link>

                                        {(userData.role === 'admin' || userData.role === 'moderator') && (
                                            <Link
                                                to="/panel"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 hover:text-secondary-500 hover:bg-primary-800 rounded-lg transition-colors"
                                            >
                                                <FaCog className="w-5 h-5 mr-3" />
                                                Панель управления
                                            </Link>
                                        )}

                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <FaSignOutAlt className="w-5 h-5 mr-3" />
                                            Выйти
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Link
                                            to="/login"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-primary-900 bg-secondary-500 hover:bg-secondary-600 rounded-lg transition-colors"
                                        >
                                            Войти
                                        </Link>
                                        <Link
                                            to="/register"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-300 border border-gray-600 hover:border-secondary-500 hover:text-secondary-500 rounded-lg transition-colors"
                                        >
                                            Регистрация
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Transition.Child>
                </div>
            </Transition>
        </header>
    );
};

export default Header;
