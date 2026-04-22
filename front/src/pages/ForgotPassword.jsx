import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import hospitalImage from '../assets/images/hospital.jpg';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.forgotPassword(email);
      setSuccess(response.message || 'If this email is registered, a password reset link has been sent.');
    } catch (err) {
      setError(err.message || 'Unable to send reset link.');
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
            <button className="auth-split-tab active">Forgot Password</button>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
              />
            </div>

            <button type="submit" className="btn-split-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
