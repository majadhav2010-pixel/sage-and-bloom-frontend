import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import './Instagram.css';

export const Instagram = () => {
  const headRef = useScrollReveal();

  const instaImages = [
    { id: 1, src: "/images/ocean_bliss_trio.jpg", alt: "Ocean bliss artisan terrazzo stone soap boxes" },
    { id: 2, src: "/images/soap_2.jpg", alt: "Lavender and rose garden botanic soap bars" },
    { id: 3, src: "/images/soap_4.jpg", alt: "Wildflower glycerin botanical bar" },
    { id: 4, src: "/images/soap_20.jpg", alt: "Herbarium pressed flower botanical clear soaps" },
    { id: 5, src: "/images/soap_21.jpg", alt: "Deluxe bath salts and honeycomb spa gift set" },
    { id: 6, src: "/images/soap_23.jpg", alt: "Ocean swirl soaps with embedded seashells and starfish" }
  ];

  return (
    <section className="instagram">
      <div className="container">
        <div className="section-head reveal" ref={headRef}>
          <span className="eyebrow">@sageandbloomsoap</span>
          <h2>Follow Our Handmade Journey</h2>
        </div>

        <div className="insta-grid">
          {instaImages.map((img) => (
            <div className="insta-item" key={img.id}>
              <img src={img.src} alt={img.alt} loading="lazy" />
              <div className="insta-overlay">♡</div>
            </div>
          ))}
        </div>

        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost"
        >
          Follow Us on Instagram
        </a>
      </div>
    </section>
  );
};
