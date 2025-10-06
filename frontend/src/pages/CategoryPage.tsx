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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Категория товаров
          </h1>
          <p className="text-gray-600">
            Slug категории: {slug}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Эта страница находится в разработке
          </p>
        </div>
      </div>
    </>
  );
};

export default CategoryPage;