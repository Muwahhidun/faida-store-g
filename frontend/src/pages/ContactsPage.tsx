/**
 * Страница Контакты и доставка.
 * Оформлена в фирменном стиле Faida Group.
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaTruck,
  FaCreditCard,
  FaWhatsapp,
  FaWarehouse,
  FaArrowLeft,
  FaPhoneAlt
} from 'react-icons/fa';

const ContactsPage: React.FC = () => {
  // Координаты склада
  const warehouseCoords = {
    lat: 42.883554,
    lng: 47.618373
  };

  return (
    <>
      <Helmet>
        <title>Контакты и доставка | Faida Group</title>
        <meta name="description" content="Контактная информация, адрес склада и условия доставки интернет-магазина Faida Group" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Шапка */}
        <div className="bg-primary-900 text-white py-12">
          <div className="max-w-6xl mx-auto px-4">
            <Link to="/" className="inline-flex items-center gap-2 text-secondary-500 hover:text-secondary-400 mb-6 transition-colors">
              <FaArrowLeft className="w-4 h-4" />
              На главную
            </Link>
            <h1 className="text-3xl font-bold">Контакты и доставка</h1>
            <p className="text-gray-400 mt-2">Свяжитесь с нами любым удобным способом</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Контакты */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">
                Контакты
              </h2>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-secondary-500/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <FaWhatsapp className="w-5 h-5 text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Телефон / WhatsApp</p>
                    <a
                      href="https://wa.me/79882258513"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-primary-900 hover:text-secondary-600 transition-colors block"
                    >
                      +7 (988) 225-85-13
                    </a>
                    <a
                      href="https://wa.me/79883015369"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-primary-900 hover:text-secondary-600 transition-colors block"
                    >
                      +7 (988) 301-53-69
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 bg-secondary-500/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <FaEnvelope className="w-5 h-5 text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <a href="mailto:mail@faidagroup.ru" className="text-lg font-semibold text-primary-900 hover:text-secondary-600 transition-colors">
                      mail@faidagroup.ru
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 bg-secondary-500/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <FaClock className="w-5 h-5 text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Время работы</p>
                    <p className="text-lg font-semibold text-primary-900">
                      Пн-Пт: 9:00 - 18:00
                    </p>
                    <p className="text-sm text-gray-500">
                      Сб-Вс: выходной
                    </p>
                  </div>
                </div>
              </div>

              {/* Реквизиты */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Реквизиты</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>ИП Абдуллаев Шамиль Семедович</strong></p>
                  <p>ИНН: 055402751907</p>
                  <p>ОГРНИП: 322057100102812</p>
                </div>
              </div>
            </div>

            {/* Адрес склада */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">
                Адрес склада
              </h2>

              <div className="flex items-start mb-6">
                <div className="w-10 h-10 bg-secondary-500/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <FaMapMarkerAlt className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Самовывоз</p>
                  <p className="text-lg font-semibold text-primary-900">
                    ул. Кирпичное шоссе, 1Г/9
                  </p>
                  <p className="text-gray-600">г. Каспийск, Республика Дагестан</p>
                </div>
              </div>

              {/* Яндекс Карта */}
              <div className="rounded-xl overflow-hidden h-64 bg-gray-100">
                <iframe
                  src={`https://yandex.ru/map-widget/v1/?pt=${warehouseCoords.lng},${warehouseCoords.lat},pm2rdm&z=15&l=map`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  title="Карта склада Faida Group"
                  className="w-full h-full"
                />
              </div>

            </div>
          </div>

          {/* Доставка */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mt-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">
              Доставка
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="w-12 h-12 bg-primary-900 rounded-xl flex items-center justify-center mb-4">
                  <FaTruck className="w-6 h-6 text-secondary-500" />
                </div>
                <h3 className="font-bold text-primary-900 mb-2">Бесплатная доставка</h3>
                <p className="text-gray-600 text-sm">
                  По Махачкале и всей Республике Дагестан доставка бесплатная при любой сумме заказа
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="w-12 h-12 bg-primary-900 rounded-xl flex items-center justify-center mb-4">
                  <FaClock className="w-6 h-6 text-secondary-500" />
                </div>
                <h3 className="font-bold text-primary-900 mb-2">Сроки доставки</h3>
                <p className="text-gray-600 text-sm">
                  Доставка в день заказа или на следующий день по договорённости
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="w-12 h-12 bg-primary-900 rounded-xl flex items-center justify-center mb-4">
                  <FaWarehouse className="w-6 h-6 text-secondary-500" />
                </div>
                <h3 className="font-bold text-primary-900 mb-2">Самовывоз</h3>
                <p className="text-gray-600 text-sm">
                  Забрать заказ можно со склада: ул. Кирпичное шоссе, 1Г/9, г. Каспийск
                </p>
              </div>
            </div>

            {/* Зоны доставки */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="font-bold text-primary-900 mb-4">Зоны доставки</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Махачкала', 'Каспийск', 'Избербаш', 'Дербент', 'Хасавюрт', 'Кизляр', 'Буйнакск', 'Другие города'].map((city) => (
                  <div key={city} className="flex items-center gap-2 text-gray-700">
                    <div className="w-2 h-2 bg-secondary-500 rounded-full" />
                    <span className="text-sm">{city}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Доставка осуществляется по всей Республике Дагестан. Для уточнения сроков доставки в ваш населённый пункт свяжитесь с нами.
              </p>
            </div>
          </div>

          {/* Оплата */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mt-8">
            <h2 className="text-2xl font-bold text-primary-900 mb-6">
              Способы оплаты
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border-2 border-gray-100 rounded-xl hover:border-secondary-500/30 transition-colors">
                <div className="w-16 h-16 bg-secondary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💵</span>
                </div>
                <h3 className="font-bold text-primary-900 mb-2">Наличными</h3>
                <p className="text-sm text-gray-600">При получении заказа курьеру или на складе</p>
              </div>

              <div className="text-center p-6 border-2 border-gray-100 rounded-xl hover:border-secondary-500/30 transition-colors">
                <div className="w-16 h-16 bg-secondary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💳</span>
                </div>
                <h3 className="font-bold text-primary-900 mb-2">Картой курьеру</h3>
                <p className="text-sm text-gray-600">Оплата банковской картой при получении</p>
              </div>

              <div className="text-center p-6 border-2 border-gray-100 rounded-xl hover:border-secondary-500/30 transition-colors">
                <div className="w-16 h-16 bg-secondary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📲</span>
                </div>
                <h3 className="font-bold text-primary-900 mb-2">Перевод на карту</h3>
                <p className="text-sm text-gray-600">По номеру телефона или карты</p>
              </div>
            </div>
          </div>

          {/* Ссылки */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/privacy" className="text-primary-900 hover:text-secondary-600 transition-colors">
              Политика конфиденциальности
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/terms" className="text-primary-900 hover:text-secondary-600 transition-colors">
              Пользовательское соглашение
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactsPage;
