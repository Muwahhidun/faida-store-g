/**
 * Компонент боковой панели с категориями для фильтрации товаров.
 */

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Category {
  id: number;
  name: string;
  display_name: string;
  category_visible_name: string;
  slug: string;
  parent: number | null;
  children?: Category[];
  products_count?: number;
}

interface CategorySidebarProps {
  selectedCategoryId?: number | null;
  onCategorySelect: (categoryId: number | null) => void;
  className?: string;
}

const fetchCategories = async (): Promise<Category[]> => {
  const startTime = performance.now();
  console.log('🚀 Начинаем загрузку категорий...');
  
  try {
    const response = await fetch('http://localhost:8000/api/categories/tree/');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    const endTime = performance.now();
    console.log(`✅ Категории загружены за ${(endTime - startTime).toFixed(0)}мс, получено ${data.length} категорий`);
    
    return data;
  } catch (error) {
    const endTime = performance.now();
    console.error(`❌ Ошибка загрузки категорий за ${(endTime - startTime).toFixed(0)}мс:`, error);
    throw error;
  }
};

const CategorySidebar: React.FC<CategorySidebarProps> = ({ 
  selectedCategoryId, 
  onCategorySelect, 
  className = '' 
}) => {
  // Восстанавливаем развёрнутые ветки из sessionStorage, чтобы не сворачивались при перерисовках
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(() => {
    try {
      const raw = sessionStorage.getItem('cat_expanded');
      if (raw) {
        const ids = JSON.parse(raw) as number[];
        return new Set(ids);
      }
    } catch {}
    return new Set();
  });

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 минут — не рефетчим на каждый клик
    cacheTime: 30 * 60 * 1000, // 30 минут кэша
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev, // оставляем предыдущие данные, чтобы убрать моргание
  });

  // Сохраняем состояние развёрнутости между перерисовками/переходами
  useEffect(() => {
    try {
      sessionStorage.setItem('cat_expanded', JSON.stringify(Array.from(expandedCategories)));
    } catch {}
  }, [expandedCategories]);

  // Авторазворачивание пути до выбранной категории, когда пришли новые категории
  useEffect(() => {
    if (!selectedCategoryId || !categories || categories.length === 0) return;

    // Ищем путь от корня до выбранной категории (массив id родителей)
    const findPath = (nodes: Category[], targetId: number, path: number[] = []): number[] | null => {
      for (const n of nodes) {
        const nextPath = [...path, n.id];
        if (n.id === targetId) return nextPath;
        if (n.children && n.children.length) {
          const res = findPath(n.children, targetId, nextPath);
          if (res) return res;
        }
      }
      return null;
    };

    const p = findPath(categories, selectedCategoryId);
    if (p && p.length) {
      // Разворачиваем всех родителей (кроме самой выбранной, чтобы не мешать ручному управлению)
      const parents = new Set(expandedCategories);
      p.slice(0, -1).forEach((id) => parents.add(id));
      setExpandedCategories(parents);
    }
  }, [selectedCategoryId, categories]);

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategoryId === category.id;

    return (
      <div key={category.id} className="mb-1">
        <div
          className={`flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-colors ${
            isSelected
              ? 'bg-secondary-100 text-primary-900 font-semibold shadow-sm'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          style={{ paddingLeft: `${0.75 + level * 1}rem` }}
          onClick={() => onCategorySelect(category.id)}
          title={`${category.category_visible_name} (${category.products_count || 0} товаров)`}
        >
          <div className="flex items-center flex-1 min-w-0">
            <span
              className="text-sm truncate font-medium"
              title={category.category_visible_name}
            >
              {category.category_visible_name}
            </span>
            {category.products_count && (
              <span className={`ml-2 text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                isSelected ? 'bg-secondary-200 text-primary-900' : 'text-gray-500 bg-gray-200'
              }`}>
                {category.products_count}
              </span>
            )}
          </div>
          
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category.id);
              }}
              className="ml-2 p-1 hover:bg-gray-200 rounded"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {category.children?.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Категории</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Категории</h3>
        <div className="text-center text-gray-500">
          <p className="text-sm">Ошибка загрузки категорий</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-4 border-b border-primary-100">
        <h3 className="text-lg font-semibold text-primary-900">Категории</h3>
      </div>

      <div className="p-4">
        {/* Кнопка "Все товары" */}
        <div
          className={`flex items-center py-2 px-3 mb-3 rounded-md cursor-pointer transition-all duration-200 ${
            selectedCategoryId === null
              ? 'bg-secondary-100 text-primary-900 font-semibold shadow-sm'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          onClick={() => onCategorySelect(null)}
        >
          <span className="text-sm">Все товары</span>
        </div>

        {/* Список категорий */}
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {categories.map(category => renderCategory(category))}
        </div>
      </div>
    </div>
  );
};

export default CategorySidebar;