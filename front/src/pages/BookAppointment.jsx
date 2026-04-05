import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/BookAppointment.css';

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
        // Format date properly for input[type="date"]
        const scheduledDate = response.data.available_from ? 
          new Date(response.data.available_from).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0];
        
        setAppointmentForm(prev => ({
          ...prev,
          doctor_id: doctorId,
          department_id: response.data.department_id || departmentId,
          hospital_id: response.data.hospital_id || hospitalId,
          scheduled_date: scheduledDate,
        }));
      } else if (response.doctor) {
        // Alternative response format
        console.log('Setting doctor from response.doctor:', response.doctor);
        setDoctor(response.doctor);
        const scheduledDate = response.doctor.available_from ? 
          new Date(response.doctor.available_from).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0];
        
        setAppointmentForm(prev => ({
          ...prev,
          doctor_id: doctorId,
          department_id: response.doctor.department_id || departmentId,
          hospital_id: response.doctor.hospital_id || hospitalId,
          scheduled_date: scheduledDate,
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
    if (schedule.is_booked || schedule.display_status === 'booked') {
      return;
    }

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
        // Appointment created, now initiate Khalti payment directly
        const appointment = response.appointment;
        const amount = appointment.payment_amount || getConsultationFee();
        
        console.log('Initiating Khalti payment:', {
          appointment_id: appointment.id,
          amount: amount,
        });
        
        const paymentResponse = await api.khalti.initiate({
          appointment_id: appointment.id,
          amount: amount
        }, token);

        console.log('Payment response:', paymentResponse);
        
        if (paymentResponse.status === 'success' && paymentResponse.data?.payment_url) {
          // Redirect directly to Khalti payment UI
          console.log('Redirecting to Khalti:', paymentResponse.data.payment_url);
          window.location.href = paymentResponse.data.payment_url;
        } else if (paymentResponse.data?.pidx) {
          // Fallback: redirect using pidx
          const khaltiUrl = `https://a.khalti.com/?pidx=${encodeURIComponent(paymentResponse.data.pidx)}`;
          window.location.href = khaltiUrl;
        } else {
          setError('Payment URL not received from server');
        }
      } else {
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
        token: token ? 'present' : 'missing',
        appointment: createdAppointment
      });
      
      // Initiate Khalti payment
      const paymentResponse = await api.khalti.initiate({
        appointment_id: createdAppointment.id,
        amount: amount
      }, token);

      console.log('Payment initiate full response:', JSON.stringify(paymentResponse, null, 2));
      console.log('Response structure:', {
        hasData: !!paymentResponse?.data,
        dataKeys: Object.keys(paymentResponse?.data || {}),
        paymentUrl: paymentResponse?.data?.payment_url,
        pidx: paymentResponse?.data?.pidx,
      });

      // Handle error responses from backend
      if (!paymentResponse || paymentResponse.status === 'error') {
        const errorMsg = paymentResponse?.message || 'Payment initiation failed';
        console.error('Backend error:', errorMsg, paymentResponse);
        setError(errorMsg);
        setBookingLoading(false);
        return;
      }

      // Check for payment URL in the successful response - try multiple paths
      let paymentUrl = paymentResponse?.data?.payment_url || paymentResponse?.payment_url;
      let pidx = paymentResponse?.data?.pidx || paymentResponse?.pidx;

      console.log('Payment details extracted:', { 
        paymentUrl, 
        pidx,
        paymentUrlType: typeof paymentUrl,
        pidxType: typeof pidx,
        isValidUrl: paymentUrl && typeof paymentUrl === 'string' && /^https?:\/\//.test(paymentUrl),
      });

      // Validate URLs before redirecting
      if (paymentUrl && typeof paymentUrl === 'string' && /^https?:\/\//.test(paymentUrl)) {
        console.log('Redirecting to Khalti payment URL:', paymentUrl);
        // Validate URL before navigation
        try {
          new URL(paymentUrl);
          window.location.href = paymentUrl;
          return;
        } catch (urlError) {
          console.error('Invalid URL:', paymentUrl, urlError);
          setError('Invalid payment URL received from server. Please contact support.');
          setBookingLoading(false);
          return;
        }
      }

      if (pidx && typeof pidx === 'string' && pidx.trim()) {
        const khaltiRedirectUrl = `https://a.khalti.com/?pidx=${encodeURIComponent(pidx)}`;
        console.log('Redirecting to Khalti sandbox with pidx:', khaltiRedirectUrl);
        try {
          new URL(khaltiRedirectUrl);
          window.location.href = khaltiRedirectUrl;
          return;
        } catch (urlError) {
          console.error('Invalid Khalti URL:', khaltiRedirectUrl, urlError);
          setError('Khalti payment gateway URL is invalid. Please try again later.');
          setBookingLoading(false);
          return;
        }
      }

      // If we get here, neither URL nor pidx is valid
      console.error('Invalid payment response structure:', {
        fullResponse: paymentResponse,
        paymentUrl,
        pidx,
      });
      setError('Payment initiation failed: Invalid response from payment gateway. Please contact support.');
      setBookingLoading(false);

    } catch (err) {
      console.error('Payment error:', err);
      console.error('Error details:', err.message, err.stack);
      // Show detailed error message from API response or error object
      let errorMessage = 'Payment failed. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.toString && err.toString().includes('Error:')) {
        errorMessage = err.toString().replace('Error: ', '');
      }
      
      setError(errorMessage);
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

  if (loading) return <div className="ba-loading">Loading...</div>;

  return (
    <div className="ba-page">
      {/* Doctor Info Header */}
      {doctor && (
        <section className="ba-doctor-section">
          <div className="ba-doctor-view">
            <div className="ba-doctor-avatar">
              {doctor.image ? (
                <img src={`${api.getStorageUrl()}/${doctor.image}`} alt={doctor.name} className="ba-avatar-img" />
              ) : (
                <span className="ba-avatar-letter">{(doctor.name || 'D').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="ba-doctor-details">
              <h1 className="ba-doctor-name">Dr. {doctor.name || doctor.user?.name}</h1>
              {doctor.department?.name && <span className="ba-dept-badge">{doctor.department.name}</span>}
              <div className="ba-doctor-meta">
                {doctor.qualification && <span>{doctor.qualification}</span>}
                {doctor.experience_years > 0 && <span>{doctor.experience_years} yrs exp</span>}
                {doctor.hospital?.name && <span>{doctor.hospital.name}</span>}
              </div>
              {doctor.consultation_fee > 0 && (
                <div className="ba-fee">Rs. {doctor.consultation_fee} <small>consultation fee</small></div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className="ba-content">
        {error && <div className="ba-error">{error}</div>}
        {success && <div className="ba-success">{success}</div>}

        {/* Schedule Selection */}
        <div className="ba-panel">
          <h2 className="ba-panel-title">Select Time Slot</h2>

          {schedules.length > 0 ? (
            <div className="ba-schedules">
              {schedules.map(schedule => (
                <div
                  key={schedule.id}
                  className={`ba-slot ${selectedSchedule?.id === schedule.id ? 'ba-slot-active' : ''} ${(schedule.is_booked || schedule.display_status === 'booked') ? 'ba-slot-booked' : ''}`}
                  onClick={() => !(schedule.is_booked || schedule.display_status === 'booked') && handleScheduleSelect(schedule)}
                >
                  <div className="ba-slot-date">{formatDate(schedule.date)}</div>
                  <div className="ba-slot-time">{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</div>
                  <div className="ba-slot-avail">
                    {(schedule.is_booked || schedule.display_status === 'booked')
                      ? 'Booked'
                      : `${schedule.remaining_slots ?? schedule.available_slots} slots left`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ba-no-schedules">
              No pre-defined schedules available. You can request an appointment time below.
            </div>
          )}
        </div>

        {/* Appointment Form */}
        <div className="ba-panel">
          <h2 className="ba-panel-title">Appointment Details</h2>
          <form onSubmit={handleSubmit} className="ba-form">
            <div className="ba-form-row">
              <div className="ba-form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={appointmentForm.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="ba-form-group">
                <label>Time *</label>
                <input
                  type="time"
                  name="time"
                  value={appointmentForm.time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="ba-form-group">
              <label>Reason for Visit</label>
              <textarea
                name="reason"
                value={appointmentForm.reason}
                onChange={handleChange}
                placeholder="Describe your reason for the appointment..."
                rows="3"
              />
            </div>
            <div className="ba-form-actions">
              <button type="submit" className="ba-btn primary" disabled={submitting}>
                {submitting ? 'Booking...' : 'Confirm Appointment'}
              </button>
              <button type="button" className="ba-btn secondary" onClick={handleBack}>
                ← Go Back
              </button>
            </div>
          </form>
        </div>
      </div>

      {success && (
        <div className="ba-modal-overlay">
          <div className="ba-modal ba-success-modal">
            <div className="ba-success-icon">✓</div>
            <h2>{success}</h2>
            <p>Redirecting to dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
