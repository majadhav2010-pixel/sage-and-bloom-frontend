import React from 'react';
import { reviews } from '../../data/reviewsData';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import './Reviews.css';

export const Reviews = () => {
  const headRef = useScrollReveal();

  const renderStars = (rating) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  return (
    <section className="reviews" id="reviews">
      <div className="container">
        <div className="section-head reveal" ref={headRef}>
          <span className="eyebrow">Kind Words</span>
          <h2>Customer Reviews</h2>
        </div>

        <div className="review-grid">
          {reviews.map((rev) => (
            <div className="review-card" key={rev.id}>
              <div className="stars">{renderStars(rev.rating)}</div>
              <p>"{rev.quote}"</p>
              <div className="reviewer">
                <div className="avatar">{rev.avatar}</div>
                <div>
                  <b>{rev.author}</b>
                  <span>{rev.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
