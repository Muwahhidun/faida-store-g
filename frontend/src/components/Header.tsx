/**
 * Компонент шапки сайта.
 */

import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';

const Header: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { getTotalItems } = useCart();

    // Функция для проверки состояния авторизации
    const checkAuthStatus = () => {
        const token = localStorage.getItem('access_token');
        setIsAuthenticated(!!token);
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
                            Главная
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
                            to="/about" 
                            className={({ isActive }) => 
                                `nav-link ${isActive ? 'nav-link-active' : ''}`
                            }
                        >
                            О нас
                        </NavLink>
                        <NavLink 
                            to="/contacts" 
                            className={({ isActive }) => 
                                `nav-link ${isActive ? 'nav-link-active' : ''}`
                            }
                        >
                            Контакты
                        </NavLink>
                    </nav>
                    
                    {/* Действия */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <Link 
                                to="/panel" 
                                className="btn btn-outline btn-sm"
                            >
                                Панель управления
                            </Link>
                        ) : (
                            <Link 
                                to="/login" 
                                className="btn btn-primary btn-sm"
                            >
                                Войти
                            </Link>
                        )}
                        
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