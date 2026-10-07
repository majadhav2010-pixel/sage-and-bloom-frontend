import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import './Contact.css';

export const Contact = () => {
  const { showToastNotification } = useCart();
  const innerRef = useScrollReveal();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    showToastNotification("Thanks! Your message has been sent successfully.");
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
  };

  const handleEmailClick = (e) => {
    // Copy email to clipboard so user has it even if mailto client is not configured
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText('majadhav2010@gmail.com').catch(() => {});
    }
    showToastNotification("Email copied: majadhav2010@gmail.com");
  };

  return (
    <section className="contact" id="contact">
      <div className="container">
        <div className="contact-inner reveal" ref={innerRef}>
          <div className="contact-info">
            <span className="eyebrow">Get In Touch</span>
            <h2>Say Hello</h2>
            <p>
              Questions about an order, a custom scent request, or a wholesale enquiry? We'd love to hear from you.
            </p>

            <div className="contact-channels">
              <a
                href="tel:+919767524923"
                className="contact-channel-item"
                title="Call 9767524923"
                aria-label="Call 9767524923"
              >
                <div className="channel-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </div>
                <div className="channel-text">
                  <small>Contact No.</small>
                  <span>9767524923</span>
                </div>
              </a>

              <a
                href="mailto:majadhav2010@gmail.com"
                className="contact-channel-item"
                onClick={handleEmailClick}
                title="Email majadhav2010@gmail.com (Click to open mail app & copy)"
                aria-label="Email majadhav2010@gmail.com"
              >
                <div className="channel-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h16v16H4z" />
                    <path d="M4 6l8 7 8-7" />
                  </svg>
                </div>
                <div className="channel-text">
                  <small>Email Address</small>
                  <span>majadhav2010@gmail.com</span>
                </div>
              </a>

              <a
                href="https://maps.google.com/?q=shantivan+colony+,behind+dattadham+,vasmat+road+,parbhani+431+401"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-channel-item"
                title="View on Google Maps"
                aria-label="View address on Google Maps"
              >
                <div className="channel-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 21s-8-7.5-8-12a8 8 0 1116 0c0 4.5-8 12-8 12z" />
                    <circle cx="12" cy="9" r="3" />
                  </svg>
                </div>
                <div className="channel-text">
                  <small>Our Address</small>
                  <span>shantivan colony ,behind dattadham ,vasmat road ,parbhani 431 401</span>
                </div>
              </a>
            </div>
          </div>

          <form id="contactForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="contact-name">Name</label>
              <input
                id="contact-name"
                name="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                placeholder="you@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-phone">Phone Number</label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                placeholder="Optional"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                name="message"
                placeholder="How can we help?"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
