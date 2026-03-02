import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import hospitalImage from '../assets/images/hospital.jpg';
import '../styles/BrowseHospitals.css';

const BrowseHospitals = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const response = await api.getHospitals();
      if (response.status === 'success' && response.data) {
        setHospitals(response.data);
      } else if (Array.isArray(response)) {
        setHospitals(response);
      } else {
        setError('Failed to load hospitals');
      }
    } catch (err) {
      setError('Error loading hospitals');
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewHospital = (hospitalId) => {
    navigate(`/hospital/${hospitalId}`);
  };

  const handleBookAppointment = (hospitalId) => {
    if (token && user?.role === 'patient') {
      navigate(`/hospital/${hospitalId}?book=true`);
    } else {
      navigate(`/hospital/${hospitalId}?book=true`);
    }
  };

  return (
    <div className="browse-hospitals-page">
      <PageHero 
        title="Find Hospitals" 
        subtitle="Browse our network of healthcare facilities and find the right hospital for your needs."
      />

      <div className="browse-container">
        <div className="browse-header">
          <h2>Book An Appointment at Hospitals</h2>
          <div className="search-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Find Hospital"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-btn">🔍</button>
            </div>
          </div>
        </div>

        {loading && <div className="loading">Loading hospitals...</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="hospitals-grid">
          {filteredHospitals.map((hospital) => (
            <div key={hospital.id} className="hospital-card">
              <div className="hospital-card-image">
                <img src={hospital.image || hospitalImage} alt={hospital.name} />
                <button 
                  className="quick-view-btn"
                  onClick={() => handleViewHospital(hospital.id)}
                >
                  »
                </button>
              </div>
              <div className="hospital-card-info">
                <h3>{hospital.name}</h3>
                <p className="hospital-address">
                  {hospital.city && hospital.state 
                    ? `${hospital.city}, ${hospital.state}` 
                    : hospital.address || 'Location not specified'}
                </p>
                <button 
                  onClick={() => handleBookAppointment(hospital.id)} 
                  className="btn-book"
                >
                  Book an Appointment »
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredHospitals.length === 0 && !loading && (
          <div className="empty-state">
            <p>No hospitals found matching your search.</p>
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

export default BrowseHospitals;
