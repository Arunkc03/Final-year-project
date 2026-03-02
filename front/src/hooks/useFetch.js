/**
 * useFetch Hook - Custom hook for API calls
 */

import { useState, useEffect } from 'react';

const useFetch = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiCall();
        if (isMounted) {
          setData(response.data.data || response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'An error occurred');
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  const refetch = async () => {
    try {
      setLoading(true);
      const response = await apiCall();
      setData(response.data.data || response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};

export default useFetch;
