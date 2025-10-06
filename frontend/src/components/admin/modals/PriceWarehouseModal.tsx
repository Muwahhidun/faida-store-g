import React, { useState, useEffect } from 'react';
import { FaCogs, FaTimes, FaSpinner } from 'react-icons/fa';
import { Source, AvailableOptions } from '../../../types/admin';
import { adminClient } from '../../../api/adminClient';

interface PriceWarehouseModalProps {
    source: Source;
    onClose: () => void;
    onSave: (id: number, data: { default_price_type?: string; default_warehouse?: string }) => Promise<void>;
}

/**
 * Модальное окно настройки цен и складов для источника
 */
export const PriceWarehouseModal: React.FC<PriceWarehouseModalProps> = ({
    source,
    onClose,
    onSave
}) => {
    const [selectedPriceType, setSelectedPriceType] = useState<string>(source.default_price_type || '');
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>(source.default_warehouse || '');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [availableOptions, setAvailableOptions] = useState<AvailableOptions>({ price_types: [], warehouses: [] });

    useEffect(() => {
        fetchAvailableOptions();
    }, [source.id]);

    const fetchAvailableOptions = async () => {
        setLoading(true);
        try {
            const response = await adminClient.get(`/sources/${source.id}/available_options/`);
            setAvailableOptions(response.data);
        } catch (err) {
            console.error('Ошибка загрузки доступных опций:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(source.id, {
                default_price_type: selectedPriceType || undefined,
                default_warehouse: selectedWarehouse || undefined,
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FaCogs className="w-5 h-5 mr-2 text-blue-600" />
                        Настройка цен и складов: {source.name}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <FaSpinner className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-3 text-gray-600">Загрузка доступных опций...</span>
                        </div>
                    ) : (
                        <>
                    <div>
                        <label htmlFor="price-type" className="block text-sm font-medium text-gray-700 mb-2">
                            Тип цены по умолчанию
                        </label>
                        <select
                            id="price-type"
                            value={selectedPriceType}
                            onChange={(e) => setSelectedPriceType(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">-- Выберите тип цены --</option>
                            {availableOptions?.price_types?.map((priceType) => (
                                <option key={priceType.code} value={priceType.code}>
                                    {priceType.name}
                                </option>
                            ))}
                        </select>
                        <p className="mt-2 text-xs text-gray-500">
                            Цена, которая будет использоваться для отображения товаров из этого источника
                        </p>
                    </div>

                    <div>
                        <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700 mb-2">
                            Склад по умолчанию
                        </label>
                        <select
                            id="warehouse"
                            value={selectedWarehouse}
                            onChange={(e) => setSelectedWarehouse(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="">-- Выберите склад --</option>
                            {availableOptions?.warehouses?.map((warehouse) => (
                                <option key={warehouse.code} value={warehouse.code}>
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>
                        <p className="mt-2 text-xs text-gray-500">
                            Склад, остатки которого будут использоваться для отображения наличия товаров
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Информация</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>
                                        Эти настройки определяют, какие данные из 1С будут использоваться для товаров этого источника.
                                        Если настройки не выбраны, товары могут отображаться некорректно.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    </>
                    )}
                </div>
                <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 mr-3"
                        disabled={saving}
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                        disabled={saving}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
};
