import React from 'react';
import { Link } from 'react-router-dom';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaRegClock, FaRegCalendarTimes, FaNewspaper, FaBriefcase } from 'react-icons/fa';
import { IoApps } from 'react-icons/io5';
import patternSvg from '../assets/pattern.svg';

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-primary-900 text-white border-t-2 border-secondary-500">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
            backgroundImage: `url(${patternSvg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        }}
      ></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Быстрые ссылки */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-secondary-500">Быстрые ссылки</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/products" className="inline-flex items-center text-gray-300 hover:text-secondary-500 transition-colors duration-200">
                  <IoApps className="w-4 h-4 mr-3 text-secondary-500" />
                  <span>Каталог</span>
                </Link>
              </li>
              <li>
                <Link to="/news" className="inline-flex items-center text-gray-300 hover:text-secondary-500 transition-colors duration-200">
                  <FaNewspaper className="w-4 h-4 mr-3 text-secondary-500" />
                  <span>Новости</span>
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="inline-flex items-center text-gray-300 hover:text-secondary-500 transition-colors duration-200">
                  <FaBriefcase className="w-4 h-4 mr-3 text-secondary-500" />
                  <span>Вакансии</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Контактная информация */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-secondary-500">Контакты</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <a href="https://wa.me/79882258513" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-secondary-500 transition-colors duration-200">
                <FaPhoneAlt className="w-4 h-4 mr-3 text-secondary-500" />
                <span>+7 (988) 225-85-13</span>
              </a>
              <a href="https://wa.me/79883015369" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-secondary-500 transition-colors duration-200">
                <FaPhoneAlt className="w-4 h-4 mr-3 text-secondary-500" />
                <span>+7 (988) 301-53-69</span>
              </a>
              <a href="mailto:mail@faidagroup.ru" className="flex items-center hover:text-secondary-500 transition-colors duration-200">
                <FaEnvelope className="w-4 h-4 mr-3 text-secondary-500" />
                <span>mail@faidagroup.ru</span>
              </a>
            </div>
          </div>

          {/* Адрес */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-secondary-500">Адрес</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <a href="https://yandex.ru/maps/?pt=47.618373,42.883554&z=17&l=map" target="_blank" rel="noopener noreferrer" className="flex items-start hover:text-secondary-500 transition-colors duration-200">
                <FaMapMarkerAlt className="w-4 h-4 mr-3 text-secondary-500 flex-shrink-0 mt-1" />
                <span>г. Каспийск, ул. Кирпичное шоссе, 1Г/9</span>
              </a>
              <div className="flex items-center">
                <FaRegClock className="w-4 h-4 mr-3 text-secondary-500" />
                <span>Пн-Пт: 9:00 - 18:00</span>
              </div>
              <div className="flex items-center">
                <FaRegCalendarTimes className="w-4 h-4 mr-3 text-secondary-500" />
                <span>Сб-Вс: выходной</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2025 Faida IT Solutions. Все права защищены.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-secondary-500 transition-colors duration-200">Политика конфиденциальности</Link>
              <Link to="/terms" className="hover:text-secondary-500 transition-colors duration-200">Условия использования</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
