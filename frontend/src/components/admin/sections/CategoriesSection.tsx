import React, { useState } from 'react';
import { FaList, FaDatabase, FaExpandArrowsAlt, FaCompressArrowsAlt, FaChevronRight, FaChevronDown, FaSpinner, FaEdit } from 'react-icons/fa';
import { Category, Source } from '../../../types/admin';
import { adminClient } from '../../../api/adminClient';
import { EditCategoryModal } from '../modals';

interface CategoriesSectionProps {
    categories: Category[];
    sources: Source[];
    loading: boolean;
    onCategoriesUpdate: () => void;
    onError: (message: string) => void;
    onSuccess: (message: string) => void;
}

/**
 * Секция управления категориями
 * Отображает иерархию категорий, позволяет управлять видимостью и порядком
 */
export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
    categories,
    sources,
    loading,
    onCategoriesUpdate,
    onError,
    onSuccess
}) => {
    const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(new Set());
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Функции для работы с категориями
    const toggleCategoryCollapse = (categoryId: number) => {
        setCollapsedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const expandAllCategories = () => {
        setCollapsedCategories(new Set());
    };

    const collapseAllCategories = () => {
        const allCategoryIds = new Set<number>();
        const collectIds = (cats: Category[]) => {
            cats.forEach(cat => {
                if (cat.children && cat.children.length > 0) {
                    allCategoryIds.add(cat.id);
                    collectIds(cat.children);
                }
            });
        };
        collectIds(categories);
        setCollapsedCategories(allCategoryIds);
    };

    const handleCategoryToggle = async (category: Category) => {
        try {
            const updatedCategory = { ...category, is_visible_on_site: !category.is_visible_on_site };
            await adminClient.patch(`/categories-management/${category.id}/`, {
                is_visible_on_site: updatedCategory.is_visible_on_site,
            });
            onSuccess(`Категория "${category.name}" ${updatedCategory.is_visible_on_site ? 'включена' : 'скрыта'}.`);
            onCategoriesUpdate();
        } catch (err) {
            onError('Ошибка при обновлении категории.');
        }
    };

    const handleCategorySave = async (id: number, data: Partial<Category>) => {
        try {
            await adminClient.patch(`/categories-management/${id}/`, data);
            onSuccess('Категория успешно обновлена.');
            onCategoriesUpdate();
        } catch (err) {
            onError('Ошибка при сохранении категории.');
            throw err;
        }
    };

    const getCategoriesGroupedBySourcesHierarchical = () => {
        const grouped: { [key: string]: Category[] } = {};

        // Функция для получения всех источников из категории и её подкатегорий
        const getCategorySources = (category: Category): Array<{id: number; name: string; code: string}> => {
            let allSources = [...category.sources];
            if (category.children) {
                category.children.forEach(child => {
                    allSources.push(...getCategorySources(child));
                });
            }
            // Убираем дубликаты
            const uniqueSources = allSources.filter((source, index, self) =>
                index === self.findIndex(s => s.id === source.id)
            );
            return uniqueSources;
        };

        categories.forEach(category => {
            const categorySources = getCategorySources(category);

            if (categorySources.length === 0) {
                // Категории без товаров
                if (!grouped['no_source']) {
                    grouped['no_source'] = [];
                }
                grouped['no_source'].push(category);
            } else {
                // Группируем по источникам
                categorySources.forEach(source => {
                    const key = `${source.code} (${source.name})`;
                    if (!grouped[key]) {
                        grouped[key] = [];
                    }
                    // Проверяем, чтобы не добавить категорию дважды
                    if (!grouped[key].find(c => c.id === category.id)) {
                        grouped[key].push(category);
                    }
                });
            }
        });

        return grouped;
    };

    const renderCategoryTree = (category: Category, level: number = 0): JSX.Element => {
        const hasChildren = category.children && category.children.length > 0;
        const isCollapsed = collapsedCategories.has(category.id);

        return (
            <div key={category.id}>
                {/* Родительская категория */}
                <div
                    className={`flex items-center justify-between p-2 rounded hover:bg-gray-100 transition-colors duration-200 ${
                        level === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                    style={{ marginLeft: `${level * 20}px` }}
                >
                    <div className="flex items-center space-x-3">
                        {/* Кнопка сворачивания/разворачивания */}
                        {hasChildren ? (
                            <button
                                onClick={() => toggleCategoryCollapse(category.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title={isCollapsed ? 'Развернуть' : 'Свернуть'}
                            >
                                {isCollapsed ? (
                                    <FaChevronRight className="w-3 h-3" />
                                ) : (
                                    <FaChevronDown className="w-3 h-3" />
                                )}
                            </button>
                        ) : (
                            <div className="w-5 h-5" /> // Пустое место для выравнивания
                        )}

                        <div className={`w-2 h-2 rounded-full ${
                            category.is_visible_on_site ? 'bg-purple-500' : 'bg-gray-300'
                        }`}></div>
                        <div className="flex-1">
                            <div className="flex items-center flex-wrap gap-1">
                                <span className={`text-sm font-medium ${
                                    level === 0 ? 'text-gray-900' : 'text-gray-700'
                                } ${
                                    category.is_active ? '' : 'text-gray-400'
                                }`}>
                                    {level > 0 && '└ '}{category.category_visible_name || category.name}
                                    {hasChildren && (
                                        <span className="ml-2 text-xs text-gray-400">
                                            ({category.children.length})
                                        </span>
                                    )}
                                </span>
                                <button
                                    onClick={() => setEditingCategory(category)}
                                    className="p-1 text-gray-400 hover:text-secondary-600 transition-colors"
                                    title="Редактировать название"
                                >
                                    <FaEdit className="w-3.5 h-3.5" />
                                </button>
                                {category.display_name && (
                                    <span className="text-xs text-gray-500">
                                        (из 1С: <span className="italic">{category.name}</span>)
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">
                                Товаров: {category.products_count}
                                {!category.is_active && ' (неактивна)'}
                                {category.sources.length > 1 && ` • Источников: ${category.sources.length}`}
                            </div>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={category.is_visible_on_site}
                            onChange={() => handleCategoryToggle(category)}
                            className="sr-only peer"
                            disabled={!category.is_active}
                        />
                        <div className={`w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                            category.is_active ? 'peer-checked:bg-primary-600' : 'opacity-50 cursor-not-allowed'
                        }`}></div>
                    </label>
                </div>

                {/* Дочерние категории */}
                {!isCollapsed && category.children && category.children.map(child => renderCategoryTree(child, level + 1))}
            </div>
        );
    };

    return (
        <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaList className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900">Управление категориями</h2>
                        <p className="text-sm text-gray-600 truncate">Отключение категорий от показа на сайте</p>
                    </div>
                </div>

                {/* Кнопки управления сворачиванием */}
                <div className="flex items-center justify-center sm:justify-start space-x-2 flex-shrink-0">
                    <button
                        onClick={expandAllCategories}
                        className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Развернуть все категории"
                    >
                        <FaExpandArrowsAlt className="w-4 h-4" />
                        <span className="hidden sm:inline">Развернуть все</span>
                    </button>
                    <button
                        onClick={collapseAllCategories}
                        className="flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Свернуть все категории"
                    >
                        <FaCompressArrowsAlt className="w-4 h-4" />
                        <span className="hidden sm:inline">Свернуть все</span>
                    </button>
                </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="py-8 text-center">
                        <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
                        <p className="text-gray-600">Загрузка категорий...</p>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-8">
                        <FaList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Категории не найдены</p>
                    </div>
                ) : (
                    Object.entries(getCategoriesGroupedBySourcesHierarchical()).map(([sourceKey, categoryList]) => (
                        <div key={sourceKey} className="border border-gray-200 rounded-lg p-3">
                            {/* Заголовок группы */}
                            <div className="flex items-center mb-3 pb-2 border-b border-gray-100">
                                <FaDatabase className="w-4 h-4 text-primary-600 mr-2" />
                                <h4 className="font-medium text-gray-800">
                                    {sourceKey === 'no_source' ? 'Категории без товаров' : sourceKey}
                                </h4>
                                <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {categoryList.length} кат.
                                </span>
                            </div>

                            {/* Иерархический список категорий */}
                            <div className="space-y-1">
                                {categoryList.map(category => renderCategoryTree(category))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Модальное окно редактирования категории */}
            {editingCategory && (
                <EditCategoryModal
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onSave={handleCategorySave}
                />
            )}
        </div>
    );
};
