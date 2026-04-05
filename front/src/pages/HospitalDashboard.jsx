import React, { useState } from 'react';
import '../styles/HospitalSystem.css';
import './HospitalDashboard.css';

const HospitalDashboard = ({ user, onLogout, onNavigate }) => {
  const [activeNav, setActiveNav] = useState('home');

  const todayAppointments = [
    { id: 1, time: '09:00 AM', doctor: 'Dr. Sarah Johnson', patient: 'John Doe' },
    { id: 2, time: '10:30 AM', doctor: 'Dr. Michael Chen', patient: 'Jane Smith' },
    { id: 3, time: '2:00 PM', doctor: 'Dr. Emily Watson', patient: 'Robert Brown' },
  ];

  const statistics = [
    { label: 'Total Doctors', value: '24', color: '#10B981' },
    { label: 'Total Patients', value: '156', color: '#10B981' },
    { label: 'Upcoming Appointments', value: '42', color: '#10B981' },
  ];

  const navigateTo = (page) => {
    setActiveNav(page);
    onNavigate(page);
  };

  return (
    <div className="hospital-dashboard">
      {/* Top Navbar */}
      <nav className="hospital-navbar">
        <div className="navbar-container">
          <div className="navbar-logo">
            <h1>HealthCare</h1>
          </div>

          <div className="navbar-menu">
            <button 
              className={`navbar-item ${activeNav === 'home' ? 'active' : ''}`}
              onClick={() => navigateTo('home')}
            >
              Home
            </button>
            <button 
              className={`navbar-item ${activeNav === 'appointments' ? 'active' : ''}`}
              onClick={() => navigateTo('appointments')}
            >
              Appointments
            </button>
            <button 
              className={`navbar-item ${activeNav === 'doctors' ? 'active' : ''}`}
              onClick={() => navigateTo('doctors')}
            >
              Doctors
            </button>
            <button 
              className={`navbar-item ${activeNav === 'patients' ? 'active' : ''}`}
              onClick={() => navigateTo('patients')}
            >
              Patients
            </button>
            <button 
              className={`navbar-item ${activeNav === 'settings' ? 'active' : ''}`}
              onClick={() => navigateTo('settings')}
            >
              Settings
            </button>
          </div>

          <div className="navbar-actions">
            <span className="user-email">{user?.email}</span>
            <button className="btn-logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="hospital-main">
          {/* Today's Appointments */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Today's Appointments</h2>
              <button className="btn btn-primary btn-sm" onClick={() => navigateTo('appointments')}>
                View All
              </button>
            </div>

            <div className="card appointments-list">
              {todayAppointments.map(apt => (
                <div key={apt.id} className="appointment-item">
                  <div className="appointment-time">{apt.time}</div>
                  <div className="appointment-info">
                    <div className="appointment-doctor">{apt.doctor}</div>
                    <div className="appointment-patient">{apt.patient}</div>
                  </div>
                  <button className="btn btn-secondary btn-sm">Details</button>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="dashboard-section">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <button className="btn btn-primary" onClick={() => navigateTo('booking')}>
                Book Appointment
              </button>
              <button className="btn btn-primary" onClick={() => navigateTo('doctors')}>
                Manage Doctors
              </button>
              <button className="btn btn-primary" onClick={() => navigateTo('appointments')}>
                View Appointments
              </button>
            </div>
          </section>

          {/* Statistics */}
          <section className="dashboard-section">
            <h2>Statistics</h2>
            <div className="grid grid-3">
              {statistics.map((stat, idx) => (
                <div key={idx} className="card stat-card">
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  };
  
  export default HospitalDashboard;
