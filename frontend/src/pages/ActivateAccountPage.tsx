/**
 * Страница активации аккаунта по ссылке из email
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircleIcon, XCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Перевод ошибок Djoser на русский
const translateDjoserError = (error: string): string => {
  const translations: Record<string, string> = {
    'Stale token for given user.': 'Ссылка активации устарела или уже была использована.',
    'Invalid token for given user.': 'Неверная ссылка активации.',
    'Invalid user id or user doesn\'t exist.': 'Пользователь не найден.',
    'User account is disabled.': 'Аккаунт пользователя отключён.',
    'User with given email does not exist.': 'Пользователь с таким email не найден.',
  };
  return translations[error] || error;
};

const ActivateAccountPage: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const activateAccount = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/auth/users/activation/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid,
            token,
          }),
        });

        if (response.ok) {
          setStatus('success');
          // Не делаем редирект - показываем форму входа
        } else {
          const data = await response.json();
          setStatus('error');
          const rawError = data.detail || 'Ошибка активации аккаунта.';
          setErrorMessage(translateDjoserError(rawError));
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('Произошла ошибка при активации аккаунта. Попробуйте позже.');
        console.error('Ошибка активации:', error);
      }
    };

    if (uid && token) {
      activateAccount();
    } else {
      setStatus('error');
      setErrorMessage('Неверная ссылка активации.');
    }
  }, [uid, token, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const response = await axios.post('http://localhost:8000/api/token/', {
        username: loginData.username,
        password: loginData.password,
      });

      if (response.data.access) {
        // Сохраняем токены
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);

        // Уведомляем Header об изменении состояния авторизации
        window.dispatchEvent(new Event('authChanged'));

        // Перенаправляем на главную
        navigate('/');
      }
    } catch (error: any) {
      console.error('Ошибка входа:', error);
      setLoginError(error.response?.data?.detail || 'Неверный логин или пароль');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Активация аккаунта</title>
        <meta name="description" content="Активация аккаунта Faida Group" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {status === 'loading' && (
            <div className="text-center">
              <LoadingSpinner size="lg" text="Активация аккаунта..." />
            </div>
          )}

          {status === 'success' && (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="flex flex-col items-center text-center">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Аккаунт успешно активирован!
                </h2>
                <p className="text-gray-600 mb-8">
                  Введите свои данные для входа в систему
                </p>

                <form onSubmit={handleLogin} className="w-full space-y-4">
                  {loginError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {loginError}
                    </div>
                  )}

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Email или логин
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Введите email или логин"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Пароль
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                        placeholder="Введите пароль"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full px-4 py-2 bg-primary-800 hover:bg-primary-900 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingIn ? 'Вход...' : 'Войти'}
                  </button>

                  <Link
                    to="/"
                    className="block w-full text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    На главную
                  </Link>
                </form>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="flex flex-col items-center text-center">
                <XCircleIcon className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Ошибка активации
                </h2>
                <p className="text-gray-600 mb-6">
                  {errorMessage}
                </p>
                <div className="space-y-3 w-full">
                  <Link
                    to="/register"
                    className="block w-full text-center px-4 py-2 bg-primary-800 hover:bg-primary-900 text-white rounded-lg transition-colors font-semibold"
                  >
                    Зарегистрироваться заново
                  </Link>
                  <Link
                    to="/"
                    className="block w-full text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    На главную
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ActivateAccountPage;
