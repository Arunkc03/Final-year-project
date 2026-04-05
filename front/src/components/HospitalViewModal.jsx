import { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, Building2, User, BadgeAlert, Stethoscope, Trash2 } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import hospitalImage from '../assets/images/hospital.jpg';
import '../styles/HospitalViewModal.css';

export function HospitalViewModal({ hospital, onClose }) {
  const { token } = useContext(AuthContext);
  const [adminData, setAdminData] = useState(null);
  const [deletingDoctorId, setDeletingDoctorId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDeleteDoctor = async (doctor) => {
    if (!window.confirm(`Delete Dr. ${doctor.name}? This will remove their account from the system and they won't be able to login. This action cannot be undone.`)) {
      return;
    }

    setDeletingDoctorId(doctor.id);
    try {
      const res = await api.deleteDoctor(doctor.id, token);
      if (res?.status === 'success') {
        alert('Doctor deleted successfully');
        // Refresh hospital data
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(res?.message || 'Failed to delete doctor');
      }
    } catch (err) {
      console.error('Error deleting doctor:', err);
      alert('Error deleting doctor. Please try again.');
    } finally {
      setDeletingDoctorId(null);
    }
  };

  useEffect(() => {
    api.getHospital(hospital.id).then((res) => {
      if (res?.admin) setAdminData(res.admin);
    }).catch(() => {});
  }, [hospital.id, refreshTrigger]);

  const imgSrc = hospital.image
    ? `${api.getStorageUrl()}/${hospital.image}`
    : hospitalImage;

  return (
    <div className="hvm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hvm-modal">

        {/* Header */}
        <div className="hvm-header">
          <h2>Hospital Details</h2>
          <button className="hvm-close-btn" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="hvm-body">

          {/* Hospital Image */}
          <div className="hvm-image-wrap">
            <img
              src={imgSrc}
              alt={hospital.name}
              onError={(e) => { e.target.src = hospitalImage; }}
            />
          </div>

          {/* Info Grid */}
          <div className="hvm-info-grid">
            <div className="hvm-field full-width">
              <span className="hvm-field-label">
                <Building2 /> Hospital Name
              </span>
              <span className="hvm-field-value large">{hospital.name}</span>
            </div>

            <div className="hvm-field">
              <span className="hvm-field-label">
                <Mail /> Email
              </span>
              <span className="hvm-field-value">{hospital.email || 'N/A'}</span>
            </div>

            <div className="hvm-field">
              <span className="hvm-field-label">
                <Phone /> Phone
              </span>
              <span className="hvm-field-value">{hospital.phone || 'N/A'}</span>
            </div>

            <div className="hvm-field full-width">
              <span className="hvm-field-label">
                <MapPin /> Address
              </span>
              <span className="hvm-field-value">
                {[hospital.address, hospital.city, hospital.state, hospital.country]
                  .filter(Boolean).join(', ') || 'N/A'}
              </span>
            </div>

            {hospital.description && (
              <div className="hvm-field full-width">
                <span className="hvm-field-label">Description</span>
                <span className="hvm-field-value">{hospital.description}</span>
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
          {hospital.departments && hospital.departments.length > 0 && (
            <div>
              <div className="hvm-dept-title">
                <Stethoscope /> Departments &amp; Doctors
              </div>
              {hospital.departments.map((dept) => (
                <div key={dept.id} className="hvm-dept-card">
                  <div className="hvm-dept-card-header">
                    <span className="hvm-dept-card-name">{dept.name}</span>
                    <span className="hvm-dept-badge">Active</span>
                  </div>

                  {(dept.beds || dept.head) && (
                    <div className="hvm-dept-meta">
                      {dept.beds && <span className="hvm-dept-meta-item">🛏️ {dept.beds} beds</span>}
                      {dept.head && <span className="hvm-dept-meta-item">👨‍⚕️ Head: {dept.head}</span>}
                    </div>
                  )}

                  {dept.doctors && dept.doctors.length > 0 ? (
                    <div>
                      <div className="hvm-doctor-label">Doctors ({dept.doctors.length})</div>
                      {dept.doctors.map((doctor) => (
                        <div key={doctor.id} className="hvm-doctor-card">
                          <div className="hvm-doctor-info">
                            <div className="hvm-doctor-avatar"><Stethoscope /></div>
                            <div>
                              <div className="hvm-doctor-name">{doctor.name}</div>
                              <div className="hvm-doctor-qual">{doctor.qualification || 'Doctor'}</div>
                              {doctor.consultation_fee && (
                                <div className="hvm-doctor-fee">Rs. {doctor.consultation_fee}</div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteDoctor(doctor)}
                            disabled={deletingDoctorId === doctor.id}
                            className="hvm-doctor-delete-btn"
                            title="Delete doctor"
                          >
                            {deletingDoctorId === doctor.id ? '⏳' : <Trash2 size={16} />}
                          </button>
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
          {hospital.created_at && (
            <div className="hvm-date-section hvm-field">
              <span className="hvm-field-label">Registration Date</span>
              <span className="hvm-field-value">
                {new Date(hospital.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="hvm-footer">
            <button className="hvm-btn-close" onClick={onClose}>Close</button>
          </div>

        </div>
      </div>
    </div>
  );
}

