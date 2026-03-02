import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Reports.css';

const Reports = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewData, setReviewData] = useState({
    status: 'reviewed',
    notes: '',
  });

  const [uploadData, setUploadData] = useState({
    patient_id: '',
    file: null,
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchReports();
  }, [token, navigate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.getReports(token);
      if (response.status === 'success') {
        // Handle paginated response (data.data) or direct array
        const reportsData = response.data?.data || response.data || [];
        setReports(Array.isArray(reportsData) ? reportsData : []);
      } else {
        setError(response.message || 'Failed to load reports');
      }
    } catch (err) {
      setError('Error loading reports');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('patient_id', uploadData.patient_id);
    formData.append('file', uploadData.file);

    try {
      setLoading(true);
      const response = await api.uploadReport(formData, token);
      if (response.status === 'success') {
        setUploadData({ patient_id: '', file: null });
        setShowUploadForm(false);
        fetchReports();
      } else {
        setError(response.message || 'Failed to upload report');
      }
    } catch (err) {
      setError('Error uploading report');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewReport = async (reportId) => {
    try {
      setLoading(true);
      const response = await api.reviewReport(reportId, reviewData, token);
      if (response.status === 'success') {
        setSelectedReport(null);
        setReviewData({ status: 'reviewed', notes: '' });
        fetchReports();
      } else {
        setError(response.message || 'Failed to review report');
      }
    } catch (err) {
      setError('Error reviewing report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const canUpload = user?.role === 'doctor';
  const canReview = user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'super_admin';

  return (
    <div className="reports-container">
      <header className="page-header">
        <div>
          <h1>📋 Medical Reports</h1>
          <p>Manage patient medical reports and reviews</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary">
          Back to Dashboard
        </button>
      </header>

      <main className="page-content">
        {error && <div className="error-message">{error}</div>}

        <div className="reports-header">
          <h2>Reports ({reports.length})</h2>
          {canUpload && (
            <button 
              onClick={() => setShowUploadForm(!showUploadForm)} 
              className="btn-primary"
            >
              {showUploadForm ? 'Cancel' : '+ Upload Report'}
            </button>
          )}
        </div>

        {showUploadForm && canUpload && (
          <form onSubmit={handleUploadReport} className="upload-form">
            <div className="form-group">
              <label>Patient ID *</label>
              <input
                type="text"
                value={uploadData.patient_id}
                onChange={(e) => setUploadData({...uploadData, patient_id: e.target.value})}
                placeholder="Enter patient ID or email"
                required
              />
            </div>

            <div className="form-group">
              <label>Report File *</label>
              <input
                type="file"
                onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})}
                placeholder="Select file"
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Report'}
            </button>
          </form>
        )}

        <div className="reports-grid">
          {reports.length === 0 ? (
            <div className="no-reports">
              <p>No reports found. Upload one to get started!</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-header">
                  <h3>{report.title || `Report #${report.id}`}</h3>
                  <span className={`status-badge status-${report.status?.toLowerCase()}`}>
                    {report.status || 'Pending'}
                  </span>
                </div>

                <div className="report-details">
                  <p><strong>Patient:</strong> {report.patient?.name || `ID: ${report.patient_id}`}</p>
                  <p><strong>Doctor:</strong> {report.doctor?.user?.name || report.doctor?.name || `ID: ${report.doctor_id || 'N/A'}`}</p>
                  <p><strong>Hospital:</strong> {report.hospital?.name || `ID: ${report.hospital_id || 'N/A'}`}</p>
                  {report.diagnosis && (
                    <p><strong>Diagnosis:</strong> {report.diagnosis}</p>
                  )}
                  {report.treatment && (
                    <p><strong>Treatment:</strong> {report.treatment}</p>
                  )}
                  {report.description && (
                    <p><strong>Description:</strong> {report.description}</p>
                  )}
                  {report.file_path && (
                    <p><strong>File:</strong> <a href={`/storage/${report.file_path}`} target="_blank" rel="noopener noreferrer">View File</a></p>
                  )}
                  {report.notes && (
                    <p><strong>Notes:</strong> {report.notes}</p>
                  )}
                  <p><strong>Created:</strong> {new Date(report.created_at).toLocaleDateString()}</p>
                </div>

                {canReview && (
                <button 
                  onClick={() => setSelectedReport(report)}
                  className="btn-secondary"
                >
                  Review Report
                </button>
              )}
            </div>
          ))
        )}
        </div>
      </main>

      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Review Report #{selectedReport.id}</h2>
            
            <div className="form-group">
              <label>Status</label>
              <select 
                value={reviewData.status}
                onChange={(e) => setReviewData({...reviewData, status: e.target.value})}
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="form-group">
              <label>Review Notes</label>
              <textarea
                value={reviewData.notes}
                onChange={(e) => setReviewData({...reviewData, notes: e.target.value})}
                placeholder="Add your review notes here"
                rows="5"
              />
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => handleReviewReport(selectedReport.id)}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Submit Review'}
              </button>
              <button 
                onClick={() => setSelectedReport(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
