import React, { useState, useEffect } from 'react';
import { FaSlidersH, FaTimes } from 'react-icons/fa';
import { ProductStockSettingsModalProps } from '../../../types/admin';
import { CustomSelect } from '../../CustomSelect';

/**
 * Модальное окно настроек остатков товара
 * Позволяет настроить индивидуальные параметры отображения остатков для конкретного товара
 */
export const ProductStockSettingsModal: React.FC<ProductStockSettingsModalProps> = ({
    product,
    onClose,
    onSave,
    globalSettings
}) => {
    const [useDefaultSettings, setUseDefaultSettings] = useState(product.use_default_stock_settings ?? true);
    const [stockDisplayStyle, setStockDisplayStyle] = useState(product.stock_display_style || 'detailed_status');
    const [lowStockThreshold, setLowStockThreshold] = useState(product.low_stock_threshold || 5);

    // Обработчик ESC для закрытия модального окна
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            use_default_stock_settings: useDefaultSettings,
            stock_display_style: stockDisplayStyle,
            low_stock_threshold: lowStockThreshold
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                {/* Заголовок */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <FaSlidersH className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Настройки остатков товара
                            </h2>
                            <p className="text-sm text-gray-600 truncate max-w-md">
                                {product.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Содержимое */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Переключатель общих/индивидуальных настроек */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Использовать общие настройки сайта
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Если включено, будут использоваться настройки из "Настройки сайта"
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={useDefaultSettings}
                                    onChange={(e) => setUseDefaultSettings(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>
                    </div>

                    {/* Предварительный просмотр общих настроек */}
                    {useDefaultSettings && (
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 className="text-sm font-medium text-blue-900 mb-3">Текущие общие настройки:</h4>
                            <div className="space-y-2 text-sm text-blue-800">
                                <div>Показ остатков: <strong>{globalSettings.show_stock_quantities_globally ? 'Включен' : 'Отключен'}</strong></div>
                                <div>Стиль: <strong>
                                    {globalSettings.default_stock_display_style === 'exact' ? 'Точное количество' :
                                     globalSettings.default_stock_display_style === 'status' ? 'Простой статус' : 'Детальный статус'}
                                </strong></div>
                                <div>Порог "мало": <strong>{globalSettings.default_low_stock_threshold}</strong></div>
                            </div>
                        </div>
                    )}

                    {/* Индивидуальные настройки */}
                    {!useDefaultSettings && (
                        <div className="space-y-4">
                            <div>
                                <CustomSelect
                                    value={stockDisplayStyle}
                                    onChange={setStockDisplayStyle}
                                    options={[
                                        { value: 'exact', label: 'Показывать точное количество' },
                                        { value: 'status', label: 'Показывать статус (В наличии / Нет)' },
                                        { value: 'detailed_status', label: 'Показывать детальный статус (В наличии / Мало / Нет)' }
                                    ]}
                                    label="Стиль отображения остатков"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Порог "Мало на складе"
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={lowStockThreshold}
                                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    При остатке меньше этого значения товар будет считаться "мало"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Кнопки */}
                    <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-purple-700 rounded-lg transition-colors"
                        >
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
