import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setSuccess(false);
        setIsLoading(true);

        try {
            await axios.post('http://localhost:8000/api/auth/users/reset_password/', {
                email,
            });

            setSuccess(true);
        } catch (err: any) {
            if (err.response?.data) {
                const errors = err.response.data;
                if (typeof errors === 'object' && errors.email) {
                    setError(Array.isArray(errors.email) ? errors.email.join(', ') : errors.email);
                } else {
                    setError('Ошибка при отправке письма. Попробуйте еще раз.');
                }
            } else {
                setError('Ошибка при отправке письма. Проверьте соединение с сервером.');
            }
            console.error('Ошибка восстановления пароля:', err);
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
                        Восстановление пароля
                    </h2>
                    <p className="text-gray-600">
                        Введите email, указанный при регистрации
                    </p>
                </div>

                {/* Форма восстановления пароля */}
                <div className="card p-8">
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">
                                Письмо отправлено!
                            </h3>
                            <p className="text-gray-600">
                                Мы отправили инструкции по восстановлению пароля на адрес <strong>{email}</strong>.
                                Проверьте вашу почту и следуйте инструкциям в письме.
                            </p>
                            <div className="pt-4">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-500"
                                >
                                    <FaArrowLeft className="w-4 h-4 mr-2" />
                                    Вернуться к входу
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            // Очистка ошибки при вводе
                                            if (error) setError('');
                                        }}
                                        className={`input pl-10 ${error ? 'border-red-500' : ''}`}
                                        placeholder="Введите ваш email"
                                        autoComplete="email"
                                        required
                                    />
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

                            {/* Кнопка отправки */}
                            <button
                                type="submit"
                                disabled={isLoading || !email}
                                className={`w-full btn btn-primary btn-lg ${
                                    isLoading ? 'opacity-75 cursor-not-allowed' : ''
                                }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="spinner w-5 h-5 mr-2"></div>
                                        Отправка...
                                    </div>
                                ) : (
                                    'Отправить инструкции'
                                )}
                            </button>

                            {/* Ссылка на страницу входа */}
                            <div className="text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                                >
                                    <FaArrowLeft className="w-3 h-3 mr-1" />
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

export default ForgotPasswordPage;
