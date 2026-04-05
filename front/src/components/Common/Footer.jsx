import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Company Info */}
        <div className="footer-section">
          <h3>Doctorsathi</h3>
          <p>Your trusted healthcare management platform connecting patients, doctors, and hospitals.</p>
          <div className="footer-socials">
            <a href="#" className="social-link" title="Facebook">f</a>
            <a href="#" className="social-link" title="Twitter">𝕏</a>
            <a href="#" className="social-link" title="LinkedIn">in</a>
            <a href="#" className="social-link" title="Instagram">@</a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><a onClick={() => navigate('/hospitals')}>Hospitals</a></li>
            <li><a onClick={() => navigate('/doctors')}>Doctors</a></li>
            <li><a onClick={() => navigate('/')}>Home</a></li>
            <li><a href="#contact">Contact Us</a></li>
          </ul>
        </div>

        {/* Support */}
        <div className="footer-section">
          <h4>Support</h4>
          <ul className="footer-links">
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#help">Help Center</a></li>
            <li><a href="#feedback">Send Feedback</a></li>
            <li><a href="#report">Report Issue</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div className="footer-section">
          <h4>Legal</h4>
          <ul className="footer-links">
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#terms">Terms & Conditions</a></li>
            <li><a href="#cookies">Cookie Policy</a></li>
            <li><a href="#disclaimer">Disclaimer</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h4>Contact</h4>
          <ul className="footer-contact">
            <li>📧 <a href="mailto:support@doctorsathi.com">support@doctorsathi.com</a></li>
            <li>📞 <a href="tel:+977-1234567890">+977-1234567890</a></li>
            <li>📍 Kathmandu, Nepal</li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>&copy; {currentYear} Doctorsathi. All rights reserved.</p>
        <p>Healthcare Management System | Made with ❤️ in Nepal</p>
      </div>
    </footer>
  );
};

export default Footer;
