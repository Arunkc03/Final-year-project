import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navigation from './components/Common/Navigation';
import Home from './pages/Home';
import Register from './pages/register';
import Login from './pages/login';
import GoogleCallback from './components/Auth/GoogleCallback';
import Dashboard from './pages/Dashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import Hospitals from './pages/Hospitals';
import Doctors from './pages/Doctors';
import DoctorDetail from './pages/DoctorDetail';
import HospitalDetail from './pages/HospitalDetail';
import BrowseHospitals from './pages/BrowseHospitals';
import BrowseDoctors from './pages/BrowseDoctors';
import HospitalView from './pages/HospitalView';
import DoctorView from './pages/DoctorView';
import HospitalDepartments from './pages/HospitalDepartments';
import DepartmentDoctors from './pages/DepartmentDoctors';
import BookAppointment from './pages/BookAppointment';
import Reports from './pages/Reports';
import DoctorSchedules from './pages/DoctorSchedules';

import { PaymentVerify } from './components/Payment';
import './styles/theme.css';
import './App.css';

// Wrapper component to conditionally show navbar
const AppContent = () => {
  const location = useLocation();
  const hideNavbarPaths = ['/login', '/register', '/auth/google/callback', '/payment/verify', '/payment/success'];
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  return (
    <>
      {!shouldHideNavbar && <Navigation />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
        <Route path="/dashboard/patient" element={<PatientDashboard />} />
        {/* Admin/Super Admin management routes */}
        <Route path="/hospitals" element={<Hospitals />} />
        <Route path="/hospitals/:id" element={<HospitalDetail />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:id" element={<DoctorDetail />} />
        {/* Public browse routes - no login required */}
        <Route path="/browse-hospitals" element={<BrowseHospitals />} />
        <Route path="/browse-doctors" element={<BrowseDoctors />} />
        <Route path="/hospital/:id" element={<HospitalView />} />
        {/* Doctor schedules - must be before /doctor/:id */}
        <Route path="/doctor/schedules" element={<DoctorSchedules />} />
        <Route path="/doctor/:id" element={<DoctorView />} />
        {/* Patient booking flow routes */}
        <Route path="/hospital/:id/departments" element={<HospitalDepartments />} />
        <Route path="/department/:id/doctors" element={<DepartmentDoctors />} />
        <Route path="/book-appointment/:id" element={<BookAppointment />} />
        {/* Reports */}
        <Route path="/my-reports" element={<Reports />} />
        <Route path="/reports" element={<Reports />} />
        {/* Notifications */}
        
        {/* Payment */}
        <Route path="/payment/verify" element={<PaymentVerify />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;