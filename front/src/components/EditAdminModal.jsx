import React, { useContext, useMemo, useState } from 'react';
import { ShieldCheck, User, Building2, Lock, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/CreateHospitalModal.css';

export function EditAdminModal({ admin, hospitals, onClose, onSuccess }) {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    phone: admin?.phone || '',
    hospital_id: admin?.hospital_id || admin?.hospital?.id || '',
    is_active: admin?.is_active !== false,
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hospitalOptions = useMemo(
    () => (Array.isArray(hospitals) ? hospitals.filter((hospital) => hospital?.id && hospital?.name) : []),
    [hospitals]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setError('');

    if (!formData.hospital_id) {
      setError('Please select a hospital for this admin.');
      return;
    }

    if (formData.password && formData.password !== formData.password_confirmation) {
      setError('Password confirmation does not match.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        hospital_id: Number(formData.hospital_id),
        is_active: formData.is_active,
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
        payload.password_confirmation = formData.password_confirmation.trim();
      }

      const response = await api.updateAdmin(admin.id, payload, token);

      if (response.status === 'success') {
        onSuccess();
        onClose();
        return;
      }

      const firstValidationError = response.errors
        ? Object.values(response.errors).flat()[0]
        : null;

      setError(firstValidationError || response.message || 'Failed to update admin');
    } catch (err) {
      setError('Error updating admin: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="create-hospital-modal">
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon">
              <ShieldCheck />
            </div>
            <div>
              <h2 className="modal-header-title">Edit Admin</h2>
              <p className="modal-header-subtitle">Update administrator account details</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          <div className="modal-section admin">
            <div className="modal-section-title indigo">
              <User size={18} />
              <span>Administrator Details</span>
            </div>
            <div className="form-grid">
              <div className="modal-field">
                <label>Name <span className="required">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="modal-field">
                <label>Email <span className="required">*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="modal-field">
                <label>Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Optional phone number" />
              </div>
              <div className="modal-field">
                <label>Hospital <span className="required">*</span></label>
                <div className="modal-select-wrap">
                  <Building2 size={16} />
                  <select name="hospital_id" value={formData.hospital_id} onChange={handleChange} required>
                    <option value="">Select hospital</option>
                    {hospitalOptions.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-field col-span-2">
                <label className="modal-checkbox-label">
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
                  <span>Admin account is active</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="modal-section-title blue">
              <Lock size={18} />
              <span>Reset Password</span>
            </div>
            <div className="form-grid">
              <div className="modal-field">
                <label>New Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current password" />
              </div>
              <div className="modal-field">
                <label>Confirm Password</label>
                <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} placeholder="Repeat new password" />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-modal-submit" disabled={loading} onClick={handleSubmit}>
              {loading ? 'Updating...' : 'Update Admin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}