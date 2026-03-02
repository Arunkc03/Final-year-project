import React from 'react';
import hospitalImage from '../../assets/images/hospital.jpg';
import './PageHero.css';

const PageHero = ({ title, subtitle, showImage = true }) => {
  return (
    <section className="page-hero">
      <div className="page-hero-overlay"></div>
      <div className="page-hero-wrapper">
        <div className="page-hero-content">
          <h1 className="page-hero-title">{title}</h1>
          {subtitle && <p className="page-hero-subtitle">{subtitle}</p>}
        </div>
        {showImage && (
          <div className="page-hero-image">
            <img src={hospitalImage} alt="Hospital" />
          </div>
        )}
      </div>
    </section>
  );
};

export default PageHero;
