import React from 'react';
import { Helmet } from 'react-helmet-async';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaTruck, FaCreditCard } from 'react-icons/fa';

const ContactsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Контакты и доставка</title>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Контакты и доставка
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Контакты */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <FaPhone className="w-6 h-6 mr-3 text-emerald-600" />
              Контакты
            </h2>

            <div className="space-y-4">
              <div className="flex items-start">
                <FaPhone className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Телефон</p>
                  <a href="tel:+79991234567" className="text-lg font-medium text-gray-900 hover:text-emerald-600">
                    +7 (999) 123-45-67
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <FaEnvelope className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href="mailto:info@faida.ru" className="text-lg font-medium text-gray-900 hover:text-emerald-600">
                    info@faida.ru
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <FaMapMarkerAlt className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Адрес</p>
                  <p className="text-lg font-medium text-gray-900">
                    Республика Дагестан, г. Махачкала
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <FaClock className="w-5 h-5 text-gray-400 mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Время работы</p>
                  <p className="text-lg font-medium text-gray-900">
                    Пн-Вс: 9:00 - 21:00
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Доставка */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <FaTruck className="w-6 h-6 mr-3 text-emerald-600" />
              Доставка
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Зоны доставки</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Махачкала</li>
                  <li>• Каспийск</li>
                  <li>• Другие города - уточняйте по телефону</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Стоимость доставки</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• При заказе от 2000 ₽ - <span className="text-emerald-600 font-medium">бесплатно</span></li>
                  <li>• При заказе до 2000 ₽ - 200 ₽</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Время доставки</h3>
                <p className="text-gray-600">
                  2-3 часа в пределах города или на следующий день по договоренности
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Оплата */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <FaCreditCard className="w-6 h-6 mr-3 text-emerald-600" />
            Способы оплаты
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-4xl mb-2">💵</div>
              <h3 className="font-medium text-gray-900 mb-1">Наличными</h3>
              <p className="text-sm text-gray-600">При получении заказа</p>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-4xl mb-2">💳</div>
              <h3 className="font-medium text-gray-900 mb-1">Картой курьеру</h3>
              <p className="text-sm text-gray-600">При получении заказа</p>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-4xl mb-2">🌐</div>
              <h3 className="font-medium text-gray-900 mb-1">Онлайн</h3>
              <p className="text-sm text-gray-600">Скоро будет доступно</p>
            </div>
          </div>
        </div>

        {/* Карта - можно добавить позже */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Мы на карте
          </h2>
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
            <p className="text-gray-500">Карта будет добавлена позже</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;
