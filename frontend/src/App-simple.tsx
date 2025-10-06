/**
 * Простая версия приложения для тестирования.
 */

import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Faida Group Store
          </h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-600 mb-4">
                Добро пожаловать в Faida Group Store!
              </h2>
              <p className="text-gray-500">
                Качественные халяль продукты с доставкой по России
              </p>
              <div className="mt-6">
                <button className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700">
                  Посмотреть каталог
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;