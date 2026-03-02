import React, { useState } from 'react';
import '../styles/HospitalSystem.css';
import './HospitalDoctors.css';

const HospitalDoctors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [doctors, setDoctors] = useState([
    { id: 1, name: 'Dr. Sarah Johnson', specialization: 'Cardiology', availability: 'Available' },
    { id: 2, name: 'Dr. Michael Chen', specialization: 'Neurology', availability: 'Available' },
    { id: 3, name: 'Dr. Emily Watson', specialization: 'Pediatrics', availability: 'On Leave' },
    { id: 4, name: 'Dr. James Brown', specialization: 'Orthopedics', availability: 'Available' },
    { id: 5, name: 'Dr. Lisa Anderson', specialization: 'Dermatology', availability: 'Available' },
  ]);

  const filteredDoctors = doctors.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDoctor = (e) => {
    e.preventDefault();
    // Add doctor logic here
    setShowAddForm(false);
  };

  return (
    <div className="doctors-page">
      <div className="page-header">
        <h1>Doctors Management</h1>
      </div>

      <div className="doctors-toolbar">
        <input
          type="text"
          placeholder="Search doctors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add Doctor'}
        </button>
      </div>

      {showAddForm && (
        <div className="card add-doctor-form">
          <h2>Add New Doctor</h2>
          <form onSubmit={handleAddDoctor}>
            <div className="form-group-inline">
              <div className="form-group">
                <label>Doctor Name</label>
                <input type="text" placeholder="Enter doctor name" />
              </div>
              <div className="form-group">
                <label>Specialization</label>
                <input type="text" placeholder="Enter specialization" />
              </div>
            </div>
            <div className="form-group-inline">
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="Enter email" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" placeholder="Enter phone number" />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Add Doctor</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card doctors-table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Doctor Name</th>
              <th>Specialization</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.map(doctor => (
              <tr key={doctor.id}>
                <td className="doctor-name">{doctor.name}</td>
                <td>{doctor.specialization}</td>
                <td>
                  <span className={`badge ${doctor.availability === 'Available' ? 'badge-confirmed' : 'badge-pending'}`}>
                    {doctor.availability}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-secondary btn-sm">Edit</button>
                    <button className="btn btn-secondary btn-sm delete">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HospitalDoctors;
