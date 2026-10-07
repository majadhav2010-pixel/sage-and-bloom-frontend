import React, { useState } from 'react';
import { faqs } from '../../data/faqsData';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import './FAQ.css';

export const FAQ = () => {
  const [openId, setOpenId] = useState(null);
  const headRef = useScrollReveal();
  const listRef = useScrollReveal();

  const toggleFAQ = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="faq" id="faq">
      <div className="container">
        <div className="section-head reveal" ref={headRef}>
          <span className="eyebrow">Good to Know</span>
          <h2>Frequently Asked Questions</h2>
        </div>

        <div className="faq-list reveal" ref={listRef}>
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className={`faq-item ${openId === faq.id ? 'open' : ''}`}
            >
              <button
                className="faq-q"
                onClick={() => toggleFAQ(faq.id)}
                aria-expanded={openId === faq.id}
              >
                <span>{faq.question}</span>
                <span className="plus">+</span>
              </button>
              <div className="faq-a">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
