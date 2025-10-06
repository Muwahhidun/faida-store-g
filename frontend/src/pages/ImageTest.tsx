/**
 * Тестовая страница для проверки загрузки изображений.
 */

import React from 'react';

const ImageTest: React.FC = () => {
  const testImageUrl = 'http://localhost:8000/media/products/2025/09/%D1%80%D0%B8%D1%81_%D0%91%D0%B0%D1%81%D0%BC%D0%B0%D1%82%D0%B8_optimized.jpg';

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Тест загрузки изображений</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Прямой URL</h2>
          <img 
            src={testImageUrl}
            alt="Тестовое изображение"
            className="w-full h-64 object-cover border"
            onLoad={() => console.log('Изображение загружено успешно')}
            onError={(e) => console.error('Ошибка загрузки изображения', e)}
          />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Через прокси</h2>
          <img 
            src="/media/products/2025/09/%D1%80%D0%B8%D1%81_%D0%91%D0%B0%D1%81%D0%BC%D0%B0%D1%82%D0%B8_optimized.jpg"
            alt="Тестовое изображение через прокси"
            className="w-full h-64 object-cover border"
            onLoad={() => console.log('Изображение через прокси загружено успешно')}
            onError={(e) => console.error('Ошибка загрузки изображения через прокси', e)}
          />
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Информация</h2>
        <p>URL изображения: {testImageUrl}</p>
        <p>Откройте консоль браузера для просмотра логов загрузки</p>
      </div>
    </div>
  );
};

export default ImageTest;