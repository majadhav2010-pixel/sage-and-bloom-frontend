import React from 'react';
import { useCart } from '../../context/CartContext';
import './Toast.css';

export const Toast = () => {
  const { toast } = useCart();

  return (
    <div className={`toast ${toast.show ? 'show' : ''}`} role="status" aria-live="polite">
      {toast.message}
    </div>
  );
};
