import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import { HospitalViewModal } from '../components/HospitalViewModal';
import { CreateHospitalModal } from '../components/CreateHospitalModal';
import { EditAdminModal } from '../components/EditAdminModal';
import { EditHospitalModal } from '../components/EditHospitalModal';
import hospitalImage from '../assets/images/hospital.jpg';
import '../styles/SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  console.log('🎬 SuperAdminDashboard component rendering');
  const navigate = useNavigate();
  const { user, token, logout } = useContext(AuthContext);
  console.log('📦 Context values:', { token: !!token, userId: user?.id, userRole: user?.role });
  const [dashboardData, setDashboardData] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [editHospital, setEditHospital] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [editAdmin, setEditAdmin] = useState(null);
  const [adminSearch, setAdminSearch] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [viewDoctor, setViewDoctor] = useState(null);
  const [editDoctor, setEditDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    qualification: '',
    experience_years: '',
    consultation_fee: '',
    license_number: '',
    bio: '',
    department_id: '',
  });
  const [doctorSaving, setDoctorSaving] = useState(false);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [activeSection, setActiveSection] = useState('stats');

  useEffect(() => {
    console.log('🎯 SuperAdminDashboard mounted');
    
    const contextToken = token;
    const localStorageToken = localStorage.getItem('token');
    const finalToken = contextToken || localStorageToken;
    
    console.log('🔍 Token check:', { 
      contextToken: !!contextToken, 
      localStorageToken: !!localStorageToken,
      finalToken: !!finalToken,
      userRole: user?.role,
      userId: user?.id 
    });
    
    if (!finalToken) {
      console.warn('❌ No token found in context or localStorage, redirecting to login');
      navigate('/login');
      return;
    }
    
    console.log('✅ Token verified, fetching dashboard data');
    
    fetchDashboard();
    fetchHospitals();
    fetchAdmins();
    fetchDoctors();
    fetchPatients();
  }, [token, navigate]);

  useEffect(() => {
    const filtered = admins.filter(a =>
      a.name?.toLowerCase().includes(adminSearch.toLowerCase()) ||
      a.email?.toLowerCase().includes(adminSearch.toLowerCase()) ||
      a.hospital?.name?.toLowerCase().includes(adminSearch.toLowerCase())
    );
    setFilteredAdmins(filtered);
  }, [adminSearch, admins]);

  useEffect(() => {
    const filtered = doctors.filter(d =>
      d.name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      d.email?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      d.hospitalName?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(doctorSearch.toLowerCase())
    );
    setFilteredDoctors(filtered);
  }, [doctorSearch, doctors]);

  useEffect(() => {
    const filtered = patients.filter(p =>
      p.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.email?.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone?.includes(patientSearch)
    );
    setFilteredPatients(filtered);
  }, [patientSearch, patients]);

  useEffect(() => {
    if (hospitals.length > 0 && doctors.length === 0) {
      fetchDoctors();
    }
  }, [hospitals]);

  useEffect(() => {
    const filtered = hospitals.filter(hospital =>
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.phone?.includes(searchTerm) ||
      hospital.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredHospitals(filtered);
  }, [searchTerm, hospitals]);

  const fetchAdmins = async () => {
    try {
      const finalToken = token || localStorage.getItem('token');
      if (!finalToken) {
        console.warn('🔴 fetchAdmins: Token is missing from both context and localStorage!');
        return;
      }
      console.log('📡 Fetching admins with token:', finalToken.substring(0, 20) + '...');
      const res = await api.getAdmins(finalToken);
      console.log('Admins response:', res);
      const list = res?.data?.data || res?.data || [];
      const adminOnly = (Array.isArray(list) ? list : []).filter(a => a.role === 'admin');
      setAdmins(adminOnly);
    } catch (e) {
      console.error('❌ Error fetching admins:', e);
    }
  };

  const handleDeleteAdmin = async (id, name) => {
    if (!window.confirm(`Delete admin "${name}"? This cannot be undone.`)) return;
    try {
      const finalToken = token || localStorage.getItem('token');
      await api.deleteAdmin(id, finalToken);
      fetchAdmins();
    } catch (e) {}
  };

  const handleAdminUpdated = () => {
    setEditAdmin(null);
    fetchAdmins();
    fetchDashboard({ silent: true });
  };

  const fetchDoctors = async () => {
    try {
      const finalToken = token || localStorage.getItem('token');
      if (!finalToken) {
        console.warn('🔴 fetchDoctors: Token is missing from both context and localStorage!');
        return;
      }
      console.log('📡 Fetching doctors with token:', finalToken.substring(0, 20) + '...');
      const res = await api.getDoctorsAdmin(finalToken);
      console.log('Doctors response:', res);
      if (res?.status !== 'success') {
        console.warn('⚠️ Doctor endpoint warning:', res?.message);
      }

      const list = res?.data?.data || res?.data || [];
      let normalized = (Array.isArray(list) ? list : []).map((doctor) => ({
        id: doctor.id,
        name: doctor.user?.name || doctor.name || '-',
        email: doctor.user?.email || doctor.email || '-',
        phone: doctor.user?.phone || doctor.phone || '-',
        hospitalName: doctor.hospital?.name || '-',
        hospitalId: doctor.hospital_id,
        departmentId: doctor.department_id,
        departmentName: doctor.department?.name || '-',
        specialization: doctor.specialization || doctor.department?.name || '-',
        qualification: doctor.qualification || '-',
        experience_years: doctor.experience_years ?? '',
        consultation_fee: doctor.consultation_fee ?? '',
        license_number: doctor.license_number || '',
        bio: doctor.bio || '',
      }));

      if (normalized.length === 0 && hospitals.length > 0) {
        const hospitalDetails = await Promise.all(
          hospitals.map(async (hospital) => {
            try {
              const details = await api.getHospital(hospital.id, finalToken);
              return { hospital, details };
            } catch {
              return null;
            }
          })
        );

        const fallbackMap = new Map();
        hospitalDetails.filter(Boolean).forEach(({ hospital, details }) => {
          const departments = Array.isArray(details?.departments) ? details.departments : [];
          departments.forEach((department) => {
            const departmentDoctors = Array.isArray(department.doctors) ? department.doctors : [];
            departmentDoctors.forEach((doctor) => {
              if (!fallbackMap.has(doctor.id)) {
                fallbackMap.set(doctor.id, {
                  id: doctor.id,
                  name: doctor.name || '-',
                  email: doctor.email || '-',
                  phone: doctor.phone || '-',
                  hospitalName: hospital.name || '-',
                  hospitalId: hospital.id,
                  departmentId: doctor.department_id,
                  departmentName: department.name || '-',
                  specialization: doctor.specialization || department.name || '-',
                  qualification: doctor.qualification || '-',
                  experience_years: doctor.experience_years ?? '',
                  consultation_fee: doctor.consultation_fee ?? '',
                  license_number: doctor.license_number || '',
                  bio: doctor.bio || '',
                });
              }
            });
          });
        });

        normalized = Array.from(fallbackMap.values());
      }

      setDoctors(normalized);

      if (normalized.length === 0 && res?.message) {
        setError(`Doctor list error: ${res.message}`);
      }
    } catch (e) {
      setDoctors([]);
      setError('Doctor list error: Failed to fetch doctors');
    }
  };

  const handleDeleteDoctor = async (id, name) => {
    if (!window.confirm(`Delete doctor "${name}"? This cannot be undone.`)) return;
    try {
      const finalToken = token || localStorage.getItem('token');
      const res = await api.deleteDoctor(id, finalToken);
      if (res?.status === 'success') {
        fetchDoctors();
        fetchDashboard({ silent: true });
      } else {
        alert(res?.message || 'Failed to delete doctor');
      }
    } catch (e) {
      alert('Error deleting doctor. Please try again.');
    }
  };

  const openEditDoctor = (doctor) => {
    setEditDoctor(doctor);
    setDoctorForm({
      name: doctor.name || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      specialization: doctor.specialization === '-' ? '' : doctor.specialization,
      qualification: doctor.qualification === '-' ? '' : doctor.qualification,
      experience_years: doctor.experience_years,
      consultation_fee: doctor.consultation_fee,
      license_number: doctor.license_number || '',
      bio: doctor.bio || '',
      department_id: doctor.departmentId || '',
    });
  };

  const handleDoctorFormChange = (e) => {
    const { name, value } = e.target;
    setDoctorForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateDoctor = async () => {
    if (!editDoctor) return;
    setDoctorSaving(true);
    try {
      const payload = {
        name: doctorForm.name,
        email: doctorForm.email,
        phone: doctorForm.phone,
        specialization: doctorForm.specialization,
        qualification: doctorForm.qualification,
        experience_years: doctorForm.experience_years === '' ? null : Number(doctorForm.experience_years),
        consultation_fee: doctorForm.consultation_fee === '' ? null : Number(doctorForm.consultation_fee),
        license_number: doctorForm.license_number,
        bio: doctorForm.bio,
        department_id: doctorForm.department_id || null,
      };

      const finalToken = token || localStorage.getItem('token');
      const response = await api.updateDoctor(editDoctor.id, payload, finalToken);
      if (response?.status === 'success') {
        setEditDoctor(null);
        fetchDoctors();
      } else {
        alert(response?.message || 'Failed to update doctor');
      }
    } catch (e) {
      alert('Error updating doctor. Please try again.');
    } finally {
      setDoctorSaving(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const finalToken = token || localStorage.getItem('token');
      if (!finalToken) {
        console.warn('❌ fetchPatients: Token is missing from both context and localStorage!');
        return;
      }
      const res = await api.getPatients(finalToken);
      const list = res?.data?.data || res?.data || [];
      setPatients(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Error fetching patients:', e);
    }
  };

  const handleDeletePatient = async (id, name) => {
    if (!window.confirm(`Remove patient "${name}" from the system? This cannot be undone.`)) return;
    try {
      const finalToken = token || localStorage.getItem('token');
      const res = await api.deletePatient(id, finalToken);
      if (res?.status === 'success') {
        fetchPatients();
        fetchDashboard();
      } else {
        alert(res?.message || 'Failed to delete patient');
      }
    } catch (e) {
      alert('Error removing patient. Please try again.');
    }
  };

  const fetchDashboard = async (options = {}) => {
    const { silent = false } = options;
    try {
      if (!silent) {
        setLoading(true);
      }
      
      const finalToken = token || localStorage.getItem('token');
      
      if (!finalToken) {
        console.error('❌ fetchDashboard: Token is missing from both context and localStorage!');
        setError('Authentication token is missing. Please login again.');
        navigate('/login');
        return;
      }
      
      console.log('📡 Fetching dashboard with token:', finalToken ? `${finalToken.substring(0, 20)}...` : 'missing');
      const response = await api.getDashboard('/dashboard/super-admin', finalToken);
      console.log('Dashboard response:', response);
      
      if (typeof response === 'string' && response.includes('<html')) {
        setError('Auth error: Invalid or expired token. Please login again.');
        return;
      }
      
      if (response.status === 'success') {
        setDashboardData(response.data);
      } else if (response.status === 'error') {
        setError(response.message || 'Failed to load dashboard');
      } else {
        setError(response.message || 'Unexpected response from server');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      if (err.status === 404) {
        setError('Dashboard endpoint not found. Try logging in again.');
      } else if (err.status === 401) {
        console.error('Authentication failed - token may be invalid or expired');
        setError('Unauthorized. Your session may have expired. Please login again.');
        logout();
        navigate('/login');
      } else {
        setError('Error loading dashboard: ' + (err.message || 'Unknown error'));
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await api.getHospitals();
      console.log('Hospitals response:', response);
      
      if (response && response.status === 'success' && response.data) {
        setHospitals(Array.isArray(response.data) ? response.data : []);
      } else if (Array.isArray(response)) {
        setHospitals(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setHospitals(response.data);
      } else {
        console.warn('Unexpected hospitals response format:', response);
        setHospitals([]);
      }
    } catch (err) {
      console.error('Error fetching hospitals:', err);
      setHospitals([]);
    }
  };

  const handleLogout = async () => {
    try {
      const finalToken = token || localStorage.getItem('token');
      await api.logout(finalToken);
    } catch (err) {
      console.error('Logout error:', err);
    }
    logout();
    navigate('/login');
  };

  const handleDeleteHospital = async (hospitalId, hospitalName) => {
    if (!window.confirm(`Are you sure you want to delete "${hospitalName}"? This will also delete all associated doctors, appointments, and data. This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.deleteHospital(hospitalId, token);
      if (response.status === 'success') {
        alert('Hospital deleted successfully!');
        setHospitals(hospitals.filter(h => h.id !== hospitalId));
        fetchAdmins();
        fetchDashboard();
      } else {
        alert(response.message || 'Failed to delete hospital');
      }
    } catch (err) {
      console.error('Error deleting hospital:', err);
      alert('Error deleting hospital. Please try again.');
    }
  };

  const handleSectionClick = (section) => {
    setActiveSection(section);
  };

  const superOverviewBars = [
    { label: 'Hospitals', value: dashboardData?.total_hospitals || 0 },
    { label: 'Users', value: dashboardData?.total_users || 0 },
    { label: 'Doctors', value: dashboardData?.total_doctors || 0 },
    { label: 'Patients', value: dashboardData?.total_patients || 0 },
  ];

  const superOpsBars = [
    { label: 'Admins', value: dashboardData?.total_admins || 0 },
    { label: 'Hospitals Listed', value: hospitals.length || 0 },
    { label: 'Admins Listed', value: admins.length || 0 },
    { label: 'Patients Listed', value: patients.length || 0 },
  ];

  const superKpiCards = [
    { label: 'Hospitals', value: dashboardData?.total_hospitals || 0 },
    { label: 'Users', value: dashboardData?.total_users || 0 },
    { label: 'Doctors', value: dashboardData?.total_doctors || 0 },
    { label: 'Patients', value: dashboardData?.total_patients || 0 },
    { label: 'Admins', value: dashboardData?.total_admins || 0 },
  ];

  const superOverviewMax = Math.max(1, ...superOverviewBars.map(item => item.value));
  const superOverviewPoints = superOverviewBars.map((item, idx) => {
    const x = superOverviewBars.length === 1 ? 50 : (idx * 100) / (superOverviewBars.length - 1);
    const y = 95 - (item.value / superOverviewMax) * 80;
    return { x, y };
  });
  const superOverviewPath = superOverviewPoints.map(point => `${point.x},${point.y}`).join(' ');

  const superPieColors = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];
  const superOpsTotal = Math.max(1, superOpsBars.reduce((sum, item) => sum + item.value, 0));
  let superAccumulated = 0;
  const superPieGradient = `conic-gradient(${superOpsBars
    .map((item, idx) => {
      const start = (superAccumulated / superOpsTotal) * 360;
      superAccumulated += item.value;
      const end = (superAccumulated / superOpsTotal) * 360;
      return `${superPieColors[idx % superPieColors.length]} ${start}deg ${end}deg`;
    })
    .join(', ')})`;

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null;

  return (
    <div className="superadmin-dashboard">
      <main className="dashboard-main">
        {error && <div className="error-message">{error}</div>}

        <div className="dash-shell">
          <aside className="dash-sidebar">
            <h3 className="dash-sidebar-title">Super Admin Navigation</h3>
            <div className="dash-sidebar-nav">
              <button className={`dash-sidebar-btn ${activeSection === 'profile' ? 'active' : ''}`} type="button" onClick={() => handleSectionClick('profile')}>My Profile</button>
              <button className={`dash-sidebar-btn ${activeSection === 'stats' ? 'active' : ''}`} type="button" onClick={() => handleSectionClick('stats')}>Stats</button>
              <button className={`dash-sidebar-btn ${activeSection === 'hospitals' ? 'active' : ''}`} type="button" onClick={() => handleSectionClick('hospitals')}>Hospitals</button>
              <button className={`dash-sidebar-btn ${activeSection === 'admins' ? 'active' : ''}`} type="button" onClick={() => handleSectionClick('admins')}>Admins</button>
              <button className={`dash-sidebar-btn ${activeSection === 'doctors' ? 'active' : ''}`} type="button" onClick={() => handleSectionClick('doctors')}>Doctors</button>
              <button className={`dash-sidebar-btn ${activeSection === 'patients' ? 'active' : ''}`} type="button" onClick={() => handleSectionClick('patients')}>Patients</button>
            </div>
            <div className="dash-sidebar-footer">
              <button className="dash-sidebar-btn dash-sidebar-logout" type="button" onClick={handleLogout}>Logout</button>
              <p className="dash-sidebar-footnote">Super Admin Panel</p>
            </div>
          </aside>

          <div className="dash-main-content">
            {activeSection === 'profile' && (
              <section className="dash-profile-section">
                <div className="dash-profile-card">
                  <div className="dash-profile-top">
                    <div className="dash-profile-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'S'}</div>
                    <div>
                      <h2 className="dash-profile-title">{user?.name || 'Super Admin'}</h2>
                      <p className="dash-profile-subtitle">System owner account overview</p>
                    </div>
                  </div>

                  <div className="dash-profile-details">
                    <div className="dash-profile-row"><label>Name</label><span>{user?.name || 'N/A'}</span></div>
                    <div className="dash-profile-row"><label>Email</label><span>{user?.email || 'N/A'}</span></div>
                    <div className="dash-profile-row"><label>Phone</label><span>{user?.phone || 'N/A'}</span></div>
                    <div className="dash-profile-row"><label>Staff ID</label><span>{user?.identifier || 'N/A'}</span></div>
                    <div className="dash-profile-row"><label>Role</label><span>Super Admin</span></div>
                    <div className="dash-profile-row"><label>Managed Scope</label><span>Entire Platform</span></div>
                  </div>

                  <div className="dash-profile-stats">
                    <div className="dash-profile-stat"><strong>{dashboardData?.total_hospitals || 0}</strong><span>Hospitals</span></div>
                    <div className="dash-profile-stat"><strong>{dashboardData?.total_admins || 0}</strong><span>Admins</span></div>
                    <div className="dash-profile-stat"><strong>{dashboardData?.total_doctors || 0}</strong><span>Doctors</span></div>
                    <div className="dash-profile-stat"><strong>{dashboardData?.total_patients || 0}</strong><span>Patients</span></div>
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'doctors' && (
              <section id="sa-doctors" className="patient-section">
                <div className="hospitals-header">
                  <div>
                    <h2>Doctor Management</h2>
                    <p className="hospitals-subtitle">Manage all doctors in the system</p>
                  </div>
                </div>

                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search doctors..."
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="table-responsive">
                  <table className="hospitals-table">
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>EMAIL</th>
                        <th>HOSPITAL</th>
                        <th>SPECIALIZATION</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDoctors.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="empty-state-message">No doctors found.</td>
                        </tr>
                      ) : filteredDoctors.map((doctor) => (
                        <tr key={doctor.id} className="hospital-row">
                          <td className="name-cell">{doctor.name}</td>
                          <td className="contact-email">{doctor.email}</td>
                          <td className="address-cell">{doctor.hospitalName}</td>
                          <td>{doctor.specialization}</td>
                          <td className="action-cell">
                            <button type="button" className="action-btn view-btn" onClick={() => setViewDoctor(doctor)}>View</button>
                            <button type="button" className="action-btn edit-btn" onClick={() => openEditDoctor(doctor)}>Edit</button>
                            <button type="button" className="action-btn delete-btn" onClick={() => handleDeleteDoctor(doctor.id, doctor.name)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeSection === 'stats' && (
              <section id="sa-stats" className="dash-analytics-kpi-section">
                <h2>Analytics Dashboard</h2>
                <p className="dash-kpi-subtitle">Real-time platform health snapshot</p>
                <div className="dash-analytics">
                  <div className="dash-graph-card">
                    <h3>System Graph</h3>
                    <p>Platform-wide key metrics</p>
                    <div className="dash-line-wrap">
                      <svg className="dash-line-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="System line graph">
                        <line className="dash-line-grid" x1="0" y1="20" x2="100" y2="20" />
                        <line className="dash-line-grid" x1="0" y1="40" x2="100" y2="40" />
                        <line className="dash-line-grid" x1="0" y1="60" x2="100" y2="60" />
                        <line className="dash-line-grid" x1="0" y1="80" x2="100" y2="80" />
                        <polyline className="dash-line-path" points={superOverviewPath} />
                        {superOverviewPoints.map((point, idx) => (
                          <circle key={superOverviewBars[idx].label} className="dash-line-point" cx={point.x} cy={point.y} r="1.8" />
                        ))}
                      </svg>
                      <div className="dash-line-labels">
                        {superOverviewBars.map((item) => (
                          <span key={item.label}>{item.label}: {item.value}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="dash-graph-card">
                    <h3>Operations Pie Chart</h3>
                    <p>Live management activity</p>
                    <div className="dash-pie-wrap">
                      <div className="dash-pie-chart" style={{ background: superPieGradient }} aria-label="Operations pie chart" />
                      <ul className="dash-pie-legend">
                        {superOpsBars.map((item, idx) => (
                          <li key={item.label}>
                            <span className="dash-pie-legend-name">
                              <span className="dash-pie-dot" style={{ background: superPieColors[idx % superPieColors.length] }} />
                              {item.label}
                            </span>
                            <span className="dash-pie-value">{item.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="dash-kpi-grid">
                  {superKpiCards.map((item) => (
                    <article key={item.label} className="dash-kpi-card">
                      <h4>{item.label}</h4>
                      <p>{item.value}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activeSection === 'hospitals' && (
              <section id="sa-hospitals" className="hospitals-section">
                <div className="hospitals-header">
                  <div>
                    <h2>Hospital Management</h2>
                    <p className="hospitals-subtitle">Manage all hospitals in the system</p>
                  </div>
                  <button type="button" onClick={() => setShowCreateModal(true)} className="btn-add-hospital">
                    Add Hospital
                  </button>
                </div>

                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search hospitals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                {filteredHospitals.length === 0 && hospitals.length === 0 ? (
                  <div className="no-hospitals">
                    <p>No hospitals found. Create your first hospital!</p>
                    <button type="button" onClick={() => navigate('/hospitals')} className="btn-create">
                      Create Hospital
                    </button>
                  </div>
                ) : filteredHospitals.length === 0 ? (
                  <div className="no-hospitals">
                    <p>No hospitals match your search.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="hospitals-table">
                      <thead>
                        <tr>
                          <th>HOSPITAL NAME</th>
                          <th>ADDRESS</th>
                          <th>CONTACT</th>
                          <th>CAPACITY</th>
                          <th>STATUS</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHospitals.map((hospital) => (
                          <tr key={hospital.id} className="hospital-row">
                            <td className="name-cell">
                              <div className="hospital-name-wrapper">
                                <img
                                  src={hospital.image ? `${api.getStorageUrl()}/${hospital.image}` : hospitalImage}
                                  alt={hospital.name}
                                  className="hospital-thumbnail"
                                  onError={(e) => {
                                    e.target.src = hospitalImage;
                                  }}
                                />
                                <span className="hospital-name-text">{hospital.name}</span>
                              </div>
                            </td>
                            <td className="address-cell">{hospital.address || 'N/A'}</td>
                            <td className="contact-cell">
                              <div className="contact-info">
                                <div>{hospital.phone || 'N/A'}</div>
                                <div className="contact-email">{hospital.email || 'N/A'}</div>
                              </div>
                            </td>
                            <td className="capacity-cell">{hospital.beds ? `${hospital.beds} beds` : (hospital.capacity ? `${hospital.capacity} beds` : 'N/A')}</td>
                            <td className="status-cell">
                              <span className={`status-badge ${hospital.is_active || hospital.status === 'active' ? 'active' : 'inactive'}`}>
                                {hospital.is_active || hospital.status === 'active' ? 'active' : 'inactive'}
                              </span>
                            </td>
                            <td className="action-cell">
                              <button
                                type="button"
                                onClick={() => setSelectedHospital(hospital)}
                                className="action-btn view-btn"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditHospital(hospital)}
                                className="action-btn edit-btn"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteHospital(hospital.id, hospital.name)}
                                className="action-btn delete-btn"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {activeSection === 'admins' && (
              <section id="sa-admins" className="admin-section">
                <div className="hospitals-header">
                  <div>
                    <h2>Admin Management</h2>
                    <p className="hospitals-subtitle">Manage all administrators in the system</p>
                  </div>
                </div>

                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search admins..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="table-responsive">
                  <table className="hospitals-table">
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>EMAIL</th>
                        <th>HOSPITAL</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdmins.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="empty-state-message">No admins found.</td>
                        </tr>
                      ) : filteredAdmins.map((admin) => (
                        <tr key={admin.id} className="hospital-row">
                          <td className="name-cell">{admin.name}</td>
                          <td className="contact-email">{admin.email}</td>
                          <td className="address-cell">{admin.hospital?.name || '-'}</td>
                          <td>
                            <span className={`status-badge ${admin.is_active !== false ? 'active' : 'inactive'}`}>
                              {admin.is_active !== false ? 'active' : 'inactive'}
                            </span>
                          </td>
                          <td className="action-cell">
                            <button type="button" className="action-btn edit-btn" onClick={() => setEditAdmin(admin)}>Edit</button>
                            <button type="button" className="action-btn delete-btn" onClick={() => handleDeleteAdmin(admin.id, admin.name)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeSection === 'patients' && (
              <section id="sa-patients" className="patient-section">
                <div className="hospitals-header">
                  <div>
                    <h2>Patient Management</h2>
                    <p className="hospitals-subtitle">Manage all patients registered in the system</p>
                  </div>
                </div>

                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="table-responsive">
                  <table className="hospitals-table">
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>EMAIL</th>
                        <th>PHONE</th>
                        <th>IDENTIFIER</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="empty-state-message">No patients found.</td>
                        </tr>
                      ) : filteredPatients.map((patient) => (
                        <tr key={patient.id} className="hospital-row">
                          <td className="name-cell">{patient.name}</td>
                          <td className="contact-email">{patient.email}</td>
                          <td>{patient.phone || '-'}</td>
                          <td><code className="identifier-code">{patient.identifier || '-'}</code></td>
                          <td>
                            <span className={`status-badge ${patient.is_active !== false ? 'active' : 'inactive'}`}>
                              {patient.is_active !== false ? 'active' : 'inactive'}
                            </span>
                          </td>
                          <td className="action-cell">
                            <button type="button" className="action-btn delete-btn" onClick={() => handleDeletePatient(patient.id, patient.name)}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {selectedHospital && (
              <HospitalViewModal 
                hospital={selectedHospital} 
                onClose={() => setSelectedHospital(null)} 
              />
            )}

            {showCreateModal && (
              <CreateHospitalModal
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                  fetchHospitals();
                  fetchAdmins();
                  fetchDashboard({ silent: true });
                }}
              />
            )}

            {editHospital && (
              <EditHospitalModal
                hospital={editHospital}
                onClose={() => setEditHospital(null)}
                onSuccess={() => {
                  setEditHospital(null);
                  fetchHospitals();
                  fetchAdmins();
                  fetchDashboard({ silent: true });
                }}
              />
            )}

            {editAdmin && (
              <EditAdminModal
                admin={editAdmin}
                hospitals={hospitals}
                onClose={() => setEditAdmin(null)}
                onSuccess={handleAdminUpdated}
              />
            )}

            {viewDoctor && (
              <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setViewDoctor(null)}>
                <div className="create-hospital-modal">
                  <div className="modal-header">
                    <div className="modal-header-left">
                      <div className="modal-header-icon">D</div>
                      <div>
                        <h2 className="modal-header-title">Doctor Details</h2>
                        <p className="modal-header-subtitle">View doctor information</p>
                      </div>
                    </div>
                    <button type="button" className="modal-close-btn" onClick={() => setViewDoctor(null)}>x</button>
                  </div>
                  <div className="modal-form">
                    <div className="form-grid">
                      <div className="modal-field"><label>Name</label><input value={viewDoctor.name} disabled /></div>
                      <div className="modal-field"><label>Email</label><input value={viewDoctor.email} disabled /></div>
                      <div className="modal-field"><label>Phone</label><input value={viewDoctor.phone} disabled /></div>
                      <div className="modal-field"><label>Hospital</label><input value={viewDoctor.hospitalName} disabled /></div>
                      <div className="modal-field"><label>Department</label><input value={viewDoctor.departmentName} disabled /></div>
                      <div className="modal-field"><label>Specialization</label><input value={viewDoctor.specialization} disabled /></div>
                      <div className="modal-field"><label>Qualification</label><input value={viewDoctor.qualification} disabled /></div>
                      <div className="modal-field"><label>Experience</label><input value={viewDoctor.experience_years || '-'} disabled /></div>
                      <div className="modal-field"><label>Fee</label><input value={viewDoctor.consultation_fee || '-'} disabled /></div>
                      <div className="modal-field col-span-2"><label>Bio</label><textarea value={viewDoctor.bio || '-'} disabled /></div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn-modal-submit" onClick={() => setViewDoctor(null)}>Close</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {editDoctor && (
              <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditDoctor(null)}>
                <div className="create-hospital-modal">
                  <div className="modal-header">
                    <div className="modal-header-left">
                      <div className="modal-header-icon">D</div>
                      <div>
                        <h2 className="modal-header-title">Edit Doctor</h2>
                        <p className="modal-header-subtitle">Update doctor information</p>
                      </div>
                    </div>
                    <button type="button" className="modal-close-btn" onClick={() => setEditDoctor(null)}>x</button>
                  </div>
                  <div className="modal-form">
                    <div className="form-grid">
                      <div className="modal-field"><label>Name</label><input name="name" value={doctorForm.name} onChange={handleDoctorFormChange} /></div>
                      <div className="modal-field"><label>Email</label><input name="email" value={doctorForm.email} onChange={handleDoctorFormChange} /></div>
                      <div className="modal-field"><label>Phone</label><input name="phone" value={doctorForm.phone} onChange={handleDoctorFormChange} /></div>
                      <div className="modal-field"><label>Hospital</label><input value={editDoctor.hospitalName} disabled /></div>
                      <div className="modal-field"><label>Department ID</label><input name="department_id" value={doctorForm.department_id} onChange={handleDoctorFormChange} /></div>
                      <div className="modal-field"><label>Specialization</label><input name="specialization" value={doctorForm.specialization} onChange={handleDoctorFormChange} /></div>
                      <div className="modal-field"><label>Qualification</label><input name="qualification" value={doctorForm.qualification} onChange={handleDoctorFormChange} /></div>
                      <div className="modal-field"><label>Experience Years</label><input name="experience_years" type="number" min="0" value={doctorForm.experience_years} onChange={handleDoctorFormChange} /></div>
                      <div className="modal-field"><label>Consultation Fee</label><input name="consultation_fee" type="number" min="0" value={doctorForm.consultation_fee} onChange={handleDoctorFormChange} /></div>
                      <div className="modal-field"><label>License Number</label><input name="license_number" value={doctorForm.license_number} onChange={handleDoctorFormChange} /></div>
                      <div className="modal-field col-span-2"><label>Bio</label><textarea name="bio" value={doctorForm.bio} onChange={handleDoctorFormChange} /></div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn-modal-cancel" onClick={() => setEditDoctor(null)}>Cancel</button>
                      <button type="button" className="btn-modal-submit" disabled={doctorSaving} onClick={handleUpdateDoctor}>{doctorSaving ? 'Saving...' : 'Save Doctor'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;