import React, { useState } from 'react';
import {
    FaDatabase, FaPlus, FaEdit, FaCogs, FaPlay, FaHistory, FaTrash,
    FaSync, FaTimes, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaHourglassHalf
} from 'react-icons/fa';
import { Switch } from '@headlessui/react';
import { Source, AvailableOptions } from '../../../types/admin';
import { adminClient } from '../../../api/adminClient';

interface SourcesSectionProps {
    sources: Source[];
    availableOptions: AvailableOptions;
    onSourcesUpdate: () => void;
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

/**
 * Секция управления источниками данных 1С
 * Отображает список источников, их статусы, позволяет запускать синхронизацию
 */
export const SourcesSection: React.FC<SourcesSectionProps> = ({
    sources,
    availableOptions,
    onSourcesUpdate,
    onError,
    onSuccess
}) => {
    const [importingSourceId, setImportingSourceId] = useState<number | null>(null);

    // Вспомогательные функции
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running':
            case 'running_data':
            case 'running_full':
                return <FaSpinner className="w-3 h-3 animate-spin text-blue-600" />;
            case 'completed':
                return <FaCheckCircle className="w-3 h-3 text-green-600" />;
            case 'failed':
                return <FaExclamationTriangle className="w-3 h-3 text-red-600" />;
            default:
                return <FaHourglassHalf className="w-3 h-3 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running':
            case 'running_data':
            case 'running_full':
                return 'text-blue-600';
            case 'completed':
                return 'text-green-600';
            case 'failed':
                return 'text-red-600';
            default:
                return 'text-gray-500';
        }
    };

    const formatLastImport = (dateString: string | null) => {
        if (!dateString) return 'Никогда';
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isSourceSyncing = (source: Source) => {
        return source.import_status === 'running' ||
               source.import_status === 'running_data' ||
               source.import_status === 'running_full';
    };

    const isAnySourceSyncing = () => {
        return sources.some(isSourceSyncing);
    };

    // Обработчики
    const handleSourceToggle = async (source: Source) => {
        try {
            const updatedSource = { ...source, show_on_site: !source.show_on_site };
            await adminClient.patch(`/sources/${source.id}/`, {
                show_on_site: updatedSource.show_on_site,
            });
            onSuccess(`Источник "${source.name}" успешно обновлен.`);
            onSourcesUpdate();
        } catch (err) {
            onError('Ошибка при обновлении источника.');
        }
    };

    const handleImportData = async (source: Source, syncType: 'full' | 'quick' = 'full') => {
        setImportingSourceId(source.id);

        try {
            const endpoint = syncType === 'quick' ? 'quick_sync' : 'import_data';
            const response = await adminClient.post(`/sources/${source.id}/${endpoint}/`);

            if (response.data.success) {
                const syncTypeLabel = syncType === 'quick' ? 'Быстрая синхронизация' : 'Полная синхронизация';
                onSuccess(`${syncTypeLabel} запущена: ${response.data.message}`);
                onSourcesUpdate();
            } else {
                onError(response.data.message);
            }
        } catch (err: any) {
            if (err.response?.data?.message) {
                onError(err.response.data.message);
            } else {
                onError('Ошибка при запуске синхронизации.');
            }
        } finally {
            setImportingSourceId(null);
        }
    };

    const handleResetStatus = async (source: Source) => {
        try {
            const response = await adminClient.post(`/sources/${source.id}/reset_status/`);

            if (response.data.success) {
                onSuccess(response.data.message);
                onSourcesUpdate();
            } else {
                onError(response.data.message);
            }
        } catch (err: any) {
            if (err.response?.data?.message) {
                onError(err.response.data.message);
            } else {
                onError('Ошибка при сбросе статуса импорта.');
            }
        }
    };

    const handleCreateSource = () => {
        // TODO: Открыть модальное окно создания источника
        console.log('Create source');
    };

    const handleEditSource = (source: Source) => {
        // TODO: Открыть модальное окно редактирования источника
        console.log('Edit source', source);
    };

    const handleEditPriceWarehouse = (source: Source) => {
        // TODO: Открыть модальное окно настройки цен и складов
        console.log('Edit price/warehouse', source);
    };

    const handleEditAutoSync = (source: Source) => {
        // TODO: Открыть модальное окно автосинхронизации
        console.log('Edit auto sync', source);
    };

    const handleShowLogs = (source: Source) => {
        // TODO: Открыть модальное окно с логами
        console.log('Show logs', source);
    };

    const handleDeleteSource = (source: Source) => {
        // TODO: Открыть модальное окно подтверждения удаления
        console.log('Delete source', source);
    };

    return (
        <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaDatabase className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900">Источники данных</h2>
                        <p className="text-sm text-gray-600 truncate">Управление отображением источников 1С</p>
                    </div>
                </div>
                <button
                    onClick={handleCreateSource}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center space-x-2 flex-shrink-0"
                >
                    <FaPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Создать источник</span>
                    <span className="sm:hidden">Создать</span>
                </button>
            </div>

            <div className="space-y-4">
                {sources.length === 0 ? (
                    <div className="text-center py-8">
                        <FaDatabase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Источники данных не найдены</p>
                    </div>
                ) : (
                    sources.map(source => (
                        <div
                            key={source.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 gap-3"
                        >
                            <div className="flex items-center space-x-3 min-w-0">
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                    source.show_on_site ? 'bg-green-500' : 'bg-gray-300'
                                }`}></div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium text-gray-900">{source.name}</span>
                                        {getStatusIcon(source.import_status)}
                                        <span className={`text-xs font-medium ${getStatusColor(source.import_status)}`}>
                                            {source.import_status_display}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Цена: {source.default_price_type_name || 'не выбрана'} |
                                        Склад: {source.default_warehouse_name || 'не выбран'}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Последний импорт: {formatLastImport(source.last_import_completed)}
                                        {source.import_status === 'failed' && source.import_error_message && (
                                            <div className="text-red-500 mt-1" title={source.import_error_message}>
                                                Ошибка: {source.import_error_message.length > 50
                                                    ? source.import_error_message.substring(0, 50) + '...'
                                                    : source.import_error_message}
                                            </div>
                                        )}
                                    </div>
                                    {source.auto_sync_enabled && (
                                        <div className="text-xs text-blue-600 mt-1 flex items-center space-x-1">
                                            <FaHourglassHalf className="w-3 h-3" />
                                            <span>
                                                Автосинхронизация: данные каждые {source.data_sync_interval} мин,
                                                полная каждые {source.full_sync_interval} мин
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-center sm:justify-start space-x-2 flex-shrink-0">
                                {/* Настройки */}
                                <button
                                    onClick={() => handleEditSource(source)}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Редактировать источник"
                                    disabled={isAnySourceSyncing()}
                                >
                                    <FaEdit className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleEditPriceWarehouse(source)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                    title="Настройки цен и складов"
                                    disabled={isAnySourceSyncing()}
                                >
                                    <FaCogs className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleEditAutoSync(source)}
                                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                                    title="Настройки автосинхронизации"
                                    disabled={isAnySourceSyncing()}
                                >
                                    <FaPlay className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleShowLogs(source)}
                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                    title="Посмотреть историю синхронизации"
                                >
                                    <FaHistory className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDeleteSource(source)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Удалить источник"
                                    disabled={isAnySourceSyncing()}
                                >
                                    <FaTrash className="w-5 h-5" />
                                </button>

                                <span className="h-6 w-px bg-gray-200"></span>

                                {/* Управление синхронизацией */}
                                <button
                                    onClick={() => handleImportData(source, 'quick')}
                                    disabled={isSourceSyncing(source) || !source.show_on_site || isAnySourceSyncing()}
                                    className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Быстрая синхронизация (только данные)"
                                >
                                    {importingSourceId === source.id && source.import_status === 'running_data'
                                        ? <FaSpinner className="w-5 h-5 animate-spin text-yellow-600" />
                                        : <FaPlus className="w-5 h-5" />
                                    }
                                </button>
                                <button
                                    onClick={() => handleImportData(source, 'full')}
                                    disabled={isSourceSyncing(source) || !source.show_on_site || isAnySourceSyncing()}
                                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Полная синхронизация (данные + изображения)"
                                >
                                    {importingSourceId === source.id && source.import_status === 'running_full'
                                        ? <FaSpinner className="w-5 h-5 animate-spin text-green-600" />
                                        : <FaSync className="w-5 h-5" />
                                    }
                                </button>
                                {isSourceSyncing(source) && (
                                    <button
                                        onClick={() => handleResetStatus(source)}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                        title="Сбросить статус импорта"
                                    >
                                        <FaTimes className="w-5 h-5" />
                                    </button>
                                )}

                                <span className="h-6 w-px bg-gray-200"></span>

                                {/* Переключатель */}
                                <Switch
                                    checked={source.show_on_site}
                                    onChange={() => handleSourceToggle(source)}
                                    disabled={isAnySourceSyncing()}
                                    className={`${
                                        source.show_on_site ? 'bg-blue-600' : 'bg-gray-200'
                                    } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
                                >
                                    <span
                                        className={`${
                                            source.show_on_site ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                                    />
                                </Switch>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
