import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import '../styles/DoctorDashboard.css';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
  
  // Report modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    diagnosis: '',
    treatment: '',
    notes: ''
  });
  const [reportFile, setReportFile] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!token || user?.role !== 'doctor') {
      navigate('/login');
      return;
    }
    fetchDashboard();
  }, [token, user, navigate]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashResponse, apptResponse] = await Promise.all([
        api.getDashboard('/dashboard/doctor', token),
        api.getDoctorAppointments(token)
      ]);
      
      if (dashResponse.status === 'success') {
        setDashboardData(dashResponse.data);
      } else {
        setError(dashResponse.message || 'Failed to load dashboard');
      }

      if (apptResponse.status === 'success') {
        setAppointments(apptResponse.data?.data || apptResponse.data || []);
      }
    } catch (err) {
      setError('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAppointment = async (appointmentId) => {
    setActionLoading(appointmentId);
    setActionMessage({ type: '', text: '' });
    try {
      const response = await api.acceptAppointment(appointmentId, '', token);
      if (response.status === 'success') {
        setActionMessage({ type: 'success', text: 'Appointment approved!' });
        // Update the appointment in the list
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'confirmed' } : apt
        ));
      } else {
        setActionMessage({ type: 'error', text: response.message || 'Failed to approve' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Error approving appointment' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectAppointment = async (appointmentId) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    setActionLoading(appointmentId);
    setActionMessage({ type: '', text: '' });
    try {
      const response = await api.rejectAppointment(appointmentId, reason, token);
      if (response.status === 'success') {
        setActionMessage({ type: 'success', text: 'Appointment declined!' });
        // Update the appointment in the list
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
        ));
      } else {
        setActionMessage({ type: 'error', text: response.message || 'Failed to decline' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Error declining appointment' });
    } finally {
      setActionLoading(null);
    }
  };

  // Report handling functions
  const openReportModal = (appointment) => {
    setSelectedPatient(appointment);
    setReportForm({
      title: `Medical Report - ${appointment.user?.name || 'Patient'}`,
      description: '',
      diagnosis: '',
      treatment: '',
      notes: ''
    });
    setReportFile(null);
    setReportMessage({ type: '', text: '' });
    setShowReportModal(true);
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedPatient(null);
    setReportForm({
      title: '',
      description: '',
      diagnosis: '',
      treatment: '',
      notes: ''
    });
    setReportFile(null);
    setReportMessage({ type: '', text: '' });
  };

  const handleReportFormChange = (e) => {
    const { name, value } = e.target;
    setReportForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setReportFile(e.target.files[0]);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setReportLoading(true);
    setReportMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('patient_id', selectedPatient.user_id);
      formData.append('appointment_id', selectedPatient.id);
      formData.append('title', reportForm.title);
      formData.append('description', reportForm.description);
      formData.append('diagnosis', reportForm.diagnosis);
      formData.append('treatment', reportForm.treatment);
      formData.append('notes', reportForm.notes);
      if (reportFile) {
        formData.append('file', reportFile);
      }

      const response = await api.uploadReport(formData, token);
      if (response.status === 'success') {
        setReportMessage({ type: 'success', text: 'Report submitted successfully!' });
        setTimeout(() => {
          closeReportModal();
          fetchDashboard(); // Refresh data
        }, 1500);
      } else {
        setReportMessage({ type: 'error', text: response.message || 'Failed to submit report' });
      }
    } catch (err) {
      setReportMessage({ type: 'error', text: 'Error submitting report' });
    } finally {
      setReportLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout(token);
    } catch (err) {
      console.error('Logout error:', err);
    }
    logout();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null;

  return (
    <div className="doctor-dashboard-page">
      <PageHero 
        title={`Dr. ${user.name}`} 
        subtitle="Manage your medical practice, patient reports, and appointments."
      />
      <div className="doctor-dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>👨‍⚕️ Doctor Dashboard</h1>
            <p>Manage your medical practice and patient reports</p>
          </div>
          <div className="header-actions">
            <span className="user-info">{user.name}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </header>

      <main className="dashboard-main">
        {error && <div className="error-message">{error}</div>}

        {/* Doctor Info Card */}
        <section className="doctor-info">
          <div className="info-card">
            <h2>Your Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Doctor ID</span>
                <span className="info-value">{user.identifier || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Name</span>
                <span className="info-value">{user.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{user.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Hospital ID</span>
                <span className="info-value">{dashboardData?.hospital_id || 'N/A'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="stats-section">
          <h2>Quick Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">�</div>
              <div className="stat-info">
                <h3>Total Appointments</h3>
                <p className="stat-value">{appointments.length}</p>
                <p className="stat-desc">All appointments</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>Pending</h3>
                <p className="stat-value">{appointments.filter(a => a.status === 'pending').length}</p>
                <p className="stat-desc">Awaiting approval</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>Confirmed</h3>
                <p className="stat-value">{appointments.filter(a => a.status === 'confirmed').length}</p>
                <p className="stat-desc">Approved appointments</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <h3>Your Reports</h3>
                <p className="stat-value">{dashboardData?.reports_count || 0}</p>
                <p className="stat-desc">Reports submitted</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button onClick={() => navigate('/my-reports')} className="action-card primary">
              <span className="action-icon">📤</span>
              <span className="action-text">Upload Report</span>
              <span className="action-desc">Submit patient report</span>
            </button>
            <button onClick={() => navigate('/reports')} className="action-card">
              <span className="action-icon">📋</span>
              <span className="action-text">View My Reports</span>
              <span className="action-desc">See all submissions</span>
            </button>
            <button onClick={() => navigate('/reports')} className="action-card">
              <span className="action-icon">👥</span>
              <span className="action-text">Patient Records</span>
              <span className="action-desc">Access patient data</span>
            </button>
            <button onClick={() => navigate('/doctor/schedules')} className="action-card">
              <span className="action-icon">🗓️</span>
              <span className="action-text">Manage Schedules</span>
              <span className="action-desc">Set availability</span>
            </button>
            <button onClick={() => navigate('/')} className="action-card">
              <span className="action-icon">🏠</span>
              <span className="action-text">Home</span>
              <span className="action-desc">Return to home</span>
            </button>
          </div>
        </section>

        {/* Appointments Section */}
        <section className="appointments-section">
          <h2>📅 Your Appointments</h2>
          {actionMessage.text && (
            <div className={`message ${actionMessage.type === 'success' ? 'success-message' : 'error-message'}`}>
              {actionMessage.text}
            </div>
          )}
          {appointments.length === 0 ? (
            <div className="info-box">
              <p>No appointments found.</p>
            </div>
          ) : (
            <div className="appointments-grid">
              {appointments.map((appointment) => (
                <div key={appointment.id} className={`appointment-card status-${appointment.status}`}>
                  <div className="appointment-header">
                    <span className={`status-badge ${appointment.status}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                    <span className="appointment-date">
                      📅 {new Date(appointment.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="appointment-body">
                    <div className="patient-info">
                      <h4>👤 {appointment.user?.name || 'Unknown Patient'}</h4>
                      <p>📧 {appointment.user?.email || 'N/A'}</p>
                      {appointment.user?.phone && <p>📞 {appointment.user.phone}</p>}
                    </div>
                    <div className="appointment-details">
                      <p><strong>Time:</strong> {appointment.time || 'Not specified'}</p>
                      {appointment.department?.name && (
                        <p><strong>Department:</strong> {appointment.department.name}</p>
                      )}
                      {appointment.hospital?.name && (
                        <p><strong>Hospital:</strong> {appointment.hospital.name}</p>
                      )}
                      {appointment.reason && (
                        <p><strong>Reason:</strong> {appointment.reason}</p>
                      )}
                      {appointment.notes && (
                        <p><strong>Notes:</strong> {appointment.notes}</p>
                      )}
                    </div>
                  </div>
                  {appointment.status === 'pending' && (
                    <div className="appointment-actions">
                      <button
                        onClick={() => handleAcceptAppointment(appointment.id)}
                        disabled={actionLoading === appointment.id}
                        className="btn-approve"
                      >
                        {actionLoading === appointment.id ? '...' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectAppointment(appointment.id)}
                        disabled={actionLoading === appointment.id}
                        className="btn-decline"
                      >
                        {actionLoading === appointment.id ? '...' : '✗ Decline'}
                      </button>
                    </div>
                  )}
                  {appointment.status === 'confirmed' && (
                    <div className="appointment-actions-row">
                      <div className="appointment-status-info confirmed">
                        ✓ Appointment Confirmed
                      </div>
                      <button
                        onClick={() => openReportModal(appointment)}
                        className="btn-report"
                      >
                        📋 Handle Report
                      </button>
                    </div>
                  )}
                  {(appointment.status === 'rejected' || appointment.status === 'cancelled') && (
                    <div className="appointment-status-info rejected">
                      ✗ Appointment Declined
                      {(appointment.cancellation_reason || appointment.rejection_reason) && (
                        <span className="rejection-reason">Reason: {appointment.cancellation_reason || appointment.rejection_reason}</span>
                      )}
                    </div>
                  )}
                  {appointment.status === 'completed' && (
                    <div className="appointment-actions-row">
                      <div className="appointment-status-info completed">
                        ✓ Completed
                      </div>
                      <button
                        onClick={() => openReportModal(appointment)}
                        className="btn-report"
                      >
                        📋 Add Report
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Login Credentials Info */}
        <section className="info-section">
          <div className="info-card">
            <h3>📝 Login Information</h3>
            <div className="login-info">
              <div className="login-item">
                <p><strong>Your Doctor ID:</strong> {user.identifier}</p>
                <p className="desc">Use this ID to login with your password</p>
              </div>
              <div className="login-item">
                <p><strong>Email:</strong> {user.email}</p>
                <p className="desc">Alternative login method</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features-section">
          <h2>Your Capabilities</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>📤 Report Upload</h3>
              <p>Submit patient medical reports with attached files. Keep all medical records organized.</p>
            </div>
            <div className="feature-card">
              <h3>👥 Patient Records</h3>
              <p>Access and view patient medical histories and information securely.</p>
            </div>
            <div className="feature-card">
              <h3>📊 Report Status</h3>
              <p>Track the status of your submitted reports and admin reviews.</p>
            </div>
            <div className="feature-card">
              <h3>🔐 Secure Access</h3>
              <p>All data is encrypted and access is controlled by hospital administrators.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Report Modal */}
      {showReportModal && selectedPatient && (
        <div className="modal-overlay" onClick={closeReportModal}>
          <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Create Patient Report</h2>
              <button className="close-modal-btn" onClick={closeReportModal}>&times;</button>
            </div>
            
            <div className="patient-summary">
              <p><strong>Patient:</strong> {selectedPatient.user?.name || 'Unknown'}</p>
              <p><strong>Email:</strong> {selectedPatient.user?.email || 'N/A'}</p>
              <p><strong>Appointment Date:</strong> {new Date(selectedPatient.date).toLocaleDateString()}</p>
              {selectedPatient.reason && <p><strong>Reason:</strong> {selectedPatient.reason}</p>}
            </div>

            {reportMessage.text && (
              <div className={`message ${reportMessage.type === 'success' ? 'success-message' : 'error-message'}`}>
                {reportMessage.text}
              </div>
            )}
            
            <form onSubmit={handleSubmitReport} className="report-form">
              <div className="form-group">
                <label>Report Title *</label>
                <input
                  type="text"
                  name="title"
                  value={reportForm.title}
                  onChange={handleReportFormChange}
                  placeholder="Report title"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Diagnosis *</label>
                <textarea
                  name="diagnosis"
                  value={reportForm.diagnosis}
                  onChange={handleReportFormChange}
                  placeholder="Enter diagnosis..."
                  rows="3"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Treatment Plan</label>
                <textarea
                  name="treatment"
                  value={reportForm.treatment}
                  onChange={handleReportFormChange}
                  placeholder="Enter treatment plan..."
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={reportForm.description}
                  onChange={handleReportFormChange}
                  placeholder="Additional description..."
                  rows="2"
                />
              </div>
              
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={reportForm.notes}
                  onChange={handleReportFormChange}
                  placeholder="Any additional notes..."
                  rows="2"
                />
              </div>
              
              <div className="form-group">
                <label>Attach File (PDF, Image, etc.)</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {reportFile && <span className="file-name">Selected: {reportFile.name}</span>}
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={closeReportModal} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={reportLoading} className="btn-submit">
                  {reportLoading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
