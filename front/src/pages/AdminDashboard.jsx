import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
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
  });
  const [doctorFormLoading, setDoctorFormLoading] = useState(false);
  const [doctorFormError, setDoctorFormError] = useState('');
  const [doctorFormSuccess, setDoctorFormSuccess] = useState('');
  
  // Doctor view/delete states
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [showDoctorView, setShowDoctorView] = useState(false);
  const [deletingDoctorId, setDeletingDoctorId] = useState(null);

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
    }
  }, [dashboardData]);

  const fetchDepartments = async (hospitalId) => {
    try {
      const response = await api.getDepartments(hospitalId, token);
      if (response.status === 'success') {
        setDepartments(response.data?.data || response.data || []);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
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

  const handleLogout = async () => {
    try {
      await api.logout(token);
    } catch (err) {
      console.error('Logout error:', err);
    }
    logout();
    navigate('/login');
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
    const { name, value } = e.target;
    setDoctorFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setDoctorFormLoading(true);
    setDoctorFormError('');
    setDoctorFormSuccess('');

    try {
      const response = await api.createDoctor(doctorFormData, token);
      if (response.status === 'success') {
        setDoctorFormSuccess('Doctor created successfully!');
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
        });
        setShowDoctorForm(false);
        setDoctorFormDept(null);
        fetchDepartments(dashboardData.hospital_id);
      } else {
        const errorMsg = response.message || response.errors?.email?.[0] || 'Failed to create doctor';
        setDoctorFormError(errorMsg);
      }
    } catch (err) {
      setDoctorFormError('Error creating doctor: ' + (err.message || err.toString()));
    } finally {
      setDoctorFormLoading(false);
    }
  };

  const closeDoctorForm = () => {
    setShowDoctorForm(false);
    setDoctorFormDept(null);
    setDoctorFormError('');
    setDoctorFormSuccess('');
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

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null;

  return (
    <div className="admin-dashboard-page">
      <PageHero 
        title="Hospital Admin Dashboard" 
        subtitle="Manage hospital operations, doctors, and patient records efficiently."
      />
      <div className="admin-dashboard">

      <main className="dashboard-main">
        {error && <div className="error-message">{error}</div>}

        {/* Hospital Info */}
        <section className="hospital-info">
          <div className="info-card">
            <h2>Your Hospital</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Hospital ID</span>
                <span className="info-value">{dashboardData?.hospital_id || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Your Role</span>
                <span className="info-value badge">Admin</span>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="stats-section">
          <h2>Hospital Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-info">
                <h3>Total Doctors</h3>
                <p className="stat-value">{dashboardData?.total_doctors || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👤</div>
              <div className="stat-info">
                <h3>Total Patients</h3>
                <p className="stat-value">{dashboardData?.total_patients || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>Total Users</h3>
                <p className="stat-value">{dashboardData?.total_users || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>Appointments</h3>
                <p className="stat-value">{dashboardData?.total_appointments || 0}</p>
                <small>Pending: {dashboardData?.pending_appointments || 0}</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📄</div>
              <div className="stat-info">
                <h3>Reports</h3>
                <p className="stat-value">{dashboardData?.total_reports || 0}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="actions-section">
          <h2>Management Tools</h2>
          <div className="actions-grid">
            <button onClick={() => navigate('/reports')} className="action-card primary">
              <span className="action-icon">📋</span>
              <span className="action-text">Review Reports</span>
              <span className="action-desc">Check patient reports</span>
            </button>
            <button onClick={() => navigate('/hospitals')} className="action-card">
              <span className="action-icon">⚙️</span>
              <span className="action-text">Hospital Settings</span>
              <span className="action-desc">Update hospital info</span>
            </button>
            <button onClick={() => navigate('/dashboard')} className="action-card">
              <span className="action-icon">🏠</span>
              <span className="action-text">Main Dashboard</span>
              <span className="action-desc">View overview</span>
            </button>
          </div>
        </section>

        {/* Departments with Doctors */}
        <section className="departments-section">
          <div className="section-header-row">
            <h2>📋 Departments & Doctors</h2>
            <button 
              className="add-dept-btn"
              onClick={() => setShowDeptForm(!showDeptForm)}
            >
              {showDeptForm ? '✕ Cancel' : '➕ Add Department & Doctor'}
            </button>
          </div>

          {/* Department & Doctor Creation Form */}
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
                      <input
                        type="text"
                        name="name"
                        value={deptFormData.name}
                        onChange={handleDeptFormChange}
                        placeholder="e.g., Cardiology"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Head Doctor</label>
                      <input
                        type="text"
                        name="head_doctor"
                        value={deptFormData.head_doctor}
                        onChange={handleDeptFormChange}
                        placeholder="e.g., Dr. Smith"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Total Beds</label>
                      <input
                        type="number"
                        name="total_beds"
                        value={deptFormData.total_beds}
                        onChange={handleDeptFormChange}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        name="status"
                        value={deptFormData.status}
                        onChange={handleDeptFormChange}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={deptFormData.description}
                      onChange={handleDeptFormChange}
                      placeholder="Department description..."
                      rows="2"
                    />
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
                  <select 
                    className="dept-select"
                    value={doctorFormData.department_id}
                    onChange={(e) => setDoctorFormData(prev => ({...prev, department_id: e.target.value}))}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  {doctorFormData.department_id && (
                    <button 
                      type="button" 
                      className="open-doctor-form-btn"
                      onClick={() => {
                        const selectedDept = departments.find(d => d.id == doctorFormData.department_id);
                        if (selectedDept) openDoctorForm(selectedDept);
                      }}
                    >
                      + Add Doctor
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {departments.length === 0 ? (
            <div className="info-box">
              <p>No departments found for this hospital. Click "Add Department & Doctor" to create one.</p>
            </div>
          ) : (
            <>
              <div className="department-filter">
                <label>Filter by Department:</label>
                <select
                  className="department-dropdown"
                  value={selectedDepartment?.id || ''}
                  onChange={(e) => {
                    const deptId = e.target.value;
                    if (deptId === '') {
                      setSelectedDepartment(null);
                    } else {
                      const dept = departments.find(d => d.id == deptId);
                      setSelectedDepartment(dept || null);
                    }
                  }}
                >
                  <option value="">All Departments ({departments.length})</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.doctors?.length || 0} doctors)
                    </option>
                  ))}
                </select>
              </div>

              <div className="departments-grid">
                {(selectedDepartment ? [selectedDepartment] : departments).map((dept) => (
                  <div key={dept.id} className="department-card">
                    <div className="department-header">
                      <h3>🏥 {dept.name}</h3>
                      <span className={`status-badge ${dept.status === 'active' ? 'active' : 'inactive'}`}>
                        {dept.status}
                      </span>
                    </div>
                    {dept.description && <p className="department-desc">{dept.description}</p>}
                    <div className="department-info">
                      {dept.head_doctor && <p><strong>Head Doctor:</strong> {dept.head_doctor}</p>}
                      {dept.total_beds > 0 && <p><strong>Total Beds:</strong> {dept.total_beds}</p>}
                    </div>
                    
                    <div className="doctors-list">
                      <div className="doctors-list-header">
                        <h4>Doctors ({dept.doctors?.length || 0})</h4>
                        <button 
                          className="add-doctor-btn"
                          onClick={() => openDoctorForm(dept)}
                        >
                          + Add Doctor
                        </button>
                      </div>
                      {(!dept.doctors || dept.doctors.length === 0) ? (
                        <p className="no-doctors">No doctors in this department</p>
                      ) : (
                        <ul className="doctors-list-view">
                          {dept.doctors.map((doctor) => (
                            <li key={doctor.id} className="doctor-list-item">
                              <span className="doctor-avatar-small">👨‍⚕️</span>
                              <div className="doctor-list-info">
                                <strong>{doctor.user?.name || doctor.name || 'Unknown'}</strong>
                                <span className="doctor-qual">{doctor.qualification || 'Medical Professional'}</span>
                                {doctor.user?.identifier && (
                                  <span className="doctor-id">ID: {doctor.user.identifier}</span>
                                )}
                              </div>
                              <span className="doctor-exp-badge">{doctor.experience_years || 0} yrs</span>
                              <span className="doctor-fee">${doctor.consultation_fee || 0}</span>
                              <div className="doctor-actions">
                                <button 
                                  className="view-btn"
                                  onClick={() => handleViewDoctor(doctor)}
                                >
                                  View
                                </button>
                                <button 
                                  className="delete-btn"
                                  onClick={() => handleDeleteDoctor(doctor.id)}
                                  disabled={deletingDoctorId === doctor.id}
                                >
                                  {deletingDoctorId === doctor.id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Features */}
        <section className="features-section">
          <h2>Your Capabilities</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>👨‍⚕️ Doctor Management</h3>
              <p>Add and manage doctors in your hospital. Each doctor gets a unique identifier for easy login.</p>
            </div>
            <div className="feature-card">
              <h3>📋 Report Review</h3>
              <p>Review medical reports submitted by doctors, add notes, and change status.</p>
            </div>
            <div className="feature-card">
              <h3>⚙️ Hospital Settings</h3>
              <p>Update hospital information, contact details, and manage hospital profile.</p>
            </div>
            <div className="feature-card">
              <h3>📊 Statistics</h3>
              <p>View real-time statistics about doctors, patients, and hospital operations.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Doctor Form Modal */}
      {showDoctorForm && (
        <div className="modal-overlay" onClick={closeDoctorForm}>
          <div className="modal-content doctor-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Doctor to {doctorFormDept?.name}</h2>
              <button className="close-modal-btn" onClick={closeDoctorForm}>&times;</button>
            </div>
            
            {doctorFormError && <div className="error-message">{doctorFormError}</div>}
            {doctorFormSuccess && <div className="success-message">{doctorFormSuccess}</div>}
            
            <form onSubmit={handleCreateDoctor} className="doctor-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={doctorFormData.name}
                    onChange={handleDoctorFormChange}
                    placeholder="Dr. John Smith"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={doctorFormData.email}
                    onChange={handleDoctorFormChange}
                    placeholder="doctor@example.com"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={doctorFormData.password}
                    onChange={handleDoctorFormChange}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={doctorFormData.phone}
                    onChange={handleDoctorFormChange}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>License Number *</label>
                  <input
                    type="text"
                    name="license_number"
                    value={doctorFormData.license_number}
                    onChange={handleDoctorFormChange}
                    placeholder="MED-12345"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Qualification</label>
                  <input
                    type="text"
                    name="qualification"
                    value={doctorFormData.qualification}
                    onChange={handleDoctorFormChange}
                    placeholder="MD, MBBS, etc."
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input
                    type="number"
                    name="experience_years"
                    value={doctorFormData.experience_years}
                    onChange={handleDoctorFormChange}
                    placeholder="5"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Consultation Fee ($)</label>
                  <input
                    type="number"
                    name="consultation_fee"
                    value={doctorFormData.consultation_fee}
                    onChange={handleDoctorFormChange}
                    placeholder="100"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="form-group full-width">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={doctorFormData.bio}
                  onChange={handleDoctorFormChange}
                  placeholder="Brief description about the doctor..."
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={closeDoctorForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" disabled={doctorFormLoading} className="submit-btn">
                  {doctorFormLoading ? 'Creating...' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor View Modal */}
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
                <div className="detail-row">
                  <label>Name</label>
                  <span>{viewingDoctor.user?.name || viewingDoctor.name || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Email</label>
                  <span>{viewingDoctor.user?.email || viewingDoctor.email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Doctor ID</label>
                  <span>{viewingDoctor.user?.identifier || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>License Number</label>
                  <span>{viewingDoctor.license_number || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Qualification</label>
                  <span>{viewingDoctor.qualification || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Experience</label>
                  <span>{viewingDoctor.experience_years || 0} years</span>
                </div>
                <div className="detail-row">
                  <label>Consultation Fee</label>
                  <span>${viewingDoctor.consultation_fee || 0}</span>
                </div>
                <div className="detail-row">
                  <label>Phone</label>
                  <span>{viewingDoctor.user?.phone || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <label>Status</label>
                  <span className={`status-badge ${viewingDoctor.is_active ? 'active' : 'inactive'}`}>
                    {viewingDoctor.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {viewingDoctor.bio && (
                  <div className="detail-row full-width">
                    <label>Bio</label>
                    <p>{viewingDoctor.bio}</p>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button onClick={closeDoctorView} className="close-btn">Close</button>
                <button 
                  onClick={() => {
                    closeDoctorView();
                    handleDeleteDoctor(viewingDoctor.id);
                  }} 
                  className="delete-btn-large"
                >
                  Delete Doctor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;
