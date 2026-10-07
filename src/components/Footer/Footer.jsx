import React from 'react';
import './Footer.css';

export const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo footer-logo">
              <img src="/logo.jpg" alt="Sage & Bloom Logo" className="footer-logo-img" />
              <span>Sage & Bloom</span>
            </div>
            <p>
              Small-batch handmade soap, crafted with natural ingredients for a gentle everyday ritual.
            </p>
            <div className="footer-social">
              <a href="#home" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" />
                </svg>
              </a>
              <a href="#home" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              <a href="https://wa.me/919767524923" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h5>Quick Links</h5>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#shop">Shop</a></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Customer Care</h5>
            <ul>
              <li><a href="#home">Shipping Policy</a></li>
              <li><a href="#home">Return Policy</a></li>
              <li><a href="#home">Privacy Policy</a></li>
              <li><a href="#home">Terms & Conditions</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Shop</h5>
            <ul>
              <li><a href="#shop">Herbal Soaps</a></li>
              <li><a href="#shop">Floral Soaps</a></li>
              <li><a href="#shop">Gift Sets</a></li>
              <li><a href="#shop">Special Editions</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Sage & Bloom. All rights reserved.</span>
          <span>Made by hand, with care.</span>
        </div>
      </div>
    </footer>
  );
};
