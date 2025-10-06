/**
 * Страница 404 - не найдено.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const NotFoundPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Страница не найдена</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <div className="mb-6">
            <h1 className="text-6xl font-bold text-emerald-600 mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Страница не найдена
            </h2>
            <p className="text-gray-600 mb-6">
              К сожалению, запрашиваемая вами страница не существует или была перемещена.
            </p>
          </div>
          
          <div className="space-y-3">
            <Link
              to="/"
              className="block w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors"
            >
              Вернуться на главную
            </Link>
            
            <Link
              to="/products"
              className="block w-full border border-emerald-600 text-emerald-600 py-2 px-4 rounded-md hover:bg-emerald-50 transition-colors"
            >
              Посмотреть каталог
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;