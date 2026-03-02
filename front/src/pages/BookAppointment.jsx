import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import '../styles/PatientDashboard.css';

const BookAppointment = () => {
  const navigate = useNavigate();
  const { id: doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const hospitalId = searchParams.get('hospital_id');
  const departmentId = searchParams.get('department_id');
  const { user, token } = useContext(AuthContext);
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    hospital_id: hospitalId || '',
    doctor_id: doctorId || '',
    department_id: departmentId || '',
    date: '',
    time: '',
    reason: '',
  });

  useEffect(() => {
    if (!token || user?.role !== 'patient') {
      navigate('/login');
      return;
    }
    fetchDoctor();
    fetchDoctorSchedules();
  }, [token, user, doctorId, navigate]);

  const fetchDoctorSchedules = async () => {
    if (!doctorId) return;
    try {
      const response = await api.getDoctorSchedules(doctorId);
      console.log('Doctor schedules:', response);
      if (response.status === 'success') {
        setSchedules(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    }
  };

  useEffect(() => {
    if (!token || user?.role !== 'patient') {
      navigate('/login');
      return;
    }
    fetchDoctor();
  }, [token, user, doctorId, navigate]);

  const fetchDoctor = async () => {
    if (!doctorId) {
      setError('No doctor ID provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      console.log('Fetching doctor with ID:', doctorId);
      const response = await api.getDoctor(doctorId, token);
      console.log('Doctor API response:', response);
      
      if (response.status === 'success' && response.data) {
        console.log('Setting doctor from response.data:', response.data);
        setDoctor(response.data);
        // Update form with doctor's department and hospital
        setAppointmentForm(prev => ({
          ...prev,
          doctor_id: doctorId,
          department_id: response.data.department_id || departmentId,
          hospital_id: response.data.hospital_id || hospitalId,
        }));
      } else if (response.doctor) {
        // Alternative response format
        console.log('Setting doctor from response.doctor:', response.doctor);
        setDoctor(response.doctor);
        setAppointmentForm(prev => ({
          ...prev,
          doctor_id: doctorId,
          department_id: response.doctor.department_id || departmentId,
          hospital_id: response.doctor.hospital_id || hospitalId,
        }));
      } else if (response.id) {
        // Direct doctor object
        console.log('Setting doctor from direct object:', response);
        setDoctor(response);
        setAppointmentForm(prev => ({
          ...prev,
          doctor_id: doctorId,
          department_id: response.department_id || departmentId,
          hospital_id: response.hospital_id || hospitalId,
        }));
      } else if (response.message) {
        // Error message from API
        console.error('API error:', response.message);
        setError('Failed to load doctor: ' + response.message);
      } else {
        console.error('Unexpected response format:', response);
        setError('Failed to load doctor details - unexpected response');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Error loading doctor details: ' + (err.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAppointmentForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleScheduleSelect = (schedule) => {
    setSelectedSchedule(schedule);
    setAppointmentForm(prev => ({
      ...prev,
      date: schedule.date,
      time: schedule.start_time?.slice(0, 5) || '',
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!appointmentForm.date || !appointmentForm.time) {
      setError('Please select date and time');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Submitting appointment:', appointmentForm);
      const response = await api.bookAppointment(appointmentForm, token);
      console.log('Appointment response:', response);
      if (response.status === 'success') {
        // Store the appointment and show payment modal
        setCreatedAppointment(response.appointment);
        setShowPaymentModal(true);
      } else {
        // Show validation errors if present
        if (response.errors) {
          const errorMessages = Object.values(response.errors).flat().join(', ');
          setError(errorMessages);
        } else {
          setError(response.message || 'Failed to book appointment');
        }
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('Error booking appointment: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      setSuccess('Payment successful! Your appointment is confirmed.');
      setShowPaymentModal(false);
      setTimeout(() => {
        navigate('/dashboard/patient');
      }, 2000);
    } catch (err) {
      setError('Error completing payment. Please contact support.');
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setCreatedAppointment(null);
  };

  const handleKhaltiPayment = async () => {
    if (!createdAppointment) {
      console.error('No appointment created yet');
      setError('No appointment found. Please try again.');
      return;
    }
    
    try {
      setBookingLoading(true);
      setError('');
      const amount = getConsultationFee();
      
      console.log('Initiating Khalti payment:', {
        appointment_id: createdAppointment.id,
        amount: amount,
        token: token ? 'present' : 'missing'
      });
      
      // Initiate Khalti payment
      const paymentResponse = await api.khalti.initiate({
        appointment_id: createdAppointment.id,
        amount: amount
      }, token);

      console.log('Payment initiate response:', paymentResponse);

      if (paymentResponse.status === 'success' && paymentResponse.data?.payment_url) {
        console.log('Redirecting to Khalti:', paymentResponse.data.payment_url);
        // Redirect to Khalti payment page
        window.location.href = paymentResponse.data.payment_url;
      } else if (paymentResponse.data?.payment_url) {
        // Handle alternative response format
        console.log('Redirecting to Khalti (alt format):', paymentResponse.data.payment_url);
        window.location.href = paymentResponse.data.payment_url;
      } else {
        console.error('Invalid response format:', paymentResponse);
        setError(paymentResponse.message || 'Failed to initiate payment. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      console.error('Error details:', err.message, err.stack);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBack = () => {
    if (departmentId && hospitalId) {
      navigate(`/department/${departmentId}/doctors?hospital_id=${hospitalId}`);
    } else {
      navigate('/dashboard/patient');
    }
  };

  // Get consultation fee from doctor
  const getConsultationFee = () => {
    return doctor?.consultation_fee || 500;
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="patient-dashboard-page">
      <PageHero 
        title="Book Appointment" 
        subtitle={`Schedule your appointment with ${doctor?.name || doctor?.user?.name || 'Doctor'}`}
      />
      <div className="patient-dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>📅 Book Appointment</h1>
            <p>Schedule your visit</p>
          </div>
          <div className="header-actions">
            <button onClick={handleBack} className="btn-secondary">
              ← Back to Doctors
            </button>
          </div>
        </header>

        <main className="dashboard-main">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Doctor Info */}
          {doctor && (
            <section className="patient-info">
              <div className="info-card">
                <h2>Doctor Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name</span>
                    <span className="info-value">{doctor.name || doctor.user?.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">{doctor.email || doctor.user?.email}</span>
                  </div>
                  {doctor.qualification && (
                    <div className="info-item">
                      <span className="info-label">Qualification</span>
                      <span className="info-value">{doctor.qualification}</span>
                    </div>
                  )}
                  {doctor.experience_years && (
                    <div className="info-item">
                      <span className="info-label">Experience</span>
                      <span className="info-value">{doctor.experience_years} years</span>
                    </div>
                  )}
                  {doctor.consultation_fee && (
                    <div className="info-item">
                      <span className="info-label">Consultation Fee</span>
                      <span className="info-value">${doctor.consultation_fee}</span>
                    </div>
                  )}
                  {doctor.department?.name && (
                    <div className="info-item">
                      <span className="info-label">Department</span>
                      <span className="info-value">{doctor.department.name}</span>
                    </div>
                  )}
                  {doctor.hospital?.name && (
                    <div className="info-item">
                      <span className="info-label">Hospital</span>
                      <span className="info-value">{doctor.hospital.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Appointment Form */}
          <section className="appointment-section">
            <div className="section-header">
              <h2>📋 Appointment Details</h2>
              <p>Select your preferred date and time</p>
            </div>

            {/* Available Schedules */}
            {schedules.length > 0 && (
              <div className="schedules-section" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#1e3a5f' }}>📅 Available Time Slots</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {schedules.map(schedule => (
                    <div 
                      key={schedule.id}
                      onClick={() => handleScheduleSelect(schedule)}
                      style={{
                        padding: '1rem',
                        border: selectedSchedule?.id === schedule.id ? '2px solid #4a90a4' : '1px solid #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        backgroundColor: selectedSchedule?.id === schedule.id ? '#e8f4f8' : 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: '600', color: '#1e3a5f', marginBottom: '0.5rem' }}>
                        {formatDate(schedule.date)}
                      </div>
                      <div style={{ color: '#4a90a4', fontWeight: '500' }}>
                        {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                        {schedule.available_slots} slots available
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {schedules.length === 0 && (
              <div style={{ padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ color: '#856404', margin: 0 }}>
                  ℹ️ No pre-defined schedules available. You can still request an appointment time below.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="appointment-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Appointment Date *</label>
                  <input 
                    type="date" 
                    name="date"
                    value={appointmentForm.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Appointment Time *</label>
                  <input 
                    type="time" 
                    name="time"
                    value={appointmentForm.time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason for Visit</label>
                <textarea 
                  name="reason"
                  value={appointmentForm.reason}
                  onChange={handleChange}
                  placeholder="Describe your reason for the appointment..."
                  rows="4"
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="btn-primary btn-book"
                disabled={submitting}
              >
                {submitting ? 'Booking...' : '📅 Confirm Appointment'}
              </button>
            </form>
          </section>
        </main>

        {/* Payment Modal */}
        {showPaymentModal && createdAppointment && (
          <div className="modal-overlay">
            <div className="modal-payment">
              <div className="payment-header">
                <h2>💳 Complete Payment</h2>
                <button 
                  className="modal-close"
                  onClick={handlePaymentCancel}
                  disabled={bookingLoading}
                >
                  ✕
                </button>
              </div>

              <div className="payment-content">
                {error && (
                  <div className="error-message" style={{marginBottom: '1.5rem', padding: '1rem', background: '#fee', border: '1px solid #fcc', borderRadius: '6px', color: '#c00'}}>
                    ⚠️ {error}
                  </div>
                )}
                
                <div className="appointment-summary">
                  <h3>Appointment Summary</h3>
                  <div className="summary-item">
                    <span className="label">Doctor:</span>
                    <span className="value">{doctor?.name || doctor?.user?.name || 'Dr. Unknown'}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Date:</span>
                    <span className="value">{createdAppointment.date}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Time:</span>
                    <span className="value">{createdAppointment.time}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Consultation Fee:</span>
                    <span className="value amount">Rs. {getConsultationFee()}</span>
                  </div>
                </div>

                <p className="payment-notice">
                  ⚠️ Complete payment to confirm your appointment. Your appointment will be auto-confirmed after successful payment.
                </p>

                <div className="payment-options">
                  <button 
                    className="khalti-pay-btn"
                    onClick={handleKhaltiPayment}
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? 'Processing...' : '💳 Pay with Khalti'}
                  </button>
                  
                  <button 
                    className="btn-cancel-payment"
                    onClick={handlePaymentCancel}
                    disabled={bookingLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="success-modal-overlay">
            <div className="success-modal">
              <div className="success-icon">✓</div>
              <h2>{success}</h2>
              <p>Redirecting to dashboard...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
