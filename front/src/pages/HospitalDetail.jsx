import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import PageHero from '../components/PageHero/PageHero';
import '../styles/HospitalDetail.css';

const HospitalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [booking, setBooking] = useState({ hospital_id: '', date: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    description: '',
    status: 'active',
  });

  // Load hospital details
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.getHospital(id, token);
        if (res && res.status === 'success') {
          const hospitalData = res.hospital || res;
          setHospital(hospitalData);
          if (user?.role === 'super_admin') {
            setEditFormData(hospitalData);
          }
        }
      } catch (e) {
        setError('Failed to load hospital details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token, user]);

  useEffect(() => {
    setBooking((b) => ({ ...b, hospital_id: id }));
  }, [id]);

  const handleBook = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!token) {
      setMessage('Please login to book an appointment');
      return;
    }
    try {
      const res = await api.bookAppointment(booking, token);
      if (res && res.status === 'success') setMessage('Appointment booked — check your email');
      else setMessage(res.message || 'Booking failed');
    } catch (err) {
      setMessage('Error connecting to server');
    }
  };

  const handleUpdateHospital = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      let res;
      if (imageFile) {
        // Use FormData for image upload
        const formData = new FormData();
        Object.keys(editFormData).forEach(key => {
          if (editFormData[key] !== null && editFormData[key] !== undefined) {
            formData.append(key, editFormData[key]);
          }
        });
        formData.append('image', imageFile);
        res = await api.updateHospitalWithImage(id, formData, token);
      } else {
        res = await api.updateHospital(id, editFormData, token);
      }
      
      if (res && res.status === 'success') {
        setHospital(res.hospital);
        setIsEditing(false);
        setMessage('Hospital updated successfully!');
        setImageFile(null);
        setImagePreview(null);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(res.message || 'Failed to update hospital');
      }
    } catch (err) {
      setError('Error updating hospital: ' + (err.message || 'Unknown error'));
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="loading">Loading hospital...</div>;
  if (!hospital) return <div className="error-message">Hospital not found</div>;

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="hospital-detail-page">
      <PageHero 
        title={hospital.name} 
        subtitle="View hospital details, doctors, and book your appointment."
      />
      <div className="hospital-detail">
        <header className="header-section">
          <div>
            <h1>{hospital.name}</h1>
            <p className="address">{hospital.address}</p>
            {isSuperAdmin && (
              <span className={`status-badge ${hospital.status}`}>{hospital.status}</span>
            )}
          </div>
          <div className="header-actions">
            <button onClick={() => navigate('/hospitals')} className="btn-secondary">
              Back to Hospitals
            </button>
            {isSuperAdmin && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn-primary">
                ✏️ Edit Hospital
              </button>
            )}
          </div>
        </header>

      <main className="hospital-content">
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        {isSuperAdmin && isEditing ? (
          // Super Admin Edit View
          <section className="edit-section">
            <h2>Edit Hospital Information</h2>
            <form onSubmit={handleUpdateHospital} className="hospital-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Hospital Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditChange}
                    placeholder="Hospital name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditChange}
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
                    value={editFormData.phone}
                    onChange={handleEditChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  placeholder="Hospital description"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={editFormData.address}
                  onChange={handleEditChange}
                  placeholder="Full address"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={editFormData.city}
                    onChange={handleEditChange}
                    placeholder="City"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={editFormData.state}
                    onChange={handleEditChange}
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
                    value={editFormData.country}
                    onChange={handleEditChange}
                    placeholder="Country"
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={editFormData.postal_code}
                    onChange={handleEditChange}
                    placeholder="Postal code"
                  />
                </div>
              </div>

              {/* Hospital Image Upload */}
              <div className="form-group">
                <label>Hospital Image</label>
                <div className="image-upload-container">
                  {(imagePreview || hospital?.image) && (
                    <div className="image-preview">
                      <img 
                        src={imagePreview || `${api.getStorageUrl()}/${hospital.image}`} 
                        alt="Hospital preview" 
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="file-input"
                  />
                  <small>Upload a hospital image (max 2MB, JPG/PNG/GIF/WEBP)</small>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  💾 Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        ) : (
          // View Section (Both Super Admin and Patient)
          <>
            {hospital.image && (
              <div className="hospital-hero-image">
                <img 
                  src={`${api.getStorageUrl()}/${hospital.image}`} 
                  alt={hospital.name}
                  onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                />
              </div>
            )}
            <section className="info-section">
              <h2>Hospital Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Name</label>
                  <p>{hospital.name}</p>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <p>{hospital.email || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <p>{hospital.phone || 'N/A'}</p>
                </div>
                {isSuperAdmin && (
                  <div className="info-item">
                    <label>Status</label>
                    <p>{hospital.status}</p>
                  </div>
                )}
                <div className="info-item">
                  <label>Address</label>
                  <p>{hospital.address || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>City</label>
                  <p>{hospital.city || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>State</label>
                  <p>{hospital.state || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Country</label>
                  <p>{hospital.country || 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Postal Code</label>
                  <p>{hospital.postal_code || 'N/A'}</p>
                </div>
                {hospital.description && (
                  <div className="info-item full-width">
                    <label>Description</label>
                    <p>{hospital.description}</p>
                  </div>
                )}
              </div>
            </section>

            {!isSuperAdmin && (
              <section className="booking-section">
                <h2>Book Appointment</h2>
                {message && <div className="info">{message}</div>}
                <form onSubmit={handleBook}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date</label>
                      <input
                        type="date"
                        value={booking.date}
                        onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Notes (optional)</label>
                    <textarea
                      value={booking.notes || ''}
                      onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                    />
                  </div>
                  <button className="btn-primary" type="submit">
                    Book Appointment
                  </button>
                </form>
              </section>
            )}
          </>
        )}
      </main>
      </div>
    </div>
  );
};

export default HospitalDetail;
