import React, { useState } from 'react';

export const AdminSettings = () => {
  const [storeName, setStoreName] = useState('Sage & Bloom Soapery');
  const [currency, setCurrency] = useState('INR (₹)');
  const [shippingThreshold, setShippingThreshold] = useState('499.00');
  const [backendUrl, setBackendUrl] = useState('http://localhost:8080/api');
  const [googleOauthStatus, setGoogleOauthStatus] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Extract currency symbol (e.g. "₹" from "INR (₹)")
  const currencySymbol = currency.match(/\((.*?)\)/)?.[1] || '₹';

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="admin-settings-view">
      <div className="dash-header">
        <div>
          <h2>Store Configuration & System Settings</h2>
          <p>Global parameters, currency settings, API connections, and OAuth status</p>
        </div>
      </div>

      <div className="dash-card" style={{ maxWidth: '780px' }}>
        <form onSubmit={handleSave} className="modal-form">
          <div className="form-group">
            <label>Store Brand Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="admin-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Default Currency</label>
              <select
                value={currency}
                onChange={(e) => {
                  const newCur = e.target.value;
                  setCurrency(newCur);
                  if (newCur.includes('INR') && shippingThreshold === '45.00') {
                    setShippingThreshold('499.00');
                  } else if (newCur.includes('USD') && shippingThreshold === '499.00') {
                    setShippingThreshold('45.00');
                  }
                }}
                className="admin-select"
              >
                <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                <option value="USD ($)">USD ($) - US Dollar</option>
                <option value="EUR (€)">EUR (€) - Euro</option>
                <option value="GBP (£)">GBP (£) - British Pound</option>
                <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
                <option value="AUD ($)">AUD ($) - Australian Dollar</option>
                <option value="AED (AED)">AED (د.إ) - UAE Dirham</option>
              </select>
            </div>

            <div className="form-group">
              <label>Free Shipping Threshold ({currencySymbol})</label>
              <input
                type="number"
                step="5"
                value={shippingThreshold}
                onChange={(e) => setShippingThreshold(e.target.value)}
                className="admin-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Spring Boot Backend API URL</label>
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              className="admin-input"
            />
            <small className="text-muted">Direct connection to Java 21 Spring Boot REST controller</small>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--paper)', borderRadius: '12px', marginTop: '10px' }}>
            <div>
              <strong>Google OAuth 2.0 Integration</strong>
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>Client ID & Secret configured in Spring Boot</div>
            </div>
            <span className="badge-growth">Connected & Ready</span>
          </div>

          {savedSuccess && (
            <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(77, 94, 67, 0.12)', color: 'var(--moss)', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
              ✓ Store settings updated successfully with {currency}!
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            <button type="submit" className="btn btn-admin-primary">
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
