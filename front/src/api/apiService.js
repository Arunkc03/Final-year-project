/**
 * API Service - Handles all HTTP requests to the backend
 */

import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========== AUTH ENDPOINTS ==========
export const authAPI = {
  login: (email, password) => API.post('/login', { email, password }),
  register: (data) => API.post('/register', data),
  logout: () => API.post('/logout'),
  profile: () => API.get('/profile'),
  updateProfile: (data) => API.put('/profile', data),
  changePassword: (data) => API.post('/change-password', data),
};

// ========== PATIENT ENDPOINTS ==========
export const patientAPI = {
  appointments: () => API.get('/appointments'),
  appointmentHistory: () => API.get('/appointments-history'),
  bookAppointment: (data) => API.post('/appointments', data),
  viewAppointment: (id) => API.get(`/appointments/${id}`),
  cancelAppointment: (id) => API.post(`/appointments/${id}/cancel`),
  payments: () => API.get('/payments'),
  createPayment: (data) => API.post('/payments', data),
  processPayment: (id, data) => API.post(`/payments/${id}/process`, data),
  reviews: () => API.get('/reviews'),
  writeReview: (data) => API.post('/reviews', data),
  updateReview: (id, data) => API.put(`/reviews/${id}`, data),
  deleteReview: (id) => API.delete(`/reviews/${id}`),
  dashboard: () => API.get('/dashboard/patient'),
};

// ========== DOCTOR ENDPOINTS ==========
export const doctorAPI = {
  appointments: () => API.get('/appointments'),
  viewAppointment: (id) => API.get(`/appointments/${id}`),
  updateAppointmentStatus: (id, data) => API.put(`/appointments/${id}`, data),
  schedules: () => API.get('/schedules'),
  createSchedule: (data) => API.post('/schedules', data),
  updateSchedule: (id, data) => API.put(`/schedules/${id}`, data),
  deleteSchedule: (id) => API.delete(`/schedules/${id}`),
  reviews: () => API.get('/reviews'),
  reports: () => API.get('/reports'),
  createReport: (data) => API.post('/reports', data),
  viewReport: (id) => API.get(`/reports/${id}`),
  dashboard: () => API.get('/dashboard/doctor'),
};

// ========== ADMIN ENDPOINTS ==========
export const adminAPI = {
  // Hospitals
  hospitals: (params) => API.get('/hospitals', { params }),
  createHospital: (data) => API.post('/hospitals', data),
  updateHospital: (id, data) => API.put(`/hospitals/${id}`, data),
  deleteHospital: (id) => API.delete(`/hospitals/${id}`),
  hospitalStats: (id) => API.get(`/hospitals/${id}/statistics`),
  
  // Departments
  departments: (params) => API.get('/departments', { params }),
  createDepartment: (data) => API.post('/departments', data),
  updateDepartment: (id, data) => API.put(`/departments/${id}`, data),
  deleteDepartment: (id) => API.delete(`/departments/${id}`),
  departmentStats: (id) => API.get(`/departments/${id}/statistics`),
  
  // Doctors
  doctors: (params) => API.get('/doctors', { params }),
  createDoctor: (data) => API.post('/doctors', data),
  updateDoctor: (id, data) => API.put(`/doctors/${id}`, data),
  deleteDoctor: (id) => API.delete(`/doctors/${id}`),
  toggleDoctorStatus: (id) => API.post(`/doctors/${id}/toggle-status`),
  
  // Appointments
  appointments: (params) => API.get('/appointments', { params }),
  confirmAppointment: (id) => API.put(`/appointments/${id}/confirm`),
  completeAppointment: (id) => API.put(`/appointments/${id}/complete`),
  cancelAppointment: (id, data) => API.put(`/appointments/${id}/cancel`, data),
  
  // Reports
  reports: (params) => API.get('/reports', { params }),
  approveReport: (id) => API.put(`/reports/${id}/approve`),
  rejectReport: (id) => API.put(`/reports/${id}/reject`),
  
  // Reviews
  reviews: () => API.get('/reviews'),
  approveReview: (id) => API.put(`/reviews/${id}/approve`),
  rejectReview: (id) => API.put(`/reviews/${id}/reject`),
  
  // Payments
  payments: (params) => API.get('/payments', { params }),
  refundPayment: (id) => API.post(`/payments/${id}/refund`),
  paymentStats: () => API.get('/payments-statistics'),
  
  // Users
  users: (params) => API.get('/users', { params }),
  updateUser: (id, data) => API.put(`/users/${id}`, data),
  
  dashboard: () => API.get('/dashboard/admin'),
};

// ========== SUPER ADMIN ENDPOINTS ==========
export const superAdminAPI = {
  // Admin Management
  admins: (params) => API.get('/admins', { params }),
  createAdmin: (data) => API.post('/admins', data),
  updateAdmin: (id, data) => API.put(`/admins/${id}`, data),
  deleteAdmin: (id) => API.delete(`/admins/${id}`),
  
  // System
  logs: (params) => API.get('/system/logs', { params }),
  settings: () => API.get('/system/settings'),
  systemUsers: (params) => API.get('/system/users', { params }),
  systemHospitals: () => API.get('/system/hospitals'),
  systemDepartments: () => API.get('/system/departments'),
  
  dashboard: () => API.get('/dashboard/super-admin'),
};

// ========== PUBLIC ENDPOINTS ==========
export const publicAPI = {
  hospitals: (params) => API.get('/hospitals', { params }),
  hospitalDetail: (id) => API.get(`/hospitals/${id}`),
  doctors: (params) => API.get('/doctors', { params }),
  doctorDetail: (id) => API.get(`/doctors/${id}`),
  doctorReviews: (id) => API.get(`/doctors/${id}/reviews`),
  departments: (params) => API.get('/departments', { params }),
  departmentDetail: (id) => API.get(`/departments/${id}`),
  doctorSchedules: (doctorId) => API.get(`/doctors/${doctorId}/schedules`),
};

// ========== NOTIFICATIONS ==========
export const notificationAPI = {
  getNotifications: (params) => API.get('/notifications', { params }),
  getUnread: () => API.get('/notifications/unread'),
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
  markAsUnread: (id) => API.put(`/notifications/${id}/unread`),
  markAllAsRead: () => API.put('/notifications/mark-all-read'),
  deleteNotification: (id) => API.delete(`/notifications/${id}`),
};

export default API;
