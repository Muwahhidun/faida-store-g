/**
 * Тестовый компонент для проверки фирменных шрифтов TikTok Sans
 * Удалите этот файл после проверки шрифтов
 */

export const FontTest = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-extrabold text-primary-900 mb-2">
          TikTok Sans ExtraBold (800)
        </h1>
        <p className="text-gray-600 mb-4">Особо важные заголовки</p>

        <h2 className="text-3xl font-bold text-primary-900 mb-2">
          TikTok Sans Bold (700)
        </h2>
        <p className="text-gray-600 mb-4">Заголовки и акценты</p>

        <h3 className="text-2xl font-semibold text-primary-800 mb-2">
          TikTok Sans SemiBold (600)
        </h3>
        <p className="text-gray-600 mb-4">Полужирные акценты</p>

        <h4 className="text-xl font-normal text-primary-700 mb-2">
          TikTok Sans Regular (400)
        </h4>
        <p className="text-gray-600 mb-4">Обычный текст</p>

        <p className="text-lg font-light text-gray-800 leading-relaxed mb-4">
          TikTok Sans Light (300) — это основной шрифт для текста, абзацев и
          длинных информационных блоков. Он обеспечивает отличную читаемость и
          соответствует фирменному стилю Faida Group. Данный шрифт поддерживает
          кириллицу и латиницу.
        </p>

        <div className="bg-secondary-50 border-l-4 border-secondary-500 p-4 mt-6">
          <p className="font-semibold text-primary-900 mb-2">
            Демонстрация всех символов:
          </p>
          <p className="font-light">
            АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ
          </p>
          <p className="font-light">
            абвгдеёжзийклмнопрстуфхцчшщъыьэюя
          </p>
          <p className="font-light">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
          </p>
          <p className="font-light">
            abcdefghijklmnopqrstuvwxyz
          </p>
          <p className="font-light">
            0123456789 !@#$%^&*()_+-=[]&#123;&#125;;':",./&lt;&gt;?
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="btn-primary">
            Кнопка с TikTok Sans
          </button>
          <button className="btn-secondary">
            Вторичная кнопка
          </button>
        </div>
      </div>

      <div className="bg-primary-900 rounded-lg shadow-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-4">
          Темный фон
        </h2>
        <p className="font-light text-lg leading-relaxed">
          Фирменный шрифт TikTok Sans отлично читается как на светлом, так и на
          темном фоне. Это важно для создания единообразного дизайна во всех
          разделах сайта Faida Group Store.
        </p>
      </div>

      <div className="bg-secondary-500 rounded-lg shadow-lg p-8 text-primary-900">
        <h2 className="text-3xl font-bold mb-4">
          Акцентный желтый фон
        </h2>
        <p className="font-light text-lg leading-relaxed">
          На фирменном желтом фоне текст сохраняет отличную читаемость и
          соответствует брендбуку компании.
        </p>
      </div>
    </div>
  );
};
