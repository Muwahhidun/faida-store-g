/**
 * Компонент футера сайта.
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-900 text-white border-t-2 border-secondary-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* О компании */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-secondary-500">Faida Group</h3>
            <p className="text-gray-300 text-sm mb-4">
              Качественные халяль продукты с доставкой по всей России.
              Натуральные колбасные изделия и мясные деликатесы высшего качества.
            </p>
            <div className="flex space-x-4">
              {/* Социальные сети */}
              <a href="#" className="text-gray-400 hover:text-secondary-500 transition-colors duration-200">
                <span className="sr-only">Facebook</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-secondary-500 transition-colors duration-200">
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C3.767 14.41 3.767 12.78 4.126 11.19c.36-1.59 1.297-2.988 2.593-3.848 1.297-.86 2.808-1.297 4.409-1.297 1.6 0 3.112.437 4.408 1.297 1.297.86 2.233 2.258 2.593 3.848.36 1.59.36 3.22-.999 4.501-.875.807-2.026 1.297-3.323 1.297H8.449z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-secondary-500 transition-colors duration-200">
                <span className="sr-only">Telegram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Быстрые ссылки */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-secondary-500">Быстрые ссылки</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/products" className="text-gray-300 hover:text-secondary-500 transition-colors duration-200">
                  Каталог товаров
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-secondary-500 transition-colors duration-200">
                  О компании
                </Link>
              </li>
              <li>
                <Link to="/delivery" className="text-gray-300 hover:text-secondary-500 transition-colors duration-200">
                  Доставка и оплата
                </Link>
              </li>
              <li>
                <Link to="/contacts" className="text-gray-300 hover:text-secondary-500 transition-colors duration-200">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          {/* Контактная информация */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-secondary-500">Контакты</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>+7 (800) 123-45-67</p>
              <p>info@faidagroup.ru</p>
              <p>Пн-Пт: 9:00 - 18:00</p>
              <p>Сб-Вс: 10:00 - 16:00</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2024 Faida Group. Все права защищены.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-secondary-500 transition-colors duration-200">
                Политика конфиденциальности
              </Link>
              <Link to="/terms" className="hover:text-secondary-500 transition-colors duration-200">
                Условия использования
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;