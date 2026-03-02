import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PageHero from '../components/PageHero/PageHero';
import '../styles/Doctors.css';

const Doctors = () => {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    department_id: '',
    license_number: '',
    qualification: '',
    experience_years: '',
    consultation_fee: '',
    bio: '',
  });

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchDepartments();
  }, [token, user, navigate]);

  const fetchDepartments = async () => {
    try {
      // Get admin's hospital_id first
      const dashResponse = await api.getDashboard('/dashboard/admin', token);
      if (dashResponse.status === 'success' && dashResponse.data?.hospital_id) {
        const deptResponse = await api.getDepartments(dashResponse.data.hospital_id, token);
        if (deptResponse.status === 'success') {
          setDepartments(deptResponse.data?.data || deptResponse.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.createDoctor(formData, token);
      console.log('Doctor creation response:', response); // Debug log
      
      if (response.status === 'success') {
        setFormData({ 
          name: '', 
          email: '', 
          password: '',
          phone: '',
          department_id: '',
          license_number: '',
          qualification: '',
          experience_years: '',
          consultation_fee: '',
          bio: '',
        });
        setShowForm(false);
        setError('');
        // Optionally refresh list or add to doctors list
        alert('Doctor created successfully with ID: ' + response.doctor?.user?.identifier);
      } else {
        // Handle error response - check for various error formats
        const errorMsg = response.message || 
                        response.errors?.email?.[0] || 
                        'Failed to create doctor';
        setError(errorMsg);
        console.error('Doctor creation error:', response); // Debug log
      }
    } catch (err) {
      console.error('Exception during doctor creation:', err); // Debug log
      setError('Error creating doctor: ' + (err.message || err.toString()));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="doctors-page">
      <PageHero 
        title="Manage Doctors" 
        subtitle="Add and manage doctors in your hospital. Assign them to departments."
      />
      <div className="doctors-container">
        <header className="page-header">
          <div>
            <h1>👨‍⚕️ Manage Doctors</h1>
            <p>Add and manage doctors in your hospital</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Back to Dashboard
          </button>
        </header>

      <main className="page-content">
        {error && <div className="error-message">{error}</div>}

        <div className="doctors-header">
          <h2>Doctors</h2>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add Doctor'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateDoctor} className="doctor-form">
            <div className="form-row">
              <div className="form-group">
                <label>Doctor Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="doctor@email.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>License Number</label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  placeholder="Medical license number"
                />
              </div>

              <div className="form-group">
                <label>Department *</label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Qualification</label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="e.g., MD, MBBS"
                />
              </div>

              <div className="form-group">
                <label>Experience (Years)</label>
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Consultation Fee</label>
                <input
                  type="number"
                  name="consultation_fee"
                  value={formData.consultation_fee}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Brief bio or description"
                rows="3"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Add Doctor'}
            </button>
          </form>
        )}

        <div className="info-box">
          <p>
            💡 <strong>Note:</strong> When a doctor is created, they receive a unique identifier (DOC######) 
            which they can use to login along with their email.
          </p>
        </div>
      </main>
      </div>
    </div>
  );
};

export default Doctors;
