import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import Footer from '../components/Common/Footer';
import '../styles/PatientDashboard.css';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Doctor reviews for cards
  const [doctorReviews, setDoctorReviews] = useState({});
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Reports section
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState(null);
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [reportCurrentPage, setReportCurrentPage] = useState(1);
  const reportsPerPage = 5;
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!token || user?.role !== 'patient') {
      navigate('/login');
      return;
    }
    fetchAllData();
  }, [token, user, navigate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setReportsLoading(true);
      const [dashRes, hospitalsRes, doctorsRes, appointmentsRes, reportsRes] = await Promise.all([
        api.getDashboard('/dashboard/patient', token),
        api.getHospitals(token),
        api.getDoctors(),
        api.getAppointments(token),
        api.getReports(token),
      ]);
      
      if (dashRes.status === 'success') {
        setDashboardData(dashRes.data);
      } else {
        setError(dashRes.message || 'Failed to load dashboard');
      }

      if (hospitalsRes.status === 'success' && hospitalsRes.data) {
        setHospitals(hospitalsRes.data);
      } else if (Array.isArray(hospitalsRes)) {
        setHospitals(hospitalsRes);
      }

      if (doctorsRes.status === 'success' && doctorsRes.data) {
        setDoctors(Array.isArray(doctorsRes.data) ? doctorsRes.data : []);
      } else if (Array.isArray(doctorsRes)) {
        setDoctors(doctorsRes);
      }

      if (appointmentsRes.status === 'success' && appointmentsRes.data) {
        setAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data : appointmentsRes.data.data || []);
      } else if (Array.isArray(appointmentsRes)) {
        setAppointments(appointmentsRes);
      }

      if (reportsRes.status === 'success' && reportsRes.data) {
        setReports(Array.isArray(reportsRes.data) ? reportsRes.data : reportsRes.data.data || []);
      } else if (Array.isArray(reportsRes)) {
        setReports(reportsRes);
      }

      // Fetch reviews for doctors - moved to doctor view page
      // await fetchDoctorReviews(doctorsRes.status === 'success' ? doctorsRes.data : doctorsRes);
    } catch (err) {
      setError('Error loading data');
      console.error('Fetch error:', err);
    } finally {
      setReportsLoading(false);
      setLoading(false);
    }
  };

  const fetchDoctorReviews = async (doctorsList) => {
    try {
      setLoadingReviews(true);
      const reviewsData = {};
      
      const docsArray = Array.isArray(doctorsList) ? doctorsList : [];
      
      for (const doc of docsArray) {
        try {
          const reviewRes = await api.getDoctorReviews(doc.id);
          if (reviewRes.status === 'success') {
            reviewsData[doc.id] = reviewRes.data;
          }
        } catch (err) {
          console.error(`Failed to fetch reviews for doctor ${doc.id}:`, err);
          reviewsData[doc.id] = [];
        }
      }
      
      setDoctorReviews(reviewsData);
    } catch (err) {
      console.error('Error fetching doctor reviews:', err);
    } finally {
      setLoadingReviews(false);
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

  const handleHospitalClick = (hospitalId) => {
    navigate(`/hospital/${hospitalId}/departments`);
  };

  const openReviewModal = (appointment) => {
    // Check if appointment is completed or confirmed
    if (!['completed', 'confirmed'].includes(appointment.status)) {
      alert('You can only review after appointment is confirmed or completed');
      return;
    }
    setSelectedAppointment(appointment);
    setReviewForm({ rating: 5, comment: '' });
    setReviewMessage({ type: '', text: '' });
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedAppointment(null);
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Delete this pending report? This cannot be undone.')) return;
    setDeletingReportId(reportId);
    try {
      const res = await api.deleteReport(reportId, token);
      if (res.status === 'success') {
        setReports(prev => prev.filter(r => r.id !== reportId));
      } else {
        alert(res.message || 'Failed to delete report');
      }
    } catch {
      alert('Error deleting report');
    } finally {
      setDeletingReportId(null);
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      setDownloadingReportId(report.id);
      
      // Generate formatted text from report content
      let content = `MEDICAL REPORT\n`;
      content += `${'='.repeat(60)}\n\n`;
      content += `Title: ${report.title}\n`;
      content += `Date: ${new Date(report.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
      if (report.doctor?.name) {
        content += `Doctor: Dr. ${report.doctor.name}\n`;
      }
      content += `Status: ${report.status}\n\n`;
      
      content += `DIAGNOSIS\n${'-'.repeat(60)}\n${report.diagnosis || 'N/A'}\n\n`;
      
      if (report.treatment) {
        content += `TREATMENT PLAN\n${'-'.repeat(60)}\n${report.treatment}\n\n`;
      }
      
      if (report.description) {
        content += `DESCRIPTION\n${'-'.repeat(60)}\n${report.description}\n\n`;
      }
      
      if (report.notes) {
        content += `NOTES\n${'-'.repeat(60)}\n${report.notes}\n\n`;
      }
      
      content += `${'='.repeat(60)}\n`;
      content += `Generated on: ${new Date().toLocaleString()}\n`;
      
      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Report_${report.title.replace(/\s+/g, '_')}_${report.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report');
    } finally {
      setDownloadingReportId(null);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      setReviewMessage({ type: 'error', text: 'Please select a rating between 1 and 5' });
      return;
    }

    const doctorUserId = selectedAppointment?.doctor?.user?.id
      || selectedAppointment?.doctor?.user_id
      || selectedAppointment?.doctor_id;

    if (!doctorUserId) {
      setReviewMessage({ type: 'error', text: 'Doctor not found for this appointment' });
      return;
    }

    setReviewLoading(true);
    setReviewMessage({ type: '', text: '' });
    try {
      const res = await api.submitReview({
        doctor_id: doctorUserId,
        appointment_id: selectedAppointment.id,
        rating: parseInt(reviewForm.rating),
        comment: reviewForm.comment,
      }, token);

      if (res.status === 'success') {
        setReviewMessage({ type: 'success', text: 'Review submitted successfully! It will be published after approval.' });
        setTimeout(() => {
          closeReviewModal();
          fetchAllData();
        }, 1500);
      } else {
        setReviewMessage({ type: 'error', text: res.message || 'Failed to submit review' });
      }
    } catch (err) {
      console.error('Review error:', err);
      setReviewMessage({ type: 'error', text: 'Error submitting review' });
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null;

  return (
    <div className="patient-dashboard-page">
      <PageHero 
        title={`Welcome, ${user.name}`} 
        subtitle="Manage your medical records, view doctors, and book appointments."
      />
      <div className="patient-dashboard">
      <main className="dashboard-main">
        {error && <div className="error-message">{error}</div>}

        {/* Patient Info Card */}
        <section className="patient-info">
          <div className="info-card">
            <h2>Your Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Patient ID</span>
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
                <span className="info-label">Hospital</span>
                <span className="info-value">{dashboardData?.hospital_name || 'N/A'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* DOCTORS SECTION - Below hero */}
        <section className="pd-doctors-section">
          <div className="pd-section-header">
            <h2>Our Doctors</h2>
            <p>Browse our qualified healthcare professionals</p>
          </div>
          {doctors.length > 0 ? (
            <div className="pd-doctors-grid">
              {doctors.map((doc) => (
                <div key={doc.id} className="pd-doctor-card">
                  <div className="pd-doctor-photo">
                    {doc.image && doc.image !== '' ? (
                      <img 
                        src={`${api.getStorageUrl()}/${doc.image}`} 
                        alt={doc.user?.name || doc.name}
                        onError={(e) => { 
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                        style={{ display: 'block' }}
                      />
                    ) : null}
                    <div className="pd-photo-fallback" style={doc.image && doc.image !== '' ? {display:'none'} : {display:'flex'}}>
                      {doc.user?.name?.charAt(0) || 'D'}
                    </div>
                  </div>
                  <div className="pd-doctor-info">
                    <h3>{doc.user?.name || 'Doctor'}</h3>
                    {doc.department?.name && <span className="pd-dept-badge">{doc.department.name}</span>}
                    {doc.specialization && <p className="pd-specialization">{doc.specialization}</p>}
                    {doc.qualification && <p className="pd-qualification">{doc.qualification}</p>}
                    {doc.experience_years > 0 && <p className="pd-experience">{doc.experience_years} yrs experience</p>}
                    {doc.consultation_fee > 0 && <p className="pd-fee">Rs. {doc.consultation_fee}</p>}
                    {doc.hospital?.name && <p className="pd-hospital-name">{doc.hospital.name}</p>}
                    {doc.user?.average_rating > 0 && (
                      <div className="pd-doc-rating">
                        {'★'.repeat(Math.round(doc.user.average_rating))}{'☆'.repeat(5 - Math.round(doc.user.average_rating))}
                        <span className="pd-rating-value"> {Number(doc.user.average_rating).toFixed(1)} ({doc.user.total_reviews})</span>
                      </div>
                    )}
                  </div>
                  <button 
                    className="pd-view-btn"
                    onClick={() => navigate(`/doctor/${doc.id}`)}
                  >
                    View Doctor
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No doctors available</div>
          )}
        </section>

        {/* HOSPITALS SECTION */}
        <section className="pd-hospitals-section">
          <div className="pd-section-header">
            <h2>Our Hospitals</h2>
            <p>Browse hospitals and book appointments</p>
          </div>
          {hospitals.length > 0 ? (
            <div className="pd-hospitals-grid">
              {hospitals.map((hospital) => (
                <div key={hospital.id} className="pd-hospital-card">
                  {hospital.image && (
                    <div className="pd-hospital-image">
                      <img 
                        src={`${api.getStorageUrl()}/${hospital.image}`} 
                        alt={hospital.name}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="pd-hospital-info">
                    <h3>{hospital.name}</h3>
                    <p><strong>Email:</strong> {hospital.email}</p>
                    <p><strong>Address:</strong> {hospital.address || 'N/A'}</p>
                    {hospital.phone && <p><strong>Phone:</strong> {hospital.phone}</p>}
                  </div>
                  <div className="pd-hospital-actions">
                    <button 
                      className="pd-view-btn"
                      onClick={() => navigate(`/hospital/${hospital.id}`)}
                    >
                      View Hospital
                    </button>
                    <button 
                      className="pd-book-btn"
                      onClick={() => handleHospitalClick(hospital.id)}
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No hospitals available</div>
          )}
        </section>

        {/* APPOINTMENTS SECTION - For reviews */}
        {appointments.length > 0 && (
          <section className="pd-appointments-section">
            <div className="pd-section-header">
              <h2>Your Appointments</h2>
              <p>Review completed appointments</p>
            </div>
            <div className="pd-appointments-list">
              {appointments
                .filter(apt => ['completed', 'confirmed'].includes(apt.status))
                .map((appointment) => (
                  <div key={appointment.id} className="pd-appointment-card">
                    <div className="pd-appt-info">
                      <h4>Dr. {appointment.doctor?.user?.name || 'Doctor'}</h4>
                      <p><strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {appointment.time}</p>
                      <p><strong>Status:</strong> <span className={`pd-status pd-status-${appointment.status}`}>{appointment.status.toUpperCase()}</span></p>
                    </div>
                    <button 
                      className="pd-review-btn"
                      onClick={() => openReviewModal(appointment)}
                    >
                      Write Review
                    </button>
                  </div>
                ))}
              {appointments.filter(apt => ['completed', 'confirmed'].includes(apt.status)).length === 0 && (
                <p className="no-data">No completed appointments to review yet</p>
              )}
            </div>
          </section>
        )}

        {/* REPORTS SECTION - View doctor's reports with download */}
        <section className="pd-reports-section">
          <div className="pd-section-header">
            <h2>Doctor Reports</h2>
            <p>View and download reports uploaded by your doctors</p>
          </div>

          {reportsLoading ? (
            <div className="no-data">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="no-data">No reports uploaded yet.</div>
          ) : (
            <>
              <div className="pd-reports-list">
                {reports
                  .slice((reportCurrentPage - 1) * reportsPerPage, reportCurrentPage * reportsPerPage)
                  .map((report) => (
                    <div key={report.id} className="pd-report-card">
                      <div className="pd-report-header">
                        <div className="pd-report-title">
                          <h4>{report.title || 'Medical Report'}</h4>
                          <p className="pd-report-doctor">Dr. {report.doctor?.name || report.doctor?.user?.name || 'Unknown'}</p>
                        </div>
                        <div className="pd-report-meta">
                          <span className="pd-report-date">{new Date(report.created_at).toLocaleDateString()}</span>
                          {report.diagnosis && <span className="pd-report-diagnosis">{report.diagnosis}</span>}
                        </div>
                      </div>

                      <div className="pd-report-actions">
                        <button
                          className="pd-download-btn"
                          onClick={() => handleDownloadReport(report)}
                          disabled={downloadingReportId === report.id}
                        >
                          {downloadingReportId === report.id ? '⏳' : '📥'} Download Report
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {reports.length > reportsPerPage && (
                <div className="pd-reports-pagination">
                  <button
                    className="pd-pagination-btn"
                    onClick={() => setReportCurrentPage(p => Math.max(1, p - 1))}
                    disabled={reportCurrentPage === 1}
                  >
                    ← Previous
                  </button>
                  <span className="pd-pagination-info">
                    Page {reportCurrentPage} of {Math.ceil(reports.length / reportsPerPage)}
                  </span>
                  <button
                    className="pd-pagination-btn"
                    onClick={() => setReportCurrentPage(p => Math.min(Math.ceil(reports.length / reportsPerPage), p + 1))}
                    disabled={reportCurrentPage === Math.ceil(reports.length / reportsPerPage)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>

      </main>
      </div>

      {/* REVIEW MODAL */}
      {showReviewModal && selectedAppointment && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content pd-review-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Write Review</h2>
              <button className="close-modal-btn" onClick={closeReviewModal}>&times;</button>
            </div>
            <div className="pd-appointment-info">
              <p><strong>Doctor:</strong> Dr. {selectedAppointment.doctor?.user?.name}</p>
              <p><strong>Date:</strong> {new Date(selectedAppointment.date).toLocaleDateString()}</p>
            </div>
            {reviewMessage.text && <div className={`pd-msg ${reviewMessage.type}`}>{reviewMessage.text}</div>}
            <form onSubmit={handleSubmitReview} className="pd-review-form">
              <div className="pd-form-group">
                <label>Rating *</label>
                <div className="pd-rating-input">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`pd-star ${reviewForm.rating >= star ? 'active' : ''}`}
                      onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span className="pd-rating-text">{reviewForm.rating} out of 5</span>
              </div>
              <div className="pd-form-group">
                <label>Comment (Optional)</label>
                <textarea 
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                  rows="4"
                  placeholder="Share your experience..."
                  maxLength="1000"
                />
                <small>{reviewForm.comment.length}/1000</small>
              </div>
              <div className="pd-form-actions">
                <button type="button" onClick={closeReviewModal} className="pd-btn cancel">Cancel</button>
                <button type="submit" disabled={reviewLoading} className="pd-btn submit">
                  {reviewLoading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PatientDashboard;
