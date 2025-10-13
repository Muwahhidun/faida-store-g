import React, { useState, useEffect } from 'react';
import { FaEdit, FaTimes } from 'react-icons/fa';
import { Category } from '../../../types/admin';

interface EditCategoryModalProps {
    category: Category;
    onClose: () => void;
    onSave: (id: number, data: Partial<Category>) => Promise<void>;
}

/**
 * Модальное окно редактирования альтернативного названия категории
 */
export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ category, onClose, onSave }) => {
    const [displayName, setDisplayName] = useState(category.display_name || '');
    const [saving, setSaving] = useState(false);

    // Обработчик ESC для закрытия модального окна
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !saving) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, saving]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(category.id, { display_name: displayName });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    // Определяем что будет показано на сайте
    const effectiveName = displayName.trim() || category.name;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FaEdit className="w-5 h-5 mr-2 text-secondary-600" />
                        Редактирование категории
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={saving}
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Название из 1С (только для чтения) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Название из 1С (автоматически обновляется)
                        </label>
                        <input
                            type="text"
                            value={category.name}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Это название приходит из 1С и обновляется автоматически при синхронизации
                        </p>
                    </div>

                    {/* Альтернативное название для сайта */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Название для показа на сайте
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Оставьте пустым для использования названия из 1С"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Если заполнено, это название будет показано вместо названия из 1С
                        </p>
                    </div>

                    {/* Предпросмотр */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                            👁️ Предпросмотр
                        </p>
                        <p className="text-sm text-blue-700">
                            На сайте будет показано: <strong>"{effectiveName}"</strong>
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 mr-3"
                        disabled={saving}
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-secondary-500 hover:bg-secondary-600 rounded-lg disabled:opacity-50"
                        disabled={saving}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
};
