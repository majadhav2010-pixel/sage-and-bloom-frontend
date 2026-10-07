import React from 'react';
import { ingredients } from '../../data/ingredientsData';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import './Ingredients.css';

export const Ingredients = () => {
  const headRef = useScrollReveal();

  return (
    <section className="ingredients" id="ingredients">
      <div className="container">
        <div className="section-head reveal" ref={headRef}>
          <span className="eyebrow">What Goes In</span>
          <h2>Our Ingredients</h2>
          <p>
            A short list of the botanicals and natural ingredients we use most. Swap these for your own recipe — only show what you actually use.
          </p>
        </div>

        <div className="ing-grid">
          {ingredients.map((item) => (
            <div className="ing-card" key={item.id}>
              <div className="ing-icon">{item.icon}</div>
              <h4>{item.name}</h4>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
