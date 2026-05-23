import React, { useState, useContext } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import hospitalImage from '../assets/images/hospital.jpg';
import '../styles/Auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const loginData = { email, password };

    console.log('🔐 Attempting login with:', loginData);

    try {
      console.log('📡 Calling api.login...');
      const response = await api.login(loginData);
      console.log('✅ Login response received:', { status: response.status, userRole: response.user?.role, userId: response.user?.id });
      
      if (response.status === 'success') {
        const user = response.user;
        const token = response.token;
        const dashboardUrl = response.dashboard;
        
        console.log('👤 User object:', { id: user.id, email: user.email, role: user.role, hasRole: !!user.role });
        console.log('📊 Backend dashboard route:', dashboardUrl);
        console.log('💾 Saving to localStorage and context...');
        
        // First, call login to update the context and localStorage
        login(user, token, dashboardUrl);
        console.log('✅ Login context updated, token and user saved to localStorage');
        console.log('📍 localStorage.token:', localStorage.getItem('token')?.substring(0, 20) + '...');
        console.log('📍 localStorage.user:', localStorage.getItem('user'));
        
        // Check for redirect URL (e.g., booking flow)
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
          console.log('↩️ Redirect parameter found:', redirectUrl);
          setTimeout(() => {
            navigate(redirectUrl);
          }, 100);
          return;
        }
        
        // Use the dashboard URL from the backend response
        if (dashboardUrl) {
          console.log('🚀 Redirecting to:', dashboardUrl, '(from backend)');
          // Use setTimeout to ensure context is updated before navigating
          setTimeout(() => {
            console.log('⏰ Redirect timeout triggered, calling navigate()');
            navigate(dashboardUrl);
          }, 100);
        } else {
          console.warn('⚠️ No dashboard URL provided by backend, using fallback');
          setTimeout(() => {
            navigate('/dashboard');
          }, 100);
        }
      } else {
        setError(response.message || 'Login failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Error connecting to server. Make sure backend is running on port 8000.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Left Side - Image */}
      <div className="auth-split-image-side">
        <img src={hospitalImage} alt="Hospital" />
      </div>

      {/* Right Side - Form */}
      <div className="auth-split-form-side">
        <div className="auth-split-form-container">
          <Link to="/" className="back-to-home">← Back to Home</Link>

          {/* Tabs */}
          <div className="auth-split-tabs">
            <button className="auth-split-tab active">Sign In</button>
            <button type="button" className="auth-split-tab" onClick={() => navigate('/register')}>Sign Up</button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Checkbox + Forgot */}
            <div className="auth-split-options">
              <label className="auth-checkbox">
                <input type="checkbox" />
                Keep me logged in
              </label>
              <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
            </div>

            {/* Sign In Button */}
            <button type="submit" className="btn-split-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* Google Button */}
          <button
            type="button"
            className="google-btn"
            onClick={() => {
              localStorage.setItem('google_auth_mode', 'login');
              window.location.href = `${API_URL}/auth/google?mode=login`;
            }}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Footer */}
          <p className="auth-footer">
            New patient?{' '}
            <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;