/**
 * Вкладка управления шаблонами уведомлений
 * Трёхуровневая иерархия с сворачиванием:
 * 1. Тип уведомления (Новый заказ, Смена статуса...)
 * 2. Тип канала (Email, Telegram, WhatsApp)
 * 3. Шаблоны (системные и кастомные)
 */

import React, { useState, useMemo } from 'react';
import {
    FaFileAlt,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSpinner,
    FaStar,
    FaEnvelope,
    FaWhatsapp,
    FaTelegram,
    FaChevronDown,
    FaChevronRight,
    FaLock,
    FaCopy
} from 'react-icons/fa';
import { useNotificationTemplates, useDeleteTemplate, useSetDefaultTemplate } from '../../../hooks/useNotifications';
import type { NotificationTemplate } from '../../../types/notifications';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../../DeleteConfirmModal';

interface TemplatesTabProps {
    onCreateTemplate: () => void;
    onEditTemplate: (template: NotificationTemplate) => void;
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({ onCreateTemplate, onEditTemplate }) => {
    const { data: templates, isLoading } = useNotificationTemplates();
    const deleteTemplate = useDeleteTemplate();
    const setDefaultTemplate = useSetDefaultTemplate();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);
    const [expandedNotificationTypes, setExpandedNotificationTypes] = useState<Set<string>>(new Set());
    const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
    const [expandedTemplates, setExpandedTemplates] = useState<Set<number>>(new Set());
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<{ id: number; name: string } | null>(null);

    // Группируем шаблоны по типу уведомления → тип канала
    const groupedTemplates = useMemo(() => {
        if (!templates) return {};

        const grouped: Record<string, Record<string, NotificationTemplate[]>> = {};

        templates.forEach(template => {
            const notificationKey = `${template.notification_type}_${template.notification_type_name}`;
            const channelKey = template.channel_type || 'unknown';

            if (!grouped[notificationKey]) {
                grouped[notificationKey] = {};
            }
            if (!grouped[notificationKey][channelKey]) {
                grouped[notificationKey][channelKey] = [];
            }

            grouped[notificationKey][channelKey].push(template);
        });

        // Сортируем шаблоны внутри каждой группы: системные первыми
        Object.keys(grouped).forEach(notificationKey => {
            Object.keys(grouped[notificationKey]).forEach(channelKey => {
                grouped[notificationKey][channelKey].sort((a, b) => {
                    if (a.is_system && !b.is_system) return -1;
                    if (!a.is_system && b.is_system) return 1;
                    return a.name.localeCompare(b.name);
                });
            });
        });

        return grouped;
    }, [templates]);

    const handleDelete = (template: NotificationTemplate) => {
        if (template.is_system) {
            toast.error('Системные шаблоны нельзя удалять');
            return;
        }

        setTemplateToDelete({ id: template.id, name: template.name });
        setDeleteModalOpen(true);
    };

    const confirmDeleteTemplate = async () => {
        if (!templateToDelete) return;

        setDeletingId(templateToDelete.id);
        try {
            await deleteTemplate.mutateAsync(templateToDelete.id);
            toast.success(`Шаблон "${templateToDelete.name}" удален`);
            setDeleteModalOpen(false);
            setTemplateToDelete(null);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка удаления');
            // Не закрываем модал при ошибке
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (template: NotificationTemplate) => {
        if (template.is_system) {
            toast.error('Системные шаблоны нельзя редактировать');
            return;
        }
        onEditTemplate(template);
    };

    const handleSetDefault = async (template: NotificationTemplate) => {
        if (template.is_default) {
            toast.success('Этот шаблон уже установлен по умолчанию');
            return;
        }

        setSettingDefaultId(template.id);
        try {
            await setDefaultTemplate.mutateAsync(template.id);
            toast.success(`Шаблон "${template.name}" установлен по умолчанию`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка установки шаблона');
        } finally {
            setSettingDefaultId(null);
        }
    };

    const toggleNotificationType = (key: string) => {
        const newExpanded = new Set(expandedNotificationTypes);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedNotificationTypes(newExpanded);
    };

    const toggleChannel = (key: string) => {
        const newExpanded = new Set(expandedChannels);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedChannels(newExpanded);
    };

    const toggleTemplate = (templateId: number) => {
        const newExpanded = new Set(expandedTemplates);
        if (newExpanded.has(templateId)) {
            newExpanded.delete(templateId);
        } else {
            newExpanded.add(templateId);
        }
        setExpandedTemplates(newExpanded);
    };

    const getChannelIcon = (channelCode: string | undefined) => {
        if (!channelCode) {
            return <FaFileAlt className="text-gray-600" />;
        }

        switch (channelCode.toLowerCase()) {
            case 'email':
                return <FaEnvelope className="text-secondary-600" />;
            case 'whatsapp':
                return <FaWhatsapp className="text-success-600" />;
            case 'telegram':
                return <FaTelegram className="text-blue-500" />;
            default:
                return <FaFileAlt className="text-gray-600" />;
        }
    };

    const getChannelDisplayName = (channelCode: string) => {
        const names: Record<string, string> = {
            'email': 'Email',
            'whatsapp': 'WhatsApp',
            'telegram': 'Telegram'
        };
        return names[channelCode] || channelCode;
    };

    // Копирование текста в буфер обмена
    const copyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${fieldName} скопирован в буфер обмена`);
        } catch (error) {
            toast.error('Ошибка копирования в буфер обмена');
        }
    };

    // Компонент для отображения одного шаблона (сворачиваемый)
    const TemplateCard: React.FC<{ template: NotificationTemplate }> = ({ template }) => {
        const isExpanded = expandedTemplates.has(template.id);

        return (
            <div className={`${template.is_system ? 'bg-gray-50' : 'bg-white'}`}>
                {/* Заголовок шаблона (кликабельный) */}
                <div className="flex items-center justify-between pl-12 pr-3 py-3 hover:bg-gray-100 transition-colors">
                    <button
                        onClick={() => toggleTemplate(template.id)}
                        className="flex items-center space-x-2 flex-1 text-left"
                    >
                        {isExpanded ? (
                            <FaChevronDown className="text-gray-500 w-3 h-3 flex-shrink-0" />
                        ) : (
                            <FaChevronRight className="text-gray-500 w-3 h-3 flex-shrink-0" />
                        )}
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 truncate">{template.name}</h5>
                            {template.is_system && (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded flex-shrink-0">
                                    <FaLock className="w-2.5 h-2.5" />
                                    <span>Системный</span>
                                </span>
                            )}
                            {template.is_default && (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded flex-shrink-0">
                                    <FaStar className="w-2.5 h-2.5" />
                                    <span>По умолчанию</span>
                                </span>
                            )}
                        </div>
                    </button>

                    {/* Действия */}
                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                        {/* Кнопка "Установить по умолчанию" */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSetDefault(template);
                            }}
                            disabled={settingDefaultId === template.id}
                            className={`p-1.5 rounded transition-colors ${
                                template.is_default
                                    ? 'text-yellow-500'
                                    : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                            } disabled:opacity-50`}
                            title={template.is_default ? 'Этот шаблон по умолчанию' : 'Установить по умолчанию'}
                        >
                            {settingDefaultId === template.id ? (
                                <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <FaStar className={`w-3.5 h-3.5 ${template.is_default ? 'fill-current' : ''}`} />
                            )}
                        </button>

                        {/* Кнопка "Редактировать" */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(template);
                            }}
                            disabled={template.is_system}
                            className={`p-1.5 rounded transition-colors ${
                                template.is_system
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-secondary-600 hover:bg-blue-50'
                            }`}
                            title={template.is_system ? 'Системный шаблон нельзя редактировать' : 'Редактировать'}
                        >
                            <FaEdit className="w-3.5 h-3.5" />
                        </button>

                        {/* Кнопка "Удалить" */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(template);
                            }}
                            disabled={template.is_system || deletingId === template.id}
                            className={`p-1.5 rounded transition-colors ${
                                template.is_system
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-red-600 hover:bg-red-50'
                            } disabled:opacity-50`}
                            title={template.is_system ? 'Системный шаблон нельзя удалить' : 'Удалить'}
                        >
                            {deletingId === template.id ? (
                                <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <FaTrash className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Детали шаблона (показываются при раскрытии) */}
                {isExpanded && (
                    <div className="pl-12 pr-3 pb-3 space-y-2">
                        {/* Тема (для email) */}
                        {template.subject && (
                            <div className="p-2 bg-white rounded border border-gray-200">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs text-gray-600">Тема:</p>
                                    {template.is_system && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyToClipboard(template.subject, 'Тема');
                                            }}
                                            className="flex items-center gap-1 text-xs text-secondary-600 hover:text-blue-800 transition-colors group"
                                            title="Копировать тему"
                                        >
                                            <FaCopy className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm text-gray-900 font-medium">{template.subject}</p>
                            </div>
                        )}

                        {/* Превью шаблона */}
                        <div className="p-2 bg-white rounded border border-gray-200">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-gray-600">Текст шаблона:</p>
                                {template.is_system && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(template.template, 'Текст шаблона');
                                        }}
                                        className="flex items-center gap-1 text-xs text-secondary-600 hover:text-blue-800 transition-colors group"
                                        title="Копировать текст шаблона"
                                    >
                                        <FaCopy className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                                    </button>
                                )}
                            </div>
                            <div className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                                {template.template}
                            </div>
                        </div>

                        {/* Переменные */}
                        {template.variables_help && Object.keys(template.variables_help).length > 0 && (
                            <div className="p-2 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs text-gray-700 font-medium mb-2">Доступные переменные:</p>
                                <div className="space-y-1">
                                    {Object.entries(template.variables_help).map(([varName, description]) => (
                                        <div key={varName} className="flex items-start space-x-2">
                                            <code className="px-1.5 py-0.5 bg-white border border-blue-300 text-blue-700 text-xs rounded font-mono flex-shrink-0">
                                                {`{{${varName}}}`}
                                            </code>
                                            <span className="text-xs text-gray-700">{description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <FaSpinner className="w-8 h-8 text-secondary-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Шаблоны уведомлений</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Управление шаблонами для каждого типа уведомления
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

            {/* Трёхуровневая иерархия */}
            <div className="space-y-3">
                {Object.entries(groupedTemplates).map(([notificationKey, channelGroups]) => {
                    const firstTemplate = Object.values(channelGroups)[0][0];
                    const notificationTypeName = firstTemplate.notification_type_name;
                    const isNotificationExpanded = expandedNotificationTypes.has(notificationKey);

                    // Подсчитываем всего шаблонов
                    const totalTemplates = Object.values(channelGroups).reduce((sum, templates) => sum + templates.length, 0);

                    return (
                        <div key={notificationKey} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Уровень 1: Тип уведомления */}
                            <button
                                onClick={() => toggleNotificationType(notificationKey)}
                                className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 hover:from-blue-100 hover:to-indigo-100 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {isNotificationExpanded ? (
                                            <FaChevronDown className="text-gray-600 w-4 h-4" />
                                        ) : (
                                            <FaChevronRight className="text-gray-600 w-4 h-4" />
                                        )}
                                        <FaFileAlt className="text-secondary-600" />
                                        <div className="text-left">
                                            <h4 className="font-semibold text-gray-900">{notificationTypeName}</h4>
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                {Object.keys(channelGroups).length} каналов · {totalTemplates} шаблонов
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* Уровень 2: Типы каналов */}
                            {isNotificationExpanded && (
                                <div className="border-t border-gray-200">
                                    {Object.entries(channelGroups).map(([channelType, channelTemplates]) => {
                                        const channelKey = `${notificationKey}_${channelType}`;
                                        const isChannelExpanded = expandedChannels.has(channelKey);
                                        const systemCount = channelTemplates.filter(t => t.is_system).length;
                                        const customCount = channelTemplates.filter(t => !t.is_system).length;

                                        return (
                                            <div key={channelKey} className="border-b border-gray-200 last:border-b-0">
                                                {/* Заголовок канала */}
                                                <button
                                                    onClick={() => toggleChannel(channelKey)}
                                                    className="w-full bg-gray-50 px-6 py-2.5 hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            {isChannelExpanded ? (
                                                                <FaChevronDown className="text-gray-500 w-3.5 h-3.5" />
                                                            ) : (
                                                                <FaChevronRight className="text-gray-500 w-3.5 h-3.5" />
                                                            )}
                                                            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                                                                {getChannelIcon(channelType)}
                                                            </div>
                                                            <div className="text-left">
                                                                <h5 className="font-medium text-gray-900 text-sm">{getChannelDisplayName(channelType)}</h5>
                                                                <p className="text-xs text-gray-600">
                                                                    {systemCount} системных, {customCount} кастомных
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* Уровень 3: Шаблоны */}
                                                {isChannelExpanded && (
                                                    <div className="divide-y divide-gray-200">
                                                        {channelTemplates.map(template => (
                                                            <TemplateCard key={template.id} template={template} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
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
                        className="text-secondary-600 hover:underline text-sm"
                    >
                        Создать первый шаблон
                    </button>
                </div>
            )}

            {/* Информация */}
            {templates && templates.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                        💡 <strong>Совет:</strong> Системные шаблоны предустановлены и защищены от изменений. Шаблон с пометкой "По умолчанию" используется, если для контакта не указан конкретный шаблон.
                    </p>
                </div>
            )}

            {/* Модальное окно подтверждения удаления */}
            {deleteModalOpen && templateToDelete && (
                <DeleteConfirmModal
                    title={templateToDelete.name}
                    itemType="шаблон"
                    onClose={() => {
                        setDeleteModalOpen(false);
                        setTemplateToDelete(null);
                    }}
                    onConfirm={confirmDeleteTemplate}
                    deleting={deletingId === templateToDelete.id}
                />
            )}
        </div>
    );
};

export default TemplatesTab;
