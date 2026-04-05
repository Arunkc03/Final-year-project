import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
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
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

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

  const handleBookingChange = async (e) => {
    const { name, value } = e.target;
    const updatedBooking = { ...booking, [name]: value };
    setBooking(updatedBooking);

    // Fetch available slots when doctor or date changes
    if ((name === 'doctor_id' || name === 'appointment_date') && updatedBooking.doctor_id && updatedBooking.appointment_date) {
      await fetchAvailableSlots(updatedBooking.doctor_id, updatedBooking.appointment_date);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    setSlotsLoading(true);
    try {
      console.log('Fetching slots for doctor:', doctorId, 'date:', date);
      const res = await api.request(`/doctors/${doctorId}/schedules?date=${date}`);
      console.log('API response:', res);
      
      if (res && res.status === 'success') {
        const schedules = res.data || [];
        console.log('Schedules returned:', schedules);
        const slots = [];
        
        // Generate available slots from schedules
        schedules.forEach(schedule => {
          const duration = schedule.slot_duration || 30;
          const [startH, startM] = schedule.start_time.split(':').map(Number);
          console.log('Processing schedule:', { duration, start_time: schedule.start_time, available_slots: schedule.available_slots });
          
          for (let i = 0; i < schedule.available_slots; i++) {
            let slotStartMin = startH * 60 + startM + (i * duration);
            const slotEndMin = slotStartMin + duration;
            
            const slotStartHour = Math.floor(slotStartMin / 60);
            const slotStartMins = slotStartMin % 60;
            const slotEndHour = Math.floor(slotEndMin / 60);
            const slotEndMins = slotEndMin % 60;
            
            const startTime = `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMins).padStart(2, '0')}`;
            const endTime = `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMins).padStart(2, '0')}`;
            
            slots.push({
              value: startTime,
              label: `${startTime} - ${endTime}`
            });
          }
        });
        
        console.log('Generated slots:', slots);
        setAvailableSlots(slots);
      } else {
        console.log('No success status in response');
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setAvailableSlots([]);
    }
    setSlotsLoading(false);
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

  // Step 1: When user clicks "Confirm Booking", directly initiate Khalti payment
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

    try {
      setBookingLoading(true);
      setBookingMessage('');

      // Step 1: Create appointment
      const bookingResponse = await api.bookAppointment({
        doctor_id: parseInt(booking.doctor_id),
        department_id: parseInt(booking.department_id) || null,
        date: booking.appointment_date,
        time: booking.appointment_time,
        reason: booking.reason,
        hospital_id: parseInt(id)
      }, token);

      if (bookingResponse.status !== 'success') {
        throw new Error(bookingResponse.message || 'Failed to create appointment');
      }

      const appointment = bookingResponse.appointment;
      console.log('Full appointment response:', appointment);
      const amount = appointment.payment_amount || getSelectedDoctorFee();
      console.log('Payment amount to send:', { amount, payment_amount: appointment.payment_amount, selected_fee: getSelectedDoctorFee() });

      // Validate appointment data before payment
      if (!appointment.id) {
        throw new Error('Appointment created but missing ID - cannot proceed to payment');
      }
      if (!amount || amount <= 0) {
        throw new Error('Invalid payment amount - appointment fee not set correctly');
      }

      // Step 2: Initiate Khalti payment directly (no modal)
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
        const errorMsg = paymentResponse.message || paymentResponse.error || 'Failed to initiate payment';
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'Payment failed';
      setBookingMessage(`Error: ${errorMessage}`);
    } finally {
      setBookingLoading(false);
    }
  };

  // Get selected doctor's consultation fee
  const getSelectedDoctorFee = () => {
    const selectedDoctor = doctors.find(d => d.id == booking.doctor_id);
    return selectedDoctor?.consultation_fee || 500;
  };

  if (error) return <div className="hv-error">{error}</div>;
  if (!hospital) return <div className="hv-error">Hospital not found</div>;

  return (
    <div className="hv-page">
      {/* Hospital Header */}
      <section className="hv-hospital-section">
        <div className="hv-hospital-view">
          <div className="hv-hospital-img-wrap">
            {hospital.image ? (
              <img src={`${api.getStorageUrl()}/${hospital.image}`} alt={hospital.name} className="hv-hospital-img" onError={e => { e.target.style.display = 'none'; }} />
            ) : (
              <div className="hv-hospital-img-placeholder">H</div>
            )}
          </div>
          <div className="hv-hospital-details">
            <h1 className="hv-hospital-name">{hospital.name}</h1>
            {hospital.address && <p>{hospital.address}</p>}
            <div className="hv-hospital-meta">
              {hospital.city && <span>{hospital.city}</span>}
              {hospital.state && <span>{hospital.state}</span>}
              {hospital.phone && <span>{hospital.phone}</span>}
              {hospital.email && <span>{hospital.email}</span>}
            </div>
            {hospital.description && <p className="hv-hospital-desc">{hospital.description}</p>}
          </div>
        </div>
      </section>

      <div className="hv-content">
        {/* Departments & Doctors */}
        <div className="hv-panel hv-departments">
          <h2 className="hv-panel-title">Departments & Doctors</h2>
          {departments.length > 0 ? (
            <div className="hv-dept-grid">
              {departments.map((dept) => {
                const deptDoctors = doctors.filter(d => d.department_id == dept.id);
                return (
                  <div key={dept.id} className="hv-dept-card">
                    <div className="hv-dept-header">
                      <h3 className="hv-dept-name">{dept.name}</h3>
                      <span className={`hv-dept-status ${dept.status === 'active' ? 'active' : ''}`}>{dept.status || 'Active'}</span>
                    </div>
                    {dept.description && <p className="hv-dept-desc">{dept.description}</p>}
                    <div className="hv-dept-stats">
                      {dept.total_beds > 0 && <span>Beds: {dept.available_beds || 0}/{dept.total_beds}</span>}
                      {dept.head_doctor && <span>Head: {dept.head_doctor}</span>}
                    </div>
                    <div className="hv-dept-doctors">
                      <h4>Doctors ({deptDoctors.length})</h4>
                      {deptDoctors.length > 0 ? (
                        <div className="hv-doctor-list">
                          {deptDoctors.map((doctor) => (
                            <div key={doctor.id} className="hv-doctor-item">
                              <div className="hv-doctor-avatar">
                                {doctor.user?.avatar ? (
                                  <img src={`${api.getStorageUrl()}/${doctor.user.avatar}`} alt={doctor.name} />
                                ) : (
                                  <span>{(doctor.name || 'D').charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="hv-doctor-info">
                                <strong>Dr. {doctor.name}</strong>
                                <p>{doctor.qualification || 'Medical Professional'}</p>
                                {doctor.consultation_fee > 0 && <span className="hv-doctor-fee">Rs. {doctor.consultation_fee}</span>}
                              </div>
                              <button onClick={() => navigate(`/doctor/${doctor.id}`)} className="hv-btn-view">View</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="hv-no-data">No doctors in this department</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="hv-no-data">No departments listed for this hospital yet.</p>
          )}

          {/* Doctors without department */}
          {doctors.filter(d => !d.department_id || !departments.find(dept => dept.id == d.department_id)).length > 0 && (
            <div className="hv-other-doctors">
              <h3>Other Doctors</h3>
              <div className="hv-doctor-list">
                {doctors
                  .filter(d => !d.department_id || !departments.find(dept => dept.id == d.department_id))
                  .map((doctor) => (
                    <div key={doctor.id} className="hv-doctor-item">
                      <div className="hv-doctor-avatar">
                        {doctor.user?.avatar ? (
                          <img src={`${api.getStorageUrl()}/${doctor.user.avatar}`} alt={doctor.name} />
                        ) : (
                          <span>{(doctor.name || 'D').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="hv-doctor-info">
                        <strong>Dr. {doctor.name}</strong>
                        <p>{doctor.qualification || 'Medical Professional'}</p>
                        {doctor.consultation_fee > 0 && <span className="hv-doctor-fee">Rs. {doctor.consultation_fee}</span>}
                      </div>
                      <button onClick={() => navigate(`/doctor/${doctor.id}`)} className="hv-btn-view">View</button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Book Appointment Section */}
        {(!user || user?.role === 'patient') && (
          <div ref={bookingRef} className="hv-panel hv-booking">
            <h2 className="hv-panel-title">Book an Appointment</h2>
            {!showBooking ? (
              <div className="hv-booking-cta">
                <p>Schedule a visit at {hospital.name}</p>
                <button onClick={() => setShowBooking(true)} className="hv-btn primary">Book an Appointment</button>
              </div>
            ) : !token ? (
              <div className="hv-login-prompt">
                <p>Please login to book an appointment at {hospital.name}</p>
                <div className="hv-auth-btns">
                  <button onClick={handleLoginRedirect} className="hv-btn primary">Login</button>
                  <button onClick={handleRegisterRedirect} className="hv-btn secondary">Register</button>
                </div>
              </div>
            ) : user?.role !== 'patient' ? (
              <div className="hv-login-prompt">
                <p>You are logged in as <strong>{user?.role}</strong>. Only patients can book appointments.</p>
                <div className="hv-auth-btns">
                  <button onClick={handleLoginRedirect} className="hv-btn primary">Login as Patient</button>
                  <button onClick={handleRegisterRedirect} className="hv-btn secondary">Register as Patient</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="hv-form">
                {bookingMessage && (
                  <div className={bookingMessage.includes('success') ? 'hv-success' : 'hv-error-msg'}>{bookingMessage}</div>
                )}
                <div className="hv-form-row">
                  <div className="hv-form-group">
                    <label>Department *</label>
                    <select name="department_id" value={booking.department_id} onChange={handleBookingChange} required>
                      <option value="">Choose a department</option>
                      {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                    </select>
                  </div>
                  <div className="hv-form-group">
                    <label>Doctor *</label>
                    <select name="doctor_id" value={booking.doctor_id} onChange={handleBookingChange} required>
                      <option value="">Choose a doctor</option>
                      {doctors.filter(d => !booking.department_id || d.department_id == booking.department_id).map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.name} - {doc.qualification || 'Medical Professional'}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="hv-form-row">
                  <div className="hv-form-group">
                    <label>Date *</label>
                    <input type="date" name="appointment_date" value={booking.appointment_date} onChange={handleBookingChange} min={new Date().toISOString().split('T')[0]} required />
                  </div>
                  <div className="hv-form-group">
                    <label>Time Slot *</label>
                    {slotsLoading ? (
                      <select disabled>
                        <option>Loading available slots...</option>
                      </select>
                    ) : availableSlots.length > 0 ? (
                      <select name="appointment_time" value={booking.appointment_time} onChange={handleBookingChange} required>
                        <option value="">Select a time slot</option>
                        {availableSlots.map((slot, idx) => (
                          <option key={idx} value={slot.value}>{slot.label}</option>
                        ))}
                      </select>
                    ) : (
                      <select disabled>
                        <option>No available slots for this date</option>
                      </select>
                    )}
                  </div>
                </div>
                <div className="hv-form-group">
                  <label>Reason for Visit</label>
                  <textarea name="reason" value={booking.reason} onChange={handleBookingChange} placeholder="Describe your symptoms or reason..." rows="3" />
                </div>
                {booking.doctor_id && (
                  <div className="hv-fee-info">Consultation Fee: <strong>Rs. {getSelectedDoctorFee()}</strong></div>
                )}
                <button type="submit" className="hv-btn primary hv-btn-full" disabled={bookingLoading}>
                  {bookingLoading ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="hv-back">
          <button onClick={() => navigate(-1)} className="hv-btn link">← Go Back</button>
        </div>
      </div>
    </div>
  );
};

export default HospitalView;
