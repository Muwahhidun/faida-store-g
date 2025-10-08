import React from 'react';
import { Helmet } from 'react-helmet-async';
import { FaNewspaper } from 'react-icons/fa';

const NewsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Новости</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <FaNewspaper className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Новости
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Раздел находится в разработке
          </p>
          <p className="text-gray-500">
            Здесь будут публиковаться новости компании, акции и специальные предложения.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
