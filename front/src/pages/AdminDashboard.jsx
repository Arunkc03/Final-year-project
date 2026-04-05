import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [deptFormData, setDeptFormData] = useState({
    name: '',
    description: '',
    head_doctor: '',
    total_beds: '',
    status: 'active'
  });
  const [deptFormLoading, setDeptFormLoading] = useState(false);
  const [deptFormError, setDeptFormError] = useState('');
  const [deptFormSuccess, setDeptFormSuccess] = useState('');
  
  // Doctor form states
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [doctorFormDept, setDoctorFormDept] = useState(null);
  const [doctorFormData, setDoctorFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    department_id: '',
    license_number: '',
    qualification: '',
    experience_years: '',
    consultation_fee: '',
    bio: '',
    image: null,
    imagePreview: '',
  });
  const [doctorFormLoading, setDoctorFormLoading] = useState(false);
  const [doctorFormError, setDoctorFormError] = useState('');
  const [doctorFormSuccess, setDoctorFormSuccess] = useState('');
  
  // Doctor view/delete/edit states
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [showDoctorView, setShowDoctorView] = useState(false);
  const [deletingDoctorId, setDeletingDoctorId] = useState(null);
  const [editingDoctorId, setEditingDoctorId] = useState(null);

  // Hospital info / edit states
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [hospitalEditMode, setHospitalEditMode] = useState(false);
  const [hospitalFormData, setHospitalFormData] = useState({});
  const [hospitalFormLoading, setHospitalFormLoading] = useState(false);
  const [hospitalFormError, setHospitalFormError] = useState('');
  const [hospitalImageFile, setHospitalImageFile] = useState(null);
  const [hospitalImagePreview, setHospitalImagePreview] = useState('');

  // Reviews
  const [allReviews, setAllReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  // Patients
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [deletingPatientId, setDeletingPatientId] = useState(null);

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchDashboard();
  }, [token, user, navigate]);

  useEffect(() => {
    if (dashboardData?.hospital_id) {
      fetchDepartments(dashboardData.hospital_id);
      fetchHospitalInfo(dashboardData.hospital_id);
      fetchPatients();
      fetchAllReviews();
    }
  }, [dashboardData]);

  const fetchDepartments = async (hospitalId) => {
    try {
      const response = await api.getDepartments(hospitalId, token);
      if (response.status === 'success') {
        const depts = response.data?.data || response.data || [];
        setDepartments(depts);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchHospitalInfo = async (hospitalId) => {
    try {
      const response = await api.getHospital(hospitalId, token);
      if (response.status === 'success') {
        const h = response.data?.hospital || response.hospital || {};
        setHospitalInfo(h);
        setHospitalFormData({
          name: h.name || '',
          address: h.address || '',
          phone: h.phone || '',
          email: h.email || '',
          description: h.description || '',
        });
        if (h.image) setHospitalImagePreview(`${api.getStorageUrl()}/${h.image}`);
      }
    } catch (err) {
      console.error('Error fetching hospital info:', err);
    }
  };

  const fetchPatients = async () => {
    setPatientsLoading(true);
    try {
      const response = await api.getPatients(token);
      if (response.status === 'success') {
        const list = response.data?.data || response.data || [];
        setPatients(list);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setPatientsLoading(false);
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (!window.confirm('Are you sure you want to remove this patient? This action cannot be undone.')) return;
    setDeletingPatientId(patientId);
    try {
      const response = await api.deletePatient(patientId, token);
      if (response.status === 'success') {
        setPatients(prev => prev.filter(p => p.id !== patientId));
      } else {
        alert(response.message || 'Failed to remove patient');
      }
    } catch (err) {
      alert('Error removing patient: ' + (err.message || err));
    } finally {
      setDeletingPatientId(null);
    }
  };

  const fetchAllReviews = async () => {
    setReviewsLoading(true);
    try {
      // Use authenticated admin /reviews endpoint — returns all-status reviews for hospital
      const res = await api.getMyReviews(token);
      const list = res.data?.data || res.data || [];
      setAllReviews(list.map(r => ({
        ...r,
        doctorName: r.doctor?.name || r.doctor?.user?.name || 'Doctor',
      })));
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    setDeletingReviewId(reviewId);
    try {
      const res = await api.deleteReview(reviewId, token);
      if (res.status === 'success') {
        setAllReviews(prev => prev.filter(r => r.id !== reviewId));
      } else {
        alert(res.message || 'Failed to delete review');
      }
    } catch (err) {
      alert('Error deleting review: ' + (err.message || err));
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleHospitalFormChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files[0]) {
      setHospitalImageFile(files[0]);
      const reader = new FileReader();
      reader.onloadend = () => setHospitalImagePreview(reader.result);
      reader.readAsDataURL(files[0]);
    } else {
      setHospitalFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleHospitalUpdate = async (e) => {
    e.preventDefault();
    setHospitalFormLoading(true);
    setHospitalFormError('');
    try {
      let response;
      if (hospitalImageFile) {
        const fd = new FormData();
        Object.keys(hospitalFormData).forEach(k => fd.append(k, hospitalFormData[k]));
        fd.append('image', hospitalImageFile);
        response = await api.updateHospitalWithImage(hospitalInfo.id, fd, token);
      } else {
        response = await api.updateHospital(hospitalInfo.id, hospitalFormData, token);
      }
      if (response.status === 'success') {
        setHospitalEditMode(false);
        fetchHospitalInfo(dashboardData.hospital_id);
      } else {
        const errMsg = response.message
          || (response.errors ? Object.values(response.errors).flat().join(', ') : '')
          || 'Failed to update hospital';
        setHospitalFormError(errMsg);
      }
    } catch (err) {
      setHospitalFormError('Error updating hospital: ' + (err.message || err));
    } finally {
      setHospitalFormLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.getDashboard('/dashboard/admin', token);
      if (response.status === 'success') {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'Failed to load dashboard');
      }
    } catch (err) {
      setError('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDeptFormChange = (e) => {
    const { name, value } = e.target;
    setDeptFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setDeptFormLoading(true);
    setDeptFormError('');
    setDeptFormSuccess('');

    try {
      const data = {
        ...deptFormData,
        hospital_id: dashboardData?.hospital_id,
        total_beds: deptFormData.total_beds ? parseInt(deptFormData.total_beds) : 0
      };
      console.log('Creating department with data:', data);
      const response = await api.createDepartment(data, token);
      console.log('Department creation response:', response);
      if (response.status === 'success') {
        setDeptFormSuccess('Department created successfully!');
        setDeptFormData({
          name: '',
          description: '',
          head_doctor: '',
          total_beds: '',
          status: 'active'
        });
        setShowDeptForm(false);
        fetchDepartments(dashboardData.hospital_id);
      } else {
        setDeptFormError(response.message || 'Failed to create department');
      }
    } catch (err) {
      console.error('Department creation error:', err);
      setDeptFormError(err.message || 'Error creating department');
    } finally {
      setDeptFormLoading(false);
    }
  };

  // Doctor form handlers
  const openDoctorForm = (dept) => {
    setDoctorFormDept(dept);
    setDoctorFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      department_id: dept.id,
      license_number: '',
      qualification: '',
      experience_years: '',
      consultation_fee: '',
      bio: '',
    });
    setDoctorFormError('');
    setDoctorFormSuccess('');
    setShowDoctorForm(true);
  };

  const handleDoctorFormChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      if (file) {
        // Read file for preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setDoctorFormData(prev => ({ 
            ...prev, 
            image: file,
            imagePreview: reader.result
          }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      setDoctorFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setDoctorFormLoading(true);
    setDoctorFormError('');
    setDoctorFormSuccess('');

    try {
      // Use FormData for file upload
      const formData = new FormData();
      Object.keys(doctorFormData).forEach(key => {
        if (key !== 'imagePreview' && doctorFormData[key] !== null && doctorFormData[key] !== '') {
          formData.append(key, doctorFormData[key]);
        }
      });
      
      // Check if editing or creating
      let response;
      if (editingDoctorId) {
        response = await api.updateDoctor(editingDoctorId, formData, token);
      } else {
        response = await api.createDoctor(formData, token);
      }
      
      if (response.status === 'success') {
        const successMsg = editingDoctorId ? 'Doctor updated successfully!' : 'Doctor created successfully!';
        setDoctorFormSuccess(successMsg);
        setDoctorFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          department_id: '',
          license_number: '',
          qualification: '',
          experience_years: '',
          consultation_fee: '',
          bio: '',
          image: null,
          imagePreview: '',
        });
        setEditingDoctorId(null);
        setShowDoctorForm(false);
        setDoctorFormDept(null);
        fetchDepartments(dashboardData.hospital_id);
      } else {
        const errorMsg = response.message || response.errors?.email?.[0] || (editingDoctorId ? 'Failed to update doctor' : 'Failed to create doctor');
        setDoctorFormError(errorMsg);
      }
    } catch (err) {
      const errorAction = editingDoctorId ? 'updating' : 'creating';
      setDoctorFormError(`Error ${errorAction} doctor: ` + (err.message || err.toString()));
    } finally {
      setDoctorFormLoading(false);
    }
  };

  const closeDoctorForm = () => {
    setShowDoctorForm(false);
    setDoctorFormDept(null);
    setEditingDoctorId(null);
    setDoctorFormError('');
    setDoctorFormSuccess('');
    setDoctorFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      department_id: '',
      license_number: '',
      qualification: '',
      experience_years: '',
      consultation_fee: '',
      bio: '',
      image: null,
      imagePreview: '',
    });
  };

  const handleEditDoctor = (doctor, dept) => {
    setEditingDoctorId(doctor.id);
    setDoctorFormDept(dept);
    setDoctorFormData({
      name: doctor.user?.name || doctor.name || '',
      email: doctor.user?.email || '',
      password: '',
      phone: doctor.phone || '',
      department_id: dept?.id || doctor.department_id || '',
      license_number: doctor.license_number || '',
      qualification: doctor.qualification || '',
      experience_years: doctor.experience_years || '',
      consultation_fee: doctor.consultation_fee || '',
      bio: doctor.bio || '',
      image: null,
      imagePreview: doctor.image ? `${api.getStorageUrl()}/${doctor.image}` : '',
    });
    setDoctorFormError('');
    setDoctorFormSuccess('');
    setShowDoctorForm(true);
  };

  // View doctor
  const handleViewDoctor = (doctor) => {
    setViewingDoctor(doctor);
    setShowDoctorView(true);
  };

  const closeDoctorView = () => {
    setViewingDoctor(null);
    setShowDoctorView(false);
  };

  // Delete doctor
  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) {
      return;
    }
    setDeletingDoctorId(doctorId);
    try {
      const response = await api.deleteDoctor(doctorId, token);
      if (response.status === 'success') {
        fetchDepartments(dashboardData.hospital_id);
        alert('Doctor deleted successfully');
      } else {
        alert(response.message || 'Failed to delete doctor');
      }
    } catch (err) {
      alert('Error deleting doctor: ' + (err.message || err.toString()));
    } finally {
      setDeletingDoctorId(null);
    }
  };

  if (loading) return <div className="ad-loading">Loading dashboard...</div>;
  if (!user) return null;

  return (
    <div className="ad-page">

      {/* ── HOSPITAL INFO SECTION ── */}
      <section className="ad-hospital-section">
        {!hospitalEditMode ? (
          <div className="ad-hospital-view">
            <div className="ad-hospital-img-wrap">
              {hospitalInfo?.image ? (
                <img
                  src={hospitalImagePreview || `${api.getStorageUrl()}/${hospitalInfo.image}`}
                  alt={hospitalInfo?.name}
                  className="ad-hospital-img"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="ad-hospital-img-placeholder">H</div>
              )}
            </div>
            <div className="ad-hospital-details">
              <h1 className="ad-hospital-name">{hospitalInfo?.name || 'Hospital'}</h1>
              {hospitalInfo?.address && <p className="ad-hospital-addr">{hospitalInfo.address}</p>}
              {hospitalInfo?.phone && <p className="ad-hospital-phone">{hospitalInfo.phone}</p>}
              {hospitalInfo?.email && <p className="ad-hospital-email">{hospitalInfo.email}</p>}
              {hospitalInfo?.description && <p className="ad-hospital-desc">{hospitalInfo.description}</p>}
              <div className="ad-hospital-stats">
                <span className="ad-hstat">{dashboardData?.total_doctors || 0} Doctors</span>
                <span className="ad-hstat">{dashboardData?.total_patients || 0} Patients</span>
                <span className="ad-hstat">{dashboardData?.total_appointments || 0} Appointments</span>
              </div>
            </div>
            <button className="ad-edit-hospital-btn" onClick={() => setHospitalEditMode(true)}>
              Edit Hospital
            </button>
          </div>
        ) : (
          <form className="ad-hospital-edit-form" onSubmit={handleHospitalUpdate}>
            <h2 className="ad-edit-title">Edit Hospital Information</h2>
            {hospitalFormError && <div className="ad-form-error">{hospitalFormError}</div>}
            <div className="ad-form-grid">
              <div className="ad-form-group">
                <label>Hospital Name *</label>
                <input name="name" value={hospitalFormData.name || ''} onChange={handleHospitalFormChange} required placeholder="Hospital name" />
              </div>
              <div className="ad-form-group">
                <label>Phone</label>
                <input name="phone" value={hospitalFormData.phone || ''} onChange={handleHospitalFormChange} placeholder="Phone number" />
              </div>
              <div className="ad-form-group">
                <label>Email</label>
                <input name="email" type="email" value={hospitalFormData.email || ''} onChange={handleHospitalFormChange} placeholder="contact@hospital.com" />
              </div>
              <div className="ad-form-group">
                <label>Address</label>
                <input name="address" value={hospitalFormData.address || ''} onChange={handleHospitalFormChange} placeholder="Hospital address" />
              </div>
              <div className="ad-form-group ad-form-group--full">
                <label>Description</label>
                <textarea name="description" value={hospitalFormData.description || ''} onChange={handleHospitalFormChange} rows="3" placeholder="About the hospital..." />
              </div>
              <div className="ad-form-group ad-form-group--full">
                <label>Hospital Image</label>
                {hospitalImagePreview && (
                  <img src={hospitalImagePreview} alt="preview" className="ad-img-preview" />
                )}
                <input type="file" name="image" accept="image/*" onChange={handleHospitalFormChange} />
              </div>
            </div>
            <div className="ad-form-actions">
              <button type="button" className="ad-cancel-btn" onClick={() => { setHospitalEditMode(false); setHospitalFormError(''); }}>Cancel</button>
              <button type="submit" className="ad-save-btn" disabled={hospitalFormLoading}>
                {hospitalFormLoading ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ── THREE PANELS ── */}
      <div className="ad-panels">

        {/* ── PANEL 1 — Admin Info ── */}
        <div className="ad-panel ad-admin-panel">
          <h2 className="ad-panel-title">👤 My Information</h2>
          <div className="ad-admin-avatar-wrap">
            <div className="ad-admin-avatar">👤</div>
            <span className="ad-admin-role-badge">Admin</span>
          </div>
          <div className="ad-admin-details">
            <div className="ad-detail-row">
              <label>Name</label>
              <span>{user?.name || 'N/A'}</span>
            </div>
            <div className="ad-detail-row">
              <label>Email</label>
              <span>{user?.email || 'N/A'}</span>
            </div>
            <div className="ad-detail-row">
              <label>Phone</label>
              <span>{user?.phone || 'N/A'}</span>
            </div>
            <div className="ad-detail-row">
              <label>Staff ID</label>
              <span>{user?.identifier || 'N/A'}</span>
            </div>
          </div>
          <div className="ad-mini-stats">
            <div className="ad-mini-stat">
              <span className="ad-mini-val">{dashboardData?.total_doctors || 0}</span>
              <span className="ad-mini-label">Doctors</span>
            </div>
            <div className="ad-mini-stat">
              <span className="ad-mini-val">{dashboardData?.total_patients || 0}</span>
              <span className="ad-mini-label">Patients</span>
            </div>
            <div className="ad-mini-stat">
              <span className="ad-mini-val">{dashboardData?.pending_appointments || 0}</span>
              <span className="ad-mini-label">Pending Appts</span>
            </div>
            <div className="ad-mini-stat">
              <span className="ad-mini-val">{dashboardData?.total_reports || 0}</span>
              <span className="ad-mini-label">Reports</span>
            </div>
          </div>
        </div>

        {/* ── PANEL 2 — Departments & Doctors ── */}
        <div className="ad-panel ad-depts-panel">
          <div className="ad-panel-header-row">
            <h2 className="ad-panel-title">🏥 Departments & Doctors</h2>
            <button className="ad-add-btn" onClick={() => setShowDeptForm(!showDeptForm)}>
              {showDeptForm ? '✕ Cancel' : '+ Add Dept / Doctor'}
            </button>
          </div>

          {/* Dept / Doctor creation form (existing) */}
          {showDeptForm && (
            <div className="dept-form-container combined-form">
              <h3>Add Department & Doctor</h3>
              {deptFormError && <div className="error-message">{deptFormError}</div>}
              {deptFormSuccess && <div className="success-message">{deptFormSuccess}</div>}
              <div className="form-section">
                <h4>📋 Department Information</h4>
                <form onSubmit={handleCreateDepartment} className="dept-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Department Name *</label>
                      <input type="text" name="name" value={deptFormData.name} onChange={handleDeptFormChange} placeholder="e.g., Cardiology" required />
                    </div>
                    <div className="form-group">
                      <label>Head Doctor</label>
                      <input type="text" name="head_doctor" value={deptFormData.head_doctor} onChange={handleDeptFormChange} placeholder="e.g., Dr. Smith" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Total Beds</label>
                      <input type="number" name="total_beds" value={deptFormData.total_beds} onChange={handleDeptFormChange} placeholder="0" min="0" />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select name="status" value={deptFormData.status} onChange={handleDeptFormChange}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea name="description" value={deptFormData.description} onChange={handleDeptFormChange} placeholder="Department description..." rows="2" />
                  </div>
                  <div className="form-actions">
                    <button type="submit" disabled={deptFormLoading} className="submit-btn">
                      {deptFormLoading ? 'Creating...' : 'Create Department'}
                    </button>
                  </div>
                </form>
              </div>
              <div className="form-section doctor-section">
                <h4>👨‍⚕️ Add Doctor to Existing Department</h4>
                <p className="section-hint">Select a department and add a doctor directly</p>
                <div className="quick-add-doctor">
                  <select className="dept-select" value={doctorFormData.department_id} onChange={(e) => setDoctorFormData(prev => ({ ...prev, department_id: e.target.value }))}>
                    <option value="">-- Select Department --</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  {doctorFormData.department_id && (
                    <button type="button" className="open-doctor-form-btn" onClick={() => {
                      const selectedDept = departments.find(d => d.id == doctorFormData.department_id);
                      if (selectedDept) openDoctorForm(selectedDept);
                    }}>
                      + Add Doctor
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {departments.length === 0 ? (
            <div className="ad-empty-box">No departments yet. Click "+ Add Dept / Doctor" to create one.</div>
          ) : departments.map(dept => (
            <div className="ad-dept-block" key={dept.id}>
              <div className="ad-dept-heading">
                <div>
                  <span className="ad-dept-name">{dept.name}</span>
                  {dept.description && <span className="ad-dept-desc"> — {dept.description}</span>}
                </div>
                <div className="ad-dept-right">
                  <span className={`status-badge ${dept.status === 'active' ? 'active' : 'inactive'}`}>{dept.status || 'active'}</span>
                  <button className="ad-add-doc-btn" onClick={() => openDoctorForm(dept)}>+ Doctor</button>
                </div>
              </div>

              {(dept.doctors || []).length === 0 ? (
                <p className="ad-no-doctors">No doctors in this department.</p>
              ) : (
                <div className="ad-doctor-table-wrap">
                  <table className="ad-doctor-table">
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>QUALIFICATION</th>
                        <th>CONTACT</th>
                        <th>EXPERIENCE</th>
                        <th>FEE</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dept.doctors || []).map(doctor => (
                        <tr key={doctor.id}>
                          <td>
                            <div className="ad-doc-name-cell">
                              <strong>{doctor.user?.name || doctor.name || 'Unknown'}</strong>
                              {doctor.user?.identifier && <span className="ad-doc-id">{doctor.user.identifier}</span>}
                            </div>
                          </td>
                          <td>{doctor.qualification || '—'}</td>
                          <td>
                            <div className="ad-doc-contact-cell">
                              {doctor.user?.phone && <span>{doctor.user.phone}</span>}
                              {doctor.user?.email && <span className="ad-doc-email">{doctor.user.email}</span>}
                            </div>
                          </td>
                          <td>{doctor.experience_years ? `${doctor.experience_years} years` : '—'}</td>
                          <td>{doctor.consultation_fee ? `Rs ${doctor.consultation_fee}` : '—'}</td>
                          <td><span className="status-badge active">active</span></td>
                          <td>
                            <div className="ad-doc-actions-cell">
                              <button className="ad-tbl-btn view" onClick={() => handleViewDoctor(doctor)}>View</button>
                              <button className="ad-tbl-btn edit" onClick={() => handleEditDoctor(doctor, dept)}>Edit</button>
                              <button className="ad-tbl-btn del" onClick={() => handleDeleteDoctor(doctor.id)} disabled={deletingDoctorId === doctor.id}>
                                {deletingDoctorId === doctor.id ? '...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>{/* end .ad-panels (2-col top row) */}

      {/* ── BOTTOM ROW — Reviews + Patients ── */}
      <div className="ad-bottom-row">

        {/* ── Reviews ── */}
        <div className="ad-panel ad-reviews-panel">
          <h2 className="ad-panel-title">⭐ Doctor Reviews</h2>
          {reviewsLoading ? (
            <p className="ad-reviews-loading">Loading reviews...</p>
          ) : allReviews.length === 0 ? (
            <p className="ad-empty-box">No reviews yet.</p>
          ) : allReviews.map((review, idx) => (
            <div className="ad-review-card" key={review.id || idx}>
              <div className="ad-review-top">
                <div>
                  <span className="ad-review-patient">{review.patient?.name || 'Patient'}</span>
                  <span className="ad-review-for"> for <strong>{review.doctorName}</strong></span>
                </div>
                <div className="ad-review-stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < review.rating ? 'star filled' : 'star empty'}>★</span>
                  ))}
                </div>
              </div>
              {review.comment && <p className="ad-review-comment">{review.comment}</p>}
              <div className="ad-review-footer">
                <span className="ad-review-dept">{review.deptName}</span>
                <span className={`ad-review-status ad-review-status--${review.status || 'pending'}`}>
                  {review.status || 'pending'}
                </span>
                <button
                  className="ad-review-delete-btn"
                  onClick={() => handleDeleteReview(review.id)}
                  disabled={deletingReviewId === review.id}
                  title="Delete review"
                >
                  {deletingReviewId === review.id ? '...' : '🗑 Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Patients ── */}
        <div className="ad-panel ad-patients-panel">
          <h2 className="ad-panel-title">🧑‍🤝‍🧑 Hospital Patients</h2>
          <input
            type="text"
            className="ad-patient-search"
            placeholder="Search patients..."
            value={patientSearch}
            onChange={e => setPatientSearch(e.target.value)}
          />
          {patientsLoading ? (
            <p className="ad-reviews-loading">Loading patients...</p>
          ) : patients.length === 0 ? (
            <p className="ad-empty-box">No patients found.</p>
          ) : (
            <div className="ad-patient-table-wrap">
              <table className="ad-doctor-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>EMAIL</th>
                    <th>PHONE</th>
                    <th>JOINED</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {patients
                    .filter(p => {
                      if (!patientSearch) return true;
                      const q = patientSearch.toLowerCase();
                      return (p.name || '').toLowerCase().includes(q)
                        || (p.email || '').toLowerCase().includes(q)
                        || (p.phone || '').toLowerCase().includes(q);
                    })
                    .map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.name || 'N/A'}</strong></td>
                      <td>{p.email || '—'}</td>
                      <td>{p.phone || '—'}</td>
                      <td>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                      <td>
                        <button
                          className="ad-tbl-btn del"
                          onClick={() => handleDeletePatient(p.id)}
                          disabled={deletingPatientId === p.id}
                        >
                          {deletingPatientId === p.id ? '...' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>{/* end .ad-bottom-row */}

      {/* ── Doctor Form Modal ── */}
      {showDoctorForm && (
        <div className="modal-overlay" onClick={closeDoctorForm}>
          <div className="modal-content doctor-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDoctorId ? 'Edit Doctor' : `Add Doctor to ${doctorFormDept?.name}`}</h2>
              <button className="close-modal-btn" onClick={closeDoctorForm}>&times;</button>
            </div>
            {doctorFormError && <div className="error-message">{doctorFormError}</div>}
            {doctorFormSuccess && <div className="success-message">{doctorFormSuccess}</div>}
            <form onSubmit={handleCreateDoctor} className="doctor-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" name="name" value={doctorFormData.name} onChange={handleDoctorFormChange} placeholder="Dr. John Smith" required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" value={doctorFormData.email} onChange={handleDoctorFormChange} placeholder="doctor@example.com" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Password {editingDoctorId ? '' : '*'}</label>
                  <input type="password" name="password" value={doctorFormData.password} onChange={handleDoctorFormChange} placeholder={editingDoctorId ? 'Leave blank to keep current password' : 'Min 6 characters'} required={!editingDoctorId} minLength={editingDoctorId ? 0 : 6} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" name="phone" value={doctorFormData.phone} onChange={handleDoctorFormChange} placeholder="+1234567890" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>License Number *</label>
                  <input type="text" name="license_number" value={doctorFormData.license_number} onChange={handleDoctorFormChange} placeholder="MED-12345" required />
                </div>
                <div className="form-group">
                  <label>Qualification</label>
                  <input type="text" name="qualification" value={doctorFormData.qualification} onChange={handleDoctorFormChange} placeholder="MD, MBBS, etc." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input type="number" name="experience_years" value={doctorFormData.experience_years} onChange={handleDoctorFormChange} placeholder="5" min="0" />
                </div>
                <div className="form-group">
                  <label>Consultation Fee (Rs)</label>
                  <input type="number" name="consultation_fee" value={doctorFormData.consultation_fee} onChange={handleDoctorFormChange} placeholder="100" min="0" />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Bio</label>
                <textarea name="bio" value={doctorFormData.bio} onChange={handleDoctorFormChange} placeholder="Brief description about the doctor..." rows="3" />
              </div>
              <div className="form-group full-width">
                <label>Doctor Image (Optional)</label>
                <div className="image-upload-container">
                  {doctorFormData.imagePreview ? (
                    <div className="image-preview">
                      <img src={doctorFormData.imagePreview} alt="Doctor preview" />
                      <button type="button" className="remove-image-btn" onClick={() => setDoctorFormData(prev => ({ ...prev, image: null, imagePreview: '' }))}>✕ Remove</button>
                    </div>
                  ) : (
                    <label className="image-upload-label">
                      <div className="upload-placeholder">📸 Click to select image or drag & drop</div>
                      <input type="file" name='image' accept="image/*" onChange={handleDoctorFormChange} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={closeDoctorForm} className="cancel-btn">Cancel</button>
                <button type="submit" disabled={doctorFormLoading} className="submit-btn">
                  {doctorFormLoading ? (editingDoctorId ? 'Updating...' : 'Creating...') : (editingDoctorId ? 'Update Doctor' : 'Create Doctor')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Doctor View Modal ── */}
      {showDoctorView && viewingDoctor && (
        <div className="modal-overlay" onClick={closeDoctorView}>
          <div className="modal-content doctor-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Doctor Details</h2>
              <button className="close-modal-btn" onClick={closeDoctorView}>&times;</button>
            </div>
            <div className="doctor-view-content">
              <div className="doctor-view-avatar">
                <span className="avatar-large">👨‍⚕️</span>
              </div>
              <div className="doctor-view-details">
                <div className="detail-row"><label>Name</label><span>{viewingDoctor.user?.name || viewingDoctor.name || 'N/A'}</span></div>
                <div className="detail-row"><label>Email</label><span>{viewingDoctor.user?.email || viewingDoctor.email || 'N/A'}</span></div>
                <div className="detail-row"><label>Doctor ID</label><span>{viewingDoctor.user?.identifier || 'N/A'}</span></div>
                <div className="detail-row"><label>License Number</label><span>{viewingDoctor.license_number || 'N/A'}</span></div>
                <div className="detail-row"><label>Qualification</label><span>{viewingDoctor.qualification || 'N/A'}</span></div>
                <div className="detail-row"><label>Experience</label><span>{viewingDoctor.experience_years || 0} years</span></div>
                <div className="detail-row"><label>Consultation Fee</label><span>Rs {viewingDoctor.consultation_fee || 0}</span></div>
                <div className="detail-row"><label>Phone</label><span>{viewingDoctor.user?.phone || 'N/A'}</span></div>
                <div className="detail-row"><label>Status</label>
                  <span className={`status-badge ${viewingDoctor.is_active ? 'active' : 'inactive'}`}>{viewingDoctor.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                {viewingDoctor.bio && (
                  <div className="detail-row full-width"><label>Bio</label><p>{viewingDoctor.bio}</p></div>
                )}
              </div>
              <div className="modal-footer">
                <button onClick={closeDoctorView} className="close-btn">Close</button>
                <button onClick={() => { closeDoctorView(); handleDeleteDoctor(viewingDoctor.id); }} className="delete-btn-large">Delete Doctor</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="ad-footer">
        <div className="ad-footer-content">
          <div className="ad-footer-brand">
            <h3>Hospital Management System</h3>
            <p>Providing efficient healthcare administration across all hospitals in the network.</p>
          </div>
          <div className="ad-footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/dashboard/admin">Dashboard</a></li>
              <li><a href="/browse-hospitals">Hospitals</a></li>
              <li><a href="/browse-doctors">Doctors</a></li>
            </ul>
          </div>
          <div className="ad-footer-links">
            <h4>Management</h4>
            <ul>
              <li><a href="/dashboard/admin">Departments</a></li>
              <li><a href="/dashboard/admin">Doctors</a></li>
              <li><a href="/dashboard/admin">Patients</a></li>
            </ul>
          </div>
        </div>
        <div className="ad-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Hospital Management System. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
};

export default AdminDashboard;
