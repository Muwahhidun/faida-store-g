import React from 'react';
import { VisibilityIndicatorProps, Category } from '../../../types/admin';

/**
 * Компонент индикатора видимости товара для пользователей
 * Показывает статус видимости и причины скрытия
 */
export const VisibilityIndicator: React.FC<VisibilityIndicatorProps> = ({
    product,
    categories,
    sources,
    minStock
}) => {
    // Пересчитываем статус видимости на основе текущего состояния
    const calculateVisibilityStatus = () => {
        const reasons: Array<{
            type: 'product' | 'category' | 'source' | 'stock';
            message: string;
            field: string;
        }> = [];

        // Проверка товара
        if (!product.is_visible_on_site) {
            reasons.push({
                type: 'product',
                message: 'Товар отключен',
                field: 'is_visible_on_site'
            });
        }

        // Проверка категории с каскадной логикой родителей
        const findCategoryByName = (categories: Category[], name: string): Category | null => {
            for (const category of categories) {
                if (category.name === name) {
                    return category;
                }
                if (category.children) {
                    const found = findCategoryByName(category.children, name);
                    if (found) return found;
                }
            }
            return null;
        };

        const findCategoryById = (categories: Category[], id: number): Category | null => {
            for (const category of categories) {
                if (category.id === id) {
                    return category;
                }
                if (category.children) {
                    const found = findCategoryById(category.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        // Функция для получения всех родителей категории
        const getCategoryParents = (category: Category): Category[] => {
            const parents: Category[] = [];
            let currentParentId = category.parent;

            while (currentParentId) {
                const parentCategory = findCategoryById(categories, currentParentId);
                if (parentCategory) {
                    parents.push(parentCategory);
                    currentParentId = parentCategory.parent;
                } else {
                    break;
                }
            }

            return parents;
        };

        // Проверка категории: используем непосредственно объект категории из продукта
        if (product.category) {
            // Проверяем саму категорию
            if (!product.category.is_visible_on_site) {
                reasons.push({
                    type: 'category',
                    message: `Категория "${product.category.name}" скрыта`,
                    field: 'category.is_visible_on_site'
                });
            } else {
                // Проверяем всех родителей
                const parents = getCategoryParents(product.category);
                const hiddenParent = parents.find(parent => !parent.is_visible_on_site);

                if (hiddenParent) {
                    reasons.push({
                        type: 'category',
                        message: `Скрыта родительская категория "${hiddenParent.name}"`,
                        field: 'category.parent.is_visible_on_site'
                    });
                }
            }
        }

        // Проверка источника (получаем из текущих данных sources)
        const currentSource = sources.find(src => src.name === product.source_name);
        if (currentSource) {
            if (!currentSource.is_active) {
                reasons.push({
                    type: 'source',
                    message: `Источник "${currentSource.name}" неактивен`,
                    field: 'source.is_active'
                });
            } else if (!currentSource.show_on_site) {
                reasons.push({
                    type: 'source',
                    message: `Источник "${currentSource.name}" скрыт с сайта`,
                    field: 'source.show_on_site'
                });
            }
        }

        // Проверка остатков (используем текущее значение minStock)
        if (product.stock_quantity < minStock) {
            reasons.push({
                type: 'stock',
                message: `Остаток (${product.stock_quantity}) меньше минимального (${minStock})`,
                field: 'stock_quantity'
            });
        }

        return {
            is_visible_to_users: reasons.length === 0,
            reasons
        };
    };

    const visibilityStatus = calculateVisibilityStatus();

    if (visibilityStatus.is_visible_to_users) {
        return (
            <div className="flex items-center space-x-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Видим пользователям
                </span>
            </div>
        );
    }

    const getCategoryReasons = () => visibilityStatus.reasons.filter(r => r.type === 'category');
    const getSourceReasons = () => visibilityStatus.reasons.filter(r => r.type === 'source');
    const getProductReasons = () => visibilityStatus.reasons.filter(r => r.type === 'product');
    const getStockReasons = () => visibilityStatus.reasons.filter(r => r.type === 'stock');

    const categoryReasons = getCategoryReasons();
    const sourceReasons = getSourceReasons();
    const productReasons = getProductReasons();
    const stockReasons = getStockReasons();

    return (
        <div className="space-y-1">
            {/* Основной индикатор */}
            <div className="flex items-center space-x-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Скрыт от пользователей
                </span>
            </div>

            {/* Детальные бейджи по причинам */}
            <div className="flex flex-wrap gap-1">
                {categoryReasons.map((reason, index) => {
                    const isParentCategory = reason.field === 'category.parent.is_visible_on_site';
                    const badgeText = isParentCategory ? 'Скрыт родитель' : 'Скрыта категория';
                    const badgeColor = isParentCategory ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800';

                    return (
                        <span
                            key={`category-${index}`}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${badgeColor}`}
                            title={reason.message}
                        >
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                {isParentCategory ? (
                                    // Иконка для родительской категории (стрелка вверх)
                                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                ) : (
                                    // Обычная иконка категории
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                )}
                            </svg>
                            {badgeText}
                        </span>
                    );
                })}

                {sourceReasons.map((reason, index) => (
                    <span
                        key={`source-${index}`}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800"
                        title={reason.message}
                    >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15.586 13H14a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        Отключен источник
                    </span>
                ))}

                {productReasons.map((reason, index) => (
                    <span
                        key={`product-${index}`}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        title={reason.message}
                    >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                        Отключен товар
                    </span>
                ))}

                {stockReasons.map((reason, index) => (
                    <span
                        key={`stock-${index}`}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                        title={reason.message}
                    >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Мало на складе
                    </span>
                ))}
            </div>

            {/* Детальный tooltip при наведении */}
            {visibilityStatus.reasons.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                    Причины: {visibilityStatus.reasons.map(r => r.message).join(', ')}
                </div>
            )}
        </div>
    );
};
