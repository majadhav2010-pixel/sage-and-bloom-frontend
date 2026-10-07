import React from 'react';
import { useCart } from '../../context/CartContext';

export const ProductCard = ({ product }) => {
  const { addToCart, openProductModal } = useCart();

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 !== 0;
    return "★".repeat(full) + (half ? "☆" : "");
  };

  return (
    <div className="product-card">
      <div className="soap-frame" onClick={() => openProductModal(product)} style={{ cursor: 'pointer' }}>
        <img src={product.img} alt={product.name} loading="lazy" />
      </div>

      <div className="product-tag">{product.tag}</div>
      <h3>{product.name}</h3>
      <p className="desc">{product.desc}</p>

      <div className="stars">
        {renderStars(product.rating)}
        <span>({product.reviews})</span>
      </div>

      <div className="price-row">
        <span className="price">₹{product.price}</span>
      </div>

      <div className="card-btns">
        <button
          className="btn-outline-small"
          onClick={() => openProductModal(product)}
        >
          View Details
        </button>
        <button
          className="btn btn-primary btn-small"
          onClick={() => addToCart(product, 1)}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};
