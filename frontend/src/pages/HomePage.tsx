/**
 * Главная страница (О компании).
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import patternSvg from '../assets/pattern.svg';
import { FaCheckCircle, FaUsers, FaHandHoldingHeart, FaUtensils, FaHome, FaBirthdayCake, FaCouch } from 'react-icons/fa';

interface Brand {
  id: number;
  name: string;
  logo: string;
  products_count: number;
}

const fetchBrands = async (): Promise<Brand[]> => {
  try {
    const response = await fetch('http://localhost:8000/api/brands/');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('Ошибка загрузки брендов:', err);
    return []; // Возвращаем пустой массив в случае ошибки
  }
};

const HomePage: React.FC = () => {
  const { data: brands = [], isLoading: isLoadingBrands } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  return (
    <>
      <Helmet>
        <title>Faida Group - Польза в каждый дом</title>
        <meta name="description" content="Faida Group - создаем качественные продукты и услуги для семьи и дома, развивая бизнес по халяльным и этическим принципам." />
      </Helmet>

      {/* Hero секция */}
      <section className="bg-primary-800 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: `url(${patternSvg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
        ></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span 
                className="block"
                style={{ fontFamily: "'Tenor Sans', sans-serif" }}
              >
                FAIDA GROUP
              </span>
              <span className="block text-3xl md:text-5xl text-secondary-500 mt-2">
                Польза в каждый дом
              </span>
            </h1>
                          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
                            Наша миссия — создавать качественные продукты и услуги для семьи и дома, развивая бизнес по халяльным принципам.
                          </p>            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#values"
                className="border-2 border-secondary-500 text-secondary-500 px-8 py-3 rounded-lg font-semibold hover:bg-secondary-500 hover:text-primary-900 transition-all duration-200 transform hover:scale-105"
              >
                Наши ценности
              </a>
              <a
                href="#brands"
                className="border-2 border-secondary-500 text-secondary-500 px-8 py-3 rounded-lg font-semibold hover:bg-secondary-500 hover:text-primary-900 transition-all duration-200 transform hover:scale-105"
              >
                Наши бренды
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* О Группе Компаний */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>Единый подход к разным сферам жизни</h2>
            <p className="text-lg text-gray-600">
              Faida Group — это компания, объединяющая направления, которые делают жизнь семьи и дома удобнее, вкуснее и комфортнее. Мы развиваем разные сферы, но объединяем их единым подходом — стремлением к качеству, честности и соответствию халяльным принципам.
            </p>
        </div>
      </section>

      {/* Наши Направления */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>Наши направления</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center group">
                <div className="bg-primary-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-200 group-hover:scale-110 group-hover:bg-secondary-500">
                    <FaUtensils className="w-8 h-8 text-secondary-500 group-hover:text-primary-900 transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-primary-900" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>Faida Product</h3>
                <p className="text-gray-600 text-sm">Продажа продуктов питания.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center group">
                <div className="bg-primary-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-200 group-hover:scale-110 group-hover:bg-secondary-500">
                    <FaHome className="w-8 h-8 text-secondary-500 group-hover:text-primary-900 transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-primary-900" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>Faida Home</h3>
                <p className="text-gray-600 text-sm">Продажа товаров для дома и хозяйственных нужд.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center group">
                <div className="bg-primary-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-200 group-hover:scale-110 group-hover:bg-secondary-500">
                    <FaBirthdayCake className="w-8 h-8 text-secondary-500 group-hover:text-primary-900 transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-primary-900" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>Faida Lacomstory</h3>
                <p className="text-gray-600 text-sm">Производство кондитерских изделий.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg text-center group">
                <div className="bg-primary-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-200 group-hover:scale-110 group-hover:bg-secondary-500">
                    <FaCouch className="w-8 h-8 text-secondary-500 group-hover:text-primary-900 transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-primary-900" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>Faida Time Design</h3>
                <p className="text-gray-600 text-sm">Производство корпусной мебели.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ценности */}
      <section id="values" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>Наши Ценности</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-primary-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-200 group-hover:scale-110 group-hover:bg-secondary-500">
                <FaUsers className="w-8 h-8 text-secondary-500 group-hover:text-primary-900 transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary-900">Польза</h3>
              <p className="text-gray-600">
                Приносим удобство, вкус и радость в повседневную жизнь.
              </p>
            </div>
            <div className="text-center group">
              <div className="bg-primary-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-200 group-hover:scale-110 group-hover:bg-secondary-500">
                <FaCheckCircle className="w-8 h-8 text-secondary-500 group-hover:text-primary-900 transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary-900">Качество</h3>
              <p className="text-gray-600">
                Вся наша продукция соответствует стандартам халяль и проходит строгий контроль качества.
              </p>
            </div>
            <div className="text-center group">
              <div className="bg-primary-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transform transition-all duration-200 group-hover:scale-110 group-hover:bg-secondary-500">
                <FaHandHoldingHeart className="w-8 h-8 text-secondary-500 group-hover:text-primary-900 transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary-900">Ответственность</h3>
              <p className="text-gray-600">
                Часть доходов мы направляем на социальные и благотворительные проекты.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Наши бренды */}
      {!isLoadingBrands && brands.length > 0 && (
        <section id="brands" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4" style={{ fontFamily: "'Tenor Sans', sans-serif" }}>Наши бренды</h2>

            </div>
            <div className="flex justify-center">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 group"
                  >
                    <div className="w-32 h-32 mb-4 flex items-center justify-center">
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="max-w-full max-h-full object-contain transform group-hover:scale-110 transition-transform duration-200"
                      />
                    </div>
                    <p className="text-sm font-semibold text-primary-800 text-center">
                      {brand.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default HomePage;
