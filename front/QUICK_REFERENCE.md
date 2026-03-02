# QUICK REFERENCE - Patient Dashboard

## 🎯 Quick Access

### Patient Dashboard URL
```
http://localhost:5173/dashboard/patient
```

### How to Access (3 Ways)

**Way 1: Direct URL**
- Navigate to: `http://localhost:5173/dashboard/patient`

**Way 2: From Home Page**
1. Login at `/login`
2. Click blue "📊 Go to Dashboard" button

**Way 3: From Navigation Bar**
1. Login at `/login`
2. Click "My Dashboard" in top navigation

---

## 📁 File Locations

| File | Path | Updated |
|------|------|---------|
| App Routes | `src/App.jsx` | ✅ Configured |
| Patient Dashboard | `src/pages/PatientDashboard.jsx` | ✅ Working |
| Home Page | `src/pages/Home.jsx` | ✅ Link Added |
| Navigation | `src/components/Common/Navigation.jsx` | ✅ Links Added |
| Auth Context | `src/context/AuthContext.jsx` | ✅ Configured |
| API Service | `src/services/api.js` | ✅ getDashboard() |

---

## 🎨 Color Theme

| Purpose | Color | Hex Code |
|---------|-------|----------|
| Primary Gradient Start | Dark Blue | `#001f3f` |
| Primary Gradient End | Medium Blue | `#003d82` |
| Text | Dark Gray | `#333` |
| Secondary Text | Medium Gray | `#666` |

---

## 🔗 All Routes

### Public Routes
- `/` - Home Page
- `/login` - Login
- `/register` - Register Patient
- `/hospitals` - Browse Hospitals
- `/hospitals/:id` - Hospital Details
- `/doctors` - Browse Doctors
- `/doctors/:id` - Doctor Details

### Patient Routes
- `/dashboard` - Dashboard Gateway (redirects to patient)
- `/dashboard/patient` - **Patient Dashboard** ✅
- `/my-reports` - Medical Reports
- `/profile` - Patient Profile
- `/notifications` - Notifications

### Other Role Routes
- `/dashboard/doctor` - Doctor Dashboard
- `/dashboard/admin` - Admin Dashboard
- `/dashboard/super-admin` - Super Admin Dashboard

---

## 📡 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/login` | Patient Login |
| GET | `/api/dashboard/patient` | Dashboard Data |
| GET | `/api/appointments` | Patient Appointments |
| POST | `/api/appointments` | Book Appointment |
| GET | `/api/reports` | Medical Reports |
| GET | `/api/profile` | Patient Profile |
| PUT | `/api/profile` | Update Profile |

---

## ✅ Verification Checklist

- [x] PatientDashboard component exists
- [x] Route `/dashboard/patient` configured
- [x] Home page has dashboard button
- [x] Navigation bar has dashboard link
- [x] AuthContext provides user role
- [x] API service has getDashboard method
- [x] Blue & Black theme applied
- [x] Mobile responsive
- [x] Protected routes working
- [x] Login/Logout flow complete

---

## 🚀 To Run the Project

### Terminal 1: Backend
```bash
cd c:\back\back
php artisan serve
```
Runs on: `http://127.0.0.1:8000`

### Terminal 2: Frontend
```bash
cd c:\back\front
npm run dev
```
Runs on: `http://localhost:5173`

---

## 🧪 Test Patient Dashboard

### 1. Register New Patient
```
URL: http://localhost:5173/register
Fill form with:
- Name: John Doe
- Email: john@example.com
- Password: password123
- DOB: 01/01/1990
- Blood Type: O+
Click: Register
```

### 2. Login
```
URL: http://localhost:5173/login
Enter:
- Email: john@example.com
- Password: password123
Click: Login
```

### 3. Access Dashboard (Choose One)
```
Option A: Click "📊 Go to Dashboard" button
Option B: Click "My Dashboard" in navigation
Option C: Visit directly: /dashboard/patient
```

### 4. Explore Dashboard
- View personal information
- Check appointment statistics
- Browse available doctors
- Browse hospitals
- View medical records
- Book appointments

---

## 📱 Responsive Design

✅ Works on:
- Desktop (1920x1080, 1366x768)
- Tablet (768x1024)
- Mobile (375x667, 414x896)

✅ Mobile Features:
- Hamburger menu in navbar
- Touch-friendly buttons
- Responsive grid layout
- Full-width content

---

## 🔐 Authentication

### Login Credentials Format
```json
{
  "email": "patient@example.com",
  "password": "password123"
}
```

### Token Storage
- Stored in: `localStorage`
- Key: `authToken` or `token`
- Sent in: `Authorization: Bearer TOKEN` header

### Auto-Logout Triggers
- Invalid token
- 401 error from API
- Manual logout button
- Session timeout

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Dashboard link not showing | Login as patient |
| 404 error on `/dashboard/patient` | Check routes in App.jsx |
| API call failing | Verify backend is running |
| Token not persisting | Check localStorage settings |
| Navigation links missing | Refresh after login |
| Blue theme not showing | Clear cache (Ctrl+Shift+Del) |

---

## 📚 Related Documentation

1. **PATIENT_DASHBOARD_LINKS_GUIDE.md** - Comprehensive navigation guide
2. **PATIENT_DASHBOARD_PATH_GUIDE.md** - Complete path structure
3. **NAVIGATION_FLOW_DIAGRAM.md** - Visual flow diagrams
4. **COLOR_THEME_CHANGE_SUMMARY.md** - Theme documentation
5. **PATIENT_DASHBOARD_COMPLETE.md** - Full implementation details

---

## 👥 User Roles

| Role | Access | Default Route |
|------|--------|---------------|
| Patient | `/dashboard/patient` | Patient Dashboard |
| Doctor | `/dashboard/doctor` | Doctor Dashboard |
| Admin | `/dashboard/admin` | Admin Dashboard |
| Super Admin | `/dashboard/super-admin` | Super Admin Dashboard |

---

## ⚙️ Configuration

### Frontend Config
- Framework: React 18
- Router: React Router v6
- State: Context API
- HTTP: Axios
- Styling: CSS3
- Build: Vite

### Backend Config
- Framework: Laravel 11
- Database: MySQL
- Auth: JWT (Sanctum)
- API: RESTful
- PHP: 8.2+

---

## 📞 Support

### For Issues:
1. Check browser console for errors
2. Verify backend is running
3. Check network tab in DevTools
4. Clear cache and reload
5. Check authentication token

### Common Errors:
- **401 Unauthorized** - Invalid/expired token
- **404 Not Found** - Route doesn't exist
- **500 Server Error** - Backend error
- **Network Error** - Backend not running
- **CORS Error** - Cross-origin issue

---

## 📊 Stats Dashboard Content

Patient dashboard displays:

### Personal Stats
- Total Appointments
- Completed Appointments
- Pending Appointments
- Medical Records Count

### Personal Information
- Patient ID
- Full Name
- Email
- Phone
- Date of Birth
- Blood Group

### Appointments
- List of upcoming appointments
- Appointment history
- Doctor information
- Hospital location
- Appointment status
- Action buttons (reschedule, cancel)

### Medical Records
- Medical reports list
- Report dates
- Download options
- Doctor information
- Report status

---

## ✨ Features

✅ **Dashboard**
- Personal information display
- Statistics cards
- Appointment management
- Medical records access

✅ **Navigation**
- Role-based links
- Responsive navbar
- User menu dropdown
- Quick access buttons

✅ **Authentication**
- Secure login
- Token management
- Auto-redirect
- Session handling

✅ **Responsive Design**
- Mobile-friendly
- Tablet-optimized
- Desktop-compatible
- Touch-friendly UI

---

**Last Updated:** December 25, 2025
**Status:** ✅ Complete & Ready
**Theme:** Blue & Black
**Version:** 1.0.0
