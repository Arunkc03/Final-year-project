/**
 * KhaltiPayment Component
 * Handles Khalti payment flow for appointments
 */

import React, { useState, useEffect } from 'react';
import useKhalti from '../../hooks/useKhalti';
import useAuth from '../../hooks/useAuth';
import './KhaltiPayment.css';

const KhaltiPayment = ({ 
  appointmentId, 
  amount, 
  onSuccess, 
  onError, 
  onCancel,
  disabled = false 
}) => {
  const { token } = useAuth();
  const { 
    loading, 
    error, 
    paymentData, 
    initiatePayment, 
    redirectToKhalti,
    resetPayment 
  } = useKhalti();
  
  const [showConfirm, setShowConfirm] = useState(false);

  // Handle payment initiation
  const handlePayWithKhalti = async () => {
    try {
      const response = await initiatePayment(appointmentId, amount, token);
      
      if (response.status === 'success' && response.data?.payment_url) {
        // Redirect to Khalti payment page
        redirectToKhalti(response.data.payment_url);
      }
    } catch (err) {
      if (onError) {
        onError(err.message || 'Payment initiation failed');
      }
    }
  };

  // Handle confirmation
  const handleConfirmPayment = () => {
    setShowConfirm(false);
    handlePayWithKhalti();
  };

  // Handle cancel
  const handleCancel = () => {
    setShowConfirm(false);
    resetPayment();
    if (onCancel) {
      onCancel();
    }
  };

  // Show error effect
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  return (
    <div className="khalti-payment">
      {/* Payment Button */}
      <button
        className="khalti-pay-btn"
        onClick={() => setShowConfirm(true)}
        disabled={disabled || loading}
      >
        {loading ? (
          <>
            <span className="khalti-spinner"></span>
            Processing...
          </>
        ) : (
          <>
            <img 
              src="https://khalti.com/static/khalti-icon.png" 
              alt="Khalti" 
              className="khalti-icon"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            Pay with Khalti
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="khalti-error">
          <span className="error-icon">!</span>
          {error}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="khalti-modal-overlay">
          <div className="khalti-modal">
            <div className="khalti-modal-header">
              <img 
                src="https://khalti.com/static/khalti-logo.png" 
                alt="Khalti" 
                className="khalti-modal-logo"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <h3>Confirm Payment</h3>
            </div>
            
            <div className="khalti-modal-body">
              <div className="khalti-amount">
                <span className="label">Amount to Pay</span>
                <span className="amount">NPR {parseFloat(amount).toLocaleString('en-NP', { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="khalti-info">
                <p>You will be redirected to Khalti's secure payment page.</p>
                <ul>
                  <li>Use your Khalti wallet, mobile banking, or card</li>
                  <li>Complete the payment within 24 hours</li>
                  <li>You'll be redirected back after payment</li>
                </ul>
              </div>
            </div>

            <div className="khalti-modal-footer">
              <button 
                className="khalti-btn-cancel"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="khalti-btn-confirm"
                onClick={handleConfirmPayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Proceed to Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KhaltiPayment;
