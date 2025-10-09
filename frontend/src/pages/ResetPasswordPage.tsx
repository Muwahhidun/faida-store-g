import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const { uid, token } = useParams<{ uid: string; token: string }>();
    const [formData, setFormData] = useState({
        new_password: '',
        re_new_password: '',
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Очистка ошибок при вводе
        if (fieldErrors[e.target.name]) {
            setFieldErrors({
                ...fieldErrors,
                [e.target.name]: [],
            });
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setFieldErrors({});
        setIsLoading(true);

        try {
            await axios.post('http://localhost:8000/api/auth/users/reset_password_confirm/', {
                uid,
                token,
                new_password: formData.new_password,
                re_new_password: formData.re_new_password,
            });

            setSuccess(true);
            // Перенаправление на страницу входа через 3 секунды
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            if (err.response?.data) {
                const errors = err.response.data;

                if (typeof errors === 'object') {
                    setFieldErrors(errors);
                    // Формируем общее сообщение об ошибке
                    const errorMessages = Object.entries(errors)
                        .map(([field, messages]) => {
                            const fieldName = field === 'new_password' ? 'Новый пароль' :
                                            field === 're_new_password' ? 'Подтверждение пароля' :
                                            field === 'token' ? 'Ссылка' :
                                            field === 'uid' ? 'Ссылка' : field;
                            return `${fieldName}: ${(messages as string[]).join(', ')}`;
                        })
                        .join('\n');
                    setError(errorMessages);
                } else {
                    setError('Ошибка при сбросе пароля. Попробуйте еще раз.');
                }
            } else {
                setError('Ошибка при сбросе пароля. Проверьте соединение с сервером.');
            }
            console.error('Ошибка сброса пароля:', err);
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
                        Создание нового пароля
                    </h2>
                    <p className="text-gray-600">
                        Введите новый пароль для вашего аккаунта
                    </p>
                </div>

                {/* Форма сброса пароля */}
                <div className="card p-8">
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">
                                Пароль успешно изменен!
                            </h3>
                            <p className="text-gray-600">
                                Вы будете перенаправлены на страницу входа через несколько секунд.
                            </p>
                            <div className="pt-4">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Войти сейчас
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Поле нового пароля */}
                            <div>
                                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Новый пароль
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="new_password"
                                        name="new_password"
                                        value={formData.new_password}
                                        onChange={handleChange}
                                        className={`input pl-10 pr-10 ${fieldErrors.new_password ? 'border-red-500' : ''}`}
                                        placeholder="Введите новый пароль"
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
                                {fieldErrors.new_password && (
                                    <p className="mt-1 text-sm text-red-600">{fieldErrors.new_password.join(', ')}</p>
                                )}
                            </div>

                            {/* Поле подтверждения пароля */}
                            <div>
                                <label htmlFor="re_new_password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Подтверждение пароля
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="re_new_password"
                                        name="re_new_password"
                                        value={formData.re_new_password}
                                        onChange={handleChange}
                                        className={`input pl-10 pr-10 ${fieldErrors.re_new_password ? 'border-red-500' : ''}`}
                                        placeholder="Повторите новый пароль"
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
                                {fieldErrors.re_new_password && (
                                    <p className="mt-1 text-sm text-red-600">{fieldErrors.re_new_password.join(', ')}</p>
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

                            {/* Кнопка сброса пароля */}
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
                                        Изменение пароля...
                                    </div>
                                ) : (
                                    'Изменить пароль'
                                )}
                            </button>

                            {/* Ссылка на страницу входа */}
                            <div className="text-center">
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                >
                                    Вернуться к входу
                                </Link>
                            </div>
                        </form>
                    )}
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

export default ResetPasswordPage;
