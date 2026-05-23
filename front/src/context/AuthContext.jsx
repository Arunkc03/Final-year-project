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
    console.log('🔐 AuthContext.login() called with:', { userId: userData?.id, role: userData?.role });
    
    // Save to state
    setUser(userData);
    setToken(authToken);
    setDashboardRoute(dashboard);
    
    // Also save directly to localStorage immediately (don't rely on useEffect)
    console.log('💾 Saving to localStorage immediately...');
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    localStorage.setItem('dashboardRoute', dashboard);
    console.log('✅ Data saved to localStorage');
    console.log('📍 Verify localStorage.user:', localStorage.getItem('user'));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setDashboardRoute(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('dashboardRoute');
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, dashboardRoute, loading, setLoading, login, logout, updateUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
