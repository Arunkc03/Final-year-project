import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import '../styles/BrowseDoctors.css';

const BrowseDoctors = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.getDoctors();
      if (response.status === 'success' && response.data) {
        setDoctors(response.data);
      } else if (Array.isArray(response)) {
        setDoctors(response);
      } else {
        setError('Failed to load doctors');
      }
    } catch (err) {
      setError('Error loading doctors');
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.department?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.hospital?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDoctor = (doctorId) => {
    navigate(`/doctor/${doctorId}`);
  };

  return (
    <div className="browse-doctors-page">
      <PageHero 
        title="Find Doctors" 
        subtitle="Browse our qualified healthcare professionals and find the right doctor for your care."
      />

      <div className="browse-container">
        <div className="browse-header">
          <h2>Available Doctors ({filteredDoctors.length})</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, department, or hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading && <div className="loading">Loading doctors...</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="doctors-grid">
          {filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="doctor-card">
              <div className="doctor-avatar">
                {doctor.avatar ? (
                  <img src={doctor.avatar} alt={doctor.name} />
                ) : (
                  <div className="avatar-placeholder">👨‍⚕️</div>
                )}
              </div>
              <h3>{doctor.name}</h3>
              <p className="doctor-id">{doctor.identifier}</p>
              {doctor.department?.name && (
                <p className="doctor-specialization">{doctor.department.name}</p>
              )}
              {doctor.hospital && (
                <p className="doctor-hospital">🏥 {doctor.hospital.name}</p>
              )}
              {doctor.experience_years > 0 && (
                <p className="doctor-experience">{doctor.experience_years} years experience</p>
              )}
              {doctor.consultation_fee > 0 && (
                <p className="doctor-fee">Consultation: ${doctor.consultation_fee}</p>
              )}
              <button 
                onClick={() => handleViewDoctor(doctor.id)} 
                className="btn-primary"
              >
                View Profile
              </button>
            </div>
          ))}
        </div>

        {filteredDoctors.length === 0 && !loading && (
          <div className="empty-state">
            <p>No doctors found matching your search.</p>
          </div>
        )}

        {!token && (
          <div className="login-prompt">
            <p>
              <strong>Want to book an appointment?</strong> 
              <a href="/login"> Login</a> or <a href="/register">Register</a> to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseDoctors;
