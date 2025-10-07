import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

interface EditPhoneModalProps {
    currentPhone: string;
    onSave: (phone: string) => void;
    onClose: () => void;
}

export const EditPhoneModal: React.FC<EditPhoneModalProps> = ({
    currentPhone,
    onSave,
    onClose
}) => {
    const [phone, setPhone] = useState(currentPhone);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(phone);
    };

    const formatPhone = (value: string): string => {
        const cleaned = value.replace(/\D/g, '');
        return cleaned;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setPhone(formatted);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Редактирование телефона</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Номер телефона
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={handlePhoneChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="+7 (999) 123-45-67"
                                autoFocus
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Введите номер телефона
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
