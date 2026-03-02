/**
 * Patient Dashboard Component
 */

import React from 'react';
import useFetch from '../../hooks/useFetch';
import { patientAPI } from '../../api/apiService';
import '../Common/Dashboard.css';

const PatientDashboard = () => {
  const { data: dashboard, loading, error } = useFetch(() => patientAPI.dashboard());
  const { data: appointments } = useFetch(() => patientAPI.appointments());

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Patient Dashboard</h1>
        <p>Welcome back!</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>Upcoming Appointments</h3>
          <p className="stat-number">{appointments?.length || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Completed Appointments</h3>
          <p className="stat-number">{dashboard?.completed_appointments || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Payments</h3>
          <p className="stat-number">{dashboard?.pending_payments || 0}</p>
        </div>
        <div className="stat-card">
          <h3>My Reviews</h3>
          <p className="stat-number">{dashboard?.reviews_count || 0}</p>
        </div>
      </div>

      <div className="dashboard-actions">
        <a href="/patient/doctors" className="btn btn-primary">
          View Doctors
        </a>
        <a href="/patient/appointments" className="btn btn-secondary">
          My Appointments
        </a>
        <a href="/patient/payments" className="btn btn-secondary">
          Payments
        </a>
      </div>

      {appointments && appointments.length > 0 && (
        <div className="upcoming-section">
          <h2>Upcoming Appointments</h2>
          <div className="appointments-list">
            {appointments.slice(0, 3).map(appointment => (
              <div key={appointment.id} className="appointment-card">
                <h4>{appointment.doctor?.name}</h4>
                <p>{new Date(appointment.date).toLocaleDateString()}</p>
                <span className={`status status-${appointment.status}`}>
                  {appointment.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
