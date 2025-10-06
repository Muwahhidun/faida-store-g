import React, { useState, useEffect } from 'react';
import { FaHistory, FaTimes, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaClock } from 'react-icons/fa';
import { adminClient } from '../../../api/adminClient';

interface SyncLog {
    id: number;
    sync_type: 'full' | 'partial';
    sync_type_display: string;
    status: 'started' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    status_display: string;
    started_at: string;
    finished_at: string | null;
    duration_formatted: string | null;
    total_products: number;
    processed_products: number;
    created_products: number;
    updated_products: number;
    errors_count: number;
    message: string;
    error_details: string;
}

interface SyncLogsModalProps {
    sourceId: number;
    sourceName: string;
    onClose: () => void;
}

/**
 * Модальное окно истории синхронизации источника
 */
export const SyncLogsModal: React.FC<SyncLogsModalProps> = ({ sourceId, sourceName, onClose }) => {
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLogs();
    }, [sourceId]);

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

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await adminClient.get(`/sources/${sourceId}/sync_logs/`);
            setLogs(response.data);
        } catch (err: any) {
            setError('Не удалось загрузить историю синхронизации');
            console.error('Ошибка загрузки логов:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'started':
            case 'in_progress':
                return <FaSpinner className="w-4 h-4 animate-spin text-blue-600" />;
            case 'completed':
                return <FaCheckCircle className="w-4 h-4 text-green-600" />;
            case 'failed':
                return <FaExclamationTriangle className="w-4 h-4 text-red-600" />;
            case 'cancelled':
                return <FaTimes className="w-4 h-4 text-gray-600" />;
            default:
                return <FaClock className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'started':
            case 'in_progress':
                return 'text-blue-600 bg-blue-50';
            case 'completed':
                return 'text-green-600 bg-green-50';
            case 'failed':
                return 'text-red-600 bg-red-50';
            case 'cancelled':
                return 'text-gray-600 bg-gray-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FaHistory className="w-5 h-5 mr-2 text-indigo-600" />
                        История синхронизации: {sourceName}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
                            <span className="ml-3 text-gray-600">Загрузка истории...</span>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800">{error}</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <FaHistory className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">История синхронизации пуста</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`border rounded-lg p-4 ${getStatusColor(log.status)}`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            {getStatusIcon(log.status)}
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">
                                                        {log.sync_type_display}
                                                    </span>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        log.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        log.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                        log.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {log.status_display}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    Начало: {formatDate(log.started_at)}
                                                    {log.finished_at && (
                                                        <> • Завершение: {formatDate(log.finished_at)}</>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {log.duration_formatted && (
                                            <div className="text-sm text-gray-600">
                                                Длительность: {log.duration_formatted}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Всего товаров:</span>
                                            <span className="ml-2 font-medium">{log.total_products}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Обработано:</span>
                                            <span className="ml-2 font-medium">{log.processed_products}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Создано:</span>
                                            <span className="ml-2 font-medium">{log.created_products}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Обновлено:</span>
                                            <span className="ml-2 font-medium">{log.updated_products}</span>
                                        </div>
                                        {log.errors_count > 0 && (
                                            <div className="col-span-2 md:col-span-4">
                                                <span className="text-red-600">Ошибок:</span>
                                                <span className="ml-2 font-medium text-red-600">{log.errors_count}</span>
                                            </div>
                                        )}
                                    </div>

                                    {log.message && (
                                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                                            <strong>Сообщение:</strong> {log.message}
                                        </div>
                                    )}

                                    {log.error_details && (
                                        <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                                            <strong>Детали ошибки:</strong> {log.error_details}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};
