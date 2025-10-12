/**
 * Вкладка управления шаблонами уведомлений
 * Шаблоны группируются по типам уведомлений
 */

import React, { useState, useMemo } from 'react';
import { FaFileAlt, FaPlus, FaEdit, FaTrash, FaSpinner, FaStar, FaEnvelope, FaWhatsapp, FaTelegram } from 'react-icons/fa';
import { useNotificationTemplates, useDeleteTemplate } from '../../../hooks/useNotifications';
import type { NotificationTemplate } from '../../../types/notifications';
import toast from 'react-hot-toast';

interface TemplatesTabProps {
    onCreateTemplate: () => void;
    onEditTemplate: (template: NotificationTemplate) => void;
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({ onCreateTemplate, onEditTemplate }) => {
    const { data: templates, isLoading } = useNotificationTemplates();
    const deleteTemplate = useDeleteTemplate();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Группируем шаблоны по типу уведомления
    const groupedTemplates = useMemo(() => {
        if (!templates) return {};

        const grouped: Record<string, NotificationTemplate[]> = {};
        templates.forEach(template => {
            const key = `${template.notification_type}_${template.notification_type_name}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(template);
        });
        return grouped;
    }, [templates]);

    const handleDelete = async (template: NotificationTemplate) => {
        if (!confirm(`Удалить шаблон "${template.name}"? Это действие нельзя отменить.`)) {
            return;
        }

        setDeletingId(template.id);
        try {
            await deleteTemplate.mutateAsync(template.id);
            toast.success('Шаблон удален');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка удаления');
        } finally {
            setDeletingId(null);
        }
    };

    const getChannelIcon = (channelCode: string) => {
        switch (channelCode) {
            case 'email':
                return <FaEnvelope className="text-blue-600" />;
            case 'whatsapp':
                return <FaWhatsapp className="text-green-600" />;
            case 'telegram':
                return <FaTelegram className="text-blue-500" />;
            default:
                return <FaFileAlt className="text-gray-600" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Шаблоны уведомлений</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Управление шаблонами для каждого типа уведомления и канала
                    </p>
                </div>
                <button
                    onClick={onCreateTemplate}
                    className="btn-primary flex items-center space-x-2"
                >
                    <FaPlus className="w-4 h-4" />
                    <span>Создать шаблон</span>
                </button>
            </div>

            {/* Группированные шаблоны */}
            <div className="space-y-6">
                {Object.entries(groupedTemplates).map(([key, groupTemplates]) => {
                    const firstTemplate = groupTemplates[0];
                    return (
                        <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Заголовок группы */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                                    <FaFileAlt className="text-blue-600" />
                                    <span>{firstTemplate.notification_type_name}</span>
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {groupTemplates.length} {groupTemplates.length === 1 ? 'шаблон' : 'шаблонов'}
                                </p>
                            </div>

                            {/* Список шаблонов в группе */}
                            <div className="divide-y divide-gray-200">
                                {groupTemplates.map(template => (
                                    <div key={template.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    {/* Иконка канала */}
                                                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                                        {getChannelIcon(template.channel_name.toLowerCase())}
                                                    </div>

                                                    {/* Название шаблона */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <h5 className="font-semibold text-gray-900">{template.name}</h5>
                                                            {template.is_default && (
                                                                <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                                                    <FaStar className="w-3 h-3" />
                                                                    <span>По умолчанию</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600">{template.channel_name}</p>
                                                    </div>
                                                </div>

                                                {/* Тема (для email) */}
                                                {template.subject && (
                                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-600 mb-1">Тема письма:</p>
                                                        <p className="text-sm text-gray-900 font-medium">{template.subject}</p>
                                                    </div>
                                                )}

                                                {/* Превью шаблона */}
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-xs text-gray-600 mb-2">Текст шаблона:</p>
                                                    <div className="text-sm text-gray-700 line-clamp-3 font-mono text-xs">
                                                        {template.template.substring(0, 200)}...
                                                    </div>
                                                </div>

                                                {/* Переменные */}
                                                {template.variables_help && Object.keys(template.variables_help).length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs text-gray-600 mb-1">Доступные переменные:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Object.keys(template.variables_help).map(varName => (
                                                                <code key={varName} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded font-mono">
                                                                    {`{{${varName}}}`}
                                                                </code>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Действия */}
                                            <div className="flex items-center space-x-2 ml-4">
                                                <button
                                                    onClick={() => onEditTemplate(template)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Редактировать"
                                                >
                                                    <FaEdit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(template)}
                                                    disabled={deletingId === template.id}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Удалить"
                                                >
                                                    {deletingId === template.id ? (
                                                        <FaSpinner className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <FaTrash className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Пустое состояние */}
            {(!templates || templates.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                    <FaFileAlt className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="mb-2">Нет шаблонов</p>
                    <button
                        onClick={onCreateTemplate}
                        className="text-blue-600 hover:underline text-sm"
                    >
                        Создать первый шаблон
                    </button>
                </div>
            )}

            {/* Информация */}
            {templates && templates.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                        💡 <strong>Совет:</strong> Шаблоны группируются по типам уведомлений. Для каждого типа+канала можно создать несколько шаблонов (например: "Стандартный", "Подробный", "Для VIP"). Шаблон с пометкой "По умолчанию" используется если для контакта не указан конкретный шаблон.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TemplatesTab;
