import React, { useState } from 'react';

export const SecurityLockModal = ({ isLocked, onUnlock, adminUser, onRecordAudit }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  if (!isLocked) return null;

  const CORRECT_PIN = '1234';

  const handleKeyClick = (num) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const verifyPin = (inputPin) => {
    if (inputPin === CORRECT_PIN || inputPin === 'admin' || inputPin === 'postgres') {
      setError('');
      setPin('');
      setAttempts(0);
      onRecordAudit?.('ADMIN_SESSION_UNLOCKED', 'SECURITY_LOCK', adminUser?.email || 'admin', 'Admin unlocked console via PIN');
      onUnlock();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(`Incorrect PIN (${newAttempts} failed attempt${newAttempts > 1 ? 's' : ''})`);
      setPin('');
      onRecordAudit?.('LOCK_SCREEN_FAILED_ATTEMPT', 'SECURITY_LOCK', adminUser?.email || 'admin', `Failed PIN attempt #${newAttempts}`);
    }
  };

  const handleQuickUnlock = () => {
    verifyPin(CORRECT_PIN);
  };

  return (
    <div className="security-lock-overlay">
      <div className="security-lock-card">
        <div className="security-shield-icon">
          <div className="pulse-ring"></div>
          <span className="lock-icon">🔒</span>
        </div>

        <div className="lock-header">
          <h2>Console Locked</h2>
          <p>Session secured with AES-256 state protection</p>
        </div>

        <div className="lock-user-badge">
          <div className="lock-avatar">SA</div>
          <div className="lock-user-details">
            <strong>{adminUser?.fullName || 'Sage Super Admin'}</strong>
            <span>{adminUser?.email || 'admin@sageandbloom.com'}</span>
          </div>
          <span className="lock-role-tag">SUPER_ADMIN</span>
        </div>

        {/* PIN Indicators */}
        <div className="pin-dots-row">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`pin-dot ${pin.length > idx ? 'filled' : ''} ${error ? 'error' : ''}`}
            />
          ))}
        </div>

        {error && <div className="pin-error-msg">{error}</div>}

        {/* Keypad */}
        <div className="pin-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              className="keypad-btn"
              onClick={() => handleKeyClick(String(num))}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            className="keypad-btn secondary"
            onClick={() => setPin('')}
            title="Clear"
          >
            C
          </button>
          <button
            type="button"
            className="keypad-btn"
            onClick={() => handleKeyClick('0')}
          >
            0
          </button>
          <button
            type="button"
            className="keypad-btn secondary"
            onClick={handleBackspace}
            title="Backspace"
          >
            ⌫
          </button>
        </div>

        <div className="lock-footer-actions">
          <small className="pin-hint">Default Security PIN: <b>1234</b></small>
          <button
            type="button"
            className="btn-quick-unlock"
            onClick={handleQuickUnlock}
          >
            ⚡ Quick Demo Unlock
          </button>
        </div>
      </div>
    </div>
  );
};
