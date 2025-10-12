/**
 * Модальное окно для создания/редактирования контакта уведомлений
 */

import React, { useState, useEffect } from 'react';
import { FaTimes, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import type { NotificationContact, NotificationChannel } from '../../../types/notifications';

interface ContactFormModalProps {
    contact: NotificationContact | null;
    channels: NotificationChannel[];
    onClose: () => void;
    onSubmit: (data: Partial<NotificationContact>) => void;
    isSubmitting: boolean;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
    contact,
    channels,
    onClose,
    onSubmit,
    isSubmitting
}) => {
    const [formData, setFormData] = useState({
        name: '',
        channel: 0,
        value: '',
        is_active: true
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (contact) {
            setFormData({
                name: contact.name,
                channel: contact.channel,
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

        if (!formData.channel) {
            newErrors.channel = 'Выберите канал';
        }

        if (!formData.value.trim()) {
            newErrors.value = 'Введите контактное значение';
        } else {
            // Валидация в зависимости от канала
            const selectedChannel = channels.find(c => c.id === formData.channel);
            if (selectedChannel?.code === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.value)) {
                    newErrors.value = 'Введите корректный email адрес';
                }
            } else if (selectedChannel?.code === 'whatsapp') {
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

    const selectedChannel = channels.find(c => c.id === formData.channel);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Например: Администратор WhatsApp"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>

                    {/* Канал */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Канал <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.channel}
                            onChange={(e) => setFormData({ ...formData, channel: parseInt(e.target.value) })}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.channel ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value={0}>Выберите канал</option>
                            {channels.map((channel) => (
                                <option key={channel.id} value={channel.id}>
                                    {channel.code === 'email' && '📧 '}
                                    {channel.code === 'whatsapp' && '💬 '}
                                    {channel.code === 'telegram' && '✈️ '}
                                    {channel.name}
                                </option>
                            ))}
                        </select>
                        {errors.channel && (
                            <p className="mt-1 text-sm text-red-500">{errors.channel}</p>
                        )}
                    </div>

                    {/* Контактное значение */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {selectedChannel?.code === 'email' && 'Email адрес'}
                            {selectedChannel?.code === 'whatsapp' && 'Номер телефона'}
                            {selectedChannel?.code === 'telegram' && 'Telegram Chat ID'}
                            {!selectedChannel && 'Контактное значение'}
                            <span className="text-red-500"> *</span>
                        </label>
                        <input
                            type={selectedChannel?.code === 'email' ? 'email' : 'text'}
                            value={formData.value}
                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.value ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder={
                                selectedChannel?.code === 'email'
                                    ? 'admin@example.com'
                                    : selectedChannel?.code === 'whatsapp'
                                    ? '79991234567'
                                    : selectedChannel?.code === 'telegram'
                                    ? '198916951'
                                    : 'Контактное значение'
                            }
                        />
                        {errors.value && (
                            <p className="mt-1 text-sm text-red-500">{errors.value}</p>
                        )}
                        {selectedChannel?.code === 'whatsapp' && (
                            <p className="mt-1 text-xs text-gray-500">
                                Формат: код страны + номер без пробелов (например: 79991234567)
                            </p>
                        )}
                        {selectedChannel?.code === 'telegram' && (
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
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Сохранение...' : contact ? 'Сохранить' : 'Создать'}
                    </button>
                </div>
            </div>
        </div>
    );
};
