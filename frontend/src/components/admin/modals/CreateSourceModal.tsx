import React, { useState, useEffect } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { Switch } from '@headlessui/react';
import { Source } from '../../../types/admin';

interface CreateSourceModalProps {
    onClose: () => void;
    onSave: (source: Partial<Source>) => Promise<void>;
}

export const CreateSourceModal: React.FC<CreateSourceModalProps> = ({ onClose, onSave }) => {
    const [newSource, setNewSource] = useState<Partial<Source>>({
        name: '',
        code: '',
        is_active: true,
        show_on_site: true,
        json_file_path: '',
        media_dir_path: '',
    });
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
            await onSave(newSource);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FaPlus className="w-5 h-5 mr-2 text-success-600" />
                        Создание нового источника данных
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="source-name" className="block text-sm font-medium text-gray-700">Название источника</label>
                        <input
                            type="text"
                            id="source-name"
                            value={newSource.name}
                            onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-success-500 focus:border-success-500 sm:text-sm"
                            placeholder="Основная база ПП"
                        />
                    </div>
                    <div>
                        <label htmlFor="source-code" className="block text-sm font-medium text-gray-700">Код источника</label>
                        <input
                            type="text"
                            id="source-code"
                            value={newSource.code}
                            onChange={(e) => setNewSource({ ...newSource, code: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-success-500 focus:border-success-500 sm:text-sm"
                            placeholder="pp"
                        />
                    </div>
                    <div>
                        <label htmlFor="json-path" className="block text-sm font-medium text-gray-700">Путь к JSON файлу</label>
                        <input
                            type="text"
                            id="json-path"
                            value={newSource.json_file_path}
                            onChange={(e) => setNewSource({ ...newSource, json_file_path: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-success-500 focus:border-success-500 sm:text-sm"
                            placeholder="pp/export.json"
                        />
                    </div>
                    <div>
                        <label htmlFor="media-path" className="block text-sm font-medium text-gray-700">Путь к папке с медиа</label>
                        <input
                            type="text"
                            id="media-path"
                            value={newSource.media_dir_path}
                            onChange={(e) => setNewSource({ ...newSource, media_dir_path: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-success-500 focus:border-success-500 sm:text-sm"
                            placeholder="pp/export_media"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center justify-between sm:justify-start">
                            <label htmlFor="is-active" className="text-sm font-medium text-gray-700 mr-3">Активен</label>
                            <Switch
                                checked={newSource.is_active ?? true}
                                onChange={(checked) => setNewSource({ ...newSource, is_active: checked })}
                                className={`${newSource.is_active ? 'bg-success-600' : 'bg-gray-200'
                                    } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success-500`}
                            >
                                <span
                                    className={`${newSource.is_active ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                                />
                            </Switch>
                        </div>
                        <div className="flex items-center justify-between sm:justify-start">
                            <label htmlFor="show-on-site" className="text-sm font-medium text-gray-700 mr-3">Показывать на сайте</label>
                            <Switch
                                checked={newSource.show_on_site ?? true}
                                onChange={(checked) => setNewSource({ ...newSource, show_on_site: checked })}
                                className={`${newSource.show_on_site ? 'bg-success-600' : 'bg-gray-200'
                                    } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success-500`}
                            >
                                <span
                                    className={`${newSource.show_on_site ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                                />
                            </Switch>
                        </div>
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
                        className="px-4 py-2 text-sm font-medium text-white bg-success-600 hover:bg-success-700 rounded-lg disabled:opacity-50"
                        disabled={saving}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
};
