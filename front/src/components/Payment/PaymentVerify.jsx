/**
 * PaymentVerify Component
 * Handles the callback from Khalti after payment
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import useKhalti from '../../hooks/useKhalti';
import './PaymentVerify.css';

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment, loading } = useKhalti();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, failed, error
  const [message, setMessage] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    const pidx = searchParams.get('pidx');
    const khaltiStatus = searchParams.get('status');
    const transactionId = searchParams.get('transaction_id');
    const amount = searchParams.get('amount');
    const purchaseOrderId = searchParams.get('purchase_order_id');

    if (!pidx) {
      setStatus('error');
      setMessage('Invalid payment callback. No payment reference found.');
      return;
    }

    // Check if user canceled
    if (khaltiStatus === 'User canceled') {
      setStatus('failed');
      setMessage('Payment was canceled by user.');
      return;
    }

    // Verify the payment
    const verify = async () => {
      try {
        const response = await verifyPayment(pidx);
        
        if (response.status === 'success') {
          const data = response.data;
          setPaymentDetails({
            paymentId: data.payment_id,
            transactionId: data.transaction_id || transactionId,
            amount: data.amount || (amount ? parseFloat(amount) / 100 : 0),
            status: data.status,
          });

          if (data.status === 'completed') {
            setStatus('success');
            setMessage('Payment completed successfully!');
          } else if (data.status === 'pending') {
            setStatus('verifying');
            setMessage('Payment is being processed. This may take a moment.');
            // Poll for status updates
            setTimeout(() => verify(), 3000);
          } else {
            setStatus('failed');
            setMessage(response.message || 'Payment was not completed.');
          }
        } else {
          setStatus('failed');
          setMessage(response.message || 'Payment verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Failed to verify payment. Please contact support.');
      }
    };

    verify();
  }, [searchParams, verifyPayment]);

  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return (
          <div className="status-icon success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="status-icon failed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="status-icon error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="status-icon verifying">
            <div className="spinner"></div>
          </div>
        );
    }
  };

  return (
    <div className="payment-verify-container">
      <div className="payment-verify-card">
        {getStatusIcon()}
        
        <h1 className={`status-title ${status}`}>
          {status === 'verifying' && 'Verifying Payment...'}
          {status === 'success' && 'Payment Successful!'}
          {status === 'failed' && 'Payment Failed'}
          {status === 'error' && 'Error'}
        </h1>
        
        <p className="status-message">{message}</p>

        {paymentDetails && status === 'success' && (
          <div className="payment-details">
            <div className="detail-row">
              <span className="detail-label">Transaction ID</span>
              <span className="detail-value">{paymentDetails.transactionId || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Amount Paid</span>
              <span className="detail-value amount">NPR {parseFloat(paymentDetails.amount).toLocaleString('en-NP', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className="detail-value status-badge success">Completed</span>
            </div>
          </div>
        )}

        <div className="action-buttons">
          {status === 'success' && (
            <>
              <Link to="/dashboard/patient" className="btn btn-primary">
                Go to Dashboard
              </Link>
              <Link to="/appointments" className="btn btn-secondary">
                View Appointments
              </Link>
            </>
          )}
          
          {(status === 'failed' || status === 'error') && (
            <>
              <button 
                className="btn btn-primary"
                onClick={() => navigate(-1)}
              >
                Try Again
              </button>
              <Link to="/dashboard/patient" className="btn btn-secondary">
                Go to Dashboard
              </Link>
            </>
          )}

          {status === 'verifying' && (
            <p className="verifying-note">
              Please wait while we confirm your payment...
            </p>
          )}
        </div>

        <div className="powered-by">
          <span>Powered by</span>
          <img 
            src="https://khalti.com/static/khalti-logo.png" 
            alt="Khalti" 
            className="khalti-logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentVerify;
