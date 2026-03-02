import React, { useState } from 'react';
import '../styles/HospitalSystem.css';
import './HospitalBooking.css';

const HospitalBooking = () => {
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    doctorId: '',
    date: '',
    time: '',
    reason: '',
    urgency: 'normal'
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const doctors = [
    { id: 1, name: 'Dr. Sarah Johnson - Cardiology' },
    { id: 2, name: 'Dr. Michael Chen - Neurology' },
    { id: 3, name: 'Dr. Emily Watson - Pediatrics' },
    { id: 4, name: 'Dr. James Brown - Orthopedics' },
    { id: 5, name: 'Dr. Lisa Anderson - Dermatology' },
  ];

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSuccessMessage(`Appointment booked successfully for ${formData.patientName} with ${doctors.find(d => d.id === parseInt(formData.doctorId))?.name.split(' - ')[0]} on ${formData.date} at ${formData.time}`);
    
    setFormData({
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      doctorId: '',
      date: '',
      time: '',
      reason: '',
      urgency: 'normal'
    });

    setSubmitting(false);

    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="booking-page">
      <div className="page-header">
        <h1>Book New Appointment</h1>
        <p className="subtitle">Schedule an appointment with a doctor</p>
      </div>

      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
        </div>
      )}

      <div className="booking-container">
        <form onSubmit={handleSubmit} className="booking-form">
          {/* Patient Information Section */}
          <div className="form-section">
            <h2>Patient Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="patientName">Full Name *</label>
                <input
                  type="text"
                  id="patientName"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleChange}
                  placeholder="Enter patient name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="patientEmail">Email *</label>
                <input
                  type="email"
                  id="patientEmail"
                  name="patientEmail"
                  value={formData.patientEmail}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="patientPhone">Phone Number *</label>
                <input
                  type="tel"
                  id="patientPhone"
                  name="patientPhone"
                  value={formData.patientPhone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>
          </div>

          {/* Appointment Details Section */}
          <div className="form-section">
            <h2>Appointment Details</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="doctorId">Select Doctor *</label>
                <select
                  id="doctorId"
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Choose a doctor --</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="urgency">Urgency Level *</label>
                <select
                  id="urgency"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  required
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Appointment Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={today}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="time">Time Slot *</label>
                <select
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select time --</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div className="form-section">
            <h2>Reason for Visit</h2>

            <div className="form-group">
              <label htmlFor="reason">Chief Complaint / Reason *</label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Describe the reason for your visit or symptoms..."
                rows="4"
                required
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={submitting}
            >
              {submitting ? 'Booking...' : 'Book Appointment'}
            </button>
            <button
              type="reset"
              className="btn btn-secondary btn-large"
              onClick={() => {
                setFormData({
                  patientName: '',
                  patientEmail: '',
                  patientPhone: '',
                  doctorId: '',
                  date: '',
                  time: '',
                  reason: '',
                  urgency: 'normal'
                });
              }}
            >
              Clear Form
            </button>
          </div>
        </form>

        {/* Info Card */}
        <div className="info-card">
          <h3>Booking Information</h3>
          <div className="info-item">
            <span className="info-label">Operating Hours:</span>
            <span className="info-value">9:00 AM - 5:00 PM</span>
          </div>
          <div className="info-item">
            <span className="info-label">Days:</span>
            <span className="info-value">Monday - Friday</span>
          </div>
          <div className="info-item">
            <span className="info-label">Confirmation:</span>
            <span className="info-value">Within 2 hours</span>
          </div>
          <div className="info-item">
            <span className="info-label">Cancellation:</span>
            <span className="info-value">Up to 24 hours before</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalBooking;
