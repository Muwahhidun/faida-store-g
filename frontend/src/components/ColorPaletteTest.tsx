/**
 * Тестовый компонент для проверки фирменных цветов Faida Group
 * Удалите этот файл после проверки цветов
 */

export const ColorPaletteTest = () => {
  const primaryShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const secondaryShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-12">
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-900 mb-4">
          Фирменные цвета Faida Group
        </h1>
        <p className="text-lg font-light text-gray-600">
          Палитра согласно брендбуку компании
        </p>
      </div>

      {/* Основные цвета из брендбука */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-primary-900 mb-6">
          Основные цвета из брендбука
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Тёмно-синий основной */}
          <div className="space-y-3">
            <div className="bg-primary-900 h-32 rounded-lg shadow-md flex items-center justify-center">
              <div className="text-center text-white">
                <p className="font-bold text-lg">Тёмно-синий</p>
                <p className="text-sm font-light">primary-900</p>
              </div>
            </div>
            <div className="text-sm space-y-1 font-light">
              <p><span className="font-semibold">Hex:</span> #0E1A3A</p>
              <p><span className="font-semibold">RGB:</span> 14, 26, 58</p>
              <p><span className="font-semibold">CMYK:</span> 100, 91, 45, 54</p>
            </div>
          </div>

          {/* Жёлтый основной */}
          <div className="space-y-3">
            <div className="bg-secondary-500 h-32 rounded-lg shadow-md flex items-center justify-center">
              <div className="text-center text-primary-900">
                <p className="font-bold text-lg">Жёлтый</p>
                <p className="text-sm font-light">secondary-500</p>
              </div>
            </div>
            <div className="text-sm space-y-1 font-light">
              <p><span className="font-semibold">Hex:</span> #F2C56D</p>
              <p><span className="font-semibold">RGB:</span> 242, 197, 109</p>
              <p><span className="font-semibold">CMYK:</span> 5, 24, 65, 0</p>
            </div>
          </div>

          {/* Дополнительный синий */}
          <div className="space-y-3">
            <div className="bg-primary-800 h-32 rounded-lg shadow-md flex items-center justify-center">
              <div className="text-center text-white">
                <p className="font-bold text-lg">Дополнительный синий</p>
                <p className="text-sm font-light">primary-800</p>
              </div>
            </div>
            <div className="text-sm space-y-1 font-light">
              <p><span className="font-semibold">Hex:</span> #162956</p>
              <p><span className="font-semibold">RGB:</span> 22, 41, 86</p>
              <p><span className="font-semibold">CMYK:</span> 100, 88, 38, 31</p>
            </div>
          </div>

          {/* Светлый золотистый */}
          <div className="space-y-3">
            <div className="bg-secondary-600 h-32 rounded-lg shadow-md flex items-center justify-center">
              <div className="text-center text-primary-900">
                <p className="font-bold text-lg">Светлый золотистый</p>
                <p className="text-sm font-light">secondary-600</p>
              </div>
            </div>
            <div className="text-sm space-y-1 font-light">
              <p><span className="font-semibold">Hex:</span> #D8AE64</p>
              <p><span className="font-semibold">RGB:</span> 216, 174, 100</p>
              <p><span className="font-semibold">CMYK:</span> 15, 31, 67, 4</p>
            </div>
          </div>
        </div>
      </div>

      {/* Полная палитра Primary */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-primary-900 mb-6">
          Primary (Тёмно-синий) - Полная палитра
        </h2>
        <div className="grid grid-cols-11 gap-2">
          {primaryShades.map((shade) => (
            <div key={shade} className="text-center">
              <div
                className={`h-20 rounded bg-primary-${shade} mb-2 shadow flex items-center justify-center`}
                style={{
                  backgroundColor: `var(--color-primary-${shade})`,
                }}
              >
                {shade >= 700 && (
                  <span className="text-white text-xs font-semibold">{shade}</span>
                )}
              </div>
              <p className="text-xs font-light text-gray-600">{shade}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Полная палитра Secondary */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-primary-900 mb-6">
          Secondary (Жёлтый) - Полная палитра
        </h2>
        <div className="grid grid-cols-11 gap-2">
          {secondaryShades.map((shade) => (
            <div key={shade} className="text-center">
              <div
                className={`h-20 rounded bg-secondary-${shade} mb-2 shadow flex items-center justify-center`}
                style={{
                  backgroundColor: `var(--color-secondary-${shade})`,
                }}
              >
                <span className="text-primary-900 text-xs font-semibold">{shade}</span>
              </div>
              <p className="text-xs font-light text-gray-600">{shade}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Примеры использования */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-primary-900 mb-6">
          Примеры использования
        </h2>

        <div className="space-y-6">
          {/* Кнопки */}
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-3">Кнопки</h3>
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary">Основная кнопка</button>
              <button className="btn-secondary">Вторичная кнопка</button>
              <button className="btn-outline">Кнопка с обводкой</button>
            </div>
          </div>

          {/* Бейджи */}
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-3">Бейджи</h3>
            <div className="flex flex-wrap gap-3">
              <span className="badge-primary">Primary</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-900 text-white">
                Dark Blue
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-500 text-primary-900">
                Yellow
              </span>
            </div>
          </div>

          {/* Карточки */}
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-3">Карточки</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary-900 text-white p-6 rounded-lg shadow">
                <h4 className="font-bold mb-2">Тёмная карточка</h4>
                <p className="font-light text-sm">Контент на тёмном фоне</p>
              </div>
              <div className="bg-secondary-500 text-primary-900 p-6 rounded-lg shadow">
                <h4 className="font-bold mb-2">Жёлтая карточка</h4>
                <p className="font-light text-sm">Контент на жёлтом фоне</p>
              </div>
              <div className="bg-white border-2 border-primary-900 text-primary-900 p-6 rounded-lg shadow">
                <h4 className="font-bold mb-2">Светлая карточка</h4>
                <p className="font-light text-sm">Контент с обводкой</p>
              </div>
            </div>
          </div>

          {/* Градиенты */}
          <div>
            <h3 className="text-lg font-semibold text-primary-900 mb-3">Градиенты</h3>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-primary-900 to-primary-800 h-16 rounded-lg shadow flex items-center justify-center text-white font-semibold">
                Синий градиент
              </div>
              <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 h-16 rounded-lg shadow flex items-center justify-center text-primary-900 font-semibold">
                Жёлтый градиент
              </div>
              <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-secondary-600 h-16 rounded-lg shadow flex items-center justify-center text-white font-semibold">
                Комбинированный градиент
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Информация */}
      <div className="bg-secondary-50 border-l-4 border-secondary-500 p-6 rounded">
        <p className="font-semibold text-primary-900 mb-2">
          ℹ️ Как использовать
        </p>
        <p className="font-light text-sm text-gray-700">
          Все цвета доступны через Tailwind классы: <code className="bg-gray-100 px-2 py-1 rounded">bg-primary-900</code>,{' '}
          <code className="bg-gray-100 px-2 py-1 rounded">text-secondary-500</code>,{' '}
          <code className="bg-gray-100 px-2 py-1 rounded">border-primary-800</code> и т.д.
          <br />
          Подробная документация доступна в файле <code className="bg-gray-100 px-2 py-1 rounded">BRAND_COLORS.md</code>
        </p>
      </div>
    </div>
  );
};
