import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import './About.css';

export const About = () => {
  const visualRef = useScrollReveal();
  const copyRef = useScrollReveal();

  return (
    <section className="about" id="about">
      <div className="container about-inner">
        <div className="about-visual reveal" ref={visualRef}>
          <div className="soap-frame">
            <img
              src="/images/soap_3.jpg"
              alt="Aloe vera and mint handmade soap bars stacked"
              loading="lazy"
            />
          </div>
          <div className="soap-frame small flip">
            <img
              src="/images/soap_6.jpg"
              alt="Oatmeal and honey handmade soap"
              loading="lazy"
            />
          </div>
        </div>

        <div className="about-copy reveal" ref={copyRef}>
          <span className="eyebrow">Our Story</span>
          <h2>Made by Hand, Made with Care</h2>
          <p>
            Every soap is carefully handcrafted in small batches with thoughtfully selected ingredients. Our goal is to bring a simple, refreshing and beautiful bathing experience to your everyday routine.
          </p>
          <p>
            From the first pour to the final cure, each bar is shaped, trimmed and wrapped by hand in our home studio. No shortcuts, no mass production — just soap made the slow way, the way it's meant to be.
          </p>
          <div className="about-facts">
            <div>
              <b>100%</b>
              <span>Handmade</span>
            </div>
            <div>
              <b>Small</b>
              <span>Batches Only</span>
            </div>
            <div>
              <b>4+ wks</b>
              <span>Cure Time</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
