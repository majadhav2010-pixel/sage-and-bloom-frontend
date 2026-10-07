import React, { useState, useMemo } from 'react';
import { useProducts } from '../../context/ProductContext';
import { CategoryFilter } from './CategoryFilter';
import { ProductCard } from './ProductCard';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import './Shop.css';

export const ProductGrid = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const headRef = useScrollReveal();
  const { activeProducts } = useProducts();

  const filteredProducts = useMemo(() => {
    if (!activeProducts || activeProducts.length === 0) return [];
    if (activeCategory === 'all') return activeProducts;
    return activeProducts.filter((p) => p.cat === activeCategory || p.category?.toLowerCase().includes(activeCategory));
  }, [activeCategory, activeProducts]);

  return (
    <section className="shop" id="shop">
      <div className="container">
        <div className="section-head reveal" ref={headRef}>
          <span className="eyebrow">The Collection</span>
          <h2>Shop Our Soaps</h2>
          <p>
            Each bar is poured, cut and cured by hand — browse the full collection below and tap any soap to see the details.
          </p>
        </div>

        <CategoryFilter
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
