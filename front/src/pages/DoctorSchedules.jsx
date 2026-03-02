import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import './DoctorSchedules.css';

const DoctorSchedules = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    available_slots: 5,
  });

  useEffect(() => {
    console.log('DoctorSchedules mounted, user:', user, 'token:', token ? 'present' : 'missing');
    
    if (!token) {
      console.log('No token - redirecting to login');
      navigate('/login');
      return;
    }
    
    if (!user) {
      // User might still be loading from storage
      console.log('Token exists but user not loaded yet');
      return;
    }
    
    if (user.role !== 'doctor') {
      console.log('Not a doctor, role is:', user.role);
      setError('Access denied. Only doctors can manage schedules.');
      setLoading(false);
      return;
    }
    fetchSchedules();
  }, [token, user, navigate]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      console.log('Fetching schedules with token:', token ? 'present' : 'missing');
      const response = await api.getSchedules(token);
      console.log('Schedules response:', response);
      if (response.status === 'success') {
        setSchedules(response.data?.data || response.data || []);
      } else {
        setError(response.message || 'Failed to load schedules');
      }
    } catch (err) {
      console.error('Schedules fetch error:', err);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const scheduleData = {
        ...formData,
        doctor_id: user.id,
        department_id: user.department_id,
      };
      
      console.log('Submitting schedule:', scheduleData);

      let response;
      if (editingSchedule) {
        response = await api.updateSchedule(editingSchedule.id, scheduleData, token);
      } else {
        response = await api.createSchedule(scheduleData, token);
      }
      
      console.log('Schedule response:', response);

      if (response.status === 'success') {
        setShowModal(false);
        setEditingSchedule(null);
        setFormData({ date: '', start_time: '', end_time: '', available_slots: 5 });
        fetchSchedules();
      } else {
        // Show validation errors if present
        if (response.errors) {
          const errorMessages = Object.values(response.errors).flat().join(', ');
          setError(errorMessages);
        } else {
          setError(response.message || 'Failed to save schedule');
        }
      }
    } catch (err) {
      console.error('Schedule save error:', err);
      setError('Failed to save schedule');
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      date: schedule.date,
      start_time: schedule.start_time?.slice(0, 5) || '',
      end_time: schedule.end_time?.slice(0, 5) || '',
      available_slots: schedule.available_slots,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await api.deleteSchedule(id, token);
      if (response.status === 'success') {
        fetchSchedules();
      } else {
        setError(response.message || 'Failed to delete schedule');
      }
    } catch (err) {
      setError('Failed to delete schedule');
    }
  };

  const openAddModal = () => {
    setEditingSchedule(null);
    setFormData({ date: '', start_time: '', end_time: '', available_slots: 5 });
    setShowModal(true);
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Show loading while user is loading
  if (!user && token) {
    return (
      <div className="schedules-page">
        <div className="loading">Loading user...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="schedules-page">
        <div className="loading">Loading schedules...</div>
      </div>
    );
  }

  // Show access denied for non-doctors
  if (!user || user.role !== 'doctor') {
    return (
      <div className="schedules-page">
        <div className="error-message">
          {error || 'Access denied. Please login as a doctor to manage schedules.'}
        </div>
      </div>
    );
  }

  return (
    <div className="schedules-page">
      <div className="schedules-header">
        <div>
          <h1>My Schedules</h1>
          <p>Manage your appointment availability</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Add Schedule
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="schedules-grid">
        {schedules.length === 0 ? (
          <div className="no-schedules">
            <h3>No schedules found</h3>
            <p>Add your first schedule to start accepting appointments</p>
          </div>
        ) : (
          schedules.map(schedule => (
            <div key={schedule.id} className={`schedule-card status-${schedule.status}`}>
              <div className="schedule-date">{formatDate(schedule.date)}</div>
              <div className="schedule-time">
                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
              </div>
              <div className="schedule-slots">
                <span className="slots-label">Available Slots:</span>
                <span className="slots-number">{schedule.available_slots}</span>
              </div>
              <div className={`schedule-status ${schedule.status}`}>
                {schedule.status?.toUpperCase()}
              </div>
              <div className="schedule-actions">
                <button className="btn btn-small btn-edit" onClick={() => handleEdit(schedule)}>
                  Edit
                </button>
                <button className="btn btn-small btn-delete" onClick={() => handleDelete(schedule.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Available Slots</label>
                <input
                  type="number"
                  name="available_slots"
                  value={formData.available_slots}
                  onChange={handleInputChange}
                  min="1"
                  max="50"
                  required
                />
              </div>
              {error && <div className="form-error">{error}</div>}
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSchedule ? 'Update' : 'Create'} Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSchedules;
