/**
 * Страница 404 - не найдено.
 * Оформлена в фирменном стиле Faida Group.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FaHome, FaShoppingBag, FaArrowLeft } from 'react-icons/fa';
import logoFullSvg from '../assets/logo-full.svg';
import patternSvg from '../assets/pattern.svg';

const NotFoundPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>404 - Страница не найдена | Faida Group</title>
      </Helmet>

      <div className="min-h-screen bg-primary-900 flex items-center justify-center relative overflow-hidden">
        {/* Фирменный паттерн */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url(${patternSvg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Декоративные круги */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-secondary-500 rounded-full opacity-5 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary-500 rounded-full opacity-5 blur-3xl" />

        <div className="relative z-10 max-w-lg w-full mx-4">
          {/* Логотип */}
          <div className="text-center mb-8">
            <Link to="/">
              <img
                src={logoFullSvg}
                alt="Faida Group Logo"
                className="h-12 mx-auto opacity-80 hover:opacity-100 transition-opacity"
              />
            </Link>
          </div>

          {/* Карточка */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/10 shadow-2xl">
            {/* 404 */}
            <div className="mb-6">
              <h1 className="text-8xl font-bold text-secondary-500 mb-4" style={{ fontFamily: "'TikTok Sans', sans-serif" }}>
                404
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-secondary-500 to-transparent mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-white mb-3" style={{ fontFamily: "'TikTok Sans', sans-serif" }}>
                Страница не найдена
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                К сожалению, запрашиваемая страница не существует, была удалена или временно недоступна.
              </p>
            </div>

            {/* Кнопки */}
            <div className="space-y-3">
              <Link
                to="/"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-secondary-500 to-secondary-600 text-primary-900 font-semibold py-3 px-6 rounded-xl hover:from-secondary-400 hover:to-secondary-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                <FaHome className="w-4 h-4" />
                На главную
              </Link>

              <Link
                to="/products"
                className="flex items-center justify-center gap-2 w-full border-2 border-secondary-500/50 text-secondary-500 font-medium py-3 px-6 rounded-xl hover:bg-secondary-500/10 hover:border-secondary-500 transition-all duration-200"
              >
                <FaShoppingBag className="w-4 h-4" />
                Перейти в каталог
              </Link>

              <button
                onClick={() => window.history.back()}
                className="flex items-center justify-center gap-2 w-full text-gray-400 hover:text-white py-2 transition-colors"
              >
                <FaArrowLeft className="w-3 h-3" />
                <span className="text-sm">Вернуться назад</span>
              </button>
            </div>
          </div>

          {/* Подсказка */}
          <p className="text-center text-gray-500 text-xs mt-6">
            Если вы уверены, что страница должна существовать, свяжитесь с нами
          </p>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
