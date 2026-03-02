/**
 * useKhalti Hook - Custom hook for Khalti payment integration
 * 
 * Handles:
 * - Initiating Khalti payments
 * - Verifying payment status
 * - Managing payment state
 */

import { useState, useCallback } from 'react';
import api from '../services/api';

const useKhalti = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  /**
   * Get Khalti public configuration
   */
  const getConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.khalti.getConfig();
      return response;
    } catch (err) {
      setError(err.message || 'Failed to get Khalti config');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initiate a Khalti payment
   * @param {number} appointmentId - The appointment ID
   * @param {number} amount - Amount in NPR
   * @param {string} token - Auth token
   */
  const initiatePayment = useCallback(async (appointmentId, amount, token) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.khalti.initiate({ 
        appointment_id: appointmentId, 
        amount 
      }, token);

      if (response.status === 'success') {
        setPaymentData(response.data);
        return response;
      } else {
        throw new Error(response.message || 'Payment initiation failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verify a Khalti payment
   * @param {string} pidx - Khalti payment index
   */
  const verifyPayment = useCallback(async (pidx) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.khalti.verify(pidx);
      
      if (response.status === 'success') {
        setPaymentData(response.data);
        return response;
      } else {
        throw new Error(response.message || 'Payment verification failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lookup payment status
   * @param {number} paymentId - Payment ID
   * @param {string} token - Auth token
   */
  const lookupPayment = useCallback(async (paymentId, token) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.khalti.lookup(paymentId, token);
      
      if (response.status === 'success') {
        setPaymentData(response.data);
        return response;
      } else {
        throw new Error(response.message || 'Payment lookup failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to lookup payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Redirect to Khalti payment page
   * @param {string} paymentUrl - Khalti payment URL
   */
  const redirectToKhalti = useCallback((paymentUrl) => {
    if (paymentUrl) {
      window.location.href = paymentUrl;
    } else {
      setError('No payment URL available');
    }
  }, []);

  /**
   * Reset payment state
   */
  const resetPayment = useCallback(() => {
    setPaymentData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    paymentData,
    getConfig,
    initiatePayment,
    verifyPayment,
    lookupPayment,
    redirectToKhalti,
    resetPayment,
  };
};

export default useKhalti;
