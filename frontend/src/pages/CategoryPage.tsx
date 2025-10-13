/**
 * Страница категории товаров.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <>
      <Helmet>
        <title>Категория</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-900 mb-4">
            Категория товаров
          </h1>
          <p className="text-gray-600">
            Slug категории: <span className="text-secondary-600 font-semibold">{slug}</span>
          </p>
          <div className="mt-8 inline-flex items-center px-4 py-2 bg-secondary-100 text-primary-900 rounded-lg">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-secondary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">Эта страница находится в разработке</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryPage;