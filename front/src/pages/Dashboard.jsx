import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        let route = '/dashboard/patient';
        if (user.role === 'super_admin') route = '/dashboard/super-admin';
        else if (user.role === 'admin') route = '/dashboard/admin';
        else if (user.role === 'doctor') route = '/dashboard/doctor';

        const response = await api.getDashboard(route, token);
        if (response.status === 'success') {
          setDashboardData(response.data);
        } else {
          setError(response.message || 'Failed to load dashboard');
        }
      } catch (err) {
        setError('Error loading dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token, user, navigate]);

  const handleLogout = async () => {
    try {
      await api.logout(token);
    } catch (err) {
      console.error('Logout error:', err);
    }
    logout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🏥 Hospital Management</h1>
          <span className="role-badge">{user.role.toUpperCase()}</span>
        </div>
        <div className="header-right">
          <span className="user-name">{user.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        {user.role === 'super_admin' && (
          <div className="dashboard-grid">
            <div className="stat-card">
              <h3>Total Hospitals</h3>
              <p className="stat-number">{dashboardData?.total_hospitals || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Users</h3>
              <p className="stat-number">{dashboardData?.total_users || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Doctors</h3>
              <p className="stat-number">{dashboardData?.total_doctors || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Patients</h3>
              <p className="stat-number">{dashboardData?.total_patients || 0}</p>
            </div>
          </div>
        )}

        {user.role === 'admin' && (
          <div className="dashboard-grid">
            <div className="stat-card">
              <h3>Hospital ID</h3>
              <p className="stat-number">{dashboardData?.hospital_id || 'N/A'}</p>
            </div>
            <div className="stat-card">
              <h3>Total Doctors</h3>
              <p className="stat-number">{dashboardData?.total_doctors || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Patients</h3>
              <p className="stat-number">{dashboardData?.total_patients || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Users</h3>
              <p className="stat-number">{dashboardData?.total_users || 0}</p>
            </div>
          </div>
        )}

        {user.role === 'doctor' && (
          <div className="dashboard-grid">
            <div className="info-card">
              <h3>Doctor Information</h3>
              <p><strong>ID:</strong> {dashboardData?.doctor_id || 'N/A'}</p>
              <p><strong>Hospital:</strong> {dashboardData?.hospital_id || 'N/A'}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          </div>
        )}

        {user.role === 'patient' && (
          <div className="dashboard-grid">
            <div className="info-card">
              <h3>Your Information</h3>
              <p><strong>ID:</strong> {user.identifier}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {user.name}</p>
            </div>
          </div>
        )}

        <div className="action-buttons">
          {user.role === 'super_admin' && (
            <>
              <button onClick={() => navigate('/hospitals')} className="action-btn">
                🏥 Manage Hospitals
              </button>
              <button onClick={() => navigate('/reports')} className="action-btn">
                📋 View All Reports
              </button>
            </>
          )}
          {user.role === 'admin' && (
            <>
              <button onClick={() => navigate('/hospitals')} className="action-btn">
                🏥 Hospital Settings
              </button>
              <button onClick={() => navigate('/doctors')} className="action-btn">
                👨‍⚕️ Manage Doctors
              </button>
              <button onClick={() => navigate('/reports')} className="action-btn">
                📋 Review Reports
              </button>
            </>
          )}
          {user.role === 'doctor' && (
            <>
              <button onClick={() => navigate('/my-reports')} className="action-btn">
                📋 My Reports
              </button>
              <button onClick={() => navigate('/reports')} className="action-btn">
                📤 Upload Report
              </button>
            </>
          )}
          {user.role === 'patient' && (
            <>
              <button onClick={() => navigate('/my-reports')} className="action-btn">
                📋 My Medical Records
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
