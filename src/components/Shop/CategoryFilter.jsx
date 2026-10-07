import React, { useMemo } from 'react';
import { useProducts, mapCategoryToCode } from '../../context/ProductContext';
import { categories as DEFAULT_CATEGORIES } from '../../data/productsData';

export const CategoryFilter = ({ activeCategory, onSelectCategory }) => {
  const { categories, activeProducts } = useProducts();

  const allCategories = useMemo(() => {
    const categoryMap = new Map();
    DEFAULT_CATEGORIES.forEach((c) => categoryMap.set(c.id, c));

    if (Array.isArray(activeProducts)) {
      activeProducts.forEach((p) => {
        const code = p.cat || mapCategoryToCode(p.category);
        if (code && !categoryMap.has(code)) {
          categoryMap.set(code, {
            id: code,
            label: p.category || (code.charAt(0).toUpperCase() + code.slice(1)),
          });
        }
      });
    }

    return Array.from(categoryMap.values());
  }, [categories, activeProducts]);

  return (
    <div className="filters">
      {allCategories.map((cat) => (
        <button
          key={cat.id}
          className={`filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
          onClick={() => onSelectCategory(cat.id)}
        >
          {cat.label || cat.name}
        </button>
      ))}
    </div>
  );
};
