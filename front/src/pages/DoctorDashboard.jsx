import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/DoctorDashboard.css';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout, updateUser } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Hospital info
  const [hospitalInfo, setHospitalInfo] = useState(null);

  // Profile image
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(user?.avatar ? `${api.getStorageUrl()}/${user.avatar}` : null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const profilePhotoInputRef = useRef(null);

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reportForm, setReportForm] = useState({ title: '', description: '', diagnosis: '', treatment: '', notes: '' });
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState({ type: '', text: '' });

  // Schedule
  const [schedules, setSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ date: '', start_time: '', end_time: '', slot_duration: '30' });
  const [availableSlots] = useState([
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00'
  ]);
  const [scheduleFormLoading, setScheduleFormLoading] = useState(false);
  const [scheduleFormError, setScheduleFormError] = useState('');
  const [deletingScheduleId, setDeletingScheduleId] = useState(null);
  const [expandedTimeRange, setExpandedTimeRange] = useState(null);

  // Helper to format time for display
  const formatTimeSlot = (startTime, durationMins) => {
    const [hour, min] = startTime.split(':').map(Number);
    let endMin = min + durationMins;
    let endHour = hour;
    if (endMin >= 60) {
      endHour += Math.floor(endMin / 60);
      endMin = endMin % 60;
    }
    const start = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    const end = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    return `${start} - ${end}`;
  };



  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Appointment filter tab
  const [activeTab, setActiveTab] = useState('all');
  const [appointmentCurrentPage, setAppointmentCurrentPage] = useState(1);
  const appointmentsPerPage = 5;

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');

  useEffect(() => {
    if (!token || user?.role !== 'doctor') {
      navigate('/login');
      return;
    }
    fetchAll();
  }, [token, user, navigate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dashRes, apptRes] = await Promise.all([
        api.getDashboard('/dashboard/doctor', token),
        api.getDoctorAppointments(token),
      ]);
      if (dashRes.status === 'success') setDashboardData(dashRes.data);
      else setError(dashRes.message || 'Failed to load dashboard');

      if (apptRes.status === 'success') setAppointments(apptRes.data?.data || apptRes.data || []);

      if (dashRes.data?.hospital_id) fetchHospitalInfo(dashRes.data.hospital_id);
      fetchSchedules();
      fetchReviews();
    } catch (err) {
      setError('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitalInfo = async (hospitalId) => {
    try {
      const res = await api.getHospital(hospitalId, token);
      if (res.status === 'success') setHospitalInfo(res.data?.hospital || res.hospital || {});
    } catch (err) { console.error('Hospital fetch error:', err); }
  };

  const fetchSchedules = async () => {
    setScheduleLoading(true);
    try {
      const res = await api.getSchedules(token);
      if (res.status === 'success') setSchedules(res.data?.data || res.data || []);
    } catch (err) { console.error('Schedule fetch error:', err); }
    finally { setScheduleLoading(false); }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      // Use authenticated endpoint so doctor sees ALL reviews (including pending)
      const res = await api.getMyReviews(token);
      if (res.status === 'success') setReviews(res.data?.data || res.data || []);
    } catch (err) { console.error('Reviews fetch error:', err); }
    finally { setReviewsLoading(false); }
  };

  // Appointment actions
  const handleAcceptAppointment = async (id) => {
    setActionLoading(id);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await api.acceptAppointment(id, '', token);
      if (res.status === 'success') {
        setActionMessage({ type: 'success', text: 'Appointment approved!' });
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
      } else setActionMessage({ type: 'error', text: res.message || 'Failed to approve' });
    } catch { setActionMessage({ type: 'error', text: 'Error approving appointment' }); }
    finally { setActionLoading(null); }
  };

  const handleCompleteAppointment = async (id) => {
    if (!window.confirm('Mark this appointment as completed?')) return;
    setActionLoading(id);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await api.completeAppointment(id, token);
      if (res.status === 'success') {
        setActionMessage({ type: 'success', text: 'Appointment marked as completed!' });
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
      } else setActionMessage({ type: 'error', text: res.message || 'Failed to complete' });
    } catch { setActionMessage({ type: 'error', text: 'Error completing appointment' }); }
    finally { setActionLoading(null); }
  };

  const handleRejectAppointment = async (id) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return;
    setActionLoading(id);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await api.rejectAppointment(id, reason, token);
      if (res.status === 'success') {
        setActionMessage({ type: 'success', text: 'Appointment declined!' });
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
      } else setActionMessage({ type: 'error', text: res.message || 'Failed to decline' });
    } catch { setActionMessage({ type: 'error', text: 'Error declining appointment' }); }
    finally { setActionLoading(null); }
  };

  const handleDeleteAppointment = async (id) => {
    const ok = window.confirm('Delete this appointment from the list?');
    if (!ok) return;
    setActionLoading(id);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await api.cancelAppointment(id, 'Deleted by doctor from dashboard', token);
      if (res.status === 'success') {
        setActionMessage({ type: 'success', text: 'Appointment deleted successfully' });
        setAppointments(prev => prev.filter(a => a.id !== id));
      } else {
        setActionMessage({ type: 'error', text: res.message || 'Failed to delete appointment' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Error deleting appointment' });
    } finally {
      setActionLoading(null);
    }
  };

  // Report
  const openReportModal = (apt) => {
    setSelectedPatient(apt);
    setReportForm({ title: `Medical Report - ${apt.user?.name || 'Patient'}`, description: '', diagnosis: '', treatment: '', notes: '' });
    setReportMessage({ type: '', text: '' });
    setShowReportModal(true);
  };
  const closeReportModal = () => { setShowReportModal(false); setSelectedPatient(null); };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setReportLoading(true);
    setReportMessage({ type: '', text: '' });
    try {
      // At least title and diagnosis are required
      if (!reportForm.title || !reportForm.diagnosis) {
        setReportMessage({ type: 'error', text: 'Title and Diagnosis are required' });
        setReportLoading(false);
        return;
      }

      const patientId = selectedPatient.user_id || selectedPatient.patient_id || selectedPatient.user?.id || selectedPatient.patient?.id;
      const appointmentId = selectedPatient.id || selectedPatient.appointment_id;
      if (!patientId) {
        setReportMessage({ type: 'error', text: 'Unable to determine patient for this report' });
        setReportLoading(false);
        return;
      }

      const fd = new FormData();
      fd.append('patient_id', patientId);
      if (appointmentId) fd.append('appointment_id', appointmentId);
      fd.append('title', reportForm.title);
      fd.append('diagnosis', reportForm.diagnosis);
      fd.append('treatment', reportForm.treatment || '');
      fd.append('description', reportForm.description || '');
      fd.append('notes', reportForm.notes || '');
      
      const res = await api.uploadReport(fd, token);
      if (res.status === 'success') {
        setReportMessage({ type: 'success', text: 'Report submitted successfully!' });
        // Reset form
        setReportForm({ title: '', description: '', diagnosis: '', treatment: '', notes: '' });
        setTimeout(() => { closeReportModal(); fetchAll(); }, 1200);
      } else {
        setReportMessage({ type: 'error', text: res.message || 'Failed to submit report' });
        console.error('Report submission error:', res);
      }
    } catch (err) {
      console.error('Report error:', err);
      setReportMessage({ type: 'error', text: 'Error submitting report: ' + (err.message || err.toString()) });
    } finally {
      setReportLoading(false);
    }
  };

  // Schedule CRUD
  const calculateSlotCount = () => {
    if (!scheduleForm.start_time || !scheduleForm.end_time || !scheduleForm.slot_duration) return 0;
    
    const [startH, startM] = scheduleForm.start_time.split(':').map(Number);
    const [endH, endM] = scheduleForm.end_time.split(':').map(Number);
    const duration = parseInt(scheduleForm.slot_duration) || 30;
    
    const startTotalMin = startH * 60 + startM;
    const endTotalMin = endH * 60 + endM;
    const rangeTotalMin = endTotalMin - startTotalMin;
    
    if (rangeTotalMin <= 0) return 0;
    return Math.floor(rangeTotalMin / duration);
  };

  const getDateLabel = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const scheduleDate = new Date(dateStr);
    scheduleDate.setHours(0, 0, 0, 0);
    
    if (scheduleDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (scheduleDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return scheduleDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const handleScheduleFormChange = (e) => {
    const { name, value } = e.target;
    setScheduleForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setScheduleFormLoading(true);
    setScheduleFormError('');
    try {
      const slotCount = calculateSlotCount();
      if (slotCount === 0) {
        throw new Error('Invalid time range or slot duration');
      }

      // Create ONE schedule record with the full time range
      const payloadForm = {
        date: scheduleForm.date,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        slot_duration: parseInt(scheduleForm.slot_duration) || 30,
        available_slots: slotCount
      };
      
      const res = await api.createSchedule(payloadForm, token);
      if (res.status !== 'success') {
        throw new Error(res.message || 'Failed to create schedule');
      }
      
      setShowScheduleForm(false);
      setScheduleForm({ date: '', start_time: '', end_time: '', slot_duration: '30' });
      fetchSchedules();
    } catch (err) { 
      setScheduleFormError(err.message || 'Error creating schedule');
    }
    finally { setScheduleFormLoading(false); }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Delete this schedule slot?')) return;
    setDeletingScheduleId(id);
    try {
      const res = await api.deleteSchedule(id, token);
      console.log('Delete schedule response:', res);
      if (res.status === 'success') {
        setSchedules(prev => prev.filter(s => s.id !== id));
        setActionMessage({ type: 'success', text: 'Schedule deleted successfully!' });
        fetchSchedules();
      } else {
        setActionMessage({ type: 'error', text: res.message || 'Failed to delete schedule' });
        console.error('Delete failed:', res);
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setActionMessage({ type: 'error', text: 'Error deleting schedule: ' + (err.message || err.toString()) });
    } finally {
      setDeletingScheduleId(null);
    }
  };

  const handleDeleteAllSchedulesOnDate = async (schedules) => {
    if (!window.confirm(`Delete all ${schedules.length} schedule(s) for this date?`)) return;
    try {
      let deletedCount = 0;
      for (const schedule of schedules) {
        const res = await api.deleteSchedule(schedule.id, token);
        if (res.status === 'success') {
          deletedCount++;
        } else {
          console.error('Failed to delete schedule', schedule.id, res.message);
        }
      }
      setActionMessage({ type: 'success', text: `Deleted ${deletedCount} of ${schedules.length} schedules` });
      fetchSchedules();
    } catch (err) {
      console.error('Error deleting schedules:', err);
      setActionMessage({ type: 'error', text: 'Error deleting schedules: ' + (err.message || err.toString()) });
    }
  };

  // Profile image
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setProfileImage(file); setProfileImagePreview(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfileImage = async () => {
    if (!profileImage) return;
    setUploadingProfile(true);
    try {
      const fd = new FormData();
      fd.append('image', profileImage);
      
      // Upload doctor image - Find doctor by user_id (use the doctor ID from dashboard or fetch it)
      // Since we're a doctor, let's use the endpoint without an ID (doctor's own profile)
      const res = await api.uploadDoctorImage(fd, token);
      console.log('Doctor image upload response:', res);
      if (res.status === 'success') {
        // Update only image-related state so dashboard doesn't enter global loading state
        if (res.doctor?.image) {
          const imageUrl = api.getStorageUrl() + '/' + res.doctor.image;
          console.log('Setting doctor image URL:', imageUrl);
          setProfileImagePreview(imageUrl);
          if (user) {
            updateUser({ ...user, avatar: res.doctor.image });
          }
        }
        setActionMessage({ type: 'success', text: 'Profile image updated successfully!' });
        setProfileImage(null);
        // Reset the file input
        if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = '';
      } else {
        setActionMessage({ type: 'error', text: res.message || 'Failed to upload image' });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setActionMessage({ type: 'error', text: 'Error uploading image: ' + (err.message || err.toString()) });
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleLogout = async () => {
    try { await api.logout(token); } catch {}
    logout();
    navigate('/login');
  };

  // Filter appointments by tab
  const filteredAppointments = activeTab === 'all' ? appointments : appointments.filter(a => a.status === activeTab);
  
  // Reset pagination when tab changes
  React.useEffect(() => {
    setAppointmentCurrentPage(1);
  }, [activeTab]);
  
  const todayStr = new Date().toDateString();
  const todayAppts = appointments.filter(a => new Date(a.date).toDateString() === todayStr);
  const todayDate = new Date().toISOString().split('T')[0];

  // Derive unique patients from appointments
  const uniquePatients = React.useMemo(() => {
    const map = new Map();
    appointments.forEach(a => {
      if (a.user && a.user_id && !map.has(a.user_id)) {
        map.set(a.user_id, {
          id: a.user_id,
          name: a.user.name,
          email: a.user.email,
          phone: a.user.phone,
          totalAppointments: 0,
          lastVisit: null,
        });
      }
      if (a.user_id && map.has(a.user_id)) {
        const p = map.get(a.user_id);
        p.totalAppointments++;
        const d = new Date(a.date);
        if (!p.lastVisit || d > p.lastVisit) p.lastVisit = d;
      }
    });
    return Array.from(map.values());
  }, [appointments]);

  const filteredPatients = patientSearch
    ? uniquePatients.filter(p =>
        p.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.email?.toLowerCase().includes(patientSearch.toLowerCase())
      )
    : uniquePatients;

  if (loading) return <div className="dd-loading">Loading dashboard...</div>;
  if (!user) return null;

  return (
    <div className="dd-page">

      {/* SECTION 1: Hospital Information */}
      <section className="dd-hospital-section">
        {hospitalInfo ? (
          <div className="dd-hospital-view">
            <div className="dd-hospital-img-wrap">
              {hospitalInfo.image ? (
                <img src={`${api.getStorageUrl()}/${hospitalInfo.image}`} alt={hospitalInfo.name} className="dd-hospital-img" onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="dd-hospital-img-placeholder">H</div>
              )}
            </div>
            <div className="dd-hospital-details">
              <h1 className="dd-hospital-name">{hospitalInfo.name || 'Hospital'}</h1>
              {hospitalInfo.address && <p>{hospitalInfo.address}</p>}
              {hospitalInfo.phone && <p>{hospitalInfo.phone}</p>}
              {hospitalInfo.email && <p>{hospitalInfo.email}</p>}
              {hospitalInfo.description && <p className="dd-hospital-desc">{hospitalInfo.description}</p>}
              <div className="dd-hospital-stats">
                <span className="dd-hstat">{dashboardData?.total_doctors || hospitalInfo.departments?.reduce((sum, d) => sum + (d.doctors?.length || 0), 0) || 0} Doctors</span>
                <span className="dd-hstat">{uniquePatients.length} Patients</span>
                <span className="dd-hstat">{appointments.length} Appointments</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="dd-empty">Hospital information not available</p>
        )}
      </section>

      {/* ── TOP ROW: My Info (left) + Appointments (right) ── */}
      <div className="dd-top-row">

        {/* PANEL 1: My Information */}
        <div className="dd-panel dd-info-panel">
          <h2 className="dd-panel-title">My Information</h2>
          <div className="dd-avatar-wrap">
            <div className="dd-avatar">
              {profileImagePreview ? (
                <img 
                  src={profileImagePreview} 
                  alt={user.name} 
                  className="dd-avatar-img"                  onLoad={() => console.log('Image loaded successfully:', profileImagePreview)}                  onError={(e) => {
                    console.error('Image failed to load:', profileImagePreview);
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<span class="dd-avatar-letter">${user.name.charAt(0).toUpperCase()}</span>`;
                  }}
                />
              ) : (
                <span className="dd-avatar-letter">{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="dd-role-badge">Doctor</span>
          </div>
          {actionMessage.text && (
            <div className={`dd-msg ${actionMessage.type}`}>{actionMessage.text}</div>
          )}
          <div className="dd-detail-rows">
            <div className="dd-detail-row"><label>Name</label><span>Dr. {user.name}</span></div>
            <div className="dd-detail-row"><label>Email</label><span>{user.email || 'N/A'}</span></div>
            <div className="dd-detail-row"><label>Phone</label><span>{user.phone || 'N/A'}</span></div>
            <div className="dd-detail-row"><label>Staff ID</label><span>{user.identifier || 'N/A'}</span></div>
            {dashboardData?.qualification && <div className="dd-detail-row"><label>Qualification</label><span>{dashboardData.qualification}</span></div>}
            {dashboardData?.experience_years && <div className="dd-detail-row"><label>Experience</label><span>{dashboardData.experience_years} years</span></div>}
            {dashboardData?.consultation_fee && <div className="dd-detail-row"><label>Fee</label><span>Rs {dashboardData.consultation_fee}</span></div>}
          </div>
          <div className="dd-mini-stats">
            <div className="dd-mini-stat"><span className="dd-mini-val">{appointments.length}</span><span className="dd-mini-label">Appointments</span></div>
            <div className="dd-mini-stat"><span className="dd-mini-val">{uniquePatients.length}</span><span className="dd-mini-label">Patients</span></div>
            <div className="dd-mini-stat"><span className="dd-mini-val">{appointments.filter(a => a.status === 'pending').length}</span><span className="dd-mini-label">Pending Appts</span></div>
            <div className="dd-mini-stat"><span className="dd-mini-val">{appointments.filter(a => a.status === 'completed').length}</span><span className="dd-mini-label">Completed</span></div>
          </div>
          <div className="dd-photo-actions">
            <label className="dd-photo-upload-btn" htmlFor="profile-photo-input">
              Change Photo
            </label>
            <input id="profile-photo-input" ref={profilePhotoInputRef} type="file" accept="image/*" onChange={handleProfileImageChange} style={{ display: 'none' }} />
            {profileImage && profileImage !== user?.avatar && (
              <button type="button" onClick={handleUploadProfileImage} disabled={uploadingProfile} className="dd-save-photo-btn">
                {uploadingProfile ? 'Saving...' : 'Save Photo'}
              </button>
            )}
          </div>
        </div>

        {/* PANEL 2: Appointments */}
        <div className="dd-panel dd-appt-panel">
          <h2 className="dd-panel-title">Appointments</h2>
          <div className="dd-tabs">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(tab => (
              <button key={tab} className={`dd-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="dd-tab-count">
                  {tab === 'all' ? appointments.length : appointments.filter(a => a.status === tab).length}
                </span>
              </button>
            ))}
          </div>

          {filteredAppointments.length === 0 ? (
            <p className="dd-empty">No {activeTab !== 'all' ? activeTab : ''} appointments found.</p>
          ) : (
            <>
              <div className="dd-appt-table-wrap dd-appt-scroll">
                <table className="dd-table">
                  <thead>
                    <tr>
                      <th>PATIENT</th>
                      <th>DATE</th>
                      <th>REASON</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments
                      .slice((appointmentCurrentPage - 1) * appointmentsPerPage, appointmentCurrentPage * appointmentsPerPage)
                      .map(apt => (
                        <tr key={apt.id}>
                          <td><strong>{apt.user?.name || 'Unknown'}</strong></td>
                          <td>{new Date(apt.date).toLocaleDateString()}{apt.time ? ` ${apt.time}` : ''}</td>
                          <td>{apt.reason || '\u2014'}</td>
                          <td><span className={`dd-status-badge ${apt.status}`}>{apt.status}</span></td>
                          <td>
                            <div className="dd-appt-actions">
                              {apt.status === 'pending' && (
                                <>
                                  <button className="dd-btn confirm" onClick={() => handleAcceptAppointment(apt.id)} disabled={actionLoading === apt.id}>Mark Confirmed</button>
                                  <button className="dd-btn decline" onClick={() => handleRejectAppointment(apt.id)} disabled={actionLoading === apt.id}>Decline</button>
                                </>
                              )}
                              {apt.status === 'confirmed' && (
                                <>
                                  <button className="dd-btn confirm" onClick={() => handleCompleteAppointment(apt.id)} disabled={actionLoading === apt.id}>Mark Completed</button>
                                  <button className="dd-btn report" onClick={() => openReportModal(apt)}>Upload Report</button>
                                </>
                              )}
                              {apt.status === 'completed' && (
                                <button className="dd-btn report" onClick={() => openReportModal(apt)}>Upload Report</button>
                              )}
                              {apt.status !== 'cancelled' && (
                                <button className="dd-btn delete" onClick={() => handleDeleteAppointment(apt.id)} disabled={actionLoading === apt.id}>Delete</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {filteredAppointments.length > appointmentsPerPage && (
                <div className="dd-appt-pagination">
                  <button
                    className="dd-pagination-btn"
                    onClick={() => setAppointmentCurrentPage(p => Math.max(1, p - 1))}
                    disabled={appointmentCurrentPage === 1}
                  >
                    ← Previous
                  </button>
                  <span className="dd-pagination-info">
                    Page {appointmentCurrentPage} of {Math.ceil(filteredAppointments.length / appointmentsPerPage)}
                  </span>
                  <button
                    className="dd-pagination-btn"
                    onClick={() => setAppointmentCurrentPage(p => Math.min(Math.ceil(filteredAppointments.length / appointmentsPerPage), p + 1))}
                    disabled={appointmentCurrentPage === Math.ceil(filteredAppointments.length / appointmentsPerPage)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {error && <div className="dd-error">{error}</div>}

      {/* ── MIDDLE ROW: Patients + Schedule ── */}
      <div className="dd-middle-row">

        {/* My Patients */}
        <div className="dd-panel dd-patients-panel">
          <div className="dd-panel-header-row">
            <h2 className="dd-panel-title">My Patients ({uniquePatients.length})</h2>
            <input
              type="text"
              className="dd-search-input"
              placeholder="Search patients..."
              value={patientSearch}
              onChange={e => setPatientSearch(e.target.value)}
            />
          </div>
        {filteredPatients.length === 0 ? (
          <p className="dd-empty">{patientSearch ? 'No matching patients.' : 'No patients yet.'}</p>
        ) : (
          <div className="dd-appt-table-wrap">
            <table className="dd-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>VISITS</th>
                  <th>LAST VISIT</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.email || '—'}</td>
                    <td>{p.phone || '—'}</td>
                    <td>{p.totalAppointments}</td>
                    <td>{p.lastVisit ? p.lastVisit.toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>

        {/* Schedule Management */}
        <div className="dd-panel dd-schedule-panel">
          <div className="dd-panel-header-row">
            <h2 className="dd-panel-title">My Schedule</h2>
            <button className="dd-add-btn" onClick={() => setShowScheduleForm(!showScheduleForm)}>
              {showScheduleForm ? 'Cancel' : '+ Add Schedule'}
            </button>
          </div>

          {showScheduleForm && (
            <form className="dd-schedule-form" onSubmit={handleCreateSchedule}>
              {scheduleFormError && <div className="dd-form-error">{scheduleFormError}</div>}
              <div className="dd-form-row">
                <div className="dd-form-group">
                  <label>Date *</label>
                  <input type="date" name="date" value={scheduleForm.date} onChange={handleScheduleFormChange} min={todayDate} required />
                </div>
                <div className="dd-form-group">
                  <label>Start Time *</label>
                  <input type="time" name="start_time" value={scheduleForm.start_time} onChange={handleScheduleFormChange} required />
                </div>
                <div className="dd-form-group">
                  <label>End Time *</label>
                  <input type="time" name="end_time" value={scheduleForm.end_time} onChange={handleScheduleFormChange} required />
                </div>
              </div>
              <div className="dd-form-row">
                <div className="dd-form-group">
                  <label>Slot Duration *</label>
                  <input type="number" name="slot_duration" value={scheduleForm.slot_duration} onChange={handleScheduleFormChange} min="15" max="120" step="15" required />
                  <small>Minutes</small>
                </div>
              </div>
              
              {scheduleForm.start_time && scheduleForm.end_time && scheduleForm.slot_duration && (
                <div className="dd-slot-preview">
                  <p className="dd-slot-info">
                    <strong>{calculateSlotCount()}</strong> slots of <strong>{scheduleForm.slot_duration}</strong> minutes will be created
                  </p>
                </div>
              )}
              
              <button type="submit" className="dd-submit-btn" disabled={scheduleFormLoading || calculateSlotCount() === 0}>
                {scheduleFormLoading ? 'Creating...' : `Create Schedule (${calculateSlotCount()} slots)`}
              </button>
            </form>
          )}

          {scheduleLoading ? (
            <p className="dd-empty">Loading schedules...</p>
          ) : schedules.length === 0 ? (
            <p className="dd-empty">No schedules yet. Add your first schedule slot.</p>
          ) : (
            <div className="dd-schedules-grouped">
              {(() => {
                // Group schedules by date
                const groupedByDate = {};
                schedules.forEach(s => {
                  if (!groupedByDate[s.date]) {
                    groupedByDate[s.date] = [];
                  }
                  groupedByDate[s.date].push(s);
                });

                // Sort by date
                return Object.entries(groupedByDate)
                  .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                  .map(([date, dateSchedules]) => {
                    const dateLabel = getDateLabel(date);
                    const isExpanded = expandedTimeRange === date;
                    
                    // Find overall start and end times across all schedules on this date
                    let minStartTime = dateSchedules[0].start_time;
                    let maxEndTime = dateSchedules[0].end_time;
                    let totalSlots = 0;
                    let duration = dateSchedules[0].slot_duration || 30;
                    
                    dateSchedules.forEach(s => {
                      if (s.start_time < minStartTime) minStartTime = s.start_time;
                      if (s.end_time > maxEndTime) maxEndTime = s.end_time;
                      totalSlots += s.available_slots;
                    });
                    
                    // Flatten all slots from all schedules on this date
                    const allSlots = [];
                    dateSchedules.forEach(s => {
                      const dur = s.slot_duration || 30;
                      const [startH, startM] = s.start_time.split(':').map(Number);
                      for (let i = 0; i < s.available_slots; i++) {
                        let slotStartMin = startH * 60 + startM + (i * dur);
                        const slotEnd = slotStartMin + dur;
                        const slotStartHour = Math.floor(slotStartMin / 60);
                        const slotStartMins = slotStartMin % 60;
                        const slotEndHour = Math.floor(slotEnd / 60);
                        const slotEndMins = slotEnd % 60;
                        allSlots.push({
                          scheduleId: s.id,
                          start: `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMins).padStart(2, '0')}`,
                          end: `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMins).padStart(2, '0')}`
                        });
                      }
                    });

                    return (
                      <div key={date} className="dd-date-group">
                        <div className="dd-date-header">
                          <div>
                            <h3 className="dd-date-label">{dateLabel}</h3>
                            <div className="dd-schedules-summary">
                              <div className="dd-schedule-time-range">
                                <span className="dd-time-badge">{minStartTime} - {maxEndTime}</span>
                                <span className="dd-duration-info">{duration} min</span>
                                <span className="dd-slots-info">{totalSlots} slots</span>
                              </div>
                            </div>
                          </div>
                          <div className="dd-date-actions">
                            <button 
                              className="dd-btn-view-slots"
                              onClick={() => setExpandedTimeRange(isExpanded ? null : date)}
                            >
                              {isExpanded ? 'Hide Slots' : 'View Slots'}
                            </button>
                            {dateSchedules.length > 0 && (
                              <button 
                                className="dd-btn-delete-all"
                                onClick={() => handleDeleteAllSchedulesOnDate(dateSchedules)}
                              >
                                Delete All
                              </button>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="dd-slots-list-container">
                            <div className="dd-slots-scroll-wrapper">
                              {allSlots.map((slot, idx) => (
                                <div key={idx} className="dd-slot-card">
                                  <span className="dd-slot-num">{idx + 1}</span>
                                  <span className="dd-slot-time-range">{slot.start} - {slot.end}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
              })()}
            </div>
          )}
        </div>

      </div>

      {/* ── BOTTOM ROW: Reviews ── */}
      <div className="dd-bottom-row">
        {/* Patient Reviews */}
        <div className="dd-panel dd-reviews-panel">
          <h2 className="dd-panel-title">Patient Reviews</h2>
          {reviewsLoading ? (
            <p className="dd-empty">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="dd-empty">No reviews yet.</p>
          ) : reviews.map((r, idx) => (
            <div className="dd-review-card" key={r.id || idx}>
              <div className="dd-review-top">
                <strong>{r.patient?.name || r.user?.name || 'Patient'}</strong>
                <div className="dd-review-stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < r.rating ? 'star filled' : 'star empty'}>&#9733;</span>
                  ))}
                </div>
                <span className={`dd-review-status ${r.status}`}>{r.status}</span>
              </div>
              {r.comment && <p className="dd-review-comment">{r.comment}</p>}
              <span className="dd-review-date">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && selectedPatient && (
        <div className="modal-overlay" onClick={closeReportModal}>
          <div className="modal-content dd-report-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Patient Report</h2>
              <button className="close-modal-btn" onClick={closeReportModal}>&times;</button>
            </div>
            <div className="dd-patient-summary">
              <p><strong>Patient:</strong> {selectedPatient.user?.name || 'Unknown'}</p>
              <p><strong>Date:</strong> {new Date(selectedPatient.date).toLocaleDateString()}</p>
              {selectedPatient.reason && <p><strong>Reason:</strong> {selectedPatient.reason}</p>}
            </div>
            {reportMessage.text && <div className={`dd-msg ${reportMessage.type}`}>{reportMessage.text}</div>}
            <form onSubmit={handleSubmitReport} className="dd-report-form">
              <div className="dd-form-group">
                <label>Report Title *</label>
                <input type="text" name="title" value={reportForm.title} onChange={e => setReportForm(p => ({ ...p, [e.target.name]: e.target.value }))} required />
              </div>
              <div className="dd-form-group">
                <label>Diagnosis *</label>
                <textarea name="diagnosis" value={reportForm.diagnosis} onChange={e => setReportForm(p => ({ ...p, [e.target.name]: e.target.value }))} rows="3" required />
              </div>
              <div className="dd-form-group">
                <label>Treatment Plan</label>
                <textarea name="treatment" value={reportForm.treatment} onChange={e => setReportForm(p => ({ ...p, [e.target.name]: e.target.value }))} rows="3" />
              </div>
              <div className="dd-form-group">
                <label>Description</label>
                <textarea name="description" value={reportForm.description} onChange={e => setReportForm(p => ({ ...p, [e.target.name]: e.target.value }))} rows="2" />
              </div>
              <div className="dd-form-group">
                <label>Notes</label>
                <textarea name="notes" value={reportForm.notes} onChange={e => setReportForm(p => ({ ...p, [e.target.name]: e.target.value }))} rows="2" />
              </div>
              <div className="dd-form-actions">
                <button type="button" onClick={closeReportModal} className="dd-btn cancel">Cancel</button>
                <button type="submit" disabled={reportLoading} className="dd-btn submit">{reportLoading ? 'Submitting...' : 'Submit Report'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="dd-footer">
        <div className="dd-footer-content">
          <div className="dd-footer-brand">
            <h3>Hospital Management System</h3>
            <p>Providing efficient healthcare administration across all hospitals in the network.</p>
          </div>
          <div className="dd-footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/dashboard/doctor">Dashboard</a></li>
              <li><a href="/browse-hospitals">Hospitals</a></li>
              <li><a href="/browse-doctors">Doctors</a></li>
            </ul>
          </div>
          <div className="dd-footer-links">
            <h4>Management</h4>
            <ul>
              <li><a href="/dashboard/doctor">Appointments</a></li>
              <li><a href="/dashboard/doctor">Schedules</a></li>
              <li><a href="/dashboard/doctor">Reports</a></li>
            </ul>
          </div>
        </div>
        <div className="dd-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Hospital Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default DoctorDashboard;
