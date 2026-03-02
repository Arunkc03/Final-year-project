/**
 * Google OAuth Callback Handler
 * Handles the redirect from Google OAuth and stores the authentication token
 */

import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing Google authentication...');
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [userData, setUserData] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [profileData, setProfileData] = useState({
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');
    const isNew = searchParams.get('is_new');

    if (error) {
      setStatus('error');
      setMessage(error);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Store auth data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUserData(user);
        setAuthToken(token);
        
        // Check if this is a new user - show profile form
        if (isNew === 'true' || !user.phone) {
          setStatus('success');
          setShowProfileForm(true);
        } else {
          // Existing user - redirect to dashboard
          let dashboardRoute = user.dashboard || '/dashboard/patient';
          if (!user.dashboard) {
            switch (user.role) {
              case 'super_admin':
                dashboardRoute = '/dashboard/super-admin';
                break;
              case 'admin':
                dashboardRoute = '/dashboard/admin';
                break;
              case 'doctor':
                dashboardRoute = '/dashboard/doctor';
                break;
              default:
                dashboardRoute = '/dashboard/patient';
            }
          }
          
          login(user, token, dashboardRoute);
          setStatus('success');
          setMessage('Login successful! Redirecting...');
          setTimeout(() => navigate(dashboardRoute), 1500);
        }
      } catch (e) {
        setStatus('error');
        setMessage('Failed to process authentication data');
        setTimeout(() => navigate('/login'), 3000);
      }
    } else {
      setStatus('error');
      setMessage('Invalid authentication response');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, navigate, login]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const updatedUser = { ...userData, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        let dashboardRoute = updatedUser.dashboard || '/dashboard/patient';
        login(updatedUser, authToken, dashboardRoute);
        
        setMessage('Profile updated! Redirecting...');
        setShowProfileForm(false);
        setTimeout(() => navigate(dashboardRoute), 1500);
      } else {
        setMessage('Failed to update profile. Please try again.');
      }
    } catch (err) {
      setMessage('Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  const skipProfile = () => {
    let dashboardRoute = userData?.dashboard || '/dashboard/patient';
    login(userData, authToken, dashboardRoute);
    navigate(dashboardRoute);
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'processing' && (
          <>
            <div className="loading-spinner"></div>
            <h2>Processing...</h2>
            <p>{message}</p>
          </>
        )}
        
        {status === 'success' && !showProfileForm && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✓</div>
            <h2 style={{ color: '#28a745' }}>Success!</h2>
            <p>{message}</p>
          </>
        )}

        {status === 'success' && showProfileForm && (
          <>
            <h2>Complete Your Profile</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Welcome {userData?.name}! Please provide additional information.
            </p>
            
            <form onSubmit={handleProfileSubmit} style={{ textAlign: 'left' }}>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={profileData.date_of_birth}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={profileData.gender}
                  onChange={handleProfileChange}
                  style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ddd' }}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  placeholder="Street address"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={profileData.city}
                    onChange={handleProfileChange}
                    placeholder="City"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={profileData.state}
                    onChange={handleProfileChange}
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={profileData.postal_code}
                  onChange={handleProfileChange}
                  placeholder="Postal code"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save & Continue'}
              </button>
              
              <button 
                type="button" 
                onClick={skipProfile}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '10px',
                  background: 'transparent',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                Skip for now
              </button>
            </form>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✗</div>
            <h2 style={{ color: '#dc3545' }}>Error</h2>
            <p>{message}</p>
            <p style={{ fontSize: '14px', color: '#666' }}>Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
