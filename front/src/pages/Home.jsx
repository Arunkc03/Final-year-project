import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Home.css';
import hospitalImage from '../assets/images/hospital.jpg';

const Home = () => {
  const navigate = useNavigate();
  const { user, token, dashboardRoute } = useContext(AuthContext);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [booking, setBooking] = useState({ hospital_id: '', date: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    // if logged in and not a patient, redirect to their dashboard
    if (token && user && user.role !== 'patient') {
      setTimeout(() => navigate(dashboardRoute || '/dashboard'), 500);
    }
  }, [token, user, dashboardRoute, navigate]);

  useEffect(() => {
    // load hospital and doctor list for public view
    const load = async () => {
      try {
        const h = await api.getHospitals(token);
        if (h) setHospitals(h?.data || h || []);
      } catch (e) {}
      try {
        const d = await api.getDoctors();
        if (d) setDoctors(d?.data || d || []);
      } catch (e) {}
    };
    load();
  }, [token]);

  const handleBook = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!booking.hospital_id || !booking.date) {
      setMessage('Please select hospital and date');
      return;
    }
    try {
      const res = await api.bookAppointment(booking, token);
      if (res && res.status === 'success') {
        setMessage('Appointment booked — check your email for confirmation');
      } else {
        setMessage(res.message || 'Booking failed');
      }
    } catch (err) {
      setMessage('Error connecting to server');
    }
  };

  // If logged in as patient, stay on home and show booking UI
  if (token && user && user.role === 'patient') {
    return (
      <div className="home-container">
        <header className="home-header">
          <h1>🏥 Hospital Management System</h1>
          <p>Welcome, {user.name}!</p>
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={() => navigate('/dashboard/patient')} 
              style={{
                padding: '10px 20px',
                background: '#001f3f',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📊 Go to Dashboard
            </button>
          </div>
        </header>

        <main className="home-content">
          <section>
            <h2>Available Doctors</h2>
            {doctors.length === 0 ? (
              <p>No doctors available.</p>
            ) : (
              <ul>
                {doctors.map((d) => (
                  <li key={d.id}>
                    <strong>{d.name}</strong> — {d.identifier}
                    {d.hospital && <span> ({d.hospital.name})</span>}
                    <button className="btn-link" onClick={() => navigate(`/doctors/${d.id}`)}>View</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>Available Hospitals</h2>
            {hospitals.length === 0 ? (
              <p>No hospitals available.</p>
            ) : (
              <ul>
                {hospitals.map((h) => (
                  <li key={h.id}>
                    <strong>{h.name}</strong>
                    <button className="btn-link" onClick={() => navigate(`/hospital/${h.id}`)}>View & Book</button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>

        <footer className="home-footer">
          <p>&copy; 2025 Hospital Management System.</p>
        </footer>
      </div>
    );
  }

  // not logged in or other roles (render public home)
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>🏥 Hospital Management System</h1>
        <p>Efficient Healthcare Administration Platform</p>
      </header>

      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-wrapper">
          <div className="hero-content">
            <h1 className="hero-title">Your Health, Our Priority</h1>
            <p className="hero-subtitle">
              Experience world-class healthcare management with our comprehensive platform.
              Book appointments, access medical records, and connect with top healthcare professionals.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">500+</span>
                <span className="stat-label">Expert Doctors</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">Partner Hospitals</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">100K+</span>
                <span className="stat-label">Happy Patients</span>
              </div>
            </div>
            <div className="hero-buttons">
              <button onClick={() => navigate('/register')} className="hero-btn hero-btn-primary">
                Get Started
              </button>
              <button onClick={() => navigate('/browse-hospitals')} className="hero-btn hero-btn-secondary">
                Explore Hospitals
              </button>
            </div>
          </div>
          <div className="hero-image">
            <img src={hospitalImage} alt="Hospital Building" />
          </div>
        </div>
      </section>

      <main className="home-content">

        <section className="features">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">👨‍💼</span>
              <h3>Super Admin</h3>
              <p>Create and manage hospitals with their admin accounts</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🏥</span>
              <h3>Hospital Admin</h3>
              <p>Manage doctors, patients, and hospital operations</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">👨‍⚕️</span>
              <h3>Doctors</h3>
              <p>Access patient records and submit medical reports</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">👤</span>
              <h3>Patients</h3>
              <p>Self-register, view medical records, and track health</p>
            </div>
          </div>
        </section>

        <section className="roles">
          <h2>System Roles</h2>
          <div className="roles-grid">
            <div className="role-card">
              <h3>Super Admin</h3>
              <ul>
                <li>Create hospitals</li>
                <li>Assign hospital admins</li>
                <li>View system statistics</li>
                <li>Can only login (no self-registration)</li>
              </ul>
            </div>
            <div className="role-card">
              <h3>Hospital Admin</h3>
              <ul>
                <li>Created by Super Admin</li>
                <li>Add doctors to hospital</li>
                <li>Manage hospital settings</li>
                <li>Review patient reports</li>
              </ul>
            </div>
            <div className="role-card">
              <h3>Doctor</h3>
              <ul>
                <li>Added by Hospital Admin</li>
                <li>View patient list</li>
                <li>Submit medical reports</li>
                <li>Identifier-based login</li>
              </ul>
            </div>
            <div className="role-card">
              <h3>Patient</h3>
              <ul>
                <li>Self-registration</li>
                <li>View medical records</li>
                <li>Get unique patient ID</li>
                <li>Secure identifier login</li>
                <li>Book appointments</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="cta">
          <h2>Get Started</h2>
          <div className="cta-buttons">
            <button onClick={() => navigate('/login')} className="btn-primary">
              Login
            </button>
            <button onClick={() => navigate('/register')} className="btn-secondary-outline">
              Register as Patient
            </button>
          </div>
        </section>

        <section className="browse-section">
          <h2>Browse Our Network</h2>
          <p className="browse-description">Find the best healthcare providers in your area</p>
          <div className="browse-cards">
            <div className="browse-card" onClick={() => navigate('/browse-hospitals')}>
              <div className="browse-card-icon">🏥</div>
              <h3>Hospitals</h3>
              <p>Explore our partner hospitals and book appointments</p>
              <span className="browse-card-link">View All Hospitals »</span>
            </div>
            <div className="browse-card" onClick={() => navigate('/browse-doctors')}>
              <div className="browse-card-icon">👨‍⚕️</div>
              <h3>Doctors</h3>
              <p>Find specialist doctors and healthcare professionals</p>
              <span className="browse-card-link">View All Doctors »</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p>&copy; 2025 Hospital Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Home;