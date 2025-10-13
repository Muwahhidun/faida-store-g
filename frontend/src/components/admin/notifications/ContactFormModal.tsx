/**
 * Модальное окно для создания/редактирования контакта уведомлений
 */

import React, { useState, useEffect } from 'react';
import { FaTimes, FaEnvelope, FaWhatsapp, FaTelegram } from 'react-icons/fa';
import type { NotificationContact } from '../../../types/notifications';
import { CustomSelect, SelectOption } from '../../CustomSelect';

interface ContactFormModalProps {
    contact: NotificationContact | null;
    onClose: () => void;
    onSubmit: (data: Partial<NotificationContact>) => void;
    isSubmitting: boolean;
}

const CHANNEL_TYPE_OPTIONS = [
    { value: 'telegram', label: 'Telegram', icon: '✈️', emoji: '📱' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '💬', emoji: '📞' },
    { value: 'email', label: 'Email', icon: '📧', emoji: '✉️' },
] as const;

// Опции для CustomSelect с эмодзи
const SELECT_OPTIONS: SelectOption[] = CHANNEL_TYPE_OPTIONS.map(opt => ({
    value: opt.value,
    label: `${opt.icon} ${opt.label}`
}));

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
    contact,
    onClose,
    onSubmit,
    isSubmitting
}) => {
    const [formData, setFormData] = useState<{
        name: string;
        channel_type: 'telegram' | 'whatsapp' | 'email' | '';
        value: string;
        is_active: boolean;
    }>({
        name: '',
        channel_type: '',
        value: '',
        is_active: true
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

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

    useEffect(() => {
        if (contact) {
            setFormData({
                name: contact.name,
                channel_type: contact.channel_type,
                value: contact.value,
                is_active: contact.is_active
            });
        }
    }, [contact]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Введите название контакта';
        }

        if (!formData.channel_type) {
            newErrors.channel_type = 'Выберите тип канала';
        }

        if (!formData.value.trim()) {
            newErrors.value = 'Введите контактное значение';
        } else {
            // Валидация в зависимости от типа канала
            if (formData.channel_type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.value)) {
                    newErrors.value = 'Введите корректный email адрес';
                }
            } else if (formData.channel_type === 'whatsapp') {
                // Проверяем формат телефона (только цифры, минимум 10)
                const phoneRegex = /^\d{10,}$/;
                if (!phoneRegex.test(formData.value.replace(/[^\d]/g, ''))) {
                    newErrors.value = 'Введите корректный номер телефона (минимум 10 цифр)';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        onSubmit(formData);
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        // Закрываем только если клик был на overlay, а не на содержимое модалки
        if (e.target === e.currentTarget && !isSubmitting) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleOverlayClick}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Заголовок */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {contact ? 'Редактировать контакт' : 'Добавить контакт'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Форма */}
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    {/* Название */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Название <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Например: Администратор WhatsApp"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>

                    {/* Тип канала */}
                    <div>
                        <CustomSelect
                            label="Тип канала *"
                            value={formData.channel_type}
                            onChange={(value) => setFormData({ ...formData, channel_type: value as any })}
                            options={SELECT_OPTIONS}
                            placeholder="Выберите тип канала"
                            error={errors.channel_type}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Выберите тип канала для отправки уведомлений
                        </p>
                    </div>

                    {/* Контактное значение */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {formData.channel_type === 'email' && 'Email адрес'}
                            {formData.channel_type === 'whatsapp' && 'Номер телефона'}
                            {formData.channel_type === 'telegram' && 'Telegram Chat ID'}
                            {!formData.channel_type && 'Контактное значение'}
                            <span className="text-red-500"> *</span>
                        </label>
                        <input
                            type={formData.channel_type === 'email' ? 'email' : 'text'}
                            value={formData.value}
                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 ${
                                errors.value ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder={
                                formData.channel_type === 'email'
                                    ? 'admin@example.com'
                                    : formData.channel_type === 'whatsapp'
                                    ? '79991234567'
                                    : formData.channel_type === 'telegram'
                                    ? '198916951'
                                    : 'Контактное значение'
                            }
                        />
                        {errors.value && (
                            <p className="mt-1 text-sm text-red-500">{errors.value}</p>
                        )}
                        {formData.channel_type === 'whatsapp' && (
                            <p className="mt-1 text-xs text-gray-500">
                                Формат: код страны + номер без пробелов (например: 79991234567)
                            </p>
                        )}
                        {formData.channel_type === 'telegram' && (
                            <p className="mt-1 text-xs text-gray-500">
                                Chat ID можно узнать у бота @userinfobot в Telegram
                            </p>
                        )}
                    </div>

                    {/* Активность */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                            Активен (уведомления будут отправляться на этот контакт)
                        </label>
                    </div>
                </form>

                {/* Футер */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={isSubmitting}
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-secondary-500 rounded-lg hover:bg-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Сохранение...' : contact ? 'Сохранить' : 'Создать'}
                    </button>
                </div>
            </div>
        </div>
    );
};
