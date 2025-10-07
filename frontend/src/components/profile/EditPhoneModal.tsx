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
    // Извлекаем только цифры из текущего телефона (без +7)
    const extractDigits = (phone: string): string => {
        const digits = phone.replace(/\D/g, '');
        // Убираем 7 в начале если есть
        return digits.startsWith('7') ? digits.slice(1) : digits;
    };

    const [phone, setPhone] = useState(extractDigits(currentPhone));

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
        // Сохраняем с +7
        onSave(`+7${phone.replace(/\D/g, '')}`);
    };

    const formatPhoneDisplay = (value: string): string => {
        // Убираем все нецифровые символы
        const cleaned = value.replace(/\D/g, '');

        // Ограничиваем 10 цифрами
        const limited = cleaned.slice(0, 10);

        // Форматируем: (XXX) XXX-XX-XX
        if (limited.length === 0) return '';
        if (limited.length <= 3) return `(${limited}`;
        if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
        if (limited.length <= 8) return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
        return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6, 8)}-${limited.slice(8)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Убираем все нецифровые символы для хранения
        const cleaned = value.replace(/\D/g, '');
        setPhone(cleaned.slice(0, 10)); // Ограничиваем 10 цифрами
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
                            <div className="flex items-center">
                                <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-700 text-sm font-medium">
                                    +7
                                </span>
                                <input
                                    type="tel"
                                    value={formatPhoneDisplay(phone)}
                                    onChange={handlePhoneChange}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="(928) 557-57-74"
                                    autoFocus
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Введите номер в формате (XXX) XXX-XX-XX
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
