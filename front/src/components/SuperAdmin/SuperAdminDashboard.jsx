/**
 * Super Admin Dashboard Component
 */

import React from 'react';
import useFetch from '../../hooks/useFetch';
import { superAdminAPI } from '../../api/apiService';
import '../Common/Dashboard.css';

const SuperAdminDashboard = () => {
  const { data: settings, loading, error } = useFetch(() => superAdminAPI.settings());

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Super Admin Dashboard</h1>
        <p>System Management</p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{settings?.total_users || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Doctors</h3>
          <p className="stat-number">{settings?.total_doctors || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Patients</h3>
          <p className="stat-number">{settings?.total_patients || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Hospitals</h3>
          <p className="stat-number">{settings?.total_hospitals || 0}</p>
        </div>
      </div>

      <div className="dashboard-actions">
        <a href="/super-admin/admins" className="btn btn-primary">
          Admin Accounts
        </a>
        <a href="/super-admin/hospitals" className="btn btn-primary">
          Hospitals
        </a>
        <a href="/super-admin/system/logs" className="btn btn-secondary">
          System Logs
        </a>
        <a href="/super-admin/system/users" className="btn btn-secondary">
          Users
        </a>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
