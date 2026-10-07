import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import './WhyChooseUs.css';

export const WhyChooseUs = () => {
  const headRef = useScrollReveal();
  const c1Ref = useScrollReveal();
  const c2Ref = useScrollReveal();
  const c3Ref = useScrollReveal();
  const c4Ref = useScrollReveal();

  return (
    <section className="why">
      <div className="container">
        <div className="section-head reveal" ref={headRef}>
          <span className="eyebrow">Our Promise</span>
          <h2>Why Choose Our Handmade Soaps?</h2>
        </div>

        <div className="why-grid">
          <div className="why-card reveal" ref={c1Ref}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M12 2v6M6 8l4 3M18 8l-4 3M4 22c2-6 6-9 8-9s6 3 8 9" />
            </svg>
            <h4>Handcrafted</h4>
            <p>Made carefully in small batches, poured and finished entirely by hand.</p>
          </div>

          <div className="why-card reveal" ref={c2Ref}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M12 21C7 17 3 13.5 3 9a5 5 0 019-3 5 5 0 019 3c0 4.5-4 8-9 12z" />
            </svg>
            <h4>Thoughtfully Made</h4>
            <p>Ingredients selected with care, blended in small quantities for freshness.</p>
          </div>

          <div className="why-card reveal" ref={c3Ref}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
            </svg>
            <h4>Fresh & Beautiful</h4>
            <p>Made to bring a refreshing, soothing experience to your everyday routine.</p>
          </div>

          <div className="why-card reveal" ref={c4Ref}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <rect x="3" y="7" width="18" height="14" rx="2" />
              <path d="M3 11h18M9 7V5a3 3 0 016 0v2" />
            </svg>
            <h4>Packed with Care</h4>
            <p>Beautifully wrapped and packaged by hand before it reaches your door.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
