import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        re_password: '',
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [usernameValidationError, setUsernameValidationError] = useState('');

    // Валидация username на клиентской стороне
    const validateUsername = (username: string): boolean => {
        if (!username) {
            setUsernameValidationError('');
            return true;
        }

        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(username)) {
            setUsernameValidationError('Имя пользователя может содержать только латинские буквы, цифры, _ и -');
            return false;
        }

        setUsernameValidationError('');
        return true;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData({
            ...formData,
            [name]: value,
        });

        // Валидация username при вводе
        if (name === 'username') {
            validateUsername(value);
        }

        // Очистка ошибок при вводе
        if (fieldErrors[name]) {
            setFieldErrors({
                ...fieldErrors,
                [name]: [],
            });
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setFieldErrors({});

        // Проверка валидации username перед отправкой
        if (!validateUsername(formData.username)) {
            setError('Пожалуйста, исправьте ошибки в форме');
            return;
        }

        setIsLoading(true);

        try {
            await axios.post('http://localhost:8000/api/auth/users/', formData);

            // Успешная регистрация - автоматический вход
            const loginResponse = await axios.post('http://localhost:8000/api/token/', {
                username: formData.username,
                password: formData.password,
            });

            localStorage.setItem('access_token', loginResponse.data.access);
            localStorage.setItem('refresh_token', loginResponse.data.refresh);

            // Уведомляем Header об изменении состояния авторизации
            window.dispatchEvent(new Event('authChanged'));

            navigate('/');
        } catch (err: any) {
            if (err.response?.data) {
                // Обработка ошибок от djoser
                const errors = err.response.data;

                if (typeof errors === 'object') {
                    setFieldErrors(errors);
                    // Формируем общее сообщение об ошибке
                    const errorMessages = Object.entries(errors)
                        .map(([field, messages]) => {
                            const fieldName = field === 'username' ? 'Имя пользователя' :
                                            field === 'email' ? 'Email' :
                                            field === 'password' ? 'Пароль' :
                                            field === 're_password' ? 'Подтверждение пароля' : field;
                            return `${fieldName}: ${(messages as string[]).join(', ')}`;
                        })
                        .join('\n');
                    setError(errorMessages);
                } else {
                    setError('Ошибка при регистрации. Попробуйте еще раз.');
                }
            } else {
                setError('Ошибка при регистрации. Проверьте соединение с сервером.');
            }
            console.error('Ошибка регистрации:', err);
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
                        Создать аккаунт
                    </h2>
                    <p className="text-gray-600">
                        Присоединяйтесь к Faida Group Store
                    </p>
                </div>

                {/* Форма регистрации */}
                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Поле имени пользователя */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Имя пользователя
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaUser className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className={`input pl-10 ${
                                        fieldErrors.username || usernameValidationError
                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                            : ''
                                    }`}
                                    placeholder="Введите имя пользователя"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                            {/* Ошибки от сервера */}
                            {fieldErrors.username && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors.username.join(', ')}</p>
                            )}
                            {/* Ошибка валидации на клиенте */}
                            {usernameValidationError && !fieldErrors.username && (
                                <p className="mt-1 text-sm text-red-600">{usernameValidationError}</p>
                            )}
                            {/* Подсказка о формате */}
                            {!usernameValidationError && !fieldErrors.username && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Латинские буквы, цифры, _ и - (например: john_doe или user-123)
                                </p>
                            )}
                        </div>

                        {/* Поле email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaEnvelope className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`input pl-10 ${fieldErrors.email ? 'border-red-500' : ''}`}
                                    placeholder="Введите email"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors.email.join(', ')}</p>
                            )}
                        </div>

                        {/* Поле пароля */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Пароль
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`input pl-10 pr-10 ${fieldErrors.password ? 'border-red-500' : ''}`}
                                    placeholder="Введите пароль"
                                    autoComplete="new-password"
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
                            {fieldErrors.password && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors.password.join(', ')}</p>
                            )}
                        </div>

                        {/* Поле подтверждения пароля */}
                        <div>
                            <label htmlFor="re_password" className="block text-sm font-medium text-gray-700 mb-2">
                                Подтверждение пароля
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="re_password"
                                    name="re_password"
                                    value={formData.re_password}
                                    onChange={handleChange}
                                    className={`input pl-10 pr-10 ${fieldErrors.re_password ? 'border-red-500' : ''}`}
                                    placeholder="Повторите пароль"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showConfirmPassword ? (
                                        <FaEyeSlash className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <FaEye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                            {fieldErrors.re_password && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors.re_password.join(', ')}</p>
                            )}
                        </div>

                        {/* Общая ошибка */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                <div className="flex items-start">
                                    <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <pre className="text-sm whitespace-pre-wrap">{error}</pre>
                                </div>
                            </div>
                        )}

                        {/* Кнопка регистрации */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full btn btn-primary btn-lg ${
                                isLoading ? 'opacity-75 cursor-not-allowed' : ''
                            }`}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="spinner w-5 h-5 mr-2"></div>
                                    Регистрация...
                                </div>
                            ) : (
                                'Зарегистрироваться'
                            )}
                        </button>
                    </form>

                    {/* Ссылка на страницу входа */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Уже есть аккаунт?{' '}
                            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Войти
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
