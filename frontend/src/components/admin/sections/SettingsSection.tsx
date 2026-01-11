import React, { useState } from 'react';
import { FaCog, FaSave, FaSpinner } from 'react-icons/fa';
import { GlobalSettings } from '../../../types/admin';
import { adminClient } from '../../../api/adminClient';
import { CustomSelect } from '../../CustomSelect';

interface SettingsSectionProps {
    initialSettings: {
        siteUrl: string;
        minStock: number;
        defaultStockDisplayStyle: string;
        defaultLowStockThreshold: number;
        showStockQuantitiesGlobally: boolean;
    };
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
    onSettingsUpdate: () => void;
}

/**
 * Секция настроек сайта
 * Глобальные настройки отображения остатков, минимального порога и других параметров
 */
export const SettingsSection: React.FC<SettingsSectionProps> = ({
    initialSettings,
    onError,
    onSuccess,
    onSettingsUpdate
}) => {
    const [siteUrl, setSiteUrl] = useState(initialSettings.siteUrl);
    const [minStock, setMinStock] = useState(initialSettings.minStock);
    const [defaultStockDisplayStyle, setDefaultStockDisplayStyle] = useState(initialSettings.defaultStockDisplayStyle);
    const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState(initialSettings.defaultLowStockThreshold);
    const [showStockQuantitiesGlobally, setShowStockQuantitiesGlobally] = useState(initialSettings.showStockQuantitiesGlobally);
    const [saveLoading, setSaveLoading] = useState(false);

    const handleSaveSettings = async () => {
        setSaveLoading(true);
        try {
            // Отправляем PATCH на конкретный объект с ID=1
            await adminClient.patch(`/settings/1/`, {
                site_url: siteUrl,
                min_stock_for_display: minStock,
                default_stock_display_style: defaultStockDisplayStyle,
                default_low_stock_threshold: defaultLowStockThreshold,
                show_stock_quantities_globally: showStockQuantitiesGlobally,
            });
            onSuccess('Настройки сайта успешно сохранены!');
            onSettingsUpdate();
        } catch (err) {
            onError('Ошибка при сохранении настроек сайта.');
        } finally {
            setSaveLoading(false);
        }
    };

    return (
        <div className="card p-6">
            <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                    <FaCog className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-primary-900">Настройки сайта</h2>
                    <p className="text-sm text-gray-600">Управление отображением товаров и остатков</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* URL сайта */}
                <div>
                    <label htmlFor="siteUrl" className="block text-sm font-medium text-gray-700 mb-2">
                        URL сайта
                    </label>
                    <div className="relative">
                        <input
                            type="url"
                            id="siteUrl"
                            value={siteUrl}
                            onChange={(e) => setSiteUrl(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                            placeholder="https://faida.ru"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Полный URL сайта для ссылок в уведомлениях. Если пусто, используется значение из переменной окружения.
                    </p>
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Настройки отображения товаров</h3>
                </div>

                <div>
                    <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 mb-2">
                        Минимальный остаток для показа
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            id="minStock"
                            min="0"
                            value={minStock}
                            onChange={(e) => setMinStock(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                            placeholder="Введите количество"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Товары с остатком меньше этого значения не будут показаны на сайте
                    </p>
                </div>

                {/* Новые настройки отображения остатков */}
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Настройки отображения остатков</h3>

                    <div className="space-y-4">
                        {/* Глобальное включение/отключение показа остатков */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Показывать остатки на сайте
                                </label>
                                <p className="text-xs text-gray-500">
                                    Если отключено, остатки не будут показываться пользователям
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showStockQuantitiesGlobally}
                                    onChange={(e) => setShowStockQuantitiesGlobally(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-secondary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-500"></div>
                            </label>
                        </div>

                        {/* Стиль отображения остатков по умолчанию */}
                        <div>
                            <CustomSelect
                                value={defaultStockDisplayStyle}
                                onChange={setDefaultStockDisplayStyle}
                                options={[
                                    { value: 'exact', label: 'Показывать точное количество' },
                                    { value: 'status', label: 'Показывать статус (В наличии / Нет)' },
                                    { value: 'detailed_status', label: 'Показывать детальный статус (В наличии / Мало / Нет)' }
                                ]}
                                label="Стиль отображения остатков по умолчанию"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Применяется ко всем товарам, использующим общие настройки
                            </p>
                        </div>

                        {/* Порог "Мало на складе" по умолчанию */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Порог "Мало на складе" по умолчанию
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={defaultLowStockThreshold}
                                onChange={(e) => setDefaultLowStockThreshold(Number(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                                placeholder="Введите количество"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                При остатке меньше этого значения товар будет считаться "мало"
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSaveSettings}
                    disabled={saveLoading}
                    className={`w-full px-4 py-2 text-sm font-medium text-primary-900 bg-secondary-500 hover:bg-secondary-600 rounded-lg flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all ${
                        saveLoading ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                >
                    {saveLoading ? (
                        <>
                            <FaSpinner className="w-4 h-4 animate-spin" />
                            <span>Сохранение...</span>
                        </>
                    ) : (
                        <>
                            <FaSave className="w-4 h-4" />
                            <span>Сохранить настройки сайта</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
