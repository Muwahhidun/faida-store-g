/**
 * Модальное окно для создания/редактирования шаблонов уведомлений
 */

import React, { useState, useEffect } from 'react';
import { FaTimes, FaSpinner, FaStar } from 'react-icons/fa';
import { useNotificationTypes, useNotificationChannels } from '../../../hooks/useNotifications';
import type { NotificationTemplate } from '../../../types/notifications';

interface TemplateFormModalProps {
    template: NotificationTemplate | null;
    onClose: () => void;
    onSubmit: (data: Partial<NotificationTemplate>) => Promise<void>;
    isSubmitting: boolean;
}

export const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
    template,
    onClose,
    onSubmit,
    isSubmitting
}) => {
    const { data: notificationTypes } = useNotificationTypes();
    const { data: channels } = useNotificationChannels();

    const [formData, setFormData] = useState({
        notification_type: template?.notification_type || 0,
        channel: template?.channel || 0,
        name: template?.name || '',
        subject: template?.subject || '',
        template: template?.template || '',
        is_default: template?.is_default || false,
    });

    const [selectedType, setSelectedType] = useState<any>(null);

    // Обновить выбранный тип при изменении notification_type
    useEffect(() => {
        if (formData.notification_type && notificationTypes) {
            const type = notificationTypes.find(t => t.id === formData.notification_type);
            setSelectedType(type);
        }
    }, [formData.notification_type, notificationTypes]);

    // Получить доступные переменные (из существующего шаблона при редактировании)
    const getAvailableVariables = (): Record<string, string> => {
        if (template?.variables_help) {
            return template.variables_help;
        }
        return {};
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.notification_type || !formData.channel || !formData.name || !formData.template) {
            alert('Заполните все обязательные поля');
            return;
        }

        await onSubmit(formData);
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const selectedChannel = channels?.find(c => c.id === formData.channel);
    const showSubjectField = selectedChannel?.code === 'email';

    const availableVariables = getAvailableVariables();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Заголовок */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {template ? 'Редактировать шаблон' : 'Создать шаблон'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Форма */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Тип уведомления */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Тип уведомления <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.notification_type}
                            onChange={(e) => handleChange('notification_type', Number(e.target.value))}
                            disabled={!!template}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            required
                        >
                            <option value={0}>Выберите тип уведомления</option>
                            {notificationTypes?.filter(t => t.is_enabled).map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                        {selectedType && (
                            <p className="mt-1 text-xs text-gray-600">{selectedType.description}</p>
                        )}
                    </div>

                    {/* Канал */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Канал отправки <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.channel}
                            onChange={(e) => handleChange('channel', Number(e.target.value))}
                            disabled={!!template}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            required
                        >
                            <option value={0}>Выберите канал</option>
                            {channels?.filter(c => c.is_active).map(channel => (
                                <option key={channel.id} value={channel.id}>
                                    {channel.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Название шаблона */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Название шаблона <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Например: Стандартный, Подробный, Для VIP клиентов"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-600">
                            Название для идентификации шаблона при выборе
                        </p>
                    </div>

                    {/* Тема письма (только для email) */}
                    {showSubjectField && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Тема письма <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.subject}
                                onChange={(e) => handleChange('subject', e.target.value)}
                                placeholder="Тема письма (можно использовать переменные)"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required={showSubjectField}
                            />
                        </div>
                    )}

                    {/* Текст шаблона */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Текст шаблона <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.template}
                            onChange={(e) => handleChange('template', e.target.value)}
                            placeholder="Текст уведомления с переменными {{variable_name}}"
                            rows={8}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-600">
                            Используйте двойные фигурные скобки для переменных: {`{{variable_name}}`}
                        </p>
                    </div>

                    {/* Доступные переменные */}
                    {Object.keys(availableVariables).length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                Доступные переменные для этого типа уведомления:
                            </h4>
                            <div className="space-y-2">
                                {Object.entries(availableVariables).map(([varName, description]) => (
                                    <div key={varName} className="flex items-start space-x-3">
                                        <code className="px-2 py-1 bg-white border border-blue-300 text-blue-700 text-xs rounded font-mono shrink-0">
                                            {`{{${varName}}}`}
                                        </code>
                                        <span className="text-xs text-gray-700">{description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Шаблон по умолчанию */}
                    <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <input
                            type="checkbox"
                            id="is_default"
                            checked={formData.is_default}
                            onChange={(e) => handleChange('is_default', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_default" className="flex items-center space-x-2 text-sm text-gray-900 cursor-pointer">
                            <FaStar className="text-yellow-600" />
                            <span>Использовать по умолчанию</span>
                        </label>
                    </div>
                    <p className="text-xs text-gray-600 -mt-3 ml-7">
                        Этот шаблон будет использоваться если для контакта не указан конкретный шаблон
                    </p>

                    {/* Кнопки */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                            {isSubmitting && <FaSpinner className="w-4 h-4 animate-spin" />}
                            <span>{template ? 'Сохранить' : 'Создать'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
