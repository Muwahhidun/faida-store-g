import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

/**
 * Декодирует JWT токен без проверки подписи (только для чтения payload)
 */
const decodeJWT = (token: string): any => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
};

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:8000/api/token/', {
                username,
                password,
            });

            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);

            // Уведомляем Header об изменении состояния авторизации
            window.dispatchEvent(new Event('authChanged'));

            // Декодируем токен и проверяем роль
            const payload = decodeJWT(response.data.access);
            const userRole = payload?.role || 'user';

            // Перенаправляем в зависимости от роли
            if (userRole === 'admin' || userRole === 'moderator') {
                navigate('/panel');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('Неверное имя пользователя или пароль.');
            console.error('Ошибка входа:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Логотип и заголовок */}
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                        <span className="text-white font-bold text-2xl">F</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Добро пожаловать
                    </h2>
                    <p className="text-gray-600">
                        Войдите в свою учетную запись
                    </p>
                </div>

                {/* Форма входа */}
                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Поле email или имени пользователя */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Email или логин
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaUser className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="input pl-10"
                                    placeholder="Введите email или логин"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>

                        {/* Поле пароля */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Пароль
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-secondary-600 hover:text-blue-500"
                                >
                                    Забыли пароль?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-10 pr-10"
                                    placeholder="Введите пароль"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <FaEyeSlash className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <FaEye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Ошибка */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            </div>
                        )}

                        {/* Кнопка входа */}
                        <button
                            type="submit"
                            disabled={isLoading || !username || !password}
                            className={`w-full btn btn-primary btn-lg ${
                                isLoading ? 'opacity-75 cursor-not-allowed' : ''
                            }`}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="spinner w-5 h-5 mr-2"></div>
                                    Вход...
                                </div>
                            ) : (
                                'Войти'
                            )}
                        </button>
                    </form>

                    {/* Ссылка на страницу регистрации */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Нет аккаунта?{' '}
                            <Link to="/register" className="font-medium text-secondary-600 hover:text-blue-500">
                                Зарегистрироваться
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Дополнительная информация */}
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Faida Group Store - Качественные халяль продукты
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
