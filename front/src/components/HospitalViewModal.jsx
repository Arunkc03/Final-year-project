import { useState, useEffect, useContext } from 'react';
import { X, Mail, Phone, MapPin, Building2, User, BadgeAlert, Stethoscope, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import hospitalImage from '../assets/images/hospital.jpg';
import '../styles/HospitalViewModal.css';

export function HospitalViewModal({ hospital, onClose }) {
  const { token } = useContext(AuthContext);
  const [hospitalData, setHospitalData] = useState(hospital);
  const [adminData, setAdminData] = useState(null);
  const [deletingDoctorId, setDeletingDoctorId] = useState(null);
  const [loadingDoctorId, setLoadingDoctorId] = useState(null);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [savingDoctorId, setSavingDoctorId] = useState(null);
  const [doctorActionMessage, setDoctorActionMessage] = useState({ type: '', text: '' });
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadHospitalDetails = async () => {
    try {
      const res = await api.getHospital(hospital.id, token);
      if (res?.status === 'success') {
        setHospitalData({
          ...(res.hospital || hospital),
          departments: res.departments || res.hospital?.departments || hospital.departments || [],
        });
        setAdminData(res.admin || null);
      }
    } catch {
      setHospitalData(hospital);
    }
  };

  const handleDeleteDoctor = async (doctor) => {
    if (!window.confirm(`Delete Dr. ${doctor.name}? This will remove their account from the system and they won't be able to login. This action cannot be undone.`)) {
      return;
    }

    setDeletingDoctorId(doctor.id);
    try {
      const res = await api.deleteDoctor(doctor.id, token);
      if (res?.status === 'success') {
        setDoctorActionMessage({ type: 'success', text: 'Doctor deleted successfully' });
        setRefreshTrigger(prev => prev + 1);
      } else {
        setDoctorActionMessage({ type: 'error', text: res?.message || 'Failed to delete doctor' });
      }
    } catch (err) {
      console.error('Error deleting doctor:', err);
      setDoctorActionMessage({ type: 'error', text: 'Error deleting doctor. Please try again.' });
    } finally {
      setDeletingDoctorId(null);
    }
  };

  const handleEditDoctorClick = async (doctor) => {
    setDoctorActionMessage({ type: '', text: '' });
    setLoadingDoctorId(doctor.id);
    try {
      const res = await api.getDoctorAdmin(doctor.id, token);
      const doctorData = res?.data;
      if (!doctorData) {
        setDoctorActionMessage({ type: 'error', text: 'Unable to load doctor details' });
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
    } catch (err) {
      setDoctorActionMessage({ type: 'error', text: err.message || 'Failed to load doctor details' });
    } finally {
      setLoadingDoctorId(null);
    }
  };

  const handleDoctorFormChange = (e) => {
    const { name, value } = e.target;
    setDoctorFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDoctorUpdate = async (e) => {
    e.preventDefault();
    if (!editingDoctorId) return;

    setSavingDoctorId(editingDoctorId);
    setDoctorActionMessage({ type: '', text: '' });

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

      const res = await api.updateDoctor(editingDoctorId, payload, token);
      if (res?.status === 'success') {
        setDoctorActionMessage({ type: 'success', text: 'Doctor updated successfully' });
        setEditingDoctorId(null);
        setRefreshTrigger(prev => prev + 1);
      } else {
        const errorText = res?.message || (res?.errors ? Object.values(res.errors).flat().join(', ') : 'Failed to update doctor');
        setDoctorActionMessage({ type: 'error', text: errorText });
      }
    } catch (err) {
      setDoctorActionMessage({ type: 'error', text: err.message || 'Failed to update doctor' });
    } finally {
      setSavingDoctorId(null);
    }
  };

  useEffect(() => {
    loadHospitalDetails();
  }, [hospital.id, refreshTrigger, token]);

  const imgSrc = hospitalData.image
    ? `${api.getStorageUrl()}/${hospitalData.image}`
    : hospitalImage;

  return (
    <div className="hvm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hvm-modal">

        {/* Header */}
        <div className="hvm-header">
          <h2>Hospital Details</h2>
          <button type="button" className="hvm-close-btn" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="hvm-body">

          {/* Hospital Image */}
          <div className="hvm-image-wrap">
            <img
              src={imgSrc}
              alt={hospitalData.name}
              onError={(e) => { e.target.src = hospitalImage; }}
            />
          </div>

          {/* Info Grid */}
          <div className="hvm-info-grid">
            <div className="hvm-field full-width">
              <span className="hvm-field-label">
                <Building2 /> Hospital Name
              </span>
              <span className="hvm-field-value large">{hospitalData.name}</span>
            </div>

            <div className="hvm-field">
              <span className="hvm-field-label">
                <Mail /> Email
              </span>
              <span className="hvm-field-value">{hospitalData.email || 'N/A'}</span>
            </div>

            <div className="hvm-field">
              <span className="hvm-field-label">
                <Phone /> Phone
              </span>
              <span className="hvm-field-value">{hospitalData.phone || 'N/A'}</span>
            </div>

            <div className="hvm-field full-width">
              <span className="hvm-field-label">
                <MapPin /> Address
              </span>
              <span className="hvm-field-value">
                {[hospitalData.address, hospitalData.city, hospitalData.state, hospitalData.country]
                  .filter(Boolean).join(', ') || 'N/A'}
              </span>
            </div>

            {hospitalData.description && (
              <div className="hvm-field full-width">
                <span className="hvm-field-label">Description</span>
                <span className="hvm-field-value">{hospitalData.description}</span>
              </div>
            )}
          </div>

          {/* Administrator */}
          {adminData && (
            <div className="hvm-admin-section">
              <div className="hvm-admin-section-title">
                <BadgeAlert /> Hospital Administrator
              </div>
              <div className="hvm-admin-row">
                <div className="hvm-admin-avatar">
                  <User />
                </div>
                <div>
                  <div className="hvm-admin-name">{adminData.name}</div>
                  <div className="hvm-admin-detail"><Mail /> {adminData.email}</div>
                  {adminData.identifier && (
                    <div className="hvm-admin-detail"><BadgeAlert /> ID: {adminData.identifier}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Departments & Doctors */}
          {doctorActionMessage.text && (
            <div className={`hvm-doctor-message ${doctorActionMessage.type}`}>{doctorActionMessage.text}</div>
          )}

          {hospitalData.departments && hospitalData.departments.length > 0 && (
            <div>
              <div className="hvm-dept-title">
                <Stethoscope /> Departments &amp; Doctors
              </div>
              {hospitalData.departments.map((dept) => (
                <div key={dept.id} className="hvm-dept-card">
                  <div className="hvm-dept-card-header">
                    <span className="hvm-dept-card-name">{dept.name}</span>
                    <span className="hvm-dept-badge">Active</span>
                  </div>

                  {(dept.beds || dept.head) && (
                    <div className="hvm-dept-meta">
                      {dept.beds && <span className="hvm-dept-meta-item">Beds: {dept.beds}</span>}
                      {dept.head && <span className="hvm-dept-meta-item">Head: {dept.head}</span>}
                    </div>
                  )}

                  {dept.doctors && dept.doctors.length > 0 ? (
                    <div>
                      <div className="hvm-doctor-label">Doctors ({dept.doctors.length})</div>
                      {dept.doctors.map((doctor) => (
                        <div key={doctor.id} className="hvm-doctor-item">
                          <div className="hvm-doctor-card">
                            <div className="hvm-doctor-info">
                              <div className="hvm-doctor-avatar"><Stethoscope /></div>
                              <div>
                                <div className="hvm-doctor-name">{doctor.name}</div>
                                <div className="hvm-doctor-qual">{doctor.qualification || doctor.specialization || 'Doctor'}</div>
                                {doctor.email && <div className="hvm-doctor-meta">{doctor.email}</div>}
                                {doctor.consultation_fee && (
                                  <div className="hvm-doctor-fee">Rs. {doctor.consultation_fee}</div>
                                )}
                              </div>
                            </div>
                            <div className="hvm-doctor-card-actions">
                              <button
                                type="button"
                                onClick={() => handleEditDoctorClick(doctor)}
                                disabled={loadingDoctorId === doctor.id || savingDoctorId === doctor.id}
                                className="hvm-doctor-action-btn"
                              >
                                {loadingDoctorId === doctor.id ? 'Loading...' : 'Edit'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDoctor(doctor)}
                                disabled={deletingDoctorId === doctor.id || savingDoctorId === doctor.id}
                                className="hvm-doctor-delete-btn"
                                title="Delete doctor"
                              >
                                {deletingDoctorId === doctor.id ? '...' : <Trash2 size={16} />}
                              </button>
                            </div>
                          </div>

                          {editingDoctorId === doctor.id && (
                            <form className="hvm-doctor-edit-form" onSubmit={handleDoctorUpdate}>
                              <div className="hvm-doctor-form-group">
                                <label>Name</label>
                                <input name="name" value={doctorFormData.name} onChange={handleDoctorFormChange} required />
                              </div>
                              <div className="hvm-doctor-form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={doctorFormData.email} onChange={handleDoctorFormChange} required />
                              </div>
                              <div className="hvm-doctor-form-group">
                                <label>Phone</label>
                                <input name="phone" value={doctorFormData.phone} onChange={handleDoctorFormChange} />
                              </div>
                              <div className="hvm-doctor-form-group">
                                <label>Department</label>
                                <select name="department_id" value={doctorFormData.department_id} onChange={handleDoctorFormChange}>
                                  <option value="">Select department</option>
                                  {hospitalData.departments.map((department) => (
                                    <option key={department.id} value={department.id}>{department.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="hvm-doctor-form-group">
                                <label>Specialization</label>
                                <input name="specialization" value={doctorFormData.specialization} onChange={handleDoctorFormChange} />
                              </div>
                              <div className="hvm-doctor-form-group">
                                <label>Qualification</label>
                                <input name="qualification" value={doctorFormData.qualification} onChange={handleDoctorFormChange} />
                              </div>
                              <div className="hvm-doctor-form-group">
                                <label>Experience Years</label>
                                <input type="number" min="0" name="experience_years" value={doctorFormData.experience_years} onChange={handleDoctorFormChange} />
                              </div>
                              <div className="hvm-doctor-form-group">
                                <label>Consultation Fee</label>
                                <input type="number" min="0" name="consultation_fee" value={doctorFormData.consultation_fee} onChange={handleDoctorFormChange} />
                              </div>
                              <div className="hvm-doctor-form-group hvm-doctor-form-group-full">
                                <label>License Number</label>
                                <input name="license_number" value={doctorFormData.license_number} onChange={handleDoctorFormChange} />
                              </div>
                              <div className="hvm-doctor-form-group hvm-doctor-form-group-full">
                                <label>Bio</label>
                                <textarea name="bio" value={doctorFormData.bio} onChange={handleDoctorFormChange} rows="3" />
                              </div>
                              <div className="hvm-doctor-form-actions hvm-doctor-form-group-full">
                                <button type="button" className="hvm-doctor-action-btn" onClick={() => setEditingDoctorId(null)}>Cancel</button>
                                <button type="submit" className="hvm-doctor-action-btn" disabled={savingDoctorId === doctor.id}>
                                  {savingDoctorId === doctor.id ? 'Saving...' : 'Save Changes'}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="hvm-no-doctors">No doctors assigned to this department</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Registration Date */}
          {hospitalData.created_at && (
            <div className="hvm-date-section hvm-field">
              <span className="hvm-field-label">Registration Date</span>
              <span className="hvm-field-value">
                {new Date(hospitalData.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="hvm-footer">
            <button type="button" className="hvm-btn-close" onClick={onClose}>Close</button>
          </div>

        </div>
      </div>
    </div>
  );
}

