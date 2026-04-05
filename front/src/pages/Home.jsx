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

  const getImageSrc = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${api.getStorageUrl()}/${String(path).replace(/^\/+/, '')}`;
  };



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

        <section className="doctors-section">
          <h2>Featured Doctors</h2>
          <p className="section-description">Find and book appointments with our expert doctors</p>
          <div className="doctors-grid">
            {doctors.length === 0 ? (
              <p className="no-data">No doctors available</p>
            ) : (
              doctors.slice(0, 6).map(doc => (
                <div key={doc.id} className="doctor-card">
                  <div className="doctor-avatar">
                    {(doc.image || doc.user?.avatar) ? (
                      <img 
                        src={getImageSrc(doc.image || doc.user?.avatar)}
                        alt={doc.user?.name || doc.name || 'Doctor'}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const placeholder = e.target.nextElementSibling;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="avatar-placeholder" style={(doc.image || doc.user?.avatar) ? { display: 'none' } : {}}>
                      {(doc.name || doc.user?.name)?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="doctor-info">
                    <h3>Dr. {doc.name}</h3>
                    {doc.hospital && <p className="doctor-hospital">{doc.hospital.name}</p>}
                    {doc.identifier && <p className="doctor-id">ID: {doc.identifier}</p>}
                    {doc.user?.average_rating > 0 && (
                      <div className="doctor-rating">
                        {'★'.repeat(Math.round(doc.user.average_rating))}{'☆'.repeat(5 - Math.round(doc.user.average_rating))}
                        <span className="doctor-rating-value"> {Number(doc.user.average_rating).toFixed(1)} ({doc.user.total_reviews})</span>
                      </div>
                    )}
                  </div>
                  <div className="doctor-actions">
                    <button 
                      className="btn-link"
                      onClick={() => navigate(`/doctor/${doc.id}`)}
                    >
                      View Profile
                    </button>
                    <button 
                      className="btn-primary btn-small"
                      onClick={() => {
                        if (!token) {
                          navigate('/login');
                        } else {
                          navigate(`/doctor/${doc.id}`);
                        }
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="hospitals-section">
          <h2>Partner Hospitals</h2>
          <p className="section-description">Access healthcare from our trusted hospital partners</p>
          <div className="hospitals-grid">
            {hospitals.length === 0 ? (
              <p className="no-data">No hospitals available</p>
            ) : (
              hospitals.slice(0, 6).map(hospital => (
                <div key={hospital.id} className="hospital-card">
                  <div className="hospital-image">
                    {hospital.image ? (
                      <img src={getImageSrc(hospital.image)} alt={hospital.name} />
                    ) : (
                      <div className="hospital-image-placeholder">🏥</div>
                    )}
                  </div>
                  <div className="hospital-info">
                    <h3>{hospital.name}</h3>
                    {hospital.address && <p className="hospital-address">{hospital.address}</p>}
                    {hospital.phone && <p className="hospital-phone">☎️ {hospital.phone}</p>}
                  </div>
                  <div className="hospital-actions">
                    <button 
                      className="btn-link"
                      onClick={() => navigate(`/hospital/${hospital.id}`)}
                    >
                      View Details
                    </button>
                    <button 
                      className="btn-primary btn-small"
                      onClick={() => {
                        if (!token) {
                          navigate('/login');
                        } else {
                          navigate(`/hospital/${hospital.id}`);
                        }
                      }}
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))
            )}
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