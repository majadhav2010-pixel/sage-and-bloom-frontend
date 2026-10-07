import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export const Navbar = ({ onOpenAdmin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isBumped, setIsBumped] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();
  const { user, isLoggedIn, openAuthModal, logout } = useAuth();

  useEffect(() => {
    if (cartCount === 0) return;
    setIsBumped(true);
    const timer = setTimeout(() => setIsBumped(false), 300);
    return () => clearTimeout(timer);
  }, [cartCount]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="header">
        <div className="nav-wrap">
          <a href="#home" className="logo" onClick={closeMobileMenu}>
            <img src="/logo.jpg" alt="Sage & Bloom Logo" className="nav-logo-img" />
            <span className="logo-text">Sage & Bloom</span>
          </a>

          <nav className="nav-links">
            <a href="#home">Home</a>
            <a href="#shop">Shop</a>
            <a href="#about">About</a>
            <a href="#ingredients">Ingredients</a>
            <a href="#reviews">Reviews</a>
            <a href="#contact">Contact</a>
            <button
              type="button"
              className="admin-link-badge"
              onClick={onOpenAdmin}
              title="Open Platform Administration"
            >
              🛡️ Admin
            </button>
          </nav>

          <div className="nav-right">
            {/* Account / Login button */}
            <button
              className={`account-btn ${isLoggedIn ? 'logged-in' : ''}`}
              onClick={() => openAuthModal(isLoggedIn ? 'account' : 'login')}
              aria-label={isLoggedIn ? `Account for ${user.name}` : 'Sign In'}
            >
              {isLoggedIn ? (
                <>
                  <span className="account-initial">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                  <span className="account-label">Hi, {user.name.split(' ')[0]}</span>
                </>
              ) : (
                <>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="account-label">Sign In</span>
                </>
              )}
            </button>

            {/* Cart button */}
            <button
              className="cart-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Cart with ${cartCount} items`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 4h2l2.4 12.2a2 2 0 002 1.8h8.4a2 2 0 002-1.7L21 8H6" />
                <circle cx="9" cy="21" r="1" />
                <circle cx="18" cy="21" r="1" />
              </svg>
              <span>Cart</span>
              <span className={`cart-count ${isBumped ? 'bump' : ''}`}>{cartCount}</span>
            </button>

            <div className="hamburger" onClick={toggleMobileMenu} aria-label="Toggle navigation menu">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </header>

      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <button className="mobile-close" onClick={closeMobileMenu} aria-label="Close menu">
          ✕
        </button>
        <a href="#home" onClick={closeMobileMenu}>Home</a>
        <a href="#shop" onClick={closeMobileMenu}>Shop</a>
        <a href="#about" onClick={closeMobileMenu}>About</a>
        <a href="#ingredients" onClick={closeMobileMenu}>Ingredients</a>
        <a href="#reviews" onClick={closeMobileMenu}>Reviews</a>
        <a href="#contact" onClick={closeMobileMenu}>Contact</a>
        <a
          href="#admin"
          onClick={() => {
            closeMobileMenu();
            onOpenAdmin?.();
          }}
          style={{ color: 'var(--sage-deep)', fontWeight: '600' }}
        >
          🛡️ Admin Dashboard
        </a>

        <div className="mobile-menu-auth">
          {isLoggedIn ? (
            <div className="mobile-user-card">
              <div className="mobile-user-info">
                <span className="account-initial">{user.name.charAt(0).toUpperCase()}</span>
                <div>
                  <strong>{user.name}</strong>
                  <span className="mobile-user-points">{user.points || 0} Bloom Points</span>
                </div>
              </div>
              <div className="mobile-auth-actions">
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => {
                    closeMobileMenu();
                    openAuthModal('account');
                  }}
                >
                  My Account
                </button>
                <button
                  className="btn btn-ghost btn-small"
                  onClick={() => {
                    closeMobileMenu();
                    logout();
                  }}
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-full"
              onClick={() => {
                closeMobileMenu();
                openAuthModal('login');
              }}
            >
              Sign In / Create Account
            </button>
          )}
        </div>
      </div>
    </>
  );
};
