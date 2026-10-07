import React, { useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './CartDrawer.css';

export const CartDrawer = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    cartTotal,
    updateQuantity,
    removeFromCart,
    showToastNotification,
    clearCart
  } = useCart();

  const { user, isLoggedIn, openAuthModal, addOrder } = useAuth();

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    const placedOrder = addOrder({
      items: [...cartItems],
      total: cartTotal,
      shippingAddress: user?.address?.street
        ? `${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.postalCode}`
        : 'Standard Express Shipping Address'
    });

    if (isLoggedIn) {
      showToastNotification(`Order #${placedOrder.id} placed! Saved to your Account 🌿`);
    } else {
      showToastNotification(`Order placed successfully for ₹${cartTotal}!`);
    }

    clearCart();
    setIsCartOpen(false);
  };

  return (
    <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-head">
          <h3>Your Basket</h3>
          <button
            className="cart-close-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        <div className="cart-drawer-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 4h2l2.4 12.2a2 2 0 002 1.8h8.4a2 2 0 002-1.7L21 8H6" />
                <circle cx="9" cy="21" r="1" />
                <circle cx="18" cy="21" r="1" />
              </svg>
              <p>Your basket is currently empty.</p>
              <button
                className="btn btn-primary btn-small"
                onClick={() => setIsCartOpen(false)}
              >
                Discover Soaps
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-img">
                    <img src={item.img} alt={item.name} />
                  </div>
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <div className="cart-item-price">₹{item.price} each</div>
                    <div className="cart-item-controls">
                      <div className="cart-qty-ctrl">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="cart-remove-btn"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-drawer-foot">
            {/* Member or Guest Prompt in Cart */}
            {isLoggedIn ? (
              <div className="cart-auth-pill">
                <span>🌿 Logged in as <strong>{user.name.split(' ')[0]}</strong></span>
                <span className="cart-auth-sub">Earns +{Math.floor(cartTotal * 0.1)} Bloom Points</span>
              </div>
            ) : (
              <div className="cart-auth-banner" onClick={() => openAuthModal('login')}>
                <span>✨ <strong>Sign In</strong> to earn {Math.floor(cartTotal * 0.1)} Bloom Points on this order</span>
              </div>
            )}

            <div className="cart-subtotal">
              <span>Subtotal</span>
              <span>₹{cartTotal}</span>
            </div>
            <button className="btn btn-primary btn-full" onClick={handleCheckout}>
              Checkout · ₹{cartTotal}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
