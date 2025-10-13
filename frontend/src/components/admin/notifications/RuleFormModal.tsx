/**
 * Модальное окно для создания/редактирования правила уведомлений
 */

import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaSpinner, FaToggleOn, FaToggleOff, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { useNotificationTypes, useNotificationChannels, useNotificationTemplates, useNotificationContacts } from '../../../hooks/useNotifications';
import type { NotificationRule } from '../../../types/notifications';

interface RuleFormModalProps {
    rule: NotificationRule | null;
    onClose: () => void;
    onSubmit: (data: Partial<NotificationRule>) => Promise<void>;
    isSubmitting: boolean;
}

export const RuleFormModal: React.FC<RuleFormModalProps> = ({
    rule,
    onClose,
    onSubmit,
    isSubmitting
}) => {
    const { data: notificationTypes } = useNotificationTypes();
    const { data: channels } = useNotificationChannels();
    const { data: allTemplates } = useNotificationTemplates();
    const { data: allContacts } = useNotificationContacts();

    const [formData, setFormData] = useState<{
        name: string;
        rule_type: 'system' | 'additional';
        notification_type: number;
        channel: number;
        default_template: number;
        is_enabled: boolean;
        contact_ids: number[];
    }>({
        name: rule?.name || '',
        rule_type: rule?.rule_type || 'additional',
        notification_type: rule?.notification_type?.id || 0,
        channel: rule?.channel?.id || 0,
        default_template: rule?.default_template?.id || 0,
        is_enabled: rule?.is_enabled ?? true,
        contact_ids: rule?.contacts?.map(c => c.id) || [],
    });

    // Обработчик ESC для закрытия модального окна
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSubmitting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, isSubmitting]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.notification_type || !formData.channel || !formData.default_template) {
            alert('Заполните все обязательные поля');
            return;
        }

        // Преобразуем данные формы в формат API
        const submitData: any = {
            name: formData.name.trim(),
            rule_type: formData.rule_type,
            notification_type: formData.notification_type,
            channel: formData.channel,
            default_template: formData.default_template,
            is_enabled: formData.is_enabled,
        };

        // Контакты отправляем ТОЛЬКО для дополнительных правил
        if (formData.rule_type === 'additional') {
            submitData.contacts = formData.contact_ids;
        }

        await onSubmit(submitData);
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // При смене типа правила на системное - фильтруем каналы только email
        if (field === 'rule_type' && value === 'system') {
            // Сбрасываем канал если выбран не email
            const currentChannel = channels?.find(c => c.id === formData.channel);
            if (currentChannel && currentChannel.code !== 'email') {
                setFormData(prev => ({ ...prev, channel: 0, default_template: 0, contact_ids: [] }));
            }
        }
    };

    const toggleContact = (contactId: number) => {
        setFormData(prev => ({
            ...prev,
            contact_ids: prev.contact_ids.includes(contactId)
                ? prev.contact_ids.filter(id => id !== contactId)
                : [...prev.contact_ids, contactId]
        }));
    };

    // Фильтруем только активные элементы
    const activeTypes = notificationTypes?.filter(t => t.is_enabled) || [];
    // Для системных правил - только email каналы, для дополнительных - все
    const activeChannels = useMemo(() => {
        const filtered = channels?.filter(c => c.is_active) || [];
        if (formData.rule_type === 'system') {
            return filtered.filter(c => c.code === 'email');
        }
        return filtered;
    }, [channels, formData.rule_type]);

    // Получаем выбранный канал
    const selectedChannel = useMemo(() => {
        return channels?.find(c => c.id === formData.channel);
    }, [channels, formData.channel]);

    // Фильтруем шаблоны: для выбранного типа уведомления и типа канала
    const availableTemplates = useMemo(() => {
        if (!formData.notification_type || !selectedChannel) return [];
        return allTemplates?.filter(
            t => t.notification_type === formData.notification_type &&
                 t.channel_type === selectedChannel.code
        ) || [];
    }, [allTemplates, formData.notification_type, selectedChannel]);

    // Фильтруем контакты: только для выбранного типа канала
    const availableContacts = useMemo(() => {
        if (!selectedChannel) return [];
        return allContacts?.filter(
            c => c.channel_type === selectedChannel.code && c.is_active
        ) || [];
    }, [allContacts, selectedChannel]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Заголовок */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {rule ? 'Редактировать правило' : 'Создать правило'}
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
                    {/* Название правила */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Название правила <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Например: Отправка администратору"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Тип правила */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Тип правила <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleChange('rule_type', 'system')}
                                className={`px-4 py-3 text-sm font-medium border-2 rounded-lg transition-all ${
                                    formData.rule_type === 'system'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                }`}
                            >
                                <div className="font-semibold">Системное</div>
                                <div className="text-xs mt-1 opacity-75">Отправка пользователю</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleChange('rule_type', 'additional')}
                                className={`px-4 py-3 text-sm font-medium border-2 rounded-lg transition-all ${
                                    formData.rule_type === 'additional'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                }`}
                            >
                                <div className="font-semibold">Дополнительное</div>
                                <div className="text-xs mt-1 opacity-75">Отправка контактам</div>
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-600">
                            {formData.rule_type === 'system'
                                ? 'Системные уведомления отправляются самому пользователю, который совершил действие (только Email)'
                                : 'Дополнительные уведомления отправляются выбранным контактам из списка (любые каналы)'}
                        </p>
                    </div>

                    {/* Тип уведомления */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Тип уведомления <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.notification_type}
                            onChange={(e) => {
                                handleChange('notification_type', Number(e.target.value));
                                // Сбрасываем выбранный шаблон при смене типа уведомления
                                handleChange('default_template', 0);
                            }}
                            disabled={!!rule}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            required
                        >
                            <option value={0}>Выберите тип уведомления</option>
                            {activeTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                        {!!rule && (
                            <p className="mt-1 text-xs text-gray-600">
                                Тип уведомления нельзя изменить после создания
                            </p>
                        )}
                    </div>

                    {/* Канал */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Канал <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.channel}
                            onChange={(e) => {
                                handleChange('channel', Number(e.target.value));
                                // Сбрасываем выбранный шаблон и контакты при смене канала
                                handleChange('default_template', 0);
                                handleChange('contact_ids', []);
                            }}
                            disabled={!!rule}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            required
                        >
                            <option value={0}>Выберите канал</option>
                            {activeChannels.map(channel => (
                                <option key={channel.id} value={channel.id}>
                                    {channel.name} ({channel.code})
                                </option>
                            ))}
                        </select>
                        {!!rule && (
                            <p className="mt-1 text-xs text-gray-600">
                                Канал нельзя изменить после создания
                            </p>
                        )}
                    </div>

                    {/* Шаблон */}
                    {formData.notification_type > 0 && formData.channel > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Шаблон <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.default_template}
                                onChange={(e) => handleChange('default_template', Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value={0}>Выберите шаблон</option>
                                {availableTemplates.map(template => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                            {availableTemplates.length === 0 && (
                                <p className="mt-1 text-xs text-amber-600">
                                    ⚠️ Нет доступных шаблонов для этой комбинации типа уведомления и канала
                                </p>
                            )}
                        </div>
                    )}

                    {/* Информация о получателе для системных правил */}
                    {formData.rule_type === 'system' && formData.channel > 0 && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-blue-700">
                                        Получатель определяется автоматически - это пользователь, который совершил действие (например, зарегистрировался или сменил пароль). Уведомление отправляется на его email.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Контакты (только для дополнительных правил) */}
                    {formData.rule_type === 'additional' && formData.channel > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Контакты-получатели
                            </label>
                            {availableContacts.length > 0 ? (
                                <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                                    {availableContacts.map(contact => (
                                        <div key={contact.id}>
                                            <button
                                                type="button"
                                                onClick={() => toggleContact(contact.id)}
                                                className="flex items-center space-x-3 p-2 w-full hover:bg-gray-50 rounded transition-colors"
                                            >
                                                {formData.contact_ids.includes(contact.id) ? (
                                                    <FaCheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                ) : (
                                                    <FaSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                )}
                                                <div className="flex-1 text-left">
                                                    <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                                                    <div className="text-xs text-gray-500">{contact.value}</div>
                                                </div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-gray-300 rounded-lg p-4 text-center text-sm text-gray-500">
                                    Нет доступных контактов для выбранного канала
                                </div>
                            )}
                            <p className="mt-2 text-xs text-gray-600">
                                Выбрано контактов: {formData.contact_ids.length}
                            </p>
                        </div>
                    )}

                    {/* Включено/Выключено */}
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <button
                            type="button"
                            onClick={() => handleChange('is_enabled', !formData.is_enabled)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                formData.is_enabled
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            {formData.is_enabled ? (
                                <>
                                    <FaToggleOn className="text-xl" />
                                    <span>Включено</span>
                                </>
                            ) : (
                                <>
                                    <FaToggleOff className="text-xl" />
                                    <span>Выключено</span>
                                </>
                            )}
                        </button>
                        <p className="text-sm text-gray-600">
                            {formData.is_enabled
                                ? 'Правило активно, уведомления будут отправляться'
                                : 'Правило неактивно, уведомления не будут отправляться'}
                        </p>
                    </div>

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
                            <span>{rule ? 'Сохранить' : 'Создать'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
