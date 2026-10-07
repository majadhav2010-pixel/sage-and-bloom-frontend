import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './AuthModal.css';

export const AuthModal = () => {
  const {
    user,
    isLoggedIn,
    isAuthModalOpen,
    authMode,
    setAuthMode,
    closeAuthModal,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateProfile,
    updateAddress,
    demoUser
  } = useAuth();

  const { showToastNotification } = useCart();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Account dashboard tab state ('orders' | 'address' | 'profile')
  const [accountTab, setAccountTab] = useState('orders');

  // Edit profile state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Edit address state
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressPostalCode, setAddressPostalCode] = useState('');
  const [addressSuccess, setAddressSuccess] = useState(false);

  // Sync profile & address fields when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      setAddressStreet(user.address?.street || '');
      setAddressCity(user.address?.city || '');
      setAddressState(user.address?.state || '');
      setAddressPostalCode(user.address?.postalCode || '');
    }
  }, [user]);

  // Handle body scroll locking and Escape key
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
      setLoginError('');
      setSignupError('');
      setForgotSent(false);
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  // Quick fill demo user
  const handleFillDemo = () => {
    setLoginEmail(demoUser.email);
    setLoginPassword(demoUser.password);
    setLoginError('');
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login({ email: loginEmail, password: loginPassword, rememberMe });
      setIsSubmitting(false);

      if (res.success) {
        showToastNotification(`Welcome back, ${res.user.name.split(' ')[0]}! 🌿`);
        closeAuthModal();
      } else {
        setLoginError(res.message || 'Login failed.');
      }
    } catch (err) {
      setIsSubmitting(false);
      setLoginError(err.message || 'Unable to sign in. Please try again.');
    }
  };

  // Handle Signup Submit
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError('');

    if (!signupName || !signupEmail || !signupPassword) {
      setSignupError('Please fill in name, email and password.');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signup({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        phone: signupPhone
      });
      setIsSubmitting(false);

      if (res.success) {
        showToastNotification(`Welcome to Sage & Bloom, ${res.user.name.split(' ')[0]}! ✨`);
        closeAuthModal();
      } else {
        setSignupError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setIsSubmitting(false);
      setSignupError(err.message || 'Unable to register. Please try again.');
    }
  };

  // Handle Forgot Password Submit
  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
  };

  // Handle Profile Update
  const handleProfileSave = (e) => {
    e.preventDefault();
    updateProfile({ name: profileName, phone: profilePhone });
    setProfileSuccess(true);
    showToastNotification('Profile details updated!');
    setTimeout(() => setProfileSuccess(false), 2500);
  };

  // Handle Address Update
  const handleAddressSave = (e) => {
    e.preventDefault();
    updateAddress({
      street: addressStreet,
      city: addressCity,
      state: addressState,
      postalCode: addressPostalCode
    });
    setAddressSuccess(true);
    showToastNotification('Default shipping address saved!');
    setTimeout(() => setAddressSuccess(false), 2500);
  };

  // Handle Logout
  const handleLogout = () => {
    logout();
    showToastNotification('You have logged out.');
  };

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={closeAuthModal} aria-label="Close modal">
          ✕
        </button>

        {/* LOGGED IN ACCOUNT DASHBOARD */}
        {isLoggedIn ? (
          <div className="account-view">
            {/* Header / User Card */}
            <div className="account-hero">
              <div className="account-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="account-hero-info">
                <div className="account-name-row">
                  <h3>{user.name}</h3>
                  <span className="account-tier-badge">{user.tier || 'Member'}</span>
                </div>
                <p className="account-email">{user.email}</p>
                {user.phone && <p className="account-phone">{user.phone}</p>}
                <span className="account-member-since">Member since {user.memberSince}</span>
              </div>
            </div>

            {/* Bloom Rewards Points Bar */}
            <div className="account-rewards-card">
              <div className="rewards-head">
                <div className="rewards-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <span>Bloom Rewards</span>
                </div>
                <div className="rewards-balance">
                  <strong>{user.points || 0}</strong> Points (₹{Math.floor((user.points || 0) * 0.5)} value)
                </div>
              </div>
              <div className="rewards-progress-bar">
                <div
                  className="rewards-progress-fill"
                  style={{ width: `${Math.min(100, ((user.points || 0) % 500) / 5)}%` }}
                ></div>
              </div>
              <div className="rewards-foot">
                <span>Next reward: ₹250 Off Coupon at 500 pts</span>
                <span>Earn 10 pts per ₹100 spent</span>
              </div>
            </div>

            {/* Account Tabs */}
            <div className="account-tabs">
              <button
                className={`account-tab-btn ${accountTab === 'orders' ? 'active' : ''}`}
                onClick={() => setAccountTab('orders')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                My Orders ({user.orders ? user.orders.length : 0})
              </button>
              <button
                className={`account-tab-btn ${accountTab === 'address' ? 'active' : ''}`}
                onClick={() => setAccountTab('address')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Shipping Address
              </button>
              <button
                className={`account-tab-btn ${accountTab === 'profile' ? 'active' : ''}`}
                onClick={() => setAccountTab('profile')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Profile Details
              </button>
            </div>

            {/* TAB CONTENT: ORDERS */}
            {accountTab === 'orders' && (
              <div className="account-tab-content">
                {(!user.orders || user.orders.length === 0) ? (
                  <div className="empty-orders-state">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p>You haven't placed any orders yet.</p>
                    <a href="#shop" onClick={closeAuthModal} className="btn btn-primary btn-small">
                      Explore Artisanal Soaps
                    </a>
                  </div>
                ) : (
                  <div className="orders-list">
                    {user.orders.map((order) => (
                      <div className="order-card" key={order.id}>
                        <div className="order-card-head">
                          <div>
                            <span className="order-id">Order {order.id}</span>
                            <span className="order-date">· {order.date}</span>
                          </div>
                          <span className={`order-status-pill status-${order.status?.toLowerCase()}`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="order-items-preview">
                          {order.items && order.items.map((item, idx) => (
                            <div className="order-item-row" key={idx}>
                              {item.img && (
                                <img src={item.img} alt={item.name} className="order-item-thumb" />
                              )}
                              <div className="order-item-details">
                                <span className="order-item-name">{item.name}</span>
                                <span className="order-item-meta">
                                  Qty: {item.quantity} · ₹{item.price} each
                                </span>
                              </div>
                              <span className="order-item-total">
                                ₹{item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="order-card-foot">
                          <span className="tracking-text">
                            Tracking: <strong>{order.trackingNumber}</strong>
                          </span>
                          <span className="order-total-sum">
                            Total: <strong>₹{order.total}</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: ADDRESS */}
            {accountTab === 'address' && (
              <div className="account-tab-content">
                <form onSubmit={handleAddressSave} className="auth-form address-form">
                  <p className="tab-helper-text">
                    This address will be automatically prefilled whenever you checkout your artisanal soaps basket.
                  </p>
                  <div className="form-group">
                    <label>Street Address / Apartment</label>
                    <input
                      type="text"
                      placeholder="e.g. 42 Lotus Blossom Lane, Apt 3B"
                      value={addressStreet}
                      onChange={(e) => setAddressStreet(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        placeholder="e.g. Bengaluru"
                        value={addressCity}
                        onChange={(e) => setAddressCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        placeholder="e.g. Karnataka"
                        value={addressState}
                        onChange={(e) => setAddressState(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>PIN / Postal Code</label>
                      <input
                        type="text"
                        placeholder="e.g. 560038"
                        value={addressPostalCode}
                        onChange={(e) => setAddressPostalCode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <input type="text" value="India" disabled className="input-disabled" />
                    </div>
                  </div>

                  {addressSuccess && (
                    <div className="form-success-banner">✓ Address saved successfully!</div>
                  )}

                  <button type="submit" className="btn btn-primary btn-full">
                    Save Shipping Address
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: PROFILE */}
            {accountTab === 'profile' && (
              <div className="account-tab-content">
                <form onSubmit={handleProfileSave} className="auth-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="input-disabled"
                    />
                    <small style={{ color: 'var(--ink-soft)', marginTop: '4px', display: 'block' }}>
                      Email cannot be changed directly in demo mode.
                    </small>
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>

                  {profileSuccess && (
                    <div className="form-success-banner">✓ Profile details updated!</div>
                  )}

                  <button type="submit" className="btn btn-primary btn-full">
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="account-modal-foot">
              <button className="logout-btn" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Log Out
              </button>
              <button className="btn btn-ghost btn-small" onClick={closeAuthModal}>
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* NOT LOGGED IN - LOGIN / SIGNUP / FORGOT VIEWS */
          <div className="auth-views-container">
            <div className="auth-header">
              <div className="auth-logo-badge">
                <img src="/logo.jpg" alt="Sage & Bloom" className="auth-logo-img" />
              </div>
              <h3>
                {authMode === 'signup'
                  ? 'Join the Ritual'
                  : authMode === 'forgot'
                  ? 'Reset Password'
                  : 'Customer Sign In'}
              </h3>
              <p>
                {authMode === 'signup'
                  ? 'Create an account to track orders and earn Bloom Rewards.'
                  : authMode === 'forgot'
                  ? 'Enter your email and we’ll send you recovery details.'
                  : 'Sign in to access your saved basket, orders, and botanical rewards.'}
              </p>
            </div>

            {/* Tab switch between Login and Signup (hidden on forgot) */}
            {authMode !== 'forgot' && (
              <div className="auth-nav-tabs">
                <button
                  type="button"
                  className={`auth-nav-btn ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthMode('login');
                    setLoginError('');
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`auth-nav-btn ${authMode === 'signup' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthMode('signup');
                    setSignupError('');
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* QUICK DEMO LOGIN SHORTCUT */}
            {authMode === 'login' && (
              <div className="demo-fill-card" onClick={handleFillDemo}>
                <div className="demo-fill-content">
                  <div className="demo-fill-title">
                    <span>✨ 1-Click Demo Account</span>
                    <span className="demo-pill">Pre-filled</span>
                  </div>
                  <div className="demo-fill-creds">
                    <span>aria@sagebloom.com</span> · <span>password123</span>
                  </div>
                </div>
                <button type="button" className="demo-fill-btn">
                  Quick Fill
                </button>
              </div>
            )}

            {/* SIGN IN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="auth-form">
                {loginError && <div className="form-error-banner">{loginError}</div>}

                <div className="form-group">
                  <label htmlFor="login-email">Email Address</label>
                  <div className="input-with-icon">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input
                      id="login-email"
                      type="email"
                      placeholder="e.g. aria@sagebloom.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="login-password">Password</label>
                    <button
                      type="button"
                      className="forgot-link"
                      onClick={() => setAuthMode('forgot')}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="input-with-icon password-field">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="form-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me on this browser</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="oauth-divider">
                  <span>or</span>
                </div>

                <button
                  type="button"
                  className="btn-oauth-google"
                  onClick={loginWithGoogle}
                >
                  <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="auth-footer-prompt">
                  <span>Don't have an account yet?</span>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => {
                      setAuthMode('signup');
                      setSignupError('');
                    }}
                  >
                    Sign up here
                  </button>
                </div>
              </form>
            )}

            {/* CREATE ACCOUNT (SIGN UP) FORM */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="auth-form">
                <div className="signup-perks-chip">
                  <span className="perk-icon">🌿</span>
                  <span><strong>Welcome Gift:</strong> 100 bonus Bloom Points + 10% off your first order!</span>
                </div>

                {signupError && <div className="form-error-banner">{signupError}</div>}

                <div className="form-group">
                  <label htmlFor="signup-name">Full Name</label>
                  <div className="input-with-icon">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      id="signup-name"
                      type="text"
                      placeholder="e.g. Clara Oswald"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="signup-email">Email Address</label>
                  <div className="input-with-icon">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input
                      id="signup-email"
                      type="email"
                      placeholder="e.g. clara@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="signup-phone">Phone Number (Optional)</label>
                  <div className="input-with-icon">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                    <input
                      id="signup-phone"
                      type="tel"
                      placeholder="e.g. +91 98765 00000"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="signup-password">Create Password</label>
                  <div className="input-with-icon password-field">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="form-options">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Receive artisanal scent previews & seasonal drops</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating account...' : 'Sign Up & Join'}
                </button>

                <div className="auth-footer-prompt">
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => {
                      setAuthMode('login');
                      setLoginError('');
                    }}
                  >
                    Sign in here
                  </button>
                </div>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {authMode === 'forgot' && (
              <div className="auth-form">
                {forgotSent ? (
                  <div className="forgot-success-box">
                    <div className="success-icon">✉️</div>
                    <h4>Recovery Email Sent!</h4>
                    <p>
                      If an account exists for <strong>{forgotEmail}</strong>, we've sent demo recovery instructions.
                    </p>
                    <p className="demo-hint-text">
                      (Demo Hint: You can sign in using default password <code>password123</code>)
                    </p>
                    <button
                      className="btn btn-primary btn-full"
                      onClick={() => {
                        setAuthMode('login');
                        setForgotSent(false);
                      }}
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit}>
                    <div className="form-group">
                      <label htmlFor="forgot-email">Account Email</label>
                      <div className="input-with-icon">
                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <input
                          id="forgot-email"
                          type="email"
                          placeholder="e.g. aria@sagebloom.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full">
                      Send Reset Instructions
                    </button>

                    <div className="auth-footer-prompt">
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => setAuthMode('login')}
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
