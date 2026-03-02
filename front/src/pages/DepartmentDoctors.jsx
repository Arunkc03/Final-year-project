import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import '../styles/PatientDashboard.css';

const DepartmentDoctors = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const hospitalId = searchParams.get('hospital_id');
  const { user, token } = useContext(AuthContext);
  const [department, setDepartment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      
      // Fetch department details
      const deptRes = await api.getDepartment(id, token);
      if (deptRes.status === 'success') {
        setDepartment(deptRes.data);
      } else if (deptRes.data) {
        setDepartment(deptRes.data);
      } else {
        setDepartment(deptRes);
      }

      // Fetch doctors for this department
      const doctorsRes = await api.getDoctorsByDepartment(id, token);
      if (doctorsRes.status === 'success') {
        const docData = doctorsRes.data?.data || doctorsRes.data || [];
        setDoctors(Array.isArray(docData) ? docData : []);
      } else if (Array.isArray(doctorsRes.data)) {
        setDoctors(doctorsRes.data);
      } else if (Array.isArray(doctorsRes)) {
        setDoctors(doctorsRes);
      }
    } catch (err) {
      setError('Error loading data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorClick = (doctorId) => {
    navigate(`/book-appointment/${doctorId}?hospital_id=${hospitalId}&department_id=${id}`);
  };

  const handleBack = () => {
    if (hospitalId) {
      navigate(`/hospital/${hospitalId}/departments`);
    } else {
      navigate('/dashboard/patient');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="patient-dashboard-page">
      <PageHero 
        title={department?.name || 'Department Doctors'} 
        subtitle="Select a doctor to book an appointment"
      />
      <div className="patient-dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>👨‍⚕️ Available Doctors</h1>
            <p>{department?.name}</p>
          </div>
          <div className="header-actions">
            <button onClick={handleBack} className="btn-secondary">
              ← Back to Departments
            </button>
          </div>
        </header>

        <main className="dashboard-main">
          {error && <div className="error-message">{error}</div>}

          {/* Department Info */}
          {department && (
            <section className="patient-info">
              <div className="info-card">
                <h2>Department Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name</span>
                    <span className="info-value">{department.name}</span>
                  </div>
                  {department.description && (
                    <div className="info-item">
                      <span className="info-label">Description</span>
                      <span className="info-value">{department.description}</span>
                    </div>
                  )}
                  {department.hospital?.name && (
                    <div className="info-item">
                      <span className="info-label">Hospital</span>
                      <span className="info-value">{department.hospital.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Doctors Grid */}
          <section className="doctors-section">
            <div className="section-header">
              <h2>👨‍⚕️ Select a Doctor</h2>
              <p>Click on a doctor to book an appointment</p>
            </div>
            {doctors.length > 0 ? (
              <div className="doctors-grid">
                {doctors.map((doctor) => (
                  <div 
                    key={doctor.id} 
                    className="doctor-card"
                    onClick={() => handleDoctorClick(doctor.id)}
                  >
                    <div className="doctor-header">
                      <h3>{doctor.name || doctor.user?.name}</h3>
                      <span className="arrow-icon">→</span>
                    </div>
                    <div className="doctor-details">
                      <p><strong>📧 Email:</strong> {doctor.email || doctor.user?.email}</p>
                      {doctor.qualification && (
                        <p><strong>🎓 Qualification:</strong> {doctor.qualification}</p>
                      )}
                      {doctor.experience_years && (
                        <p><strong>⏱️ Experience:</strong> {doctor.experience_years} years</p>
                      )}
                      {doctor.consultation_fee && (
                        <p><strong>💰 Fee:</strong> ${doctor.consultation_fee}</p>
                      )}
                      {doctor.bio && (
                        <p className="doctor-bio">{doctor.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">No doctors available in this department</div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default DepartmentDoctors;
