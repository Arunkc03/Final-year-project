import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import '../styles/PatientDashboard.css';

const HospitalDepartments = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const [hospital, setHospital] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDept, setExpandedDept] = useState(null);

  useEffect(() => {
    if (!token || user?.role !== 'patient') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token, user, id, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('=== FETCHING DATA ===');
      console.log('Hospital ID from URL:', id);
      console.log('Token present:', !!token);
      
      // Fetch hospital details
      const hospitalRes = await api.getHospital(id, token);
      console.log('Hospital API response:', JSON.stringify(hospitalRes, null, 2));
      if (hospitalRes.status === 'success') {
        setHospital(hospitalRes.data);
      } else if (hospitalRes.data) {
        setHospital(hospitalRes.data);
      } else {
        setHospital(hospitalRes);
      }

      // Fetch departments for this hospital
      console.log('=== FETCHING DEPARTMENTS ===');
      console.log('Calling getDepartments with hospitalId:', id);
      const deptRes = await api.getDepartments(id, token);
      console.log('Departments API full response:', JSON.stringify(deptRes, null, 2));
      
      // Try multiple possible response formats
      let deptData = [];
      if (deptRes.status === 'success' && deptRes.data) {
        // Response: { status: 'success', data: { data: [...] } } (paginated)
        // OR: { status: 'success', data: [...] }
        deptData = deptRes.data?.data || deptRes.data;
        console.log('Extracted from status=success:', deptData);
      } else if (deptRes.data) {
        deptData = deptRes.data?.data || deptRes.data;
        console.log('Extracted from .data:', deptData);
      } else if (Array.isArray(deptRes)) {
        deptData = deptRes;
        console.log('Response was direct array:', deptData);
      }
      
      console.log('Final department data to set:', deptData);
      console.log('Is array:', Array.isArray(deptData));
      console.log('Length:', deptData?.length);
      
      setDepartments(Array.isArray(deptData) ? deptData : []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Error loading data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentClick = (departmentId) => {
    navigate(`/department/${departmentId}/doctors?hospital_id=${id}`);
  };

  const toggleDeptExpand = (deptId) => {
    setExpandedDept(expandedDept === deptId ? null : deptId);
  };

  const handleDoctorClick = (doctorId) => {
    navigate(`/book-appointment/${doctorId}`);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="patient-dashboard-page">
      <PageHero 
        title={hospital?.name || 'Hospital Departments'} 
        subtitle="Select a department to view available doctors"
      />
      <div className="patient-dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>🏢 Departments</h1>
            <p>{hospital?.name}</p>
          </div>
          <div className="header-actions">
            <button onClick={() => navigate('/dashboard/patient')} className="btn-secondary">
              ← Back to Dashboard
            </button>
          </div>
        </header>

        <main className="dashboard-main">
          {error && <div className="error-message">{error}</div>}

          {/* Hospital Info */}
          {hospital && (
            <section className="patient-info">
              <div className="info-card">
                {hospital.image && (
                  <div className="hospital-info-image">
                    <img 
                      src={`${api.getStorageUrl()}/${hospital.image}`} 
                      alt={hospital.name}
                      onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                    />
                  </div>
                )}
                <h2>Hospital Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name</span>
                    <span className="info-value">{hospital.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">{hospital.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Address</span>
                    <span className="info-value">{hospital.address || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{hospital.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Departments Grid */}
          <section className="departments-section">
            <div className="section-header">
              <h2>🏢 Select a Department</h2>
              <p>Click on a department to view doctors, or expand to see doctors here</p>
            </div>
            {departments.length > 0 ? (
              <div className="departments-grid">
                {departments.map((department) => (
                  <div key={department.id} className="department-card expanded-card">
                    <div className="department-header">
                      <div className="dept-title-row">
                        <h3>{department.name}</h3>
                        <span className="admin-badge">Added by Admin</span>
                      </div>
                      <div className="dept-actions">
                        <button 
                          className="expand-btn"
                          onClick={() => toggleDeptExpand(department.id)}
                        >
                          {expandedDept === department.id ? '▼' : '▶'} Doctors
                        </button>
                        <span 
                          className="arrow-icon"
                          onClick={() => handleDepartmentClick(department.id)}
                          title="View all doctors"
                        >→</span>
                      </div>
                    </div>
                    <div className="department-details">
                      {department.description && <p>{department.description}</p>}
                      <p className="doctor-count">👨‍⚕️ {department.doctors?.length || 0} Doctors</p>
                    </div>
                    
                    {/* Doctors List */}
                    {expandedDept === department.id && (
                      <div className="dept-doctors-list">
                        <h4>Doctors in {department.name}</h4>
                        {department.doctors && department.doctors.length > 0 ? (
                          <ul className="doctors-mini-list">
                            {department.doctors.map((doctor) => (
                              <li 
                                key={doctor.id} 
                                className="doctor-mini-item"
                                onClick={() => handleDoctorClick(doctor.id)}
                              >
                                <span className="doctor-icon">👨‍⚕️</span>
                                <div className="doctor-mini-info">
                                  <strong>{doctor.user?.name || doctor.name || 'Doctor'}</strong>
                                  <span className="doctor-qual">{doctor.qualification || 'Medical Professional'}</span>
                                </div>
                                <span className="doctor-fee">${doctor.consultation_fee || 0}</span>
                                <span className="book-arrow">Book →</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="no-doctors-msg">No doctors available in this department</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">No departments available in this hospital</div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default HospitalDepartments;
