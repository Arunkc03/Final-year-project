import React, { useState, useContext, useEffect } from 'react';
import { X, Building2, Upload, User, Stethoscope } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import '../styles/CreateHospitalModal.css';

export function EditHospitalModal({ hospital, onClose, onSuccess }) {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: hospital.name || '',
    email: hospital.email || '',
    phone: hospital.phone || '',
    address: hospital.address || '',
    city: hospital.city || '',
    state: hospital.state || '',
    country: hospital.country || '',
    postal_code: hospital.postal_code || '',
    description: hospital.description || '',
    admin_email: hospital.admin_email || '',
    image: null,
    imagePreview: hospital.image ? `${api.getStorageUrl()}/${hospital.image}` : '',
  });
  const [adminData, setAdminData] = useState({ name: '', email: '', phone: '' });
  const [adminId, setAdminId] = useState(null);
  const [adminActive, setAdminActive] = useState(true);
  const [doctorList, setDoctorList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [loadingDoctorId, setLoadingDoctorId] = useState(null);
  const [savingDoctorId, setSavingDoctorId] = useState(null);
  const [doctorFormData, setDoctorFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department_id: '',
    specialization: '',
    qualification: '',
    experience_years: '',
    consultation_fee: '',
    license_number: '',
    bio: '',
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStaffData = async () => {
      setStaffLoading(true);
      try {
        const [hospitalDetailRes, adminsRes] = await Promise.all([
          api.getHospital(hospital.id, token),
          api.getAdmins(token),
        ]);

        const adminListRaw = adminsRes?.data?.data || adminsRes?.data || [];
        const adminList = Array.isArray(adminListRaw) ? adminListRaw : [];
        const linkedAdmin = adminList.find((item) => Number(item.hospital_id) === Number(hospital.id));

        if (linkedAdmin) {
          setAdminId(linkedAdmin.id);
          setAdminActive(linkedAdmin.is_active !== false);
          setAdminData({
            name: linkedAdmin.name || '',
            email: linkedAdmin.email || '',
            phone: linkedAdmin.phone || '',
          });
          setFormData((prev) => ({
            ...prev,
            admin_email: linkedAdmin.email || prev.admin_email,
          }));
        } else if (hospitalDetailRes?.admin) {
          setAdminData({
            name: hospitalDetailRes.admin.name || '',
            email: hospitalDetailRes.admin.email || '',
            phone: hospitalDetailRes.admin.phone || '',
          });
          setFormData((prev) => ({
            ...prev,
            admin_email: hospitalDetailRes.admin.email || prev.admin_email,
          }));
        }

        const departments = Array.isArray(hospitalDetailRes?.departments) ? hospitalDetailRes.departments : [];
        setDepartmentList(departments);
        const doctors = departments.flatMap((department) => {
          const deptDoctors = Array.isArray(department.doctors) ? department.doctors : [];
          return deptDoctors.map((doctor) => ({
            ...doctor,
            department_name: department.name || 'General',
          }));
        });

        setDoctorList(doctors);
      } catch (fetchError) {
        // Keep modal usable even if related staff data fails to load.
      } finally {
        setStaffLoading(false);
      }
    };

    fetchStaffData();
  }, [hospital.id, token]);

  const handleDoctorFormChange = (event) => {
    const { name, value } = event.target;
    setDoctorFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditDoctorClick = async (doctor) => {
    setError('');
    setLoadingDoctorId(doctor.id);
    try {
      const response = await api.getDoctorAdmin(doctor.id, token);
      const doctorData = response?.data;
      if (!doctorData) {
        setError('Unable to load doctor details.');
        return;
      }

      setDoctorFormData({
        name: doctorData.user?.name || doctor.name || '',
        email: doctorData.user?.email || doctor.email || '',
        phone: doctorData.user?.phone || '',
        department_id: doctorData.department_id || doctor.department_id || '',
        specialization: doctorData.specialization || '',
        qualification: doctorData.qualification || '',
        experience_years: doctorData.experience_years ?? '',
        consultation_fee: doctorData.consultation_fee ?? '',
        license_number: doctorData.license_number || '',
        bio: doctorData.bio || '',
      });
      setEditingDoctorId(doctor.id);
    } catch (fetchError) {
      setError(fetchError?.message || 'Failed to load doctor details.');
    } finally {
      setLoadingDoctorId(null);
    }
  };

  const handleDoctorUpdate = async () => {
    if (!editingDoctorId) return;

    setSavingDoctorId(editingDoctorId);
    setError('');
    try {
      const payload = {
        name: doctorFormData.name,
        email: doctorFormData.email,
        phone: doctorFormData.phone,
        department_id: doctorFormData.department_id || null,
        specialization: doctorFormData.specialization,
        qualification: doctorFormData.qualification,
        experience_years: doctorFormData.experience_years === '' ? null : Number(doctorFormData.experience_years),
        consultation_fee: doctorFormData.consultation_fee === '' ? null : Number(doctorFormData.consultation_fee),
        license_number: doctorFormData.license_number,
        bio: doctorFormData.bio,
      };

      const response = await api.updateHospitalDoctor(hospital.id, editingDoctorId, payload, token);
      if (response?.status === 'success') {
        const updatedDoctor = response?.doctor;
        setDoctorList((prev) => prev.map((doctor) => {
          if (doctor.id !== editingDoctorId) return doctor;
          const selectedDepartment = departmentList.find((department) => Number(department.id) === Number(updatedDoctor?.department_id));
          return {
            ...doctor,
            name: updatedDoctor?.user?.name || doctor.name,
            email: updatedDoctor?.user?.email || doctor.email,
            department_id: updatedDoctor?.department_id,
            department_name: selectedDepartment?.name || doctor.department_name,
            qualification: updatedDoctor?.qualification,
            specialization: updatedDoctor?.specialization,
            consultation_fee: updatedDoctor?.consultation_fee,
          };
        }));
        setEditingDoctorId(null);
      } else {
        const doctorError = response?.message
          || (response?.errors ? Object.values(response.errors).flat().join(', ') : '')
          || 'Failed to update doctor details.';
        setError(doctorError);
      }
    } catch (updateError) {
      setError(updateError?.message || 'Failed to update doctor details.');
    } finally {
      setSavingDoctorId(null);
    }
  };

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

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      let response;
      if (formData.image) {
        const fd = new FormData();
        ['name','email','phone','address','city','state','country','postal_code','description','admin_email'].forEach(k => {
          if (formData[k] !== undefined && formData[k] !== null) fd.append(k, formData[k]);
        });
        fd.append('image', formData.image);
        response = await api.updateHospitalWithImage(hospital.id, fd, token);
      } else {
        const { image, imagePreview, ...data } = formData;
        response = await api.updateHospital(hospital.id, data, token);
      }

      if (response.status === 'success') {
        // Admin profile update is optional because older hospital records can have no linked admin user.
        if (adminId) {
          const adminUpdatePayload = {
            name: adminData.name,
            email: adminData.email,
            phone: adminData.phone,
            hospital_id: hospital.id,
            is_active: adminActive,
          };
          const adminUpdateRes = await api.updateAdmin(adminId, adminUpdatePayload, token);
          if (adminUpdateRes?.status !== 'success') {
            const adminErrorMessage = adminUpdateRes?.message
              || (adminUpdateRes?.errors ? Object.values(adminUpdateRes.errors).flat().join(', ') : '')
              || 'Hospital was updated but admin details could not be updated.';
            setError(adminErrorMessage);
            return;
          }
        }

        onSuccess();
        onClose();
      } else {
        const errMsg = response.message
          || (response.errors ? Object.values(response.errors).flat().join(', ') : '')
          || 'Failed to update hospital';
        setError(errMsg);
      }
    } catch (err) {
      setError('Error updating hospital: ' + (err.message || 'Unknown error'));
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
              <h2 className="modal-header-title">Edit Hospital</h2>
              <p className="modal-header-subtitle">Update hospital information</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="modal-form">
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
              <div className="modal-field col-span-2">
                <label>Admin Email</label>
                <input type="email" name="admin_email" value={formData.admin_email} onChange={handleChange} placeholder="Primary admin email" />
              </div>
            </div>
          </div>

          <div className="modal-section admin">
            <div className="modal-section-title indigo">
              <User size={18} />
              <span>Hospital Admin (Editable)</span>
            </div>
            {staffLoading ? (
              <p className="staff-loading">Loading admin info...</p>
            ) : (
              <div className="form-grid">
                <div className="modal-field">
                  <label>Admin Name</label>
                  <input
                    type="text"
                    value={adminData.name}
                    onChange={(e) => setAdminData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Admin full name"
                    disabled={!adminId}
                  />
                </div>
                <div className="modal-field">
                  <label>Admin Email</label>
                  <input
                    type="email"
                    value={adminData.email}
                    onChange={(e) => {
                      const email = e.target.value;
                      setAdminData((prev) => ({ ...prev, email }));
                      setFormData((prev) => ({ ...prev, admin_email: email }));
                    }}
                    placeholder="admin@hospital.com"
                    disabled={!adminId}
                  />
                </div>
                <div className="modal-field">
                  <label>Admin Phone</label>
                  <input
                    type="tel"
                    value={adminData.phone}
                    onChange={(e) => setAdminData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Optional phone"
                    disabled={!adminId}
                  />
                </div>
                {!adminId && (
                  <div className="modal-field col-span-2">
                    <p className="staff-note">No linked admin user was found for this hospital record.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="modal-section-title blue">
              <Stethoscope size={18} />
              <span>Hospital Doctors</span>
            </div>
            {staffLoading ? (
              <p className="staff-loading">Loading doctors...</p>
            ) : doctorList.length === 0 ? (
              <p className="staff-note">No doctors are assigned to this hospital yet.</p>
            ) : (
              <div className="staff-list-wrap">
                {doctorList.slice(0, 10).map((doctor) => (
                  <div key={`${doctor.id}-${doctor.department_name}`}>
                    <div className="staff-list-item">
                      <div>
                        <strong>{doctor.name || 'Unknown Doctor'}</strong>
                        <p>{doctor.email || 'No email'}</p>
                      </div>
                      <div className="staff-doctor-actions">
                        <span>{doctor.department_name}</span>
                        <button
                          type="button"
                          className="staff-edit-btn"
                          onClick={() => handleEditDoctorClick(doctor)}
                          disabled={loadingDoctorId === doctor.id || savingDoctorId === doctor.id}
                        >
                          {loadingDoctorId === doctor.id ? 'Loading...' : 'Edit Doctor'}
                        </button>
                      </div>
                    </div>

                    {editingDoctorId === doctor.id && (
                      <div className="doctor-inline-form">
                        <div className="form-grid">
                          <div className="modal-field">
                            <label>Name</label>
                            <input name="name" value={doctorFormData.name} onChange={handleDoctorFormChange} required />
                          </div>
                          <div className="modal-field">
                            <label>Email</label>
                            <input type="email" name="email" value={doctorFormData.email} onChange={handleDoctorFormChange} required />
                          </div>
                          <div className="modal-field">
                            <label>Phone</label>
                            <input name="phone" value={doctorFormData.phone} onChange={handleDoctorFormChange} />
                          </div>
                          <div className="modal-field">
                            <label>Department</label>
                            <select name="department_id" value={doctorFormData.department_id} onChange={handleDoctorFormChange}>
                              <option value="">Select department</option>
                              {departmentList.map((department) => (
                                <option key={department.id} value={department.id}>{department.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="modal-field">
                            <label>Specialization</label>
                            <input name="specialization" value={doctorFormData.specialization} onChange={handleDoctorFormChange} />
                          </div>
                          <div className="modal-field">
                            <label>Qualification</label>
                            <input name="qualification" value={doctorFormData.qualification} onChange={handleDoctorFormChange} />
                          </div>
                          <div className="modal-field">
                            <label>Experience Years</label>
                            <input type="number" min="0" name="experience_years" value={doctorFormData.experience_years} onChange={handleDoctorFormChange} />
                          </div>
                          <div className="modal-field">
                            <label>Consultation Fee</label>
                            <input type="number" min="0" name="consultation_fee" value={doctorFormData.consultation_fee} onChange={handleDoctorFormChange} />
                          </div>
                          <div className="modal-field col-span-2">
                            <label>License Number</label>
                            <input name="license_number" value={doctorFormData.license_number} onChange={handleDoctorFormChange} />
                          </div>
                          <div className="modal-field col-span-2">
                            <label>Bio</label>
                            <textarea name="bio" rows="3" value={doctorFormData.bio} onChange={handleDoctorFormChange} />
                          </div>
                        </div>
                        <div className="doctor-inline-actions">
                          <button type="button" className="btn-modal-cancel" onClick={() => setEditingDoctorId(null)}>Cancel</button>
                          <button type="button" className="btn-modal-submit" disabled={savingDoctorId === doctor.id} onClick={handleDoctorUpdate}>
                            {savingDoctorId === doctor.id ? 'Saving...' : 'Save Doctor'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {doctorList.length > 10 && <p className="staff-note">Showing first 10 doctors. Edit from doctor management for the full list.</p>}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="btn-modal-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Hospital'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
