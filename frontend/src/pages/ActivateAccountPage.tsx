/**
 * Страница активации аккаунта по ссылке из email
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const ActivateAccountPage: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

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
          // Редирект на страницу входа через 3 секунды
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          const data = await response.json();
          setStatus('error');
          setErrorMessage(data.detail || 'Ошибка активации аккаунта. Возможно, ссылка устарела или недействительна.');
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

  return (
    <>
      <Helmet>
        <title>Активация аккаунта</title>
        <meta name="description" content="Активация аккаунта Faida Group Store" />
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
              <div className="flex flex-col items-center">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Аккаунт успешно активирован!
                </h2>
                <p className="text-gray-600 text-center mb-6">
                  Ваш аккаунт активирован. Теперь вы можете войти в систему и начать делать покупки.
                </p>
                <div className="space-y-3 w-full">
                  <Link
                    to="/login"
                    className="block w-full text-center px-4 py-2 bg-primary-800 hover:bg-primary-900 text-white rounded-lg transition-colors font-semibold"
                  >
                    Войти в аккаунт
                  </Link>
                  <Link
                    to="/"
                    className="block w-full text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    На главную
                  </Link>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Перенаправление через 3 секунды...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="flex flex-col items-center">
                <XCircleIcon className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Ошибка активации
                </h2>
                <p className="text-gray-600 text-center mb-6">
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
