import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import './ProductModal.css';

export const ProductModal = () => {
  const { selectedProduct, closeProductModal, addToCart, setIsCartOpen } = useCart();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 !== 0;
    return "★".repeat(full) + (half ? "☆" : "");
  };

  const handleBuyNow = () => {
    addToCart(selectedProduct, quantity, false);
    closeProductModal();
    setIsCartOpen(true);
  };

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity, true);
    closeProductModal();
  };

  return (
    <div className="modal-overlay" onClick={closeProductModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeProductModal} aria-label="Close modal">
          ✕
        </button>

        <div className="modal-img">
          <img
            src={selectedProduct.img || selectedProduct.imageUrl || '/images/slide_1.jpg'}
            alt={selectedProduct.name || selectedProduct.title || 'Botanical Soap'}
            onError={(e) => {
              e.target.src = '/images/slide_1.jpg';
            }}
          />
        </div>

        <div className="modal-body">
          <div className="product-tag">{selectedProduct.tag || selectedProduct.badge || 'Artisan Soap'}</div>
          <h3>{selectedProduct.name || selectedProduct.title || 'Botanical Soap'}</h3>
          <span className="price">₹{selectedProduct.price}</span>

          <div className="stars">
            {renderStars(selectedProduct.rating || 5)}
            <span>({selectedProduct.reviews || selectedProduct.reviewCount || 0} reviews)</span>
          </div>

          <p className="desc">{selectedProduct.desc || selectedProduct.description || ''}</p>

          <div className="modal-meta">
            <div>
              <span>Weight</span>
              <b>{selectedProduct.weight || `${selectedProduct.weightGrams || 200}g bar`}</b>
            </div>
            <div>
              <span>Suitable For</span>
              <b>{selectedProduct.suitable || selectedProduct.skinType || 'All Skin Types'}</b>
            </div>
          </div>

          <div className="modal-section">
            <h5>Ingredients</h5>
            <ul>
              {(Array.isArray(selectedProduct.ingredients)
                ? selectedProduct.ingredients
                : (typeof selectedProduct.ingredients === 'string'
                    ? selectedProduct.ingredients.split(',').map((s) => s.trim()).filter(Boolean)
                    : ['Natural Plant Oils', 'Organic Shea Butter', 'Pure Botanical Extracts'])
              ).map((ing, idx) => (
                <li key={idx}>{ing}</li>
              ))}
            </ul>
          </div>

          <div className="modal-section">
            <h5>Benefits</h5>
            <ul>
              {(Array.isArray(selectedProduct.benefits) && selectedProduct.benefits.length > 0
                ? selectedProduct.benefits
                : ['Helps leave skin soft and deeply nourished', 'Gently cleanses without stripping moisture', 'Calming natural aromatherapy blend']
              ).map((ben, idx) => (
                <li key={idx}>{ben}</li>
              ))}
            </ul>
          </div>

          <div className="modal-section">
            <h5>How to Use</h5>
            <p>{selectedProduct.use || 'Work into a rich creamy lather with warm water, gently massage over damp skin, and rinse well.'}</p>
          </div>

          <div className="qty-row">
            <div className="qty-selector">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
              In stock, ready to ship
            </span>
          </div>

          <div className="modal-btns">
            <button className="btn btn-ghost" onClick={handleAddToCart}>
              Add to Cart
            </button>
            <button className="btn btn-clay" onClick={handleBuyNow}>
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
