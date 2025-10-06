import React from 'react';
import { Category, Source } from '../../../types/admin';

interface CategoriesSectionProps {
    categories: Category[];
    sources: Source[];
    onCategoriesUpdate: () => void;
}

/**
 * Секция управления категориями
 * Отображает иерархию категорий, позволяет управлять видимостью и порядком
 */
export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
    categories,
    sources,
    onCategoriesUpdate
}) => {
    // TODO: Перенести код из AdminPanelPage
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Управление категориями</h3>
            <p className="text-gray-500">Секция в разработке... Код будет перенесён из AdminPanelPage</p>
            <div className="mt-4">
                <p className="text-sm">Категорий: {categories.length}</p>
            </div>
        </div>
    );
};
