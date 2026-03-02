# SuperAdmin Hospital & Admin Creation Guide

## Overview
Super Admins can create hospitals and automatically assign admin users via the Hospital Management page.

---

## 1. Home Page - Browse Doctors & Hospitals

The updated Home page now includes browse links visible to all users:

```jsx
<section className="browse-section">
  <h2>Browse Our Network</h2>
  <div className="browse-buttons">
    <button onClick={() => navigate('/hospitals')} className="btn-secondary">
      🏥 View All Hospitals
    </button>
    <button onClick={() => navigate('/doctors')} className="btn-secondary">
      👨‍⚕️ View All Doctors
    </button>
  </div>
</section>
```

**Location:** `front/src/pages/Home.jsx`

---

## 2. SuperAdmin Dashboard

The dashboard provides quick access to hospital management:

```jsx
<button onClick={() => navigate('/hospitals')} className="action-card primary">
  <span className="action-icon">➕</span>
  <span className="action-text">Create Hospital</span>
  <span className="action-desc">Add new hospital & admin</span>
</button>
```

**Location:** `front/src/pages/SuperAdminDashboard.jsx`

---

## 3. Hospital Creation Form (SuperAdmin Page)

Super Admins access `http://localhost:5173/hospitals` (after login as super_admin) and see:

### Hospital Details Section
```jsx
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

  <div className="form-group">
    <label>Address</label>
    <input
      type="text"
      value={formData.address}
      onChange={(e) => setFormData({...formData, address: e.target.value})}
      placeholder="Hospital address"
    />
  </div>
```

### Admin Account Creation Section
```jsx
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
```

**Location:** `front/src/pages/Hospitals.jsx`

---

## 4. Backend API - Hospital Creation

### Endpoint
```
POST /api/hospitals
```

### Required Authentication
```
Authorization: Bearer {token}
Role: super_admin
```

### Request Body
```json
{
  "name": "City General Hospital",
  "email": "hospital@citygen.com",
  "address": "123 Main St, City, State",
  "admin_name": "John Doe",
  "admin_email": "admin@citygen.com",
  "admin_password": "SecurePassword123"
}
```

### Response (Success)
```json
{
  "status": "success",
  "hospital": {
    "id": 1,
    "name": "City General Hospital",
    "email": "hospital@citygen.com",
    "address": "123 Main St, City, State",
    "status": "active"
  },
  "admin": {
    "id": 5,
    "name": "John Doe",
    "email": "admin@citygen.com",
    "role": "admin",
    "hospital_id": 1,
    "identifier": "ADM1A2B3C"
  }
}
```

**Location:** `back/app/Http/Controllers/api/HospitalController.php`

---

## 5. User Flow - Step by Step

### For SuperAdmin:
1. Login to dashboard with super_admin credentials
2. Click "Create Hospital" button
3. Fill in hospital details (name, email, address)
4. Fill in admin credentials (name, email, password)
5. Submit form
6. Hospital is created with admin account automatically
7. Admin can now login with their email/password and manage doctors

### For Admin (Hospital Administrator):
1. Login with email/password provided by SuperAdmin
2. Access admin dashboard
3. Add doctors to their hospital
4. Manage hospital operations
5. Review appointment bookings

### For Patients:
1. Register as patient (self-registration)
2. Home page shows available hospitals and doctors
3. Click on doctor → view doctor details
4. Click on hospital → view hospital details and book appointment
5. Fill in appointment date and submit
6. Receive confirmation email

### For Doctors:
1. Doctor identifier and password provided by admin
2. Login using identifier or email
3. Access doctor dashboard
4. View patient reports
5. Submit/review medical reports

---

## 6. Key Files Summary

| File | Purpose |
|------|---------|
| `front/src/pages/Home.jsx` | Updated with browse links |
| `front/src/pages/SuperAdminDashboard.jsx` | Dashboard with hospital creation link |
| `front/src/pages/Hospitals.jsx` | Full hospital + admin creation form |
| `back/app/Http/Controllers/api/HospitalController.php` | Backend hospital creation API |
| `back/routes/api.php` | API routes for hospital endpoints |

---

## 7. Testing Checklist

- [ ] SuperAdmin can login
- [ ] SuperAdmin sees "Create Hospital" button on dashboard
- [ ] Hospital creation form accepts all fields
- [ ] Backend creates hospital and admin user in transaction
- [ ] Admin receives automatic identifier (ADM######)
- [ ] Admin can login with provided credentials
- [ ] Patients can view created hospitals on home page
- [ ] Patients can view doctors linked to hospitals
- [ ] Appointment booking works for patients

---

## 8. Notes

- Hospital and admin creation happens in a single database transaction for data integrity
- Admin gets a unique identifier (ADM######) for identifier-based login
- Email validation prevents duplicate hospital/admin emails
- All passwords are hashed using bcrypt
- SuperAdmin is the only role that can create hospitals

