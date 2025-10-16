import React, { useState, useRef } from 'react';
import { FaTags, FaEdit, FaTrash, FaPlus, FaImage, FaSpinner, FaSave, FaTimes } from 'react-icons/fa';
import { Brand } from '../../../types/admin';
import { adminClient } from '../../../api/adminClient';

interface BrandsSectionProps {
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
    onBrandsUpdate: () => void;
}

/**
 * Секция управления брендами
 * Позволяет редактировать, добавлять и удалять бренды, управлять их логотипами
 */
export const BrandsSection: React.FC<BrandsSectionProps> = ({
    onError,
    onSuccess,
    onBrandsUpdate
}) => {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [creatingBrand, setCreatingBrand] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Форма для создания/редактирования бренда
    const [brandForm, setBrandForm] = useState({
        name: '',
        description: '',
        logo: null as File | null,
        logoPreview: '' as string | null
    });

    // Загрузка брендов
    const fetchBrands = async () => {
        try {
            setLoading(true);
            const response = await adminClient.get('/brands-management/');
            setBrands(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            onError('Ошибка при загрузке брендов');
            console.error('Ошибка загрузки брендов:', err);
        } finally {
            setLoading(false);
        }
    };

    // Начальная загрузка
    React.useEffect(() => {
        fetchBrands();
    }, []);

    // Обработка выбора файла
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Проверяем, что это изображение
            if (!file.type.startsWith('image/')) {
                onError('Пожалуйста, выберите файл изображения');
                return;
            }

            // Проверяем размер файла (максимум 5MB)
            if (file.size > 5 * 1024 * 1024) {
                onError('Размер файла не должен превышать 5MB');
                return;
            }

            setBrandForm(prev => ({
                ...prev,
                logo: file,
                logoPreview: URL.createObjectURL(file)
            }));
        }
    };

    // Сброс формы
    const resetForm = () => {
        setBrandForm({
            name: '',
            description: '',
            logo: null,
            logoPreview: null
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Начать редактирование бренда
    const startEditBrand = (brand: Brand) => {
        setEditingBrand(brand);
        setBrandForm({
            name: brand.name,
            description: brand.description,
            logo: null,
            logoPreview: brand.logo
        });
        setCreatingBrand(false);
    };

    // Начать создание бренда
    const startCreateBrand = () => {
        setEditingBrand(null);
        resetForm();
        setCreatingBrand(true);
    };

    // Отмена редактирования
    const cancelEdit = () => {
        setEditingBrand(null);
        setCreatingBrand(false);
        resetForm();
    };

    // Сохранение бренда
    const saveBrand = async () => {
        if (!brandForm.name.trim()) {
            onError('Название бренда обязательно для заполнения');
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', brandForm.name);
            formData.append('description', brandForm.description);
            
            if (brandForm.logo) {
                formData.append('logo', brandForm.logo);
            }

            if (editingBrand) {
                // Обновление существующего бренда
                await adminClient.patch(`/brands-management/${editingBrand.id}/`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                onSuccess('Бренд успешно обновлен');
            } else {
                // Создание нового бренда
                await adminClient.post('/brands-management/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                onSuccess('Бренд успешно создан');
            }

            cancelEdit();
            fetchBrands();
            onBrandsUpdate();
        } catch (err) {
            onError(editingBrand ? 'Ошибка при обновлении бренда' : 'Ошибка при создании бренда');
            console.error('Ошибка сохранения бренда:', err);
        } finally {
            setSaving(false);
        }
    };

    // Удаление бренда
    const deleteBrand = async (brand: Brand) => {
        if (!window.confirm(`Вы уверены, что хотите удалить бренд "${brand.name}"?`)) {
            return;
        }

        try {
            await adminClient.delete(`/brands-management/${brand.id}/`);
            onSuccess('Бренд успешно удален');
            fetchBrands();
            onBrandsUpdate();
        } catch (err) {
            onError('Ошибка при удалении бренда');
            console.error('Ошибка удаления бренда:', err);
        }
    };

    return (
        <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaTags className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900">Управление брендами</h2>
                        <p className="text-sm text-gray-600 truncate">Редактирование брендов и их логотипов</p>
                    </div>
                </div>

                <button
                    onClick={startCreateBrand}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors flex-shrink-0"
                >
                    <FaPlus className="w-4 h-4" />
                    <span>Добавить бренд</span>
                </button>
            </div>

            {/* Форма создания/редактирования */}
            {(editingBrand || creatingBrand) && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                            {editingBrand ? 'Редактирование бренда' : 'Создание нового бренда'}
                        </h3>
                        <button
                            onClick={cancelEdit}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Название бренда *
                            </label>
                            <input
                                type="text"
                                value={brandForm.name}
                                onChange={(e) => setBrandForm(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                                placeholder="Введите название бренда"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Логотип бренда
                            </label>
                            <div className="flex items-center space-x-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <FaImage className="w-4 h-4" />
                                    <span>Выбрать файл</span>
                                </button>
                                {brandForm.logo && (
                                    <span className="text-sm text-gray-600">
                                        {brandForm.logo.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {(brandForm.logoPreview || (editingBrand && editingBrand.logo)) && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Предпросмотр логотипа
                            </label>
                            <div className="w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-white">
                                <img
                                    src={brandForm.logoPreview || editingBrand?.logo || undefined}
                                    alt="Предпросмотр логотипа"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Описание бренда
                        </label>
                        <textarea
                            value={brandForm.description}
                            onChange={(e) => setBrandForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                            placeholder="Введите описание бренда (необязательно)"
                        />
                    </div>

                    <div className="mt-4 flex justify-end space-x-3">
                        <button
                            onClick={cancelEdit}
                            disabled={saving}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={saveBrand}
                            disabled={saving}
                            className="flex items-center space-x-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <FaSpinner className="w-4 h-4 animate-spin" />
                            ) : (
                                <FaSave className="w-4 h-4" />
                            )}
                            <span>{editingBrand ? 'Сохранить' : 'Создать'}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Список брендов */}
            <div className="space-y-3">
                {loading ? (
                    <div className="py-8 text-center">
                        <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
                        <p className="text-gray-600">Загрузка брендов...</p>
                    </div>
                ) : brands.length === 0 ? (
                    <div className="text-center py-8">
                        <FaTags className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Бренды не найдены</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {brands.map((brand) => (
                            <div key={brand.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start space-x-3">
                                    <div className="w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-white flex-shrink-0">
                                        {brand.logo ? (
                                            <img
                                                src={brand.logo}
                                                alt={brand.name}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                <FaImage className="w-6 h-6 text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 truncate">{brand.name}</h4>
                                        <p className="text-sm text-gray-500">Товаров: {brand.products_count}</p>
                                        {brand.description && (
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{brand.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-end space-x-2">
                                    <button
                                        onClick={() => startEditBrand(brand)}
                                        className="p-2 text-gray-400 hover:text-secondary-600 transition-colors"
                                        title="Редактировать бренд"
                                    >
                                        <FaEdit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteBrand(brand)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Удалить бренд"
                                    >
                                        <FaTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};