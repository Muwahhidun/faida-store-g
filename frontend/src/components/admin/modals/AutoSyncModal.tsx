import React, { useState, useEffect } from 'react';
import { FaPlay, FaTimes } from 'react-icons/fa';
import { Switch } from '@headlessui/react';
import { Source } from '../../../types/admin';

interface AutoSyncModalProps {
    source: Source;
    onClose: () => void;
    onSave: (id: number, data: {
        auto_sync_enabled?: boolean;
        data_sync_interval?: number;
        full_sync_interval?: number;
    }) => Promise<void>;
}

/**
 * Модальное окно настройки автосинхронизации
 */
export const AutoSyncModal: React.FC<AutoSyncModalProps> = ({ source, onClose, onSave }) => {
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(source.auto_sync_enabled);
    const [dataSyncInterval, setDataSyncInterval] = useState(source.data_sync_interval || 60);
    const [fullSyncInterval, setFullSyncInterval] = useState(source.full_sync_interval || 1440);
    const [saving, setSaving] = useState(false);

    // Обработчик ESC для закрытия модального окна
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !saving) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, saving]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(source.id, {
                auto_sync_enabled: autoSyncEnabled,
                data_sync_interval: dataSyncInterval,
                full_sync_interval: fullSyncInterval,
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
                        <FaPlay className="w-5 h-5 mr-2 text-purple-600" />
                        Настройка автосинхронизации: {source.name}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">Автоматическая синхронизация</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Включить автоматическую синхронизацию данных по расписанию
                            </p>
                        </div>
                        <Switch
                            checked={autoSyncEnabled}
                            onChange={setAutoSyncEnabled}
                            className={`${autoSyncEnabled ? 'bg-purple-600' : 'bg-gray-200'
                                } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                        >
                            <span
                                className={`${autoSyncEnabled ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                            />
                        </Switch>
                    </div>

                    {autoSyncEnabled && (
                        <>
                            <div>
                                <label htmlFor="data-sync-interval" className="block text-sm font-medium text-gray-700 mb-2">
                                    Интервал быстрой синхронизации (минуты)
                                </label>
                                <input
                                    type="number"
                                    id="data-sync-interval"
                                    min="1"
                                    max="10080"
                                    value={dataSyncInterval}
                                    onChange={(e) => setDataSyncInterval(parseInt(e.target.value) || 60)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Как часто обновлять данные о товарах (цены, остатки, названия). Рекомендуется: 30-60 минут
                                </p>
                            </div>

                            <div>
                                <label htmlFor="full-sync-interval" className="block text-sm font-medium text-gray-700 mb-2">
                                    Интервал полной синхронизации (минуты)
                                </label>
                                <input
                                    type="number"
                                    id="full-sync-interval"
                                    min="1"
                                    max="10080"
                                    value={fullSyncInterval}
                                    onChange={(e) => setFullSyncInterval(parseInt(e.target.value) || 1440)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Как часто выполнять полную синхронизацию с изображениями. Рекомендуется: 1440 минут (1 раз в день)
                                </p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">Важно</h3>
                                        <div className="mt-2 text-sm text-yellow-700">
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Слишком частая синхронизация может создать нагрузку на сервер</li>
                                                <li>Полная синхронизация занимает больше времени и ресурсов</li>
                                                <li>Минимальный интервал: 1 минута, максимальный: 7 дней (10080 минут)</li>
                                            </ul>
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
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50"
                        disabled={saving}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
};
