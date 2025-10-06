import React, { useState, useEffect } from 'react';
import { FaTrash, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { Source } from '../../../types/admin';

interface DeleteConfirmModalProps {
    source: Source;
    onClose: () => void;
    onConfirm: (id: number) => Promise<void>;
}

/**
 * Модальное окно подтверждения удаления источника
 */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ source, onClose, onConfirm }) => {
    const [deleting, setDeleting] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    // Обработчик ESC для закрытия модального окна
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !deleting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, deleting]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await onConfirm(source.id);
            onClose();
        } finally {
            setDeleting(false);
        }
    };

    const isConfirmValid = confirmText === source.name;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FaExclamationTriangle className="w-5 h-5 mr-2 text-red-600" />
                        Подтверждение удаления
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <FaExclamationTriangle className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Внимание!</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>Вы собираетесь удалить источник данных:</p>
                                    <p className="font-semibold mt-2">"{source.name}"</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">Это действие приведёт к:</h4>
                        <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                            <li>Удалению всех товаров из этого источника</li>
                            <li>Удалению категорий, принадлежащих источнику</li>
                            <li>Удалению всех изображений товаров</li>
                            <li>Удалению истории синхронизации</li>
                        </ul>
                        <p className="mt-3 text-sm font-medium text-yellow-800">
                            Это действие необратимо!
                        </p>
                    </div>

                    <div>
                        <label htmlFor="confirm-text" className="block text-sm font-medium text-gray-700 mb-2">
                            Для подтверждения введите название источника:
                        </label>
                        <input
                            type="text"
                            id="confirm-text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                            placeholder={source.name}
                            autoComplete="off"
                        />
                        {confirmText && !isConfirmValid && (
                            <p className="mt-1 text-xs text-red-600">Название не совпадает</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 mr-3"
                        disabled={deleting}
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        disabled={!isConfirmValid || deleting}
                    >
                        <FaTrash className="w-4 h-4 mr-2" />
                        {deleting ? 'Удаление...' : 'Удалить источник'}
                    </button>
                </div>
            </div>
        </div>
    );
};
