import React, { useState, useContext } from 'react';
import { X, Building2, User, Upload } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/CreateHospitalModal.css';

const initialForm = {
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
};

export function CreateHospitalModal({ onClose, onSuccess }) {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, image: file, imagePreview: reader.result }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;

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

        const res = await fetch(`${api.getStorageUrl().replace('/storage', '')}/api/hospitals`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: submitData,
        });
        response = await res.json();
      } else {
        response = await api.createHospital(formData, token);
      }

      if (response.status === 'success') {
        onSuccess();
        onClose();
      } else {
        const firstValidationError = response.errors
          ? Object.values(response.errors).flat()[0]
          : null;

        const errorMsg =
          firstValidationError ||
          response.errors?.general?.[0] ||
          response.message ||
          'Failed to create hospital';
        setError(errorMsg);
      }
    } catch (err) {
      setError('Error creating hospital: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="create-hospital-modal">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon">
              <Building2 />
            </div>
            <div>
              <h2 className="modal-header-title">Create New Hospital</h2>
              <p className="modal-header-subtitle">Fill in the details to add a hospital</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="modal-error">{error}</div>}

          {/* Image Upload */}
          <div>
            <div className="modal-section-title blue">
              <Upload size={18} />
              <span>Hospital Image</span>
            </div>
            {formData.imagePreview ? (
              <div className="image-preview-wrap">
                <img src={formData.imagePreview} alt="Preview" />
                <button
                  type="button"
                  className="image-remove-btn"
                  onClick={() => setFormData(prev => ({ ...prev, image: null, imagePreview: '' }))}
                >
                  <X />
                </button>
              </div>
            ) : (
              <label className="image-upload-label">
                <Upload />
                <span>Click to upload hospital image</span>
                <input type="file" name="image" onChange={handleChange} accept="image/*" style={{ display: 'none' }} />
              </label>
            )}
          </div>

          {/* Hospital Information */}
          <div>
            <div className="modal-section-title blue">
              <Building2 size={18} />
              <span>Hospital Information</span>
            </div>
            <div className="form-grid">
              <div className="modal-field">
                <label>Hospital Name <span className="required">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. City General Hospital" required />
              </div>
              <div className="modal-field">
                <label>Hospital Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="hospital@email.com" />
              </div>
              <div className="modal-field">
                <label>Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 123-4567" />
              </div>
              <div className="modal-field">
                <label>Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Street address" />
              </div>
              <div className="modal-field">
                <label>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
              </div>
              <div className="modal-field">
                <label>State</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" />
              </div>
              <div className="modal-field">
                <label>Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Country" />
              </div>
              <div className="modal-field">
                <label>Postal Code</label>
                <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="12345" />
              </div>
              <div className="modal-field col-span-2">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Brief description of the hospital..." />
              </div>
            </div>
          </div>

          {/* Administrator Account */}
          <div className="modal-section admin">
            <div className="modal-section-title indigo">
              <User size={18} />
              <span>Administrator Account</span>
            </div>
            <div className="form-grid">
              <div className="modal-field">
                <label>Admin Name <span className="required">*</span></label>
                <input type="text" name="admin_name" value={formData.admin_name} onChange={handleChange} placeholder="Admin full name" required />
              </div>
              <div className="modal-field">
                <label>Admin Email <span className="required">*</span></label>
                <input type="email" name="admin_email" value={formData.admin_email} onChange={handleChange} placeholder="admin@hospital.com" required />
              </div>
              <div className="modal-field col-span-2">
                <label>Admin Password <span className="required">*</span></label>
                <input type="password" name="admin_password" value={formData.admin_password} onChange={handleChange} placeholder="At least 6 characters" required />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-modal-submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Hospital'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

