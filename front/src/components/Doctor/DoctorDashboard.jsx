/**
 * Doctor Dashboard Component
 */

import React from 'react';
import useFetch from '../../hooks/useFetch';
import { doctorAPI } from '../../api/apiService';
import '../Common/Dashboard.css';

const DoctorDashboard = () => {
  const { data: dashboard, loading, error } = useFetch(() => doctorAPI.dashboard());
  const { data: appointments } = useFetch(() => doctorAPI.appointments());

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Doctor Dashboard</h1>
        <p>Manage your appointments and schedules</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>Today's Appointments</h3>
          <p className="stat-number">{dashboard?.todays_appointments || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Appointments</h3>
          <p className="stat-number">{appointments?.length || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Reviews</h3>
          <p className="stat-number">{dashboard?.total_reviews || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Rating</h3>
          <p className="stat-number">{dashboard?.average_rating?.toFixed(1) || 'N/A'}</p>
        </div>
      </div>

      <div className="dashboard-actions">
        <a href="/doctor/schedules" className="btn btn-primary">
          Manage Schedules
        </a>
        <a href="/doctor/appointments" className="btn btn-secondary">
          My Appointments
        </a>
        <a href="/doctor/reviews" className="btn btn-secondary">
          Reviews
        </a>
      </div>

      {appointments && appointments.length > 0 && (
        <div className="upcoming-section">
          <h2>Today's Appointments</h2>
          <div className="appointments-list">
            {appointments.slice(0, 3).map(appointment => (
              <div key={appointment.id} className="appointment-card">
                <h4>{appointment.patient?.name}</h4>
                <p>{appointment.time}</p>
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

export default DoctorDashboard;
