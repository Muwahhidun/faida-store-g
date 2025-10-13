/**
 * Страница "О компании".
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const HomePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>О компании</title>
        <meta name="description" content="Faida Group - качественные халяль продукты с доставкой по Дагестану" />
      </Helmet>

      {/* Hero секция */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white relative overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-500 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500 opacity-10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Качественные <span className="text-secondary-500">халяль</span> продукты
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">
              Натуральные колбасные изделия и мясные деликатесы высшего качества
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="bg-secondary-500 text-primary-900 px-8 py-3 rounded-lg font-semibold hover:bg-secondary-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Посмотреть каталог
              </Link>
              <Link
                to="/about"
                className="border-2 border-secondary-500 text-secondary-500 px-8 py-3 rounded-lg font-semibold hover:bg-secondary-500 hover:text-primary-900 transition-all duration-200 transform hover:scale-105"
              >
                О компании
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Почему выбирают нас?
            </h2>
            <p className="text-xl text-gray-600">
              Мы гарантируем качество и натуральность наших продуктов
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-200 group-hover:scale-110 group-hover:bg-secondary-500">
                <svg className="w-8 h-8 text-secondary-600 group-hover:text-primary-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary-900">100% Халяль</h3>
              <p className="text-gray-600">
                Все наши продукты имеют сертификат халяль и производятся в соответствии с исламскими традициями
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-200 group-hover:scale-110 group-hover:bg-secondary-500">
                <svg className="w-8 h-8 text-secondary-600 group-hover:text-primary-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary-900">Натуральные ингредиенты</h3>
              <p className="text-gray-600">
                Используем только натуральные специи и ингредиенты без консервантов и искусственных добавок
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-200 group-hover:scale-110 group-hover:bg-secondary-500">
                <svg className="w-8 h-8 text-secondary-600 group-hover:text-primary-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary-900">Быстрая доставка</h3>
              <p className="text-gray-600">
                Доставляем свежие продукты по всей России в кратчайшие сроки с сохранением качества
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Популярные товары */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Популярные товары
            </h2>
            <p className="text-xl text-gray-600">
              Самые любимые продукты наших покупателей
            </p>
          </div>

          <div className="text-center">
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-900 bg-secondary-500 hover:bg-secondary-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Посмотреть все товары
              <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;