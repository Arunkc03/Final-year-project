import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import '../styles/PatientDashboard.css';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  useEffect(() => {
    if (!token || user?.role !== 'patient') {
      navigate('/login');
      return;
    }
    fetchAllData();
    fetchAIRecommendations();
  }, [token, user, navigate]);

  const fetchAIRecommendations = async () => {
    try {
      setRecommendationsLoading(true);
      const response = await api.aiRecommendations.getDoctorRecommendations(token);
      if (response.status === 'success' && response.data) {
        setRecommendations(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Error fetching AI recommendations:', err);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [dashRes, hospitalsRes] = await Promise.all([
        api.getDashboard('/dashboard/patient', token),
        api.getHospitals(token),
      ]);
      
      if (dashRes.status === 'success') {
        setDashboardData(dashRes.data);
      } else {
        setError(dashRes.message || 'Failed to load dashboard');
      }

      if (hospitalsRes.status === 'success' && hospitalsRes.data) {
        setHospitals(hospitalsRes.data);
      } else if (Array.isArray(hospitalsRes)) {
        setHospitals(hospitalsRes);
      }
    } catch (err) {
      setError('Error loading data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout(token);
    } catch (err) {
      console.error('Logout error:', err);
    }
    logout();
    navigate('/login');
  };

  const handleHospitalClick = (hospitalId) => {
    navigate(`/hospital/${hospitalId}/departments`);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null;

  return (
    <div className="patient-dashboard-page">
      <PageHero 
        title={`Welcome, ${user.name}`} 
        subtitle="Manage your medical records, view doctors, and book appointments."
      />
      <div className="patient-dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>👤 Patient Dashboard</h1>
            <p>Manage your medical records and appointments</p>
          </div>
          <div className="header-actions">
            <span className="user-info">{user.name}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </header>

      <main className="dashboard-main">
        {error && <div className="error-message">{error}</div>}

        {/* Patient Info Card */}
        <section className="patient-info">
          <div className="info-card">
            <h2>Your Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Patient ID</span>
                <span className="info-value">{user.identifier || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Name</span>
                <span className="info-value">{user.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{user.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Hospital</span>
                <span className="info-value">{dashboardData?.hospital_name || 'N/A'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* HOSPITALS SECTION - Click to navigate */}
        <section className="hospitals-section">
          <div className="section-header">
            <h2>🏥 Book an Appointment</h2>
            <p>Select a hospital to view departments and book an appointment</p>
          </div>
          {hospitals.length > 0 ? (
            <div className="hospitals-grid">
              {hospitals.map((hospital) => (
                <div 
                  key={hospital.id} 
                  className="hospital-card clickable"
                  onClick={() => handleHospitalClick(hospital.id)}
                >
                  {hospital.image && (
                    <div className="hospital-image">
                      <img 
                        src={`${api.getStorageUrl()}/${hospital.image}`} 
                        alt={hospital.name}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="hospital-header">
                    <h3>{hospital.name}</h3>
                    <span className="arrow-icon">→</span>
                  </div>
                  <div className="hospital-details">
                    <p><strong>📧 Email:</strong> {hospital.email}</p>
                    <p><strong>📍 Address:</strong> {hospital.address || 'N/A'}</p>
                    {hospital.phone && <p><strong>📱 Phone:</strong> {hospital.phone}</p>}
                  </div>
                  <div className="card-action">
                    <span className="view-departments-btn">View Departments →</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No hospitals available</div>
          )}
        </section>

        {/* Medical Records Stats */}
        <section className="stats-section">
          <h2>Medical Records Summary</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>Total Records</h3>
                <p className="stat-value">{dashboardData?.total_reports || 0}</p>
                <p className="stat-desc">Medical reports on file</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>Appointments</h3>
                <p className="stat-value">{dashboardData?.total_appointments || 0}</p>
                <p className="stat-desc">Total appointments</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>Pending</h3>
                <p className="stat-value">{dashboardData?.pending_appointments || 0}</p>
                <p className="stat-desc">Upcoming appointments</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button onClick={() => navigate('/reports')} className="action-card primary">
              <span className="action-icon">📋</span>
              <span className="action-text">View Medical Records</span>
              <span className="action-desc">Access your health reports</span>
            </button>
            <button onClick={() => navigate('/reports')} className="action-card">
              <span className="action-icon">📊</span>
              <span className="action-text">Report History</span>
              <span className="action-desc">View all past reports</span>
            </button>
            <button onClick={() => navigate('/reports')} className="action-card">
              <span className="action-icon">👨‍⚕️</span>
              <span className="action-text">My Doctors</span>
              <span className="action-desc">Assigned physicians</span>
            </button>
            <button onClick={() => navigate('/')} className="action-card">
              <span className="action-icon">🏠</span>
              <span className="action-text">Home</span>
              <span className="action-desc">Return to home</span>
            </button>
          </div>
        </section>

        {/* AI Doctor Recommendations */}
        <section className="ai-recommendations-section">
          <div className="recommendations-header">
            <h2>🤖 AI Doctor Recommendations</h2>
            <p>Personalized doctor suggestions based on your medical history and needs</p>
          </div>
          
          {recommendationsLoading ? (
            <div className="recommendations-loading">Analyzing your health profile...</div>
          ) : recommendations.length > 0 ? (
            <div className="recommendations-grid">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="recommendation-card">
                  <div className="recommendation-header">
                    <div className="doctor-avatar">
                      {rec.doctor?.image ? (
                        <img 
                          src={`${api.getStorageUrl()}/${rec.doctor.image}`}
                          alt={rec.doctor.name}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="avatar-placeholder">👨‍⚕️</div>
                      )}
                    </div>
                    <div className="doctor-info">
                      <h3>{rec.doctor?.name || 'Dr. Recommended'}</h3>
                      <p className="specialty">{rec.doctor?.specialization || 'General Practice'}</p>
                      {rec.match_score && (
                        <div className="match-score">
                          <span className="score-label">Match</span>
                          <span className="score-value">{Math.round(rec.match_score)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="recommendation-reason">
                    {rec.reason && (
                      <div className="reason-text">
                        <strong>Why recommended:</strong> {rec.reason}
                      </div>
                    )}
                  </div>

                  {rec.doctor?.hospital && (
                    <div className="doctor-hospital">
                      <span className="hospital-icon">🏥</span>
                      <span>{rec.doctor.hospital}</span>
                    </div>
                  )}

                  <div className="recommendation-actions">
                    <button 
                      onClick={() => rec.doctor?.id && navigate(`/doctor/${rec.doctor.id}`)}
                      className="btn-view-profile"
                    >
                      View Profile
                    </button>
                    <button 
                      onClick={() => rec.doctor?.id && navigate(`/book-appointment`)}
                      className="btn-book-appointment"
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-recommendations">
              <p>📊 No recommendations available yet. Start by booking an appointment or uploading medical records.</p>
            </div>
          )}
        </section>

        {/* Login Credentials Info */}
        <section className="info-section">
          <div className="info-card">
            <h3>📝 Your Login Details</h3>
            <div className="login-info">
              <div className="login-item">
                <p><strong>Your Patient ID:</strong> {user.identifier}</p>
                <p className="desc">Use this ID to login with your password</p>
              </div>
              <div className="login-item">
                <p><strong>Email:</strong> {user.email}</p>
                <p className="desc">Alternative login method</p>
              </div>
              <div className="security-notice">
                <p className="notice-title">🔒 Security Notice</p>
                <p>Keep your login credentials private. Never share your ID with others.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features-section">
          <h2>Your Benefits</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>📋 Medical Records</h3>
              <p>Access all your medical records and health reports submitted by doctors in a secure, organized manner.</p>
            </div>
            <div className="feature-card">
              <h3>🔍 Report Tracking</h3>
              <p>Monitor the status of your reports and see when doctors submit new records about your health.</p>
            </div>
            <div className="feature-card">
              <h3>📱 Easy Access</h3>
              <p>Access your medical information anytime, anywhere with secure login and encrypted data storage.</p>
            </div>
            <div className="feature-card">
              <h3>🛡️ Privacy Protected</h3>
              <p>Your medical information is fully protected and only accessible to authorized healthcare professionals.</p>
            </div>
          </div>
        </section>

        {/* Health Tips */}
        <section className="tips-section">
          <div className="tips-card">
            <h3>💡 Health Tips</h3>
            <ul>
              <li>Keep your medical records organized and up to date</li>
              <li>Review your reports regularly with your assigned doctor</li>
              <li>Contact your hospital for any medical concerns or questions</li>
              <li>Maintain regular checkups and follow doctor recommendations</li>
            </ul>
          </div>
        </section>
      </main>
      </div>
    </div>
  );
};

export default PatientDashboard;
