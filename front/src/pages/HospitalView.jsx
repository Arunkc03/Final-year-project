import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import PageHero from '../components/PageHero/PageHero';
import '../styles/HospitalView.css';

const HospitalView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useContext(AuthContext);
  const bookingRef = useRef(null);
  const [hospital, setHospital] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState({
    doctor_id: '',
    department_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: ''
  });
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.getHospital(id);
        console.log('Hospital API response:', res);
        if (res && res.status === 'success' && res.hospital) {
          setHospital(res.hospital);
          setAdmin(res.admin || null);
          setDepartments(res.departments || []);
          // Extract all doctors from departments
          const allDoctors = (res.departments || []).flatMap(dept => 
            (dept.doctors || []).map(doc => ({
              ...doc,
              department_id: dept.id,
              department_name: dept.name
            }))
          );
          setDoctors(allDoctors);
        } else if (res && res.hospital) {
          // Handle direct response format
          setHospital(res.hospital);
          setAdmin(res.admin || null);
          setDepartments(res.departments || []);
          const allDoctors = (res.departments || []).flatMap(dept => 
            (dept.doctors || []).map(doc => ({
              ...doc,
              department_id: dept.id,
              department_name: dept.name
            }))
          );
          setDoctors(allDoctors);
        } else if (res && !res.status) {
          // Handle case where hospital data is returned directly
          setHospital(res);
        } else {
          setError(res?.message || 'Hospital not found');
        }
      } catch (e) {
        console.error('Error loading hospital:', e);
        setError('Failed to load hospital details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Auto-scroll to booking section if patient is logged in and ?book=true
  useEffect(() => {
    const shouldBook = searchParams.get('book') === 'true';
    if (shouldBook && !loading) {
      if (token && user?.role === 'patient') {
        setShowBooking(true);
        setTimeout(() => {
          bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else if (!token) {
        setShowBooking(true);
        setTimeout(() => {
          bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [searchParams, loading, token, user]);

  const handleBookingChange = (e) => {
    setBooking({ ...booking, [e.target.name]: e.target.value });
  };

  const handleLoginRedirect = () => {
    // Store the return URL to come back after login
    const returnUrl = `/hospital/${id}?book=true`;
    navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
  };

  const handleRegisterRedirect = () => {
    const returnUrl = `/hospital/${id}?book=true`;
    navigate(`/register?redirect=${encodeURIComponent(returnUrl)}`);
  };

  // Step 1: When user clicks "Confirm Booking", show payment modal first
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!token || user?.role !== 'patient') {
      navigate('/login');
      return;
    }

    // Validate booking data
    if (!booking.doctor_id || !booking.appointment_date || !booking.appointment_time) {
      setBookingMessage('Please fill in all required fields');
      return;
    }

    // Show payment modal first - appointment will be created after payment
    setShowPaymentModal(true);
    setBookingMessage('');
  };

  // Step 2: After successful payment, create the appointment
  const handlePaymentSuccess = async (paymentData) => {
    setBookingLoading(true);
    try {
      const response = await api.bookAppointment({
        doctor_id: booking.doctor_id,
        department_id: booking.department_id,
        date: booking.appointment_date,
        time: booking.appointment_time,
        reason: booking.reason,
        hospital_id: id,
        payment_completed: true,
        payment_reference: paymentData?.transaction_id || null
      }, token);

      if (response.status === 'success') {
        setShowPaymentModal(false);
        setCreatedAppointment(response.appointment);
        setBookingMessage('Payment successful! Appointment booked and pending doctor approval.');
        setBooking({
          doctor_id: '',
          department_id: '',
          appointment_date: '',
          appointment_time: '',
          reason: ''
        });
        setTimeout(() => {
          navigate('/dashboard/patient');
        }, 2000);
      } else {
        setBookingMessage(response.message || 'Failed to create appointment after payment');
      }
    } catch (err) {
      setBookingMessage('Error creating appointment. Please contact support with your payment reference.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    setShowPaymentModal(false);
    setBookingMessage(`Payment failed: ${error}. Please try again.`);
  };

  // Handle payment cancel
  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setBookingMessage('Payment cancelled. Complete payment to book your appointment.');
  };

  // Get selected doctor's consultation fee
  const getSelectedDoctorFee = () => {
    const selectedDoctor = doctors.find(d => d.id == booking.doctor_id);
    return selectedDoctor?.consultation_fee || 500;
  };

  // Handle Khalti payment - payment first, then create appointment
  const handleKhaltiPayment = async () => {
    setBookingLoading(true);
    try {
      // First create a pending appointment to get an ID for payment
      const bookingResponse = await api.bookAppointment({
        doctor_id: booking.doctor_id,
        department_id: booking.department_id,
        date: booking.appointment_date,
        time: booking.appointment_time,
        reason: booking.reason,
        hospital_id: id
      }, token);

      if (bookingResponse.status !== 'success') {
        throw new Error(bookingResponse.message || 'Failed to create appointment');
      }

      const appointment = bookingResponse.appointment;
      const amount = appointment.payment_amount || getSelectedDoctorFee();

      // Now initiate Khalti payment
      const paymentResponse = await api.khalti.initiate({
        appointment_id: appointment.id,
        amount: amount
      }, token);

      if (paymentResponse.status === 'success' && paymentResponse.data?.payment_url) {
        // Redirect to Khalti payment page
        window.location.href = paymentResponse.data.payment_url;
      } else {
        throw new Error(paymentResponse.message || 'Failed to initiate payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      handlePaymentError(err.message || 'Payment failed');
    } finally {
      setBookingLoading(false);
    }
  };
  if (error) return <div className="error-message">{error}</div>;
  if (!hospital) return <div className="error-message">Hospital not found</div>;

  return (
    <div className="hospital-view-page">
      <PageHero 
        title={hospital.name} 
        subtitle="View hospital details"
      />

      <div className="hospital-view-container">
        {/* Hospital Info */}
        <div className="hospital-info-section">
          <div className="info-card">
            <h2>Hospital Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Address</span>
                <span className="info-value">{hospital.address || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">City</span>
                <span className="info-value">{hospital.city || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">State</span>
                <span className="info-value">{hospital.state || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone</span>
                <span className="info-value">{hospital.phone || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{hospital.email || 'N/A'}</span>
              </div>
            </div>
            {hospital.description && (
              <div className="description">
                <h3>About</h3>
                <p>{hospital.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Hospital Admin Section */}
        {admin && (
          <div className="admin-section">
            <h2>👨‍💼 Hospital Administrator</h2>
            <div className="admin-card">
              <div className="admin-avatar">👤</div>
              <div className="admin-info">
                <h3>{admin.name}</h3>
                <p>📧 {admin.email}</p>
                {admin.identifier && <p>🆔 {admin.identifier}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Departments Section with Doctors */}
        <div className="departments-section">
          <h2>🏥 Departments & Doctors</h2>
          {departments.length > 0 ? (
            <div className="departments-grid">
              {departments.map((dept) => {
                // Get doctors for this department
                const deptDoctors = doctors.filter(d => d.department_id == dept.id);
                return (
                  <div key={dept.id} className="department-card">
                    <div className="dept-header">
                      <h3>{dept.name}</h3>
                      <span className={`dept-status status-${dept.status || 'active'}`}>
                        {dept.status || 'Active'}
                      </span>
                    </div>
                    {dept.description && <p className="dept-desc">{dept.description}</p>}
                    <div className="dept-stats">
                      {dept.total_beds > 0 && (
                        <span className="dept-stat">
                          🛏️ {dept.available_beds || 0}/{dept.total_beds} beds
                        </span>
                      )}
                      {dept.head_doctor && (
                        <span className="dept-stat">👨‍⚕️ Head: {dept.head_doctor}</span>
                      )}
                    </div>
                    
                    {/* Doctors under this department */}
                    <div className="dept-doctors">
                      <h4>Doctors ({deptDoctors.length})</h4>
                      {deptDoctors.length > 0 ? (
                        <div className="dept-doctors-list">
                          {deptDoctors.map((doctor) => (
                            <div key={doctor.id} className="dept-doctor-item">
                              <div className="doctor-avatar-small">👨‍⚕️</div>
                              <div className="doctor-info-compact">
                                <h5>{doctor.name}</h5>
                                <p>{doctor.qualification || 'Medical Professional'}</p>
                                {doctor.consultation_fee > 0 && (
                                  <span className="fee-small">${doctor.consultation_fee}</span>
                                )}
                              </div>
                              <button 
                                onClick={() => navigate(`/doctor/${doctor.id}`)} 
                                className="btn-view-small"
                              >
                                View
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-doctors-dept">No doctors in this department</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-departments">No departments listed for this hospital yet.</p>
          )}
          
          {/* Show doctors without department */}
          {doctors.filter(d => !d.department_id || !departments.find(dept => dept.id == d.department_id)).length > 0 && (
            <div className="other-doctors-section">
              <h3>Other Doctors</h3>
              <div className="dept-doctors-list">
                {doctors
                  .filter(d => !d.department_id || !departments.find(dept => dept.id == d.department_id))
                  .map((doctor) => (
                    <div key={doctor.id} className="dept-doctor-item">
                      <div className="doctor-avatar-small">👨‍⚕️</div>
                      <div className="doctor-info-compact">
                        <h5>{doctor.name}</h5>
                        <p>{doctor.qualification || 'Medical Professional'}</p>
                        {doctor.consultation_fee > 0 && (
                          <span className="fee-small">${doctor.consultation_fee}</span>
                        )}
                      </div>
                      <button 
                        onClick={() => navigate(`/doctor/${doctor.id}`)} 
                        className="btn-view-small"
                      >
                        View
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Book Appointment Section - Only show for patients or non-logged in users */}
        {(!user || user?.role === 'patient') && (
        <div ref={bookingRef} className="booking-section">
          <div className="booking-header">
            <h2>📅 Book an Appointment</h2>
            {!showBooking && (
              <button onClick={() => setShowBooking(true)} className="btn-book-main">
                Book an Appointment »
              </button>
            )}
          </div>

          {showBooking && (
            <>
              {!token ? (
                <div className="login-prompt-box">
                  <p>Please login to book an appointment at {hospital.name}</p>
                  <div className="prompt-actions">
                    <button onClick={handleLoginRedirect} className="btn-login">
                      Login
                    </button>
                    <button onClick={handleRegisterRedirect} className="btn-register">
                      Register
                    </button>
                  </div>
                </div>
              ) : user?.role !== 'patient' ? (
                <div className="login-prompt-box">
                  <p>You are logged in as <strong>{user?.role}</strong>. Only patients can book appointments.</p>
                  <p className="prompt-hint">Please login with a patient account or register as a new patient.</p>
                  <div className="prompt-actions">
                    <button onClick={handleLoginRedirect} className="btn-login">
                      Login as Patient
                    </button>
                    <button onClick={handleRegisterRedirect} className="btn-register">
                      Register as Patient
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookAppointment} className="booking-form">
                  {bookingMessage && (
                    <div className={bookingMessage.includes('success') ? 'success-msg' : 'error-msg'}>
                      {bookingMessage}
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Select Department *</label>
                      <select
                        name="department_id"
                        value={booking.department_id}
                        onChange={handleBookingChange}
                        required
                      >
                        <option value="">Choose a department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Select Doctor *</label>
                      <select
                        name="doctor_id"
                        value={booking.doctor_id}
                        onChange={handleBookingChange}
                        required
                      >
                        <option value="">Choose a doctor</option>
                        {doctors
                          .filter(d => !booking.department_id || d.department_id == booking.department_id)
                          .map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.name} - {doc.qualification || 'Medical Professional'}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Appointment Date *</label>
                      <input
                        type="date"
                        name="appointment_date"
                        value={booking.appointment_date}
                        onChange={handleBookingChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Preferred Time *</label>
                      <select
                        name="appointment_time"
                        value={booking.appointment_time}
                        onChange={handleBookingChange}
                        required
                      >
                        <option value="">Select time</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                        <option value="17:00">05:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Reason for Visit</label>
                    <textarea
                      name="reason"
                      value={booking.reason}
                      onChange={handleBookingChange}
                      placeholder="Briefly describe your symptoms or reason for appointment"
                      rows="3"
                    />
                  </div>

                  {booking.doctor_id && (
                    <div className="consultation-fee-info">
                      <span>💰 Consultation Fee: </span>
                      <strong>Rs. {getSelectedDoctorFee()}</strong>
                    </div>
                  )}

                  <button type="submit" className="btn-submit btn-payment" disabled={bookingLoading}>
                    {bookingLoading ? 'Processing...' : '💳 Proceed to Payment »'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
        )}

        <div className="back-link">
          <button onClick={() => navigate('/browse-hospitals')} className="btn-link">
            ← Back to Hospitals
          </button>
        </div>
      </div>

      {/* Payment Modal - Shows BEFORE appointment is created */}
      {showPaymentModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <div className="payment-modal-header">
              <h2>💳 Complete Payment First</h2>
              <button 
                className="close-btn" 
                onClick={handlePaymentCancel}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="payment-modal-body">
              <div className="appointment-summary">
                <h3>Booking Details</h3>
                <p><strong>Doctor:</strong> {doctors.find(d => d.id == booking.doctor_id)?.name || 'N/A'}</p>
                <p><strong>Hospital:</strong> {hospital?.name}</p>
                <p><strong>Date:</strong> {booking.appointment_date ? new Date(booking.appointment_date).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Time:</strong> {booking.appointment_time || 'N/A'}</p>
                <p><strong>Amount:</strong> Rs. {getSelectedDoctorFee()}</p>
              </div>
              
              <p className="payment-notice">
                ⚠️ Complete payment to confirm your booking. Your appointment will be created after successful payment.
              </p>
              
              <div className="payment-options">
                <button 
                  className="khalti-pay-btn"
                  onClick={handleKhaltiPayment}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <img 
                        src="https://khalti.com/static/khalti-icon.png" 
                        alt="Khalti" 
                        className="khalti-icon"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      Pay Rs. {getSelectedDoctorFee()} with Khalti
                    </>
                  )}
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
    </div>
  );
};

export default HospitalView;
