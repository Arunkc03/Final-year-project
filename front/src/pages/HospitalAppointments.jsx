import React, { useState } from 'react';
import '../styles/HospitalSystem.css';
import './HospitalAppointments.css';

const HospitalAppointments = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [appointments, setAppointments] = useState([
    { id: 1, patientName: 'John Doe', doctorName: 'Dr. Sarah Johnson', dateTime: '2024-01-15 09:30 AM', status: 'confirmed', reason: 'Heart Checkup' },
    { id: 2, patientName: 'Jane Smith', doctorName: 'Dr. Michael Chen', dateTime: '2024-01-15 10:00 AM', status: 'pending', reason: 'Neurological Consultation' },
    { id: 3, patientName: 'Robert Johnson', doctorName: 'Dr. Emily Watson', dateTime: '2024-01-15 02:00 PM', status: 'confirmed', reason: 'Pediatric Examination' },
    { id: 4, patientName: 'Mary Williams', doctorName: 'Dr. James Brown', dateTime: '2024-01-16 11:00 AM', status: 'completed', reason: 'Ortho Consultation' },
    { id: 5, patientName: 'David Brown', doctorName: 'Dr. Lisa Anderson', dateTime: '2024-01-16 03:30 PM', status: 'pending', reason: 'Skin Assessment' },
  ]);

  const filteredAppointments = appointments.filter(apt => {
    const dateMatch = apt.dateTime.startsWith(selectedDate);
    const statusMatch = filterStatus === 'all' || apt.status === filterStatus;
    return dateMatch && statusMatch;
  });

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const currentDate = new Date(selectedDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const handleDateSelect = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  return (
    <div className="appointments-page">
      <div className="page-header">
        <h1>Appointments Management</h1>
      </div>

      <div className="appointments-content">
        {/* Calendar Section */}
        <div className="card calendar-card">
          <h2>Select Date</h2>
          <div className="calendar">
            <div className="calendar-header">
              <span className="month-year">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>
            <div className="calendar-days">
              {calendarDays.map((day, idx) => (
                <div key={idx} className="calendar-day">
                  {day && (
                    <button
                      className={`day-button ${selectedDate === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` ? 'active' : ''}`}
                      onClick={() => handleDateSelect(day)}
                    >
                      {day}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="appointments-list">
          <div className="list-header">
            <h2>Appointments for {selectedDate}</h2>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterStatus('pending')}
              >
                Pending
              </button>
              <button
                className={`filter-btn ${filterStatus === 'confirmed' ? 'active' : ''}`}
                onClick={() => setFilterStatus('confirmed')}
              >
                Confirmed
              </button>
              <button
                className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                onClick={() => setFilterStatus('completed')}
              >
                Completed
              </button>
            </div>
          </div>

          {filteredAppointments.length > 0 ? (
            <div className="appointments-list-items">
              {filteredAppointments.map(apt => (
                <div key={apt.id} className="card appointment-item">
                  <div className="appointment-main">
                    <div className="appointment-info">
                      <h3>{apt.patientName}</h3>
                      <p className="doctor-name">{apt.doctorName}</p>
                      <p className="reason">{apt.reason}</p>
                    </div>
                    <div className="appointment-time">
                      <p className="time">{apt.dateTime.split(' ')[1]} {apt.dateTime.split(' ')[2]}</p>
                      <span className={`badge badge-${apt.status}`}>{apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}</span>
                    </div>
                  </div>
                  <div className="appointment-actions">
                    <button className="btn btn-secondary btn-sm">View</button>
                    <button className="btn btn-secondary btn-sm">Reschedule</button>
                    <button className="btn btn-secondary btn-sm delete">Cancel</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-appointments">
              <p>No appointments found for this date</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalAppointments;
