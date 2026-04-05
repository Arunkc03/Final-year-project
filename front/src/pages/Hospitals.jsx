import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import hospitalImage from '../assets/images/hospital.jpg';
import '../styles/Hospitals.css';

const Hospitals = () => {
  const navigate = useNavigate();
  const { id: hospitalId } = useParams();
  const { user, token } = useContext(AuthContext);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(!hospitalId); // Show form by default unless editing
  const [editingHospitalId, setEditingHospitalId] = useState(hospitalId || null);
  const [editingHospital, setEditingHospital] = useState(null);
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
    image: null,
    imagePreview: '',
  });

  useEffect(() => {
    if (!token || user?.role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }
    fetchHospitals();
  }, [token, user, navigate]);

  useEffect(() => {
    if (editingHospitalId && hospitals.length > 0) {
      const hospital = hospitals.find(h => h.id == editingHospitalId);
      if (hospital) {
        setEditingHospital(hospital);
        setFormData(prev => ({
          ...prev,
          name: hospital.name || '',
          email: hospital.email || '',
          phone: hospital.phone || '',
          address: hospital.address || '',
          city: hospital.city || '',
          state: hospital.state || '',
          country: hospital.country || '',
          postal_code: hospital.postal_code || '',
          description: hospital.description || '',
          admin_name: hospital.admin?.name || hospital.admin_name || '',
          admin_email: hospital.admin?.email || hospital.admin_email || '',
          imagePreview: hospital.image ? `${api.getStorageUrl()}${hospital.image}` : '',
        }));
        setShowForm(true);
      }
    }
  }, [editingHospitalId, hospitals]);

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
      let response;
      
      if (editingHospitalId) {
        // For updates, use FormData to support image upload
        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('email', formData.email);
        submitData.append('phone', formData.phone);
        submitData.append('address', formData.address);
        submitData.append('city', formData.city);
        submitData.append('state', formData.state);
        submitData.append('country', formData.country);
        submitData.append('postal_code', formData.postal_code);
        submitData.append('description', formData.description);
        submitData.append('admin_name', formData.admin_name);
        submitData.append('admin_email', formData.admin_email);
        
        if (formData.admin_password) {
          submitData.append('admin_password', formData.admin_password);
        }
        
        if (formData.image) {
          submitData.append('image', formData.image);
        }
        
        response = await api.updateHospitalWithImage(editingHospitalId, submitData, token);
      } else {
        // For creation, check if image exists
        if (formData.image) {
          const submitData = new FormData();
          submitData.append('name', formData.name);
          submitData.append('email', formData.email);
          submitData.append('phone', formData.phone);
          submitData.append('address', formData.address);
          submitData.append('city', formData.city);
          submitData.append('state', formData.state);
          submitData.append('country', formData.country);
          submitData.append('postal_code', formData.postal_code);
          submitData.append('description', formData.description);
          submitData.append('admin_name', formData.admin_name);
          submitData.append('admin_email', formData.admin_email);
          submitData.append('admin_password', formData.admin_password);
          submitData.append('image', formData.image);
          
          // Create hospital with image
          const res = await fetch(`${api.getStorageUrl().replace('/storage', '')}/api/hospitals`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: submitData,
          });
          response = await res.json();
        } else {
          response = await api.createHospital(formData, token);
        }
      }
      
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
          image: null,
          imagePreview: '',
        });
        setShowForm(false);
        setEditingHospitalId(null);
        setEditingHospital(null);
        fetchHospitals();
        if (editingHospitalId) {
          navigate('/hospitals');
        }
      } else {
        const errorMsg = response.errors?.['admin_email']?.[0] 
          || response.errors?.general?.[0]
          || response.message 
          || (editingHospitalId ? 'Failed to update hospital' : 'Failed to create hospital');
        setError(errorMsg);
      }
    } catch (err) {
      setError((editingHospitalId ? 'Error updating' : 'Error creating') + ' hospital: ' + (err.message || 'Unknown error'));
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ 
            ...prev, 
            image: file,
            imagePreview: reader.result
          }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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
          {editingHospitalId ? (
            <button 
              onClick={() => {
                setShowForm(false);
                setEditingHospitalId(null);
                setEditingHospital(null);
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
                  image: null,
                  imagePreview: '',
                });
              }} 
              className="btn-secondary"
            >
              Cancel Edit
            </button>
          ) : (
            <button 
              onClick={() => setShowForm(!showForm)} 
              className="btn-primary"
            >
              {showForm ? 'Cancel' : '+ Create Hospital'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreateHospital} className="hospital-form">
            <h3>{editingHospitalId ? 'Edit Hospital' : 'Create New Hospital'}</h3>
            
            {editingHospital && editingHospital.admin && (
              <div className="edit-info-box">
                <h4>Current Admin</h4>
                <p><strong>Name:</strong> {editingHospital.admin.name}</p>
                <p><strong>Email:</strong> {editingHospital.admin.email}</p>
              </div>
            )}
            
            <div className="form-row">
              <div className="form-group">
                <label>Hospital Image</label>
                <div className="image-upload-group">
                  {formData.imagePreview && (
                    <div className="image-preview">
                      <img src={formData.imagePreview} alt="Hospital preview" />
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: '' }))}
                        className="btn-remove-image"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {!formData.imagePreview && (
                    <label className="image-upload-placeholder">
                      <input 
                        type="file" 
                        name="image"
                        onChange={handleFormChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      📸 Click to upload hospital image
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hospital Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Hospital name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Hospital Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="hospital@email.com"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="Hospital address"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleFormChange}
                  placeholder="City"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleFormChange}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleFormChange}
                  placeholder="Country"
                />
              </div>
              <div className="form-group">
                <label>Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleFormChange}
                  placeholder="Postal code"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Hospital description"
                rows="4"
              />
            </div>

            <div className="form-divider">Admin Account Details</div>

            <div className="form-row">
              <div className="form-group">
                <label>Admin Name {editingHospitalId && '(Read-only)'}</label>
                <input
                  type="text"
                  name="admin_name"
                  value={formData.admin_name}
                  onChange={handleFormChange}
                  placeholder="Admin full name"
                  required={!editingHospitalId}
                  disabled={editingHospitalId}
                />
              </div>
              <div className="form-group">
                <label>Admin Email *</label>
                <input
                  type="email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleFormChange}
                  placeholder="admin@hospital.com"
                  required
                />
              </div>
            </div>

            {!editingHospitalId && (
              <div className="form-group">
                <label>Admin Password *</label>
                <input
                  type="password"
                  name="admin_password"
                  value={formData.admin_password}
                  onChange={handleFormChange}
                  placeholder="At least 6 characters"
                  required
                />
              </div>
            )}

            <button type="submit" className="btn-primary">
              {editingHospitalId ? 'Update Hospital' : 'Create Hospital'}
            </button>
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
                {hospital.email && <p><strong>Email:</strong> {hospital.email}</p>}
                {hospital.address && <p><strong>Address:</strong> {hospital.address}</p>}
                {hospital.phone && <p><strong>Phone:</strong> {hospital.phone}</p>}
                {hospital.admin && (
                  <p><strong>Admin:</strong> {hospital.admin.name || 'Not assigned'}</p>
                )}
                <p><strong>Status:</strong> <span className="status-active">{hospital.status || 'Active'}</span></p>
                <div className="hospital-card-actions">
                  <button 
                    onClick={() => navigate(`/hospital/${hospital.id}`)} 
                    className="btn-view"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => setEditingHospitalId(hospital.id)} 
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
