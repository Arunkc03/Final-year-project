import React, { useState } from 'react';
import '../styles/HospitalSystem.css';
import './HospitalSettings.css';

const HospitalSettings = () => {
  const [profileData, setProfileData] = useState({
    firstName: 'Admin',
    lastName: 'Hospital',
    email: 'admin@hospital.com',
    phone: '+1-234-567-8900',
    hospital: 'Central Medical Hospital',
    department: 'Administration',
    position: 'Hospital Administrator'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    appointmentReminders: true,
    newsletters: false,
    smsAlerts: true
  });

  const [editingMode, setEditingMode] = useState({
    profile: false,
    password: false
  });

  const [successMessages, setSuccessMessages] = useState({
    profile: false,
    password: false
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setSuccessMessages(prev => ({ ...prev, profile: true }));
    setEditingMode(prev => ({ ...prev, profile: false }));
    setTimeout(() => {
      setSuccessMessages(prev => ({ ...prev, profile: false }));
    }, 3000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters!');
      return;
    }
    setSuccessMessages(prev => ({ ...prev, password: true }));
    setEditingMode(prev => ({ ...prev, password: false }));
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => {
      setSuccessMessages(prev => ({ ...prev, password: false }));
    }, 3000);
  };

  const handleNotificationSubmit = (e) => {
    e.preventDefault();
    setSuccessMessages(prev => ({ ...prev, notifications: true }));
    setTimeout(() => {
      setSuccessMessages(prev => ({ ...prev, notifications: false }));
    }, 3000);
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-container">
        {/* Profile Settings */}
        <div className="card settings-card">
          <div className="settings-header">
            <h2>Profile Settings</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setEditingMode(prev => ({ ...prev, profile: !prev.profile }))}
            >
              {editingMode.profile ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {successMessages.profile && (
            <div className="success-alert">
              Profile updated successfully
            </div>
          )}

          {editingMode.profile ? (
            <form onSubmit={handleProfileSubmit} className="settings-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="hospital">Hospital</label>
                  <input
                    type="text"
                    id="hospital"
                    name="hospital"
                    value={profileData.hospital}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={profileData.department}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="position">Position</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={profileData.position}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingMode(prev => ({ ...prev, profile: false }))}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="settings-display">
              <div className="setting-row">
                <span className="label">First Name:</span>
                <span className="value">{profileData.firstName}</span>
              </div>
              <div className="setting-row">
                <span className="label">Last Name:</span>
                <span className="value">{profileData.lastName}</span>
              </div>
              <div className="setting-row">
                <span className="label">Email:</span>
                <span className="value">{profileData.email}</span>
              </div>
              <div className="setting-row">
                <span className="label">Phone:</span>
                <span className="value">{profileData.phone}</span>
              </div>
              <div className="setting-row">
                <span className="label">Hospital:</span>
                <span className="value">{profileData.hospital}</span>
              </div>
              <div className="setting-row">
                <span className="label">Department:</span>
                <span className="value">{profileData.department}</span>
              </div>
              <div className="setting-row">
                <span className="label">Position:</span>
                <span className="value">{profileData.position}</span>
              </div>
            </div>
          )}
        </div>

        {/* Password Settings */}
        <div className="card settings-card">
          <div className="settings-header">
            <h2>Change Password</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setEditingMode(prev => ({ ...prev, password: !prev.password }))}
            >
              {editingMode.password ? 'Cancel' : 'Change'}
            </button>
          </div>

          {successMessages.password && (
            <div className="success-alert">
              Password changed successfully
            </div>
          )}

          {editingMode.password ? (
            <form onSubmit={handlePasswordSubmit} className="settings-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password (min 8 characters)"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Update Password</button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingMode(prev => ({ ...prev, password: false }))}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="settings-display">
              <p className="password-hint">Password is protected. Click "Change" to update.</p>
            </div>
          )}
        </div>

        {/* Notification Settings */}
        <div className="card settings-card">
          <div className="settings-header">
            <h2>Notification Preferences</h2>
          </div>

          {successMessages.notifications && (
            <div className="success-alert">
              Notification preferences updated
            </div>
          )}

          <form onSubmit={handleNotificationSubmit} className="settings-form">
            <div className="notification-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={notifications.emailNotifications}
                  onChange={handleNotificationChange}
                />
                <span className="checkbox-text">Email Notifications</span>
              </label>
              <p className="notification-desc">Receive email updates about system changes</p>
            </div>

            <div className="notification-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="appointmentReminders"
                  checked={notifications.appointmentReminders}
                  onChange={handleNotificationChange}
                />
                <span className="checkbox-text">Appointment Reminders</span>
              </label>
              <p className="notification-desc">Get reminders for upcoming appointments</p>
            </div>

            <div className="notification-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="newsletters"
                  checked={notifications.newsletters}
                  onChange={handleNotificationChange}
                />
                <span className="checkbox-text">Newsletters</span>
              </label>
              <p className="notification-desc">Subscribe to our hospital newsletters</p>
            </div>

            <div className="notification-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="smsAlerts"
                  checked={notifications.smsAlerts}
                  onChange={handleNotificationChange}
                />
                <span className="checkbox-text">SMS Alerts</span>
              </label>
              <p className="notification-desc">Receive critical alerts via SMS</p>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save Preferences</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HospitalSettings;
