import React, { useState } from 'react';
import {
    FaDatabase, FaPlus, FaEdit, FaCogs, FaPlay, FaHistory, FaTrash,
    FaSync, FaTimes, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaHourglassHalf
} from 'react-icons/fa';
import { Switch } from '@headlessui/react';
import { Source, AvailableOptions } from '../../../types/admin';
import { adminClient } from '../../../api/adminClient';
import {
    CreateSourceModal,
    EditSourceModal,
    PriceWarehouseModal,
    AutoSyncModal,
    SyncLogsModal,
    DeleteConfirmModal
} from '../modals';

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
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingSource, setEditingSource] = useState<Source | null>(null);
    const [priceWarehouseSource, setPriceWarehouseSource] = useState<Source | null>(null);
    const [autoSyncSource, setAutoSyncSource] = useState<Source | null>(null);
    const [logsSource, setLogsSource] = useState<Source | null>(null);
    const [deletingSource, setDeletingSource] = useState<Source | null>(null);

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
        setShowCreateModal(true);
    };

    const handleSaveNewSource = async (newSource: Partial<Source>) => {
        // Валидация
        if (!newSource.name || !newSource.code || !newSource.json_file_path || !newSource.media_dir_path) {
            onError('Все поля обязательны для заполнения.');
            throw new Error('Validation failed');
        }

        try {
            await adminClient.post('/sources/', newSource);
            onSuccess(`Источник "${newSource.name}" успешно создан.`);
            onSourcesUpdate();
        } catch (err: any) {
            console.error('Ошибка создания источника:', err);
            const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : 'Не удалось создать источник.';
            onError(`Ошибка: ${errorMessage}`);
            throw err;
        }
    };

    const handleEditSource = (source: Source) => {
        setEditingSource(source);
    };

    const handleSaveEditedSource = async (id: number, updatedSource: Partial<Source>) => {
        try {
            await adminClient.patch(`/sources/${id}/`, updatedSource);
            onSuccess(`Источник успешно обновлен.`);
            onSourcesUpdate();
        } catch (err: any) {
            const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : 'Не удалось обновить источник.';
            onError(`Ошибка: ${errorMessage}`);
            throw err;
        }
    };

    const handleEditPriceWarehouse = (source: Source) => {
        setPriceWarehouseSource(source);
    };

    const handleSavePriceWarehouse = async (id: number, data: { default_price_type?: string; default_warehouse?: string }) => {
        try {
            await adminClient.patch(`/sources/${id}/`, data);
            onSuccess('Настройки цен и складов успешно обновлены.');
            onSourcesUpdate();
        } catch (err: any) {
            const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : 'Не удалось обновить настройки.';
            onError(`Ошибка: ${errorMessage}`);
            throw err;
        }
    };

    const handleEditAutoSync = (source: Source) => {
        setAutoSyncSource(source);
    };

    const handleSaveAutoSync = async (id: number, data: {
        auto_sync_enabled?: boolean;
        data_sync_interval?: number;
        full_sync_interval?: number;
    }) => {
        try {
            await adminClient.patch(`/sources/${id}/`, data);
            onSuccess('Настройки автосинхронизации успешно обновлены.');
            onSourcesUpdate();
        } catch (err: any) {
            const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : 'Не удалось обновить настройки.';
            onError(`Ошибка: ${errorMessage}`);
            throw err;
        }
    };

    const handleShowLogs = (source: Source) => {
        setLogsSource(source);
    };

    const handleDeleteSource = (source: Source) => {
        setDeletingSource(source);
    };

    const handleConfirmDelete = async (id: number) => {
        try {
            await adminClient.delete(`/sources/${id}/`);
            onSuccess('Источник успешно удален.');
            onSourcesUpdate();
        } catch (err: any) {
            const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : 'Не удалось удалить источник.';
            onError(`Ошибка: ${errorMessage}`);
            throw err;
        }
    };

    return (
        <>
            {showCreateModal && (
                <CreateSourceModal
                    onClose={() => setShowCreateModal(false)}
                    onSave={handleSaveNewSource}
                />
            )}

            {editingSource && (
                <EditSourceModal
                    source={editingSource}
                    onClose={() => setEditingSource(null)}
                    onSave={handleSaveEditedSource}
                />
            )}

            {priceWarehouseSource && (
                <PriceWarehouseModal
                    source={priceWarehouseSource}
                    onClose={() => setPriceWarehouseSource(null)}
                    onSave={handleSavePriceWarehouse}
                />
            )}

            {autoSyncSource && (
                <AutoSyncModal
                    source={autoSyncSource}
                    onClose={() => setAutoSyncSource(null)}
                    onSave={handleSaveAutoSync}
                />
            )}

            {logsSource && (
                <SyncLogsModal
                    sourceId={logsSource.id}
                    sourceName={logsSource.name}
                    onClose={() => setLogsSource(null)}
                />
            )}

            {deletingSource && (
                <DeleteConfirmModal
                    source={deletingSource}
                    onClose={() => setDeletingSource(null)}
                    onConfirm={handleConfirmDelete}
                />
            )}

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
                                    {!source.is_active && (
                                        <div className="text-xs text-orange-600 mt-1 flex items-center space-x-1">
                                            <FaExclamationTriangle className="w-3 h-3" />
                                            <span className="font-medium">
                                                Источник неактивен - синхронизация отключена
                                            </span>
                                        </div>
                                    )}
                                    {source.auto_sync_enabled && (
                                        <div className={`text-xs mt-1 flex items-center space-x-1 ${
                                            source.is_active ? 'text-blue-600' : 'text-gray-400'
                                        }`}>
                                            <FaHourglassHalf className="w-3 h-3" />
                                            <span>
                                                Автосинхронизация: данные каждые {source.data_sync_interval} мин,
                                                полная каждые {source.full_sync_interval} мин
                                                {!source.is_active && ' (не работает)'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-center sm:justify-start space-x-2 flex-shrink-0">
                                {/* Настройки */}
                                <button
                                    onClick={() => handleEditSource(source)}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Редактировать источник"
                                    disabled={isSourceSyncing(source)}
                                >
                                    <FaEdit className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleEditPriceWarehouse(source)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Настройки цен и складов"
                                    disabled={isSourceSyncing(source)}
                                >
                                    <FaCogs className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleEditAutoSync(source)}
                                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Настройки автосинхронизации"
                                    disabled={isSourceSyncing(source)}
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
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Удалить источник"
                                    disabled={isSourceSyncing(source)}
                                >
                                    <FaTrash className="w-5 h-5" />
                                </button>

                                <span className="h-6 w-px bg-gray-200"></span>

                                {/* Управление синхронизацией */}
                                <button
                                    onClick={() => handleImportData(source, 'quick')}
                                    disabled={!source.is_active || isSourceSyncing(source) || !source.show_on_site || isAnySourceSyncing()}
                                    className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={!source.is_active ? "Источник неактивен - синхронизация недоступна" : "Быстрая синхронизация (только данные)"}
                                >
                                    {importingSourceId === source.id && source.import_status === 'running_data'
                                        ? <FaSpinner className="w-5 h-5 animate-spin text-yellow-600" />
                                        : <FaPlus className="w-5 h-5" />
                                    }
                                </button>
                                <button
                                    onClick={() => handleImportData(source, 'full')}
                                    disabled={!source.is_active || isSourceSyncing(source) || !source.show_on_site || isAnySourceSyncing()}
                                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={!source.is_active ? "Источник неактивен - синхронизация недоступна" : "Полная синхронизация (данные + изображения)"}
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
                                    disabled={isSourceSyncing(source)}
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
        </>
    );
};
