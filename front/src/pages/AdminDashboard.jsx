import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Stethoscope, User, Calendar, Building2, Clock, Star, BarChart3, Folder, Users, LogOut, CheckCircle, Plus, Edit, Mail, Phone, Hash, Upload } from 'lucide-react';
// import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout, updateUser } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [deptFormData, setDeptFormData] = useState({
    name: '',
    description: '',
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
  const [deletingDepartmentId, setDeletingDepartmentId] = useState(null);
  const [editingDoctorId, setEditingDoctorId] = useState(null);

  // Hospital info states
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
  const [activeSection, setActiveSection] = useState('overview');
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
  });
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

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

  useEffect(() => {
    if (!user) return;
    setProfileFormData({
      name: user.name || '',
      phone: user.phone || '',
      date_of_birth: user.date_of_birth || '',
      gender: user.gender || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      postal_code: user.postal_code || '',
    });
    setProfileAvatarPreview(user.avatar ? `${api.getStorageUrl()}/${user.avatar}` : '');
  }, [user]);

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
    if (!window.confirm('Are you sure you want to remove this patient?')) return;
    setDeletingPatientId(patientId);
    try {
      const response = await api.deletePatient(patientId, token);
      if (response.status === 'success') {
        setPatients(prev => prev.filter(p => p.id !== patientId));
        alert('Patient removed successfully');
      } else {
        alert(response.message || 'Failed to remove patient');
      }
    } catch (err) {
      alert('Error removing patient');
    } finally {
      setDeletingPatientId(null);
    }
  };

  const fetchAllReviews = async () => {
    setReviewsLoading(true);
    try {
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
    if (!window.confirm('Delete this review?')) return;
    setDeletingReviewId(reviewId);
    try {
      const res = await api.deleteReview(reviewId, token);
      if (res.status === 'success') {
        setAllReviews(prev => prev.filter(r => r.id !== reviewId));
        alert('Review deleted successfully');
      } else {
        alert(res.message || 'Failed to delete review');
      }
    } catch (err) {
      alert('Error deleting review');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleHospitalFormChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files && files[0]) {
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
        alert('Hospital updated successfully');
      } else {
        setHospitalFormError(response.message || 'Failed to update hospital');
      }
    } catch (err) {
      setHospitalFormError('Error updating hospital');
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
      const response = await api.createDepartment(data, token);
      if (response.status === 'success') {
        setDeptFormSuccess('Department created successfully!');
        setDeptFormData({
          name: '',
          description: '',
          total_beds: '',
          status: 'active'
        });
        setShowDeptForm(false);
        fetchDepartments(dashboardData.hospital_id);
        setTimeout(() => setDeptFormSuccess(''), 3000);
      } else {
        setDeptFormError(response.message || 'Failed to create department');
      }
    } catch (err) {
      setDeptFormError('Error creating department');
    } finally {
      setDeptFormLoading(false);
    }
  };

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
      image: null,
      imagePreview: '',
    });
    setDoctorFormError('');
    setDoctorFormSuccess('');
    setShowDoctorForm(true);
  };

  const handleDoctorFormChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file' && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setDoctorFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
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
      const formData = new FormData();
      Object.keys(doctorFormData).forEach(key => {
        if (key !== 'imagePreview' && doctorFormData[key] !== null && doctorFormData[key] !== '') {
          formData.append(key, doctorFormData[key]);
        }
      });

      let response;
      if (editingDoctorId) {
        response = await api.updateDoctor(editingDoctorId, formData, token);
      } else {
        response = await api.createDoctor(formData, token);
      }

      if (response.status === 'success') {
        setDoctorFormSuccess(editingDoctorId ? 'Doctor updated successfully!' : 'Doctor created successfully!');
        closeDoctorForm();
        fetchDepartments(dashboardData.hospital_id);
        setTimeout(() => setDoctorFormSuccess(''), 3000);
      } else {
        setDoctorFormError(response.message || 'Failed to save doctor');
      }
    } catch (err) {
      setDoctorFormError('Error saving doctor');
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
    setShowDoctorForm(true);
  };

  const handleViewDoctor = (doctor) => {
    setViewingDoctor(doctor);
    setShowDoctorView(true);
  };

  const closeDoctorView = () => {
    setViewingDoctor(null);
    setShowDoctorView(false);
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Delete this doctor?')) return;
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
      alert('Error deleting doctor');
    } finally {
      setDeletingDoctorId(null);
    }
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (!window.confirm('Delete this department?')) return;
    setDeletingDepartmentId(departmentId);
    try {
      const response = await api.deleteDepartment(departmentId, token);
      if (response.status === 'success') {
        fetchDepartments(dashboardData.hospital_id);
        alert('Department deleted successfully');
      } else {
        alert(response.message || 'Failed to delete department');
      }
    } catch (err) {
      alert('Error deleting department');
    } finally {
      setDeletingDepartmentId(null);
    }
  };

  const handleSectionClick = (section) => {
    setActiveSection(section);
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

  const handleProfileInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file' && files && files[0]) {
      setProfileAvatarFile(files[0]);
      const reader = new FileReader();
      reader.onloadend = () => setProfileAvatarPreview(reader.result);
      reader.readAsDataURL(files[0]);
      return;
    }
    setProfileFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileCancel = () => {
    setProfileEditMode(false);
    setProfileAvatarFile(null);
    setProfileMessage({ type: '', text: '' });
    setProfileFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      date_of_birth: user?.date_of_birth || '',
      gender: user?.gender || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      postal_code: user?.postal_code || '',
    });
    setProfileAvatarPreview(user?.avatar ? `${api.getStorageUrl()}/${user.avatar}` : '');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      Object.entries(profileFormData).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      if (profileAvatarFile) {
        formData.append('avatar', profileAvatarFile);
      }

      const response = await api.updateProfile(formData, token);
      if (response.status === 'success') {
        if (updateUser) updateUser(response.user);
        setProfileAvatarFile(null);
        setProfileEditMode(false);
        setProfileMessage({ type: 'success', text: 'Profile updated successfully' });
        setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
      } else {
        setProfileMessage({ type: 'error', text: response.message || 'Failed to update profile' });
      }
    } catch (err) {
      setProfileMessage({ type: 'error', text: 'Error updating profile' });
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loader"></div>
      <p>Loading dashboard...</p>
    </div>
  );

  if (!user) return null;

  const stats = [
    { title: 'Total Doctors', value: dashboardData?.total_doctors || 0, Icon: Stethoscope, color: '#8B4513', bg: '#f5f0e8' },
    { title: 'Total Patients', value: dashboardData?.total_patients || 0, Icon: User, color: '#10b981', bg: '#ecfdf5' },
    { title: 'Appointments', value: dashboardData?.total_appointments || 0, Icon: Calendar, color: '#f59e0b', bg: '#fffbeb' },
    { title: 'Departments', value: departments.length || 0, Icon: Building2, color: '#a0522d', bg: '#f9f5f0' },
    { title: 'Pending Appointments', value: dashboardData?.pending_appointments || 0, Icon: Clock, color: '#ef4444', bg: '#fef2f2' },
    { title: 'Total Reviews', value: allReviews.length || 0, Icon: Star, color: '#d97706', bg: '#fef3c7' },
  ];

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Building2 size={28} />
            <h2>Doctor Sathi</h2>
          </div>
          <p>Admin Portal</p>
        </div>

        <nav className="sidebar-nav">
          <div className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`} onClick={() => handleSectionClick('overview')}>
            <BarChart3 size={20} />
            <span>Overview</span>
          </div>
          <div className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`} onClick={() => handleSectionClick('profile')}>
            <User size={20} />
            <span>My Profile</span>
          </div>
          <div className={`nav-item ${activeSection === 'hospital' ? 'active' : ''}`} onClick={() => handleSectionClick('hospital')}>
            <Building2 size={20} />
            <span>Hospital</span>
          </div>
          <div className={`nav-item ${activeSection === 'departments' ? 'active' : ''}`} onClick={() => handleSectionClick('departments')}>
            <Folder size={20} />
            <span>Departments</span>
          </div>
          <div className={`nav-item ${activeSection === 'reviews' ? 'active' : ''}`} onClick={() => handleSectionClick('reviews')}>
            <Star size={20} />
            <span>Reviews</span>
          </div>
          <div className={`nav-item ${activeSection === 'patients' ? 'active' : ''}`} onClick={() => handleSectionClick('patients')}>
            <Users size={20} />
            <span>Patients</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
          <p className="footer-note">© 2024 MediCare HMS</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Overview Section */}
        <div className={`content-section ${activeSection === 'overview' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1>Dashboard Overview</h1>
              <p>Welcome back, {user?.name || 'Admin'}! Here's what's happening today.</p>
            </div>
            <div className="header-actions">
              <button className="btn-secondary" onClick={() => handleSectionClick('departments')}>
                <Plus size={18} /> Quick Add
              </button>
            </div>
          </div>

          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div className="stat-card" key={index} style={{ borderLeftColor: stat.color }}>
                <div className="stat-header">
                  <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
                    <stat.Icon size={24} />
                  </div>
                  <span className="stat-value">{stat.value.toLocaleString()}</span>
                </div>
                <div className="stat-title">{stat.title}</div>
              </div>
            ))}
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon"><CheckCircle size={20} /></div>
                  <div>
                    <p className="activity-text">System ready for operations</p>
                    <span className="activity-time">Just now</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon"><Stethoscope size={20} /></div>
                  <div>
                    <p className="activity-text">Total {dashboardData?.total_doctors || 0} doctors available</p>
                    <span className="activity-time">Today</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon"><Calendar size={20} /></div>
                  <div>
                    <p className="activity-text">{dashboardData?.total_appointments || 0} total appointments scheduled</p>
                    <span className="activity-time">This week</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <h3>Quick Actions</h3>
              <div className="quick-actions">
                <button className="quick-action-btn" onClick={() => handleSectionClick('departments')}>
                  <div className="action-icon"><Plus size={20} /></div>
                  <div>
                    <strong>Add Department</strong>
                    <p>Create new department</p>
                  </div>
                </button>
                <button className="quick-action-btn" onClick={() => {
                  if (departments.length > 0) openDoctorForm(departments[0]);
                  else alert('Please create a department first');
                }}>
                  <div className="action-icon"><Stethoscope size={20} /></div>
                  <div>
                    <strong>Add Doctor</strong>
                    <p>Register new doctor</p>
                  </div>
                </button>
                <button className="quick-action-btn" onClick={() => handleSectionClick('hospital')}>
                  <div className="action-icon"><Edit size={20} /></div>
                  <div>
                    <strong>Edit Hospital</strong>
                    <p>Update hospital info</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className={`content-section ${activeSection === 'profile' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1>My Profile</h1>
              <p>Manage your account information</p>
            </div>
          </div>

          <div className="profile-card">
            {!profileEditMode ? (
              <>
                <div className="profile-header">
                  <div className="profile-avatar">
                    {profileAvatarPreview ? (
                      <img src={profileAvatarPreview} alt={user?.name} />
                    ) : (
                      <div className="avatar-placeholder">{user?.name?.charAt(0) || 'A'}</div>
                    )}
                  </div>
                  <div className="profile-info">
                    <h2>{user?.name || 'Admin'}</h2>
                    <p className="profile-role">Administrator</p>
                    <button className="btn-edit" onClick={() => setProfileEditMode(true)}>
                      <Edit size={16} /> Edit Profile
                    </button>
                  </div>
                </div>
                <div className="profile-details">
                  <div className="detail-row">
                    <label><Mail size={18} /> Email</label>
                    <span>{user?.email || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label><Phone size={18} /> Phone</label>
                    <span>{user?.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label><Hash size={18} /> Staff ID</label>
                    <span>{user?.identifier || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label><Building2 size={18} /> Hospital</label>
                    <span>{hospitalInfo?.name || 'N/A'}</span>
                  </div>
                </div>
              </>
            ) : (
              <form className="profile-form" onSubmit={handleProfileSave}>
                {profileMessage.text && (
                  <div className={`alert ${profileMessage.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                    {profileMessage.text}
                  </div>
                )}
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="name" value={profileFormData.name} onChange={handleProfileInputChange} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" name="phone" value={profileFormData.phone} onChange={handleProfileInputChange} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input type="date" name="date_of_birth" value={profileFormData.date_of_birth} onChange={handleProfileInputChange} />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select name="gender" value={profileFormData.gender} onChange={handleProfileInputChange}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Profile Picture</label>
                  <input type="file" accept="image/*" onChange={handleProfileInputChange} />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={handleProfileCancel}>Cancel</button>
                  <button type="submit" className="btn-save" disabled={profileSaving}>
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Hospital Section - FIXED VERSION */}
        <div className={`content-section ${activeSection === 'hospital' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1>Hospital Information</h1>
              <p>Manage your hospital details and branding</p>
            </div>
            {!hospitalEditMode && (
              <button className="btn-primary" onClick={() => setHospitalEditMode(true)}>
                <Edit size={18} /> Edit Hospital
              </button>
            )}
          </div>

          {!hospitalEditMode ? (
            <div className="hospital-main-card">
              <div className="hospital-layout">
                {/* Image Section */}
                <div className="hospital-image-section">
                  <div className="hospital-image-wrapper">
                    {(hospitalInfo?.image || hospitalImagePreview) ? (
                      <img
                        src={hospitalImagePreview || `${api.getStorageUrl()}/${hospitalInfo.image}`}
                        alt={hospitalInfo?.name || 'Hospital'}
                        className="hospital-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1453&q=80';
                        }}
                      />
                    ) : (
                      <div className="hospital-image-placeholder">
                        <img
                          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1453&q=80"
                          alt="Hospital default"
                          className="hospital-image"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Section */}
                <div className="hospital-info-section">
                  <div className="hospital-header">
                    <h2>{hospitalInfo?.name || 'Charak Memorial Hospital'}</h2>
                    <div className="hospital-status">
                      <span className="status-badge active">Active</span>
                    </div>
                  </div>

                  <div className="hospital-details-grid">
                    <div className="detail-item">
                      <div className="detail-icon">📍</div>
                      <div className="detail-content">
                        <label>Location</label>
                        <p>{hospitalInfo?.address || 'Pokhara-2, Lekhnath, Nepal'}</p>
                      </div>
                    </div>

                    <div className="detail-item">
                      <div className="detail-icon">📞</div>
                      <div className="detail-content">
                        <label>Phone Number</label>
                        <p>{hospitalInfo?.phone || '+977-1234567890'}</p>
                        <small>Emergency: 102</small>
                      </div>
                    </div>

                    <div className="detail-item">
                      <div className="detail-icon">✉️</div>
                      <div className="detail-content">
                        <label>Email Address</label>
                        <p>{hospitalInfo?.email || 'charak11@gmail.com'}</p>
                      </div>
                    </div>

                    <div className="detail-item full-width">
                      <div className="detail-icon">ℹ️</div>
                      <div className="detail-content">
                        <label>About Hospital</label>
                        <p>{hospitalInfo?.description || 'City Hospital Pokhara is a leading healthcare facility committed to providing exceptional medical services with compassion and excellence.'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="hospital-stats">
                    <div className="stat">
                      <div className="stat-value">{dashboardData?.total_doctors || 0}</div>
                      <div className="stat-label">Doctors</div>
                    </div>
                    <div className="stat">
                      <div className="stat-value">{dashboardData?.total_patients || 0}</div>
                      <div className="stat-label">Patients</div>
                    </div>
                    <div className="stat">
                      <div className="stat-value">{dashboardData?.total_appointments || 0}</div>
                      <div className="stat-label">Appointments</div>
                    </div>
                    <div className="stat">
                      <div className="stat-value">{departments.length || 0}</div>
                      <div className="stat-label">Departments</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="hospital-edit-card">
              <div className="edit-header">
                <h3>✏️ Edit Hospital Information</h3>
                <button className="close-edit" onClick={() => setHospitalEditMode(false)}>✕</button>
              </div>

              {hospitalFormError && <div className="alert alert-error">{hospitalFormError}</div>}

              <form onSubmit={handleHospitalUpdate} className="hospital-edit-form">
                <div className="form-group">
                  <label>Hospital Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={hospitalFormData.name || ''}
                    onChange={handleHospitalFormChange}
                    placeholder="Enter hospital name"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={hospitalFormData.phone || ''}
                      onChange={handleHospitalFormChange}
                      placeholder="Phone number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={hospitalFormData.email || ''}
                      onChange={handleHospitalFormChange}
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={hospitalFormData.address || ''}
                    onChange={handleHospitalFormChange}
                    placeholder="Full address"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={hospitalFormData.description || ''}
                    onChange={handleHospitalFormChange}
                    rows="4"
                    placeholder="Describe your hospital, services, mission, etc."
                  />
                </div>

                <div className="form-group">
                  <label>Hospital Image</label>
                  <div className="image-upload-area">
                    {hospitalImagePreview && (
                      <div className="image-preview-container">
                        <img src={hospitalImagePreview} alt="Preview" className="image-preview" />
                        <button
                          type="button"
                          className="remove-image"
                          onClick={() => {
                            setHospitalImageFile(null);
                            setHospitalImagePreview('');
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <label className="upload-btn">
                      📁 {hospitalImagePreview ? 'Change Image' : 'Upload Image'}
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleHospitalFormChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <p className="upload-hint">Recommended: 800x600px, JPG or PNG</p>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => {
                    setHospitalEditMode(false);
                    setHospitalFormError('');
                    setHospitalImageFile(null);
                    setHospitalImagePreview(hospitalInfo?.image ? `${api.getStorageUrl()}/${hospitalInfo.image}` : '');
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save" disabled={hospitalFormLoading}>
                    {hospitalFormLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Departments Section */}
        <div className={`content-section ${activeSection === 'departments' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1>Departments</h1>
              <p>Manage hospital departments and doctors</p>
            </div>
            <button className="btn-primary" onClick={() => setShowDeptForm(!showDeptForm)}>
              {showDeptForm ? 'Cancel' : '+ Add Department'}
            </button>
          </div>

          {showDeptForm && (
            <div className="form-card">
              <h3>Create New Department</h3>
              {deptFormError && <div className="alert alert-error">{deptFormError}</div>}
              {deptFormSuccess && <div className="alert alert-success">{deptFormSuccess}</div>}
              <form onSubmit={handleCreateDepartment}>
                <div className="form-group">
                  <label>Department Name *</label>
                  <input type="text" name="name" value={deptFormData.name} onChange={handleDeptFormChange} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" value={deptFormData.description} onChange={handleDeptFormChange} rows="3" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Total Beds</label>
                    <input type="number" name="total_beds" value={deptFormData.total_beds} onChange={handleDeptFormChange} min="0" />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={deptFormData.status} onChange={handleDeptFormChange}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={deptFormLoading}>
                    {deptFormLoading ? 'Creating...' : 'Create Department'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {departments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <p>No departments yet. Click "Add Department" to get started.</p>
            </div>
          ) : (
            departments.map(dept => (
              <div className="department-card" key={dept.id}>
                <div className="dept-header">
                  <div>
                    <h3>{dept.name}</h3>
                    {dept.description && <p className="dept-desc">{dept.description}</p>}
                  </div>
                  <div className="dept-actions">
                    <span className={`status-badge ${dept.status}`}>{dept.status}</span>
                    <button className="btn-icon" onClick={() => openDoctorForm(dept)} title="Add Doctor">
                      + Doctor
                    </button>
                    <button className="btn-icon danger" onClick={() => handleDeleteDepartment(dept.id)} disabled={deletingDepartmentId === dept.id}>
                      🗑️
                    </button>
                  </div>
                </div>

                {(dept.doctors || []).length === 0 ? (
                  <p className="no-doctors">No doctors in this department.</p>
                ) : (
                  <div className="doctors-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Doctor Name</th>
                          <th>Qualification</th>
                          <th>Experience</th>
                          <th>Fee</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dept.doctors || []).map(doctor => (
                          <tr key={doctor.id}>
                            <td>
                              <strong>{doctor.user?.name || doctor.name}</strong>
                              <small>{doctor.user?.identifier}</small>
                            </td>
                            <td>{doctor.qualification || '—'}</td>
                            <td>{doctor.experience_years ? `${doctor.experience_years} yrs` : '—'}</td>
                            <td>{doctor.consultation_fee ? `Rs ${doctor.consultation_fee}` : '—'}</td>
                            <td>
                              <button className="btn-small" onClick={() => handleViewDoctor(doctor)}>View</button>
                              <button className="btn-small" onClick={() => handleEditDoctor(doctor, dept)}>Edit</button>
                              <button className="btn-small danger" onClick={() => handleDeleteDoctor(doctor.id)} disabled={deletingDoctorId === doctor.id}>
                                {deletingDoctorId === doctor.id ? '...' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Reviews Section */}
        <div className={`content-section ${activeSection === 'reviews' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1>Patient Reviews</h1>
              <p>Manage doctor reviews and feedback</p>
            </div>
          </div>

          {reviewsLoading ? (
            <div className="loading-state">Loading reviews...</div>
          ) : allReviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⭐</div>
              <p>No reviews yet.</p>
            </div>
          ) : (
            <div className="reviews-grid">
              {allReviews.map(review => (
                <div className="review-card" key={review.id}>
                  <div className="review-header">
                    <div>
                      <strong>{review.patient?.name || 'Patient'}</strong>
                      <span className="review-for"> for {review.doctorName}</span>
                    </div>
                    <div className="review-rating">
                      {Array(5).fill().map((_, i) => (
                        <span key={i} className={i < review.rating ? 'star filled' : 'star'}>★</span>
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="review-comment">{review.comment}</p>}
                  <div className="review-footer">
                    <span className="review-status">{review.status || 'pending'}</span>
                    <button className="btn-small danger" onClick={() => handleDeleteReview(review.id)} disabled={deletingReviewId === review.id}>
                      {deletingReviewId === review.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patients Section */}
        <div className={`content-section ${activeSection === 'patients' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1>Patients</h1>
              <p>View and manage hospital patients</p>
            </div>
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search patients..."
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
              />
            </div>
          </div>

          {patientsLoading ? (
            <div className="loading-state">Loading patients...</div>
          ) : patients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>No patients found.</p>
            </div>
          ) : (
            <div className="patients-table-container">
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Registered</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patients
                    .filter(p => {
                      if (!patientSearch) return true;
                      const search = patientSearch.toLowerCase();
                      return (p.name || '').toLowerCase().includes(search) ||
                        (p.email || '').toLowerCase().includes(search) ||
                        (p.phone || '').toLowerCase().includes(search);
                    })
                    .map(patient => (
                      <tr key={patient.id}>
                        <td><strong>{patient.name || 'N/A'}</strong></td>
                        <td>{patient.email || '—'}</td>
                        <td>{patient.phone || '—'}</td>
                        <td>{patient.created_at ? new Date(patient.created_at).toLocaleDateString() : '—'}</td>
                        <td>
                          <button className="btn-small danger" onClick={() => handleDeletePatient(patient.id)} disabled={deletingPatientId === patient.id}>
                            {deletingPatientId === patient.id ? '...' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Doctor Form Modal */}
      {showDoctorForm && (
        <div className="modal-overlay" onClick={closeDoctorForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDoctorId ? 'Edit Doctor' : `Add Doctor to ${doctorFormDept?.name}`}</h2>
              <button className="modal-close" onClick={closeDoctorForm}>✕</button>
            </div>
            <form onSubmit={handleCreateDoctor}>
              {doctorFormError && <div className="alert alert-error">{doctorFormError}</div>}
              {doctorFormSuccess && <div className="alert alert-success">{doctorFormSuccess}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" name="name" value={doctorFormData.name} onChange={handleDoctorFormChange} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" value={doctorFormData.email} onChange={handleDoctorFormChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Password {!editingDoctorId && '*'}</label>
                  <input type="password" name="password" value={doctorFormData.password} onChange={handleDoctorFormChange} placeholder={editingDoctorId ? 'Leave blank to keep current' : 'Min 6 characters'} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" name="phone" value={doctorFormData.phone} onChange={handleDoctorFormChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>License Number *</label>
                  <input type="text" name="license_number" value={doctorFormData.license_number} onChange={handleDoctorFormChange} required />
                </div>
                <div className="form-group">
                  <label>Qualification</label>
                  <input type="text" name="qualification" value={doctorFormData.qualification} onChange={handleDoctorFormChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input type="number" name="experience_years" value={doctorFormData.experience_years} onChange={handleDoctorFormChange} min="0" />
                </div>
                <div className="form-group">
                  <label>Consultation Fee (Rs)</label>
                  <input type="number" name="consultation_fee" value={doctorFormData.consultation_fee} onChange={handleDoctorFormChange} min="0" />
                </div>
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea name="bio" value={doctorFormData.bio} onChange={handleDoctorFormChange} rows="3" />
              </div>
              <div className="form-group">
                <label>Profile Image</label>
                {doctorFormData.imagePreview && <img src={doctorFormData.imagePreview} alt="Preview" className="image-preview" />}
                <input type="file" accept="image/*" onChange={handleDoctorFormChange} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={closeDoctorForm}>Cancel</button>
                <button type="submit" className="btn-save" disabled={doctorFormLoading}>
                  {doctorFormLoading ? (editingDoctorId ? 'Updating...' : 'Creating...') : (editingDoctorId ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor View Modal */}
      {showDoctorView && viewingDoctor && (
        <div className="modal-overlay" onClick={closeDoctorView}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Doctor Details</h2>
              <button className="modal-close" onClick={closeDoctorView}>✕</button>
            </div>
            <div className="doctor-details">
              <div className="detail-row">
                <label>Name:</label>
                <span>{viewingDoctor.user?.name || viewingDoctor.name}</span>
              </div>
              <div className="detail-row">
                <label>Email:</label>
                <span>{viewingDoctor.user?.email || viewingDoctor.email}</span>
              </div>
              <div className="detail-row">
                <label>License Number:</label>
                <span>{viewingDoctor.license_number || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Qualification:</label>
                <span>{viewingDoctor.qualification || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <label>Experience:</label>
                <span>{viewingDoctor.experience_years || 0} years</span>
              </div>
              <div className="detail-row">
                <label>Consultation Fee:</label>
                <span>Rs {viewingDoctor.consultation_fee || 0}</span>
              </div>
              <div className="detail-row">
                <label>Phone:</label>
                <span>{viewingDoctor.user?.phone || 'N/A'}</span>
              </div>
              {viewingDoctor.bio && (
                <div className="detail-row">
                  <label>Bio:</label>
                  <p>{viewingDoctor.bio}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeDoctorView}>Close</button>
              <button className="btn-danger" onClick={() => { closeDoctorView(); handleDeleteDoctor(viewingDoctor.id); }}>
                Delete Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;