import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import PageHero from '../components/PageHero/PageHero';
import '../styles/DoctorView.css';

const DoctorView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.getDoctor(id);
        if (res && res.status === 'success') {
          setDoctor(res.doctor || res);
        }
      } catch (e) {
        setError('Failed to load doctor details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleBookWithDoctor = () => {
    if (!token) {
      navigate('/login', { state: { from: `/doctor/${id}` } });
      return;
    }
    if (doctor?.hospital_id) {
      navigate(`/hospital/${doctor.hospital_id}`);
    }
  };

  if (loading) return <div className="loading">Loading doctor...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!doctor) return <div className="error-message">Doctor not found</div>;

  return (
    <div className="doctor-view-page">
      <PageHero 
        title={doctor.name} 
        subtitle={doctor.department?.name || 'Healthcare Professional'}
      />

      <div className="doctor-view-container">
        {/* Doctor Profile */}
        <div className="doctor-profile">
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {doctor.avatar ? (
                  <img src={doctor.avatar} alt={doctor.name} />
                ) : (
                  <div className="avatar-placeholder">👨‍⚕️</div>
                )}
              </div>
              <div className="profile-basic">
                <h2>{doctor.name}</h2>
                <span className="doctor-id">{doctor.identifier}</span>
                {doctor.department?.name && (
                  <span className="specialization-badge">{doctor.department.name}</span>
                )}
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{doctor.email}</span>
                </div>
                {doctor.phone && (
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{doctor.phone}</span>
                  </div>
                )}
                {doctor.qualification && (
                  <div className="detail-item">
                    <span className="detail-label">Qualification</span>
                    <span className="detail-value">{doctor.qualification}</span>
                  </div>
                )}
                {doctor.experience_years > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Experience</span>
                    <span className="detail-value">{doctor.experience_years} years</span>
                  </div>
                )}
                {doctor.consultation_fee > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Consultation Fee</span>
                    <span className="detail-value fee">${doctor.consultation_fee}</span>
                  </div>
                )}
              </div>

              {doctor.bio && (
                <div className="doctor-bio">
                  <h3>About</h3>
                  <p>{doctor.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hospital Info */}
        {doctor.hospital && (
          <div className="hospital-section">
            <h3>Works at</h3>
            <div className="hospital-card">
              <div className="hospital-icon">🏥</div>
              <div className="hospital-info">
                <h4>{doctor.hospital.name}</h4>
                <p>{doctor.hospital.address || 'Address not specified'}</p>
              </div>
              <button 
                onClick={() => navigate(`/hospital/${doctor.hospital.id}`)}
                className="btn-secondary"
              >
                View Hospital
              </button>
            </div>
          </div>
        )}

        {/* Book Appointment */}
        <div className="booking-section">
          {!token ? (
            <div className="login-required">
              <p>Login or register to book an appointment with {doctor.name}</p>
              <div className="auth-buttons">
                <button onClick={() => navigate('/login')} className="btn-primary">
                  Login
                </button>
                <button onClick={() => navigate('/register')} className="btn-secondary">
                  Register
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleBookWithDoctor} className="btn-primary book-btn">
              📅 Book Appointment with {doctor.name}
            </button>
          )}
        </div>

        <div className="back-link">
          <button onClick={() => navigate('/browse-doctors')} className="btn-link">
            ← Back to Doctors
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorView;
