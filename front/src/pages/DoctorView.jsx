import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import '../styles/DoctorView.css';

const DoctorView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useContext(AuthContext);
  const bookingRef = useRef(null);
  const [doctor, setDoctor] = useState(null);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [booking, setBooking] = useState({
    doctor_id: id || '',
    department_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewMessage, setReviewMessage] = useState({ type: '', text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.getDoctor(id);
        if (res && res.status === 'success') {
          const doc = res.data || res.doctor || res;
          setDoctor(doc);
          setBooking(prev => ({ ...prev, doctor_id: doc.id }));
          if (doc.department_id) {
            setBooking(prev => ({ ...prev, department_id: doc.department_id }));
          }
          if (doc.hospital_id) {
            try {
              const hRes = await api.getHospital(doc.hospital_id);
              if (hRes.status === 'success') {
                setHospitalInfo(hRes.data?.hospital || hRes.hospital || null);
                // Load departments from hospital
                const deptRes = await api.getDepartments(doc.hospital_id);
                if (deptRes.status === 'success') {
                  setDepartments(deptRes.data || []);
                } else if (Array.isArray(deptRes)) {
                  setDepartments(deptRes);
                }
              }
            } catch (e) { console.error('Hospital fetch error:', e); }
          }
        }
      } catch (e) {
        setError('Failed to load doctor details');
      } finally {
        setLoading(false);
      }
    };
    load();
    // Fetch reviews for this doctor
    fetchReviews();
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

    // Fetch available slots when date changes
    if (name === 'appointment_date' && updatedBooking.appointment_date && updatedBooking.doctor_id) {
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

  // Fetch reviews for this doctor
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await api.getDoctorReviews(id);
      if (res.status === 'success') {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        setReviews(list);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Submit a review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      setReviewMessage({ type: 'error', text: 'Please select a rating' });
      return;
    }

    if (!doctor || !doctor.id) {
      setReviewMessage({ type: 'error', text: 'Doctor information not loaded' });
      return;
    }

    setSubmittingReview(true);
    setReviewMessage({ type: '', text: '' });
    try {
      const res = await api.submitReview({
        doctor_id: doctor.id,
        appointment_id: null,
        rating: parseInt(reviewForm.rating),
        comment: reviewForm.comment,
      }, token);

      if (res.status === 'success') {
        setReviewMessage({ type: 'success', text: 'Review submitted successfully!' });
        setReviewForm({ rating: 5, comment: '' });
        setShowReviewForm(false);
        setTimeout(() => {
          fetchReviews();
        }, 1000);
      } else {
        const errorMsg = res.message || res.errors?.doctor_id?.[0] || res.errors?.rating?.[0] || 'Failed to submit review';
        setReviewMessage({ type: 'error', text: errorMsg });
        console.error('Review submission failed:', res);
      }
    } catch (err) {
      console.error('Review error:', err);
      setReviewMessage({ type: 'error', text: err.message || 'Error submitting review' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const getSelectedDoctorFee = () => {
    return doctor?.consultation_fee || 500;
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!token || user?.role !== 'patient') {
      navigate('/login');
      return;
    }

    if (!booking.doctor_id || !booking.appointment_date || !booking.appointment_time) {
      setBookingMessage('Please fill in all required fields');
      return;
    }

    try {
      setBookingLoading(true);
      setBookingMessage('');

      const bookingResponse = await api.bookAppointment({
        doctor_id: parseInt(booking.doctor_id),
        department_id: parseInt(booking.department_id) || null,
        date: booking.appointment_date,
        time: booking.appointment_time,
        reason: booking.reason,
        hospital_id: parseInt(doctor?.hospital_id)
      }, token);

      if (bookingResponse.status !== 'success') {
        throw new Error(bookingResponse.message || 'Failed to create appointment');
      }

      const appointment = bookingResponse.appointment;
      const amount = appointment.payment_amount || getSelectedDoctorFee();

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
      setBookingMessage(err.message || 'Payment failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    const returnUrl = `/doctor/${id}?book=true`;
    navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
  };

  const handleRegisterRedirect = () => {
    const returnUrl = `/doctor/${id}?book=true`;
    navigate(`/register?redirect=${encodeURIComponent(returnUrl)}`);
  };

  const handleBookWithDoctor = () => {
    if (!token) {
      navigate('/login', { state: { from: `/doctor/${id}` } });
      return;
    }
    navigate(`/book-appointment/${id}${doctor?.hospital_id ? `?hospital_id=${doctor.hospital_id}` : ''}${doctor?.department_id ? `&department_id=${doctor.department_id}` : ''}`);
  };

  if (loading) return <div className="dv-loading">Loading doctor...</div>;
  if (error) return <div className="dv-error">{error}</div>;
  if (!doctor) return <div className="dv-error">Doctor not found</div>;

  return (
    <div className="dv-page">
      {/* Hospital Information */}
      {hospitalInfo && (
        <section className="dv-hospital-section">
          <div className="dv-hospital-view">
            <div className="dv-hospital-img-wrap">
              {hospitalInfo.image ? (
                <img src={`${api.getStorageUrl()}/${hospitalInfo.image}`} alt={hospitalInfo.name} className="dv-hospital-img" onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="dv-hospital-img-placeholder">H</div>
              )}
            </div>
            <div className="dv-hospital-details">
              <h1 className="dv-hospital-name">{hospitalInfo.name || 'Hospital'}</h1>
              {hospitalInfo.address && <p>{hospitalInfo.address}</p>}
              {hospitalInfo.phone && <p>{hospitalInfo.phone}</p>}
              {hospitalInfo.email && <p>{hospitalInfo.email}</p>}
              {hospitalInfo.description && <p className="dv-hospital-desc">{hospitalInfo.description}</p>}
            </div>
          </div>
        </section>
      )}

      {/* Doctor Info + Actions Layout */}
      <div className="dv-content">
        {/* Doctor Information Panel */}
        <div className="dv-panel dv-info-panel">
          <h2 className="dv-panel-title">Doctor Information</h2>
          <div className="dv-avatar-wrap">
            <div className="dv-avatar">
              {doctor.image ? (
                <img src={`${api.getStorageUrl()}/${doctor.image}`} alt={doctor.name} className="dv-avatar-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
              ) : null}
              <span className="dv-avatar-letter" style={doctor.image ? {display:'none'} : {}}>{doctor.name?.charAt(0)?.toUpperCase() || 'D'}</span>
            </div>
            <div>
              <h3 className="dv-doctor-name">Dr. {doctor.name}</h3>
              <span className="dv-role-badge">Doctor</span>
            </div>
          </div>
          {doctor.department?.name && (
            <span className="dv-dept-badge">{doctor.department.name}</span>
          )}
          <div className="dv-detail-rows">
            <div className="dv-detail-row"><label>Staff ID</label><span>{doctor.identifier || 'N/A'}</span></div>
            <div className="dv-detail-row"><label>Email</label><span>{doctor.email || 'N/A'}</span></div>
            {doctor.phone && <div className="dv-detail-row"><label>Phone</label><span>{doctor.phone}</span></div>}
            {doctor.qualification && <div className="dv-detail-row"><label>Qualification</label><span>{doctor.qualification}</span></div>}
            {doctor.experience_years > 0 && <div className="dv-detail-row"><label>Experience</label><span>{doctor.experience_years} years</span></div>}
            {doctor.consultation_fee > 0 && <div className="dv-detail-row"><label>Consultation Fee</label><span className="dv-fee">Rs. {doctor.consultation_fee}</span></div>}
            {doctor.specialization && <div className="dv-detail-row"><label>Specialization</label><span>{doctor.specialization}</span></div>}
          </div>
          {doctor.bio && (
            <div className="dv-bio">
              <h4>About</h4>
              <p>{doctor.bio}</p>
            </div>
          )}
        </div>

        {/* Book Appointment Section */}
        {(!user || user?.role === 'patient') && (
          <div ref={bookingRef} className="dv-panel dv-booking">
            <h2 className="dv-panel-title">Book an Appointment</h2>
            {!showBooking ? (
              <div className="dv-booking-cta">
                <p>Schedule an appointment with Dr. {doctor?.name}</p>
                <button onClick={() => setShowBooking(true)} className="dv-btn primary">Book an Appointment</button>
              </div>
            ) : !token ? (
              <div className="dv-login-prompt">
                <p>Please login to book an appointment with Dr. {doctor?.name}</p>
                <div className="dv-auth-btns">
                  <button onClick={handleLoginRedirect} className="dv-btn primary">Login</button>
                  <button onClick={handleRegisterRedirect} className="dv-btn secondary">Register</button>
                </div>
              </div>
            ) : user?.role !== 'patient' ? (
              <div className="dv-login-prompt">
                <p>You are logged in as <strong>{user?.role}</strong>. Only patients can book appointments.</p>
                <div className="dv-auth-btns">
                  <button onClick={handleLoginRedirect} className="dv-btn primary">Login as Patient</button>
                  <button onClick={handleRegisterRedirect} className="dv-btn secondary">Register as Patient</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="dv-form">
                {bookingMessage && (
                  <div className={bookingMessage.includes('success') ? 'dv-success' : 'dv-error-msg'}>{bookingMessage}</div>
                )}
                <div className="dv-form-row">
                  {departments.length > 0 && (
                    <div className="dv-form-group">
                      <label>Department *</label>
                      <select name="department_id" value={booking.department_id} onChange={handleBookingChange} required>
                        <option value="">Choose a department</option>
                        {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="dv-form-group">
                    <label>Doctor *</label>
                    <input type="text" value={`Dr. ${doctor?.name}`} disabled className="dv-input-disabled" />
                  </div>
                </div>
                <div className="dv-form-row">
                  <div className="dv-form-group">
                    <label>Date *</label>
                    <input type="date" name="appointment_date" value={booking.appointment_date} onChange={handleBookingChange} min={new Date().toISOString().split('T')[0]} required />
                  </div>
                  <div className="dv-form-group">
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
                <div className="dv-form-group">
                  <label>Reason for Visit</label>
                  <textarea name="reason" value={booking.reason} onChange={handleBookingChange} placeholder="Describe your symptoms or reason..." rows="3" />
                </div>
                {booking.doctor_id && (
                  <div className="dv-fee-info">Consultation Fee: <strong>Rs. {getSelectedDoctorFee()}</strong></div>
                )}
                <button type="submit" className="dv-btn primary dv-btn-full" disabled={bookingLoading}>
                  {bookingLoading ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Reviews Section */}
        <div className="dv-panel dv-reviews-panel">
          <h2 className="dv-panel-title">Reviews & Ratings</h2>
          
          {reviews.length > 0 && (
            <div className="dv-rating-summary">
              <div className="dv-average-rating">
                <span className="dv-average-number">
                  {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                </span>
                <div className="dv-stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className={`dv-star ${star <= Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) ? 'active' : ''}`}>★</span>
                  ))}
                </div>
                <p className="dv-review-count">Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
              </div>
            </div>
          )}

          {(!showReviewForm || reviews.length === 0) && token && user?.role === 'patient' && (
            <button onClick={() => setShowReviewForm(true)} className="dv-btn primary dv-write-review-btn">
              Write a Review
            </button>
          )}

          {showReviewForm && token && user?.role === 'patient' && (
            <form onSubmit={handleSubmitReview} className="dv-review-form">
              <h3>Share your experience</h3>
              {reviewMessage.text && (
                <div className={`dv-msg ${reviewMessage.type}`}>{reviewMessage.text}</div>
              )}
              <div className="dv-form-group">
                <label>Rating *</label>
                <div className="dv-rating-input">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`dv-star-btn ${reviewForm.rating >= star ? 'active' : ''}`}
                      onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span className="dv-rating-text">{reviewForm.rating} out of 5</span>
              </div>
              <div className="dv-form-group">
                <label>Comment (Optional)</label>
                <textarea 
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                  rows="4"
                  placeholder="Share your experience with this doctor..."
                  maxLength="1000"
                />
                <small>{reviewForm.comment.length}/1000</small>
              </div>
              <div className="dv-form-actions">
                <button type="button" onClick={() => setShowReviewForm(false)} className="dv-btn secondary">Cancel</button>
                <button type="submit" disabled={submittingReview} className="dv-btn primary">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}

          {reviews.length > 0 ? (
            <div className="dv-reviews-scroll">
              <div className="dv-reviews-list">
                {reviews.map(review => (
                  <div key={review.id} className="dv-review-card">
                    <div className="dv-review-header">
                      <div className="dv-review-rating">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className={`dv-star-sm ${star <= review.rating ? 'active' : ''}`}>★</span>
                        ))}
                      </div>
                      <span className="dv-review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    {review.comment && (
                      <p className="dv-review-comment">{review.comment}</p>
                    )}
                    {review.patient?.name && (
                      <p className="dv-review-author">— {review.patient.name}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !showReviewForm && <p className="dv-no-reviews">No reviews yet. Be the first to review this doctor!</p>
          )}
        </div>

        <div className="dv-back">
          <button onClick={() => navigate(-1)} className="dv-btn link">← Go Back</button>
        </div>
      </div>
    </div>
  );
};

export default DoctorView;
