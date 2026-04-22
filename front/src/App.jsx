import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Register from './pages/register';
import Login from './pages/login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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
import HospitalView from './pages/HospitalView';
import DoctorView from './pages/DoctorView';
import HospitalDepartments from './pages/HospitalDepartments';
import DepartmentDoctors from './pages/DepartmentDoctors';
import BookAppointment from './pages/BookAppointment';
import Reports from './pages/Reports';
import DoctorSchedules from './pages/DoctorSchedules';

import { PaymentVerify } from './components/Payment';
import './App.css';

const AppContent = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;