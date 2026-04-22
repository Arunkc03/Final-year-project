import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import hospitalImage from '../assets/images/hospital.jpg';
import '../styles/Auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token || !email) {
      setError('Invalid or missing password reset link.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await api.resetPassword({
        token,
        email,
        password,
        password_confirmation: confirmPassword,
      });

      setSuccess(response.message || 'Password has been reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      <div className="auth-split-image-side">
        <img src={hospitalImage} alt="Hospital" />
      </div>

      <div className="auth-split-form-side">
        <div className="auth-split-form-container">
          <Link to="/login" className="back-to-home">← Back to Login</Link>

          <div className="auth-split-tabs">
            <button className="auth-split-tab active">Reset Password</button>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                minLength={6}
                required
              />
            </div>

            <button type="submit" className="btn-split-primary" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
