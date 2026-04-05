import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit2, Trash2, Search, Plus } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import { HospitalViewModal } from '../components/HospitalViewModal';
import { CreateHospitalModal } from '../components/CreateHospitalModal';
import { EditHospitalModal } from '../components/EditHospitalModal';
import hospitalImage from '../assets/images/hospital.jpg';
import '../styles/SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useContext(AuthContext);
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
  const [adminSearch, setAdminSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');

  useEffect(() => {
    if (!token || user?.role !== 'super_admin') {
      navigate('/login');
      return;
    }
    fetchDashboard();
    fetchHospitals();
    fetchAdmins();
    fetchPatients();
  }, [token, user, navigate]);

  useEffect(() => {
    const filtered = admins.filter(a =>
      a.name?.toLowerCase().includes(adminSearch.toLowerCase()) ||
      a.email?.toLowerCase().includes(adminSearch.toLowerCase()) ||
      a.hospital?.name?.toLowerCase().includes(adminSearch.toLowerCase())
    );
    setFilteredAdmins(filtered);
  }, [adminSearch, admins]);

  useEffect(() => {
    const filtered = patients.filter(p =>
      p.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.email?.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone?.includes(patientSearch)
    );
    setFilteredPatients(filtered);
  }, [patientSearch, patients]);

  useEffect(() => {
    // Filter hospitals based on search term
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
      const res = await api.getAdmins(token);
      const list = res?.data?.data || res?.data || [];
      const adminOnly = (Array.isArray(list) ? list : []).filter(a => a.role === 'admin');
      setAdmins(adminOnly);
    } catch (e) {
      // silently fail
    }
  };

  const handleDeleteAdmin = async (id, name) => {
    if (!window.confirm(`Delete admin "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteAdmin(id, token);
      fetchAdmins();
    } catch (e) {}
  };

  const fetchPatients = async () => {
    try {
      const res = await api.getPatients(token);
      const list = res?.data?.data || res?.data || [];
      setPatients(Array.isArray(list) ? list : []);
    } catch (e) {}
  };

  const handleDeletePatient = async (id, name) => {
    if (!window.confirm(`Remove patient "${name}" from the system? This cannot be undone.`)) return;
    try {
      const res = await api.deletePatient(id, token);
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

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard with token:', token ? 'exists' : 'missing');
      const response = await api.getDashboard('/dashboard/super-admin', token);
      console.log('Dashboard response:', response);
      
      // Check if response is HTML (error page)
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
        setError('Unauthorized. Your session may have expired. Please login again.');
      } else {
        setError('Error loading dashboard: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await api.getHospitals();
      console.log('Hospitals response:', response);
      
      // Handle different response formats
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
      await api.logout(token);
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
        // Refresh hospitals list
        setHospitals(hospitals.filter(h => h.id !== hospitalId));
        // Refresh dashboard data
        fetchDashboard();
      } else {
        alert(response.message || 'Failed to delete hospital');
      }
    } catch (err) {
      console.error('Error deleting hospital:', err);
      alert('Error deleting hospital. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null;

  return (
    <div className="superadmin-dashboard">
      <main className="dashboard-main" style={{display:'flex', flexDirection:'column', width:'100%'}}>
        {error && <div className="error-message">{error}</div>}

        {/* Statistics Section */}
        <section className="stats-section">
          <h2>System Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Hospitals</h3>
                <p className="stat-value">{dashboardData?.total_hospitals || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Users</h3>
                <p className="stat-value">{dashboardData?.total_users || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Doctors</h3>
                <p className="stat-value">{dashboardData?.total_doctors || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Patients</h3>
                <p className="stat-value">{dashboardData?.total_patients || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Admins</h3>
                <p className="stat-value">{dashboardData?.total_admins || 0}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Hospitals Management Section */}
        <section className="hospitals-section">
          <div className="hospitals-header">
            <div>
              <h2>Hospital Management</h2>
              <p className="hospitals-subtitle">Manage all hospitals in the system</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="btn-add-hospital">
              <Plus size={18} />
              Add Hospital
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search hospitals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Hospitals Table */}
          {filteredHospitals.length === 0 && hospitals.length === 0 ? (
            <div className="no-hospitals">
              <p>No hospitals found. Create your first hospital!</p>
              <button onClick={() => navigate('/hospitals')} className="btn-create">
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
                          onClick={() => setSelectedHospital(hospital)}
                          className="action-btn view-btn"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setEditHospital(hospital)}
                          className="action-btn edit-btn"
                        >
                          Edit
                        </button>
                        <button
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

        {/* Admin Management Section */}
        <section className="admin-section">
          <div className="hospitals-header">
            <div>
              <h2>Admin Management</h2>
              <p className="hospitals-subtitle">Manage all administrators in the system</p>
            </div>
          </div>

          <div className="search-container">
            <Search className="search-icon" />
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
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>No admins found.</td></tr>
                ) : filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hospital-row">
                    <td style={{ fontWeight: 700, color: 'var(--foreground)' }}>{admin.name}</td>
                    <td className="contact-email" style={{ fontSize: '0.9rem' }}>{admin.email}</td>
                    <td className="address-cell">{admin.hospital?.name || '-'}</td>
                    <td>
                      <span className={`status-badge ${admin.is_active !== false ? 'active' : 'inactive'}`}>
                        {admin.is_active !== false ? 'active' : 'inactive'}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button className="action-btn delete-btn" onClick={() => handleDeleteAdmin(admin.id, admin.name)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Patient Management Section */}
        <section className="patient-section">
          <div className="hospitals-header">
            <div>
              <h2>Patient Management</h2>
              <p className="hospitals-subtitle">Manage all patients registered in the system</p>
            </div>
          </div>

          <div className="search-container">
            <Search className="search-icon" />
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
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>No patients found.</td></tr>
                ) : filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hospital-row">
                    <td style={{ fontWeight: 700, color: 'var(--foreground)' }}>{patient.name}</td>
                    <td className="contact-email" style={{ fontSize: '0.9rem' }}>{patient.email}</td>
                    <td>{patient.phone || '-'}</td>
                    <td><code style={{ fontSize: '0.82rem', background: 'var(--muted)', padding: '2px 6px', borderRadius: '4px' }}>{patient.identifier || '-'}</code></td>
                    <td>
                      <span className={`status-badge ${patient.is_active !== false ? 'active' : 'inactive'}`}>
                        {patient.is_active !== false ? 'active' : 'inactive'}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button className="action-btn delete-btn" onClick={() => handleDeletePatient(patient.id, patient.name)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

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
              fetchDashboard();
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
              fetchDashboard();
            }}
          />
        )}
      </main>

      <footer className="sa-footer">
        <div className="sa-footer-content">
          <div className="sa-footer-brand">
            <h3>🏥 Hospital Management System</h3>
            <p>Providing efficient healthcare administration across all hospitals in the network.</p>
          </div>
          <div className="sa-footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/dashboard/super-admin">Dashboard</a></li>
              <li><a href="/browse-hospitals">Hospitals</a></li>
              <li><a href="/browse-doctors">Doctors</a></li>
            </ul>
          </div>
          <div className="sa-footer-links">
            <h4>System</h4>
            <ul>
              <li><a href="/dashboard/super-admin">Hospital Management</a></li>
              <li><a href="/dashboard/super-admin">Admin Management</a></li>
              <li><a href="/dashboard/super-admin">Patient Records</a></li>
            </ul>
          </div>
        </div>
        <div className="sa-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Hospital Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default SuperAdminDashboard;
