import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

// Helper to safely parse JSON from localStorage
const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [dashboardRoute, setDashboardRoute] = useState(localStorage.getItem('dashboardRoute') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    if (dashboardRoute) {
      localStorage.setItem('dashboardRoute', dashboardRoute);
    } else {
      localStorage.removeItem('dashboardRoute');
    }
  }, [dashboardRoute]);

  const login = (userData, authToken, dashboard) => {
    setUser(userData);
    setToken(authToken);
    setDashboardRoute(dashboard);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setDashboardRoute(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('dashboardRoute');
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, dashboardRoute, loading, setLoading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
