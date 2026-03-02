import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import hospitalImage from '../assets/images/hospital.jpg';
import '../styles/SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || user?.role !== 'super_admin') {
      navigate('/login');
      return;
    }
    fetchDashboard();
    fetchHospitals();
  }, [token, user, navigate]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard with token:', token ? 'exists' : 'missing');
      const response = await api.getDashboard('/dashboard/super-admin', token);
      console.log('Dashboard response:', response);
      
      // Check if response is HTML (error page)
      if (typeof response === 'string' && response.includes('<html')) {
        setError('Auth error: Invalid or expired token. Please login again.');
        return;
      }
      
      if (response.status === 'success') {
        setDashboardData(response.data);
      } else if (response.status === 'error') {
        setError(response.message || 'Failed to load dashboard');
      } else {
        setError(response.message || 'Unexpected response from server');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      if (err.status === 404) {
        setError('Dashboard endpoint not found. Try logging in again.');
      } else if (err.status === 401) {
        setError('Unauthorized. Your session may have expired. Please login again.');
      } else {
        setError('Error loading dashboard: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await api.getHospitals(token);
      if (response) {
        setHospitals(response.data || response || []);
      }
    } catch (err) {
      console.error('Error fetching hospitals:', err);
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

  const handleDeleteHospital = async (hospitalId, hospitalName) => {
    if (!window.confirm(`Are you sure you want to delete "${hospitalName}"? This will also delete all associated doctors, appointments, and data. This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.deleteHospital(hospitalId, token);
      if (response.status === 'success') {
        alert('Hospital deleted successfully!');
        // Refresh hospitals list
        setHospitals(hospitals.filter(h => h.id !== hospitalId));
        // Refresh dashboard data
        fetchDashboard();
      } else {
        alert(response.message || 'Failed to delete hospital');
      }
    } catch (err) {
      console.error('Error deleting hospital:', err);
      alert('Error deleting hospital. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null;

  return (
    <div className="superadmin-dashboard">
      <PageHero 
        title="Super Admin Dashboard" 
        subtitle={`Welcome ${user.name} - Manage entire hospital system`}
      />

      <main className="dashboard-main">
        {error && <div className="error-message">{error}</div>}

        {/* Statistics Section */}
        <section className="stats-section">
          <h2>System Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Hospitals</h3>
                <p className="stat-value">{dashboardData?.total_hospitals || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Users</h3>
                <p className="stat-value">{dashboardData?.total_users || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Doctors</h3>
                <p className="stat-value">{dashboardData?.total_doctors || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Patients</h3>
                <p className="stat-value">{dashboardData?.total_patients || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Admins</h3>
                <p className="stat-value">{dashboardData?.total_admins || 0}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button onClick={() => navigate('/hospitals')} className="action-card primary">
              <span className="action-text">Create Hospital</span>
              <span className="action-desc">Add new hospital & admin</span>
            </button>
            <button onClick={() => navigate('/reports')} className="action-card">
              <span className="action-text">View Reports</span>
              <span className="action-desc">Review all reports</span>
            </button>
            <button onClick={() => navigate('/')} className="action-card">
              <span className="action-text">Back to Home</span>
              <span className="action-desc">Return to main page</span>
            </button>
          </div>
        </section>

        {/* Hospitals List Section */}
        <section className="hospitals-section">
          <h2>All Hospitals</h2>
          {hospitals.length === 0 ? (
            <div className="no-hospitals">
              <p>No hospitals found. Create your first hospital!</p>
              <button onClick={() => navigate('/hospitals')} className="btn-create">
                Create Hospital
              </button>
            </div>
          ) : (
            <div className="hospitals-grid">
              {hospitals.map((hospital) => (
                <div key={hospital.id} className="hospital-card">
                  <div className="hospital-card-image">
                    <img src={hospital.image || hospitalImage} alt={hospital.name} />
                  </div>
                  <div className="hospital-card-info">
                    <h3>{hospital.name}</h3>
                    <p className="hospital-address">{hospital.address || 'Address not available'}</p>
                    <p className="hospital-phone">{hospital.phone || 'N/A'}</p>
                    <p className="hospital-admin">Admin: {hospital.admin?.name || 'Not assigned'}</p>
                    <div className="hospital-card-actions">
                      <button 
                        onClick={() => navigate(`/hospital/${hospital.id}`)} 
                        className="btn-view"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => navigate(`/hospitals/${hospital.id}`)} 
                        className="btn-edit"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteHospital(hospital.id, hospital.name)} 
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Info Section */}
        <section className="info-section">
          <div className="info-card">
            <h3>System Overview</h3>
            <ul>
              <li>Multi-hospital system management</li>
              <li>User role management (Admin, Doctor, Patient)</li>
              <li>Hospital creation with automatic admin assignment</li>
              <li>System-wide reporting and analytics</li>
              <li>Identifier-based authentication</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
