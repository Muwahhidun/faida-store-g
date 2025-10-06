import React from 'react';
import { Product, Category, Source, GlobalSettings } from '../../../types/admin';

interface ProductsSectionProps {
    products: Product[];
    categories: Category[];
    sources: Source[];
    globalSettings: GlobalSettings;
    minStock: number;
    onProductsUpdate: () => void;
}

/**
 * Секция управления товарами
 * Отображает список товаров с фильтрами, позволяет управлять видимостью и настройками
 */
export const ProductsSection: React.FC<ProductsSectionProps> = ({
    products,
    categories,
    sources,
    globalSettings,
    minStock,
    onProductsUpdate
}) => {
    // TODO: Перенести код из AdminPanelPage
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Управление товарами</h3>
            <p className="text-gray-500">Секция в разработке... Код будет перенесён из AdminPanelPage</p>
            <div className="mt-4">
                <p className="text-sm">Товаров: {products.length}</p>
            </div>
        </div>
    );
};
