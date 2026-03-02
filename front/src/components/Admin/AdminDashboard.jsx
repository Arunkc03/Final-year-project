/**
 * Admin Dashboard Component
 */

import React from 'react';
import useFetch from '../../hooks/useFetch';
import { adminAPI } from '../../api/apiService';
import '../Common/Dashboard.css';

const AdminDashboard = () => {
  const { data: dashboard, loading, error } = useFetch(() => adminAPI.dashboard());

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Hospital Management System</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>Total Doctors</h3>
          <p className="stat-number">{dashboard?.total_doctors || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Patients</h3>
          <p className="stat-number">{dashboard?.total_patients || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Appointments</h3>
          <p className="stat-number">{dashboard?.total_appointments || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number">{dashboard?.pending_appointments || 0}</p>
        </div>
      </div>

      <div className="dashboard-actions">
        <a href="/admin/hospitals" className="btn btn-primary">
          Hospitals
        </a>
        <a href="/admin/departments" className="btn btn-primary">
          Departments
        </a>
        <a href="/admin/doctors" className="btn btn-secondary">
          Doctors
        </a>
        <a href="/admin/appointments" className="btn btn-secondary">
          Appointments
        </a>
      </div>
    </div>
  );
};

export default AdminDashboard;
