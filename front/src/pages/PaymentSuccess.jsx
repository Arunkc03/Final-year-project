import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/PaymentSuccess.css';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/payment/verify${location.search}`, { replace: true });
  }, [location.search, navigate]);

  return (
    <div className="payment-success-container">
      <div className="payment-card">
        <div className="verifying-state">
          <div className="spinner"></div>
          <h1>Redirecting To Payment Verification</h1>
          <p>Please wait while we confirm your Khalti sandbox payment...</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
