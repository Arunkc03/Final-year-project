import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import hospitalImage from '../assets/images/hospital.jpg';
import '../styles/Hospitals.css';

const Hospitals = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    description: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  });

  useEffect(() => {
    if (!token || user?.role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }
    fetchHospitals();
  }, [token, user, navigate]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const response = await api.getHospitals(token);
      if (response.status === 'success' && response.data) {
        setHospitals(response.data);
      } else if (Array.isArray(response)) {
        // Handle case where response is directly an array (legacy format)
        setHospitals(response);
      } else {
        setError(response.message || 'Failed to load hospitals');
      }
    } catch (err) {
      setError('Error loading hospitals: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHospital = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await api.createHospital(formData, token);
      if (response.status === 'success') {
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          country: '',
          postal_code: '',
          description: '',
          admin_name: '',
          admin_email: '',
          admin_password: '',
        });
        setShowForm(false);
        fetchHospitals();
      } else {
        const errorMsg = response.errors?.['admin_email']?.[0] 
          || response.errors?.general?.[0]
          || response.message 
          || 'Failed to create hospital';
        setError(errorMsg);
      }
    } catch (err) {
      setError('Error creating hospital: ' + (err.message || 'Unknown error'));
    }
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
      } else {
        alert(response.message || 'Failed to delete hospital');
      }
    } catch (err) {
      console.error('Error deleting hospital:', err);
      alert('Error deleting hospital. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="hospitals-page">
      <PageHero 
        title="Hospital Management" 
        subtitle="Manage hospitals and their admin accounts. Create and configure healthcare facilities."
      />
      <div className="hospitals-container">
        <header className="page-header">
          <div>
            <h1>🏥 Hospital Management</h1>
            <p>Manage hospitals and their admin accounts</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Back to Dashboard
          </button>
        </header>

      <main className="page-content">
        {error && <div className="error-message">{error}</div>}

        <div className="hospitals-header">
          <h2>Hospitals ({hospitals.length})</h2>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn-primary"
          >
            {showForm ? 'Cancel' : '+ Create Hospital'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateHospital} className="hospital-form">
            <div className="form-row">
              <div className="form-group">
                <label>Hospital Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Hospital name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Hospital Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="hospital@email.com"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Hospital address"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="City"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  placeholder="Country"
                />
              </div>
              <div className="form-group">
                <label>Postal Code</label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                  placeholder="Postal code"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Hospital description"
                rows="4"
              />
            </div>

            <div className="form-divider">Admin Account Details</div>

            <div className="form-row">
              <div className="form-group">
                <label>Admin Name *</label>
                <input
                  type="text"
                  value={formData.admin_name}
                  onChange={(e) => setFormData({...formData, admin_name: e.target.value})}
                  placeholder="Admin full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Admin Email *</label>
                <input
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                  placeholder="admin@hospital.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Admin Password *</label>
              <input
                type="password"
                value={formData.admin_password}
                onChange={(e) => setFormData({...formData, admin_password: e.target.value})}
                placeholder="At least 6 characters"
                required
              />
            </div>

            <button type="submit" className="btn-primary">Create Hospital</button>
          </form>
        )}

        <div className="hospitals-grid">
          {hospitals.map((hospital) => (
            <div key={hospital.id} className="hospital-card">
              <div className="hospital-card-image">
                <img src={hospital.image || hospitalImage} alt={hospital.name} />
              </div>
              <div className="hospital-card-info">
                <h3>{hospital.name}</h3>
                <p className="hospital-id">ID: {hospital.id}</p>
                {hospital.email && <p>{hospital.email}</p>}
                {hospital.address && <p>{hospital.address}</p>}
                {hospital.phone && <p>{hospital.phone}</p>}
                <p><strong>Status:</strong> <span className="status-active">{hospital.status || 'Active'}</span></p>
                <div className="hospital-card-actions">
                  <button 
                    onClick={() => navigate(`/hospital/${hospital.id}`)} 
                    className="btn-view"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => navigate(`/hospitals/${hospital.id}`)} 
                    className="btn-edit"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteHospital(hospital.id, hospital.name)} 
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hospitals.length === 0 && !showForm && (
          <div className="empty-state">
            <p>No hospitals yet. Create one to get started!</p>
          </div>
        )}
      </main>
      </div>
    </div>
  );
};

export default Hospitals;
