import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Navigation from '../components/Common/Navigation';
import Footer from '../components/Common/Footer';
import '../styles/Home.css';
import hospitalImage from '../assets/images/hospital.jpg';

const Home = () => {
  const navigate = useNavigate();
  const { user, token, dashboardRoute } = useContext(AuthContext);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [featuredHospitals, setFeaturedHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({ hospital_id: '', date: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  const getImageSrc = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${api.getStorageUrl()}/${String(path).replace(/^\/+/, '')}`;
  };

  useEffect(() => {
    // Logged-in users should land on their dashboard instead of the public home view
    if (token && user && dashboardRoute && dashboardRoute !== '/') {
      navigate(dashboardRoute, { replace: true });
    }
  }, [token, user, dashboardRoute, navigate]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load hospitals
        const h = await api.getHospitals(token);
        const hospitalsData = h?.data || h || [];
        setHospitals(hospitalsData);
        setFeaturedHospitals(hospitalsData.slice(0, 6));

        // Load doctors
        const d = await api.getDoctors();
        const doctorsData = d?.data || d || [];
        setDoctors(doctorsData);
        setFeaturedDoctors(doctorsData.slice(0, 6));
      } catch (e) {
        console.error('Error loading home data:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  const handleBook = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (!booking.hospital_id || !booking.date) {
      setMessage({ type: 'error', text: 'Please select hospital and date' });
      return;
    }
    
    try {
      const res = await api.bookAppointment(booking, token);
      if (res && res.status === 'success') {
        setMessage({ type: 'success', text: 'Appointment booked — check your email for confirmation' });
        setBooking({ hospital_id: '', date: '' });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      } else {
        setMessage({ type: 'error', text: res.message || 'Booking failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error connecting to server' });
    }
  };

  // If logged in as patient, show dashboard-style home with booking UI
  if (token && user && user.role === 'patient') {
    return (
      <div className="home-container">
        <Navigation />
        
        <header className="home-header">
          <h1>🏥 Hospital Management System</h1>
          <p>Welcome back, {user.name}!</p>
          <div className="header-buttons">
            <button 
              onClick={() => navigate('/dashboard/patient')} 
              className="hero-btn-primary"
            >
              📊 Go to Dashboard
            </button>
          </div>
        </header>

        <main className="home-content">
          {/* Booking Section */}
          <section className="booking-section">
            <h3>Book New Appointment</h3>
            {message.text && (
              <div className={`message ${message.type}`}>{message.text}</div>
            )}
            <form onSubmit={handleBook} className="booking-form">
              <select
                value={booking.hospital_id}
                onChange={(e) => setBooking({ ...booking, hospital_id: e.target.value })}
                required
              >
                <option value="">Select Hospital</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={booking.date}
                onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <button type="submit">Book Appointment</button>
            </form>
          </section>

          {/* Doctors Section */}
          <section className="doctors-section">
            <h2>Our Doctors</h2>
            <p className="section-description">Browse our qualified healthcare professionals</p>
            {loading ? (
              <div className="loading-spinner">Loading doctors...</div>
            ) : (
              <div className="doctors-grid">
                {featuredDoctors.length === 0 ? (
                  <p className="no-data">No doctors available</p>
                ) : (
                  featuredDoctors.map(doc => (
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
                          {(doc.name || doc.user?.name)?.charAt(0).toUpperCase() || 'D'}
                        </div>
                      </div>
                      <div className="doctor-info">
                        <h3>Dr. {doc.user?.name || doc.name || 'Doctor'}</h3>
                        {doc.department?.name && <p className="doctor-dept">{doc.department.name}</p>}
                        {doc.specialization && <p className="doctor-specialty">{doc.specialization}</p>}
                        {doc.qualification && <p className="doctor-qualification">{doc.qualification}</p>}
                        {doc.experience_years > 0 && (
                          <p className="doctor-experience">{doc.experience_years} years experience</p>
                        )}
                        {doc.hospital && <p className="doctor-hospital">{doc.hospital.name}</p>}
                        {doc.user?.average_rating > 0 && (
                          <div className="doctor-rating">
                            {'★'.repeat(Math.round(doc.user.average_rating))}
                            {'☆'.repeat(5 - Math.round(doc.user.average_rating))}
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
                          onClick={() => navigate(`/doctor/${doc.id}`)}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {doctors.length > 6 && (
              <div className="view-all-container">
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/doctors')}
                >
                  View All Doctors →
                </button>
              </div>
            )}
          </section>

          {/* Hospitals Section */}
          <section className="hospitals-section">
            <h2>Partner Hospitals</h2>
            <p className="section-description">Access healthcare from our trusted hospital partners</p>
            {loading ? (
              <div className="loading-spinner">Loading hospitals...</div>
            ) : (
              <div className="hospitals-grid">
                {featuredHospitals.length === 0 ? (
                  <p className="no-data">No hospitals available</p>
                ) : (
                  featuredHospitals.map(hospital => (
                    <div key={hospital.id} className="hospital-card">
                      <div className="hospital-image">
                        {hospital.image ? (
                          <img 
                            src={getImageSrc(hospital.image)} 
                            alt={hospital.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const placeholder = e.target.nextElementSibling;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="hospital-image-placeholder" style={hospital.image ? { display: 'none' } : {}}>
                          🏥
                        </div>
                      </div>
                      <div className="hospital-info">
                        <h3>{hospital.name}</h3>
                        {hospital.address && <p className="hospital-address">📍 {hospital.address}</p>}
                        {hospital.phone && <p className="hospital-phone">📞 {hospital.phone}</p>}
                        {hospital.email && <p className="hospital-email">✉️ {hospital.email}</p>}
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
                          onClick={() => navigate(`/hospital/${hospital.id}`)}
                        >
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {hospitals.length > 6 && (
              <div className="view-all-container">
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/hospitals')}
                >
                  View All Hospitals →
                </button>
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  // Not logged in or other roles - render public home page
  return (
    <div className="home-container">
      <Navigation />
      
      {/* Hero Section */}
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
                <span className="stat-number">{doctors.length}+</span>
                <span className="stat-label">Expert Doctors</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{hospitals.length}+</span>
                <span className="stat-label">Partner Hospitals</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Happy Patients</span>
              </div>
            </div>
            <div className="hero-buttons">
              <button onClick={() => navigate('/register')} className="hero-btn hero-btn-primary">
                Get Started
              </button>
              <button onClick={() => navigate('/login')} className="hero-btn hero-btn-secondary">
                Login
              </button>
            </div>
          </div>
          <div className="hero-image">
            <img src={hospitalImage} alt="Hospital Building" />
          </div>
        </div>
      </section>

      <main className="home-content">
        {/* Doctors Section */}
        <section className="doctors-section">
          <h2>Featured Doctors</h2>
          <p className="section-description">Meet our expert healthcare professionals</p>
          {loading ? (
            <div className="loading-spinner">Loading doctors...</div>
          ) : (
            <div className="doctors-grid">
              {featuredDoctors.length === 0 ? (
                <p className="no-data">No doctors available</p>
              ) : (
                featuredDoctors.map(doc => (
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
                        {(doc.name || doc.user?.name)?.charAt(0).toUpperCase() || 'D'}
                      </div>
                    </div>
                    <div className="doctor-info">
                      <h3>Dr. {doc.user?.name || doc.name || 'Doctor'}</h3>
                      {doc.department?.name && <p className="doctor-dept">{doc.department.name}</p>}
                      {doc.specialization && <p className="doctor-specialty">{doc.specialization}</p>}
                      {doc.qualification && <p className="doctor-qualification">{doc.qualification}</p>}
                      {doc.experience_years > 0 && (
                        <p className="doctor-experience">{doc.experience_years} years experience</p>
                      )}
                      {doc.hospital && <p className="doctor-hospital">{doc.hospital.name}</p>}
                      {doc.user?.average_rating > 0 && (
                        <div className="doctor-rating">
                          {'★'.repeat(Math.round(doc.user.average_rating))}
                          {'☆'.repeat(5 - Math.round(doc.user.average_rating))}
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
                        onClick={() => navigate('/login')}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {doctors.length > 6 && (
            <div className="view-all-container">
              <button 
                className="btn-primary"
                onClick={() => navigate('/doctors')}
              >
                View All Doctors →
              </button>
            </div>
          )}
        </section>

        {/* Hospitals Section */}
        <section className="hospitals-section">
          <h2>Partner Hospitals</h2>
          <p className="section-description">Access healthcare from our trusted network</p>
          {loading ? (
            <div className="loading-spinner">Loading hospitals...</div>
          ) : (
            <div className="hospitals-grid">
              {featuredHospitals.length === 0 ? (
                <p className="no-data">No hospitals available</p>
              ) : (
                featuredHospitals.map(hospital => (
                  <div key={hospital.id} className="hospital-card">
                    <div className="hospital-image">
                      {hospital.image ? (
                        <img 
                          src={getImageSrc(hospital.image)} 
                          alt={hospital.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const placeholder = e.target.nextElementSibling;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="hospital-image-placeholder" style={hospital.image ? { display: 'none' } : {}}>
                        🏥
                      </div>
                    </div>
                    <div className="hospital-info">
                      <h3>{hospital.name}</h3>
                      {hospital.address && <p className="hospital-address">📍 {hospital.address}</p>}
                      {hospital.phone && <p className="hospital-phone">📞 {hospital.phone}</p>}
                      {hospital.email && <p className="hospital-email">✉️ {hospital.email}</p>}
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
                        onClick={() => navigate('/login')}
                      >
                        Book Appointment
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {hospitals.length > 6 && (
            <div className="view-all-container">
              <button 
                className="btn-primary"
                onClick={() => navigate('/hospitals')}
              >
                View All Hospitals →
              </button>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of satisfied patients who trust us for their healthcare needs.</p>
            <div className="cta-buttons">
              <button onClick={() => navigate('/register')} className="hero-btn-primary">
                Create Account
              </button>
              <button onClick={() => navigate('/login')} className="hero-btn-secondary">
                Login
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;