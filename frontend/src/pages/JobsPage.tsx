import React from 'react';
import { Helmet } from 'react-helmet-async';
import { FaBriefcase, FaPhone, FaEnvelope } from 'react-icons/fa';

const JobsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Вакансии</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <FaBriefcase className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Вакансии
          </h1>
          <p className="text-lg text-gray-600">
            В данный момент открытых вакансий нет
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Хотите работать в Faida Group?
          </h2>
          <p className="text-gray-600 mb-6">
            Мы всегда рады талантливым и ответственным сотрудникам!
            Отправьте ваше резюме, и мы свяжемся с вами при появлении подходящих вакансий.
          </p>

          <div className="space-y-4">
            <div className="flex items-center">
              <FaPhone className="w-5 h-5 text-emerald-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Телефон</p>
                <a href="tel:+79991234567" className="text-lg font-medium text-gray-900 hover:text-emerald-600">
                  +7 (999) 123-45-67
                </a>
              </div>
            </div>

            <div className="flex items-center">
              <FaEnvelope className="w-5 h-5 text-emerald-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Email для резюме</p>
                <a href="mailto:hr@faida.ru" className="text-lg font-medium text-gray-900 hover:text-emerald-600">
                  hr@faida.ru
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
