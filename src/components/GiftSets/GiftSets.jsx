import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import './GiftSets.css';

export const GiftSets = () => {
  const headRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const bundles = [
    {
      id: 1,
      name: "Ocean Bliss Sliding Box Trio",
      desc: "Three arched sliding keepsake boxes with terrazzo soap stones in seashell, coral & seaweed editions.",
      img: "/images/ocean_bliss_trio.jpg"
    },
    {
      id: 2,
      name: "Relax & Enjoy Spa Ritual Box",
      desc: "Honeycomb, floral bars, bath salts, and natural sisal sponge in a luxury gift box.",
      img: "/images/soap_21.jpg"
    },
    {
      id: 3,
      name: "Ocean Breeze Sea Turtle Box",
      desc: "Sea turtle bar with pastel seashell soaps tied with rustic twine.",
      img: "/images/soap_22.jpg"
    },
    {
      id: 4,
      name: "Rustic Artisan Favor & Dish Set",
      desc: "Cold-processed bar with natural sisal scrubber and wooden draining dish.",
      img: "/images/soap_24.jpg"
    }
  ];

  return (
    <section className="bundle">
      <div className="container">
        <div className="bundle-head reveal" ref={headRef}>
          <span className="eyebrow">Gifting Made Easy</span>
          <h2>A Little More Self-Care</h2>
          <p>
            Handmade soap gift sets — a beautiful collection of handcrafted soaps, perfect for gifting or creating your own relaxing routine.
          </p>
        </div>

        <div className="bundle-grid">
          {bundles.map((bundle) => (
            <div className="bundle-card" key={bundle.id}>
              <div className="soap-frame">
                <img src={bundle.img} alt={bundle.name} loading="lazy" />
              </div>
              <div className="bundle-overlay">
                <h4>{bundle.name}</h4>
                <p>{bundle.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bundle-cta reveal" ref={ctaRef}>
          <a href="#shop" className="btn btn-clay">
            Shop Gift Sets
          </a>
        </div>
      </div>
    </section>
  );
};
