/**
 * Navigation Component
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import logo from '../../assets/images/Doctorsathi.png';
import './Navigation.css';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <img src={logo} alt="Doctor Sathi" className="nav-logo-img" />
        </Link>

        <div className={`nav-menu ${showMenu ? 'active' : ''}`}>
          {!isAuthenticated ? (
            <div className="nav-menu-right">
              <Link to="/login" className="nav-link nav-btn">
                Login
              </Link>
              <Link to="/register" className="nav-link nav-btn-primary">
                Register
              </Link>
            </div>
          ) : (
            <>
              <div className="nav-menu-left">
                {user?.role === 'patient' && (
                  <Link to="/dashboard/patient" className="nav-link">
                    My Dashboard
                  </Link>
                )}
                {user?.role === 'doctor' && (
                  <Link to="/dashboard/doctor" className="nav-link">
                    Doctor Portal
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/dashboard/admin" className="nav-link">
                    Admin Panel
                  </Link>
                )}
                {user?.role === 'super_admin' && (
                  <Link to="/dashboard/super-admin" className="nav-link">
                    Super Admin
                  </Link>
                )}
              </div>

              <div className="nav-menu-right">
                <span className="nav-user-name">Welcome, {user?.name}</span>
                <button onClick={handleLogout} className="nav-link nav-btn-logout">
                  Logout
                </button>
              </div>
            </>
          )}
        </div>

        <button className={`hamburger ${showMenu ? 'active' : ''}`} onClick={() => setShowMenu(!showMenu)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
