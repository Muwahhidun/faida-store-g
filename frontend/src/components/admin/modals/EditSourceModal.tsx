import React, { useState, useEffect } from 'react';
import { FaEdit, FaTimes } from 'react-icons/fa';
import { Switch } from '@headlessui/react';
import { Source } from '../../../types/admin';

interface EditSourceModalProps {
    source: Source;
    onClose: () => void;
    onSave: (id: number, source: Partial<Source>) => Promise<void>;
}

/**
 * Модальное окно редактирования источника данных
 */
export const EditSourceModal: React.FC<EditSourceModalProps> = ({ source, onClose, onSave }) => {
    const [editedSource, setEditedSource] = useState<Partial<Source>>({
        name: source.name,
        code: source.code,
        is_active: source.is_active,
        show_on_site: source.show_on_site,
        json_file_path: source.json_file_path,
        media_dir_path: source.media_dir_path,
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(source.id, editedSource);
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
                        <FaEdit className="w-5 h-5 mr-2 text-blue-600" />
                        Редактирование источника данных
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
                        <label htmlFor="edit-source-name" className="block text-sm font-medium text-gray-700">Название источника</label>
                        <input
                            type="text"
                            id="edit-source-name"
                            value={editedSource.name}
                            onChange={(e) => setEditedSource({ ...editedSource, name: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Основная база ПП"
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-source-code" className="block text-sm font-medium text-gray-700">Код источника</label>
                        <input
                            type="text"
                            id="edit-source-code"
                            value={editedSource.code}
                            onChange={(e) => setEditedSource({ ...editedSource, code: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="pp"
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-json-path" className="block text-sm font-medium text-gray-700">Путь к JSON файлу</label>
                        <input
                            type="text"
                            id="edit-json-path"
                            value={editedSource.json_file_path}
                            onChange={(e) => setEditedSource({ ...editedSource, json_file_path: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="pp/export.json"
                        />
                    </div>
                    <div>
                        <label htmlFor="edit-media-path" className="block text-sm font-medium text-gray-700">Путь к папке с медиа</label>
                        <input
                            type="text"
                            id="edit-media-path"
                            value={editedSource.media_dir_path}
                            onChange={(e) => setEditedSource({ ...editedSource, media_dir_path: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="pp/export_media"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <label htmlFor="edit-is-active" className="text-sm font-medium text-gray-700 mr-3">Активен</label>
                            <Switch
                                checked={editedSource.is_active ?? true}
                                onChange={(checked) => setEditedSource({ ...editedSource, is_active: checked })}
                                className={`${editedSource.is_active ? 'bg-blue-600' : 'bg-gray-200'
                                    } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                            >
                                <span
                                    className={`${editedSource.is_active ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                                />
                            </Switch>
                        </div>
                        <div className="flex items-center">
                            <label htmlFor="edit-show-on-site" className="text-sm font-medium text-gray-700 mr-3">Показывать на сайте</label>
                            <Switch
                                checked={editedSource.show_on_site ?? true}
                                onChange={(checked) => setEditedSource({ ...editedSource, show_on_site: checked })}
                                className={`${editedSource.show_on_site ? 'bg-blue-600' : 'bg-gray-200'
                                    } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                            >
                                <span
                                    className={`${editedSource.show_on_site ? 'translate-x-6' : 'translate-x-1'
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
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                        disabled={saving}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
};
