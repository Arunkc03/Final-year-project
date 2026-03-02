# Patient Dashboard - Navigation Flow Diagram

## 🌍 Complete Application Navigation Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOSPITAL MANAGEMENT SYSTEM                    │
│                    http://localhost:5173                         │
└─────────────────────────────────────────────────────────────────┘

UNAUTHENTICATED USERS
═════════════════════════════════════════════════════════════════

                              HOME PAGE (/)
                                  │
                  ┌───────────────┼───────────────┐
                  ▼               ▼               ▼
            [LOGIN]         [REGISTER]      [BROWSE PAGES]
              /login         /register      /hospitals
                │               │           /doctors
                │               │               │
                │           ┌───┴───┐          │
                │           ▼       ▼          │
                │      [Patient    [Admin      │
                │       Account]   Account]    │
                │           │       │          │
                └───────────┼───────┼──────────┘
                            │       │
                    ┌───────┘       └───────┐
                    ▼                       ▼
              PATIENT LOGIN             ADMIN LOGIN
              (proceeds below)          (redirects to admin dashboard)


AUTHENTICATED PATIENT USER
═════════════════════════════════════════════════════════════════

                          NAVIGATION BAR
        ┌──────────────────────────────────────────────────┐
        │  HDAS  │  Dashboard  │  My Dashboard  │  Profile │
        └──────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    [DASHBOARD]    [MY DASHBOARD]      [PROFILE]
       /dashboard  /dashboard/patient    /profile
          │              │
          │    (Auto-    ▼
          └────redirect)  PATIENT DASHBOARD ✅
                         /dashboard/patient
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              [PERSONAL]  [APPOINTMENTS]  [MEDICAL]
              [INFO]      [HISTORY]       [RECORDS]


HOME PAGE (/) - WHEN LOGGED IN AS PATIENT
═════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────┐
│         Welcome to Hospital Management System           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Welcome, [Patient Name]!                        │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │ 📊 GO TO DASHBOARD  (→ /dashboard/patient)  │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Available Doctors                                      │
│  ├─ Dr. Name 1  [VIEW]  → /doctors/1                  │
│  ├─ Dr. Name 2  [VIEW]  → /doctors/2                  │
│  └─ Dr. Name 3  [VIEW]  → /doctors/3                  │
│                                                         │
│  Available Hospitals                                    │
│  ├─ Hospital A  [VIEW & BOOK]  → /hospitals/1         │
│  ├─ Hospital B  [VIEW & BOOK]  → /hospitals/2         │
│  └─ Hospital C  [VIEW & BOOK]  → /hospitals/3         │
└─────────────────────────────────────────────────────────┘


PATIENT DASHBOARD (/dashboard/patient) - FULL LAYOUT
═════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────┐
│  Header                                                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 👤 Patient Dashboard                    [LOGOUT]       │  │
│  │ Manage your medical records and appointments           │  │
│  │ User: John Doe                                         │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ Main Content                                                 │
│                                                              │
│ ┌── PATIENT INFORMATION ────────────────────────────────────┐ │
│ │ Patient ID: P12345  │ Name: John Doe  │ Email: john@...  │ │
│ │ Phone: +1234567890  │ DOB: 01/01/1990 │ Blood: O+        │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌── STATISTICS ──────────────────────────────────────────────┐│
│ │ ┌──────────────────┐ ┌──────────────────┐                  ││
│ │ │ Total Appts: 5   │ │ Completed: 3     │                  ││
│ │ └──────────────────┘ └──────────────────┘                  ││
│ │ ┌──────────────────┐ ┌──────────────────┐                  ││
│ │ │ Pending: 2       │ │ Medical Records:4│                  ││
│ │ └──────────────────┘ └──────────────────┘                  ││
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌── MY APPOINTMENTS ────────────────────────────────────────┐ │
│ │ Upcoming Appointments:                                   │ │
│ │ ├─ Dr. Smith - Hospital A - 2025-01-15 10:00 AM        │ │
│ │ ├─ Dr. Jones - Hospital B - 2025-01-20 02:00 PM        │ │
│ │ └─ [BOOK NEW]  [HISTORY]  [RESCHEDULE]  [CANCEL]       │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌── MEDICAL RECORDS ────────────────────────────────────────┐ │
│ │ ├─ Report from Dr. Smith (2025-01-10) [VIEW] [DL]       │ │
│ │ ├─ Report from Dr. Jones (2025-01-05) [VIEW] [DL]       │ │
│ │ ├─ Prescription from Dr. Smith [VIEW]                   │ │
│ │ └─ [VIEW ALL REPORTS]  [DOWNLOAD ZIP]                   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌── QUICK ACTIONS ──────────────────────────────────────────┐ │
│ │ [BOOK APPOINTMENT] [VIEW DOCTORS] [VIEW HOSPITALS]       │ │
│ │ [CONTACT SUPPORT]  [VIEW REPORTS] [DOWNLOAD RECORDS]     │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘


ALL PATIENT ROUTES
═════════════════════════════════════════════════════════════════

Route Path              Component              Access
─────────────────────────────────────────────────────────────
/                       Home.jsx               Public/Patient
/login                  login.jsx              Public
/register               register.jsx           Public
/dashboard              Dashboard.jsx          Patient (redirects)
/dashboard/patient      PatientDashboard.jsx   Patient ✅
/hospitals              Hospitals.jsx          Public
/hospitals/:id          HospitalDetail.jsx     Public
/doctors                Doctors.jsx            Public
/doctors/:id            DoctorDetail.jsx       Public
/my-reports             Reports.jsx            Patient
/reports                Reports.jsx            Doctor/Admin
/profile                (From navbar)          Patient
/notifications          (From navbar)          Patient


LINK STRUCTURE
═════════════════════════════════════════════════════════════════

Home Page Links (When Patient Logged In):
├─ 📊 Dashboard Button → /dashboard/patient ✅
├─ Browse Hospitals → /hospitals
├─ Browse Doctors → /doctors
└─ Hospital Details → /hospitals/:id

Navigation Bar Links (Patient):
├─ HDAS Logo → /
├─ Dashboard → /dashboard (→ /dashboard/patient)
├─ My Dashboard → /dashboard/patient ✅
├─ Profile (dropdown) → /profile
├─ Notifications (dropdown) → /notifications
└─ Logout

Dropdown Menu Links:
├─ Profile → /profile
├─ Notifications → /notifications
└─ Logout → / (clears session)


API FLOW
═════════════════════════════════════════════════════════════════

Patient Login Request:
  POST /api/login
  ├─ Request: { email, password }
  └─ Response: { token, user: { id, name, email, role, ... } }

Get Patient Dashboard Data:
  GET /api/dashboard/patient
  ├─ Headers: { Authorization: "Bearer TOKEN" }
  └─ Response: { stats: {...}, appointments: [...], ... }

Get Patient Appointments:
  GET /api/appointments
  ├─ Headers: { Authorization: "Bearer TOKEN" }
  └─ Response: [ { id, date, doctor, hospital, status }, ... ]

Book New Appointment:
  POST /api/appointments
  ├─ Headers: { Authorization: "Bearer TOKEN" }
  ├─ Body: { hospital_id, doctor_id, date, time, reason }
  └─ Response: { status: "success", appointment: {...} }


COLOR THEME
═════════════════════════════════════════════════════════════════

Primary: #001f3f (Dark Blue) - Used for:
├─ Main backgrounds
├─ Primary buttons
├─ Navigation headers
└─ Dashboard borders

Secondary: #003d82 (Medium Blue) - Used for:
├─ Button hover states
├─ Accent borders
├─ Secondary elements
└─ Gradient right side

Text: #333 (Dark Gray) - Main text color
Accents: #666 (Medium Gray) - Secondary text color


STATE MANAGEMENT
═════════════════════════════════════════════════════════════════

AuthContext Provides:
├─ user: {
│   ├─ id
│   ├─ name
│   ├─ email
│   ├─ role: "patient"
│   ├─ identifier
│   └─ ...
├─ token: "JWT_TOKEN_STRING"
├─ isAuthenticated: true/false
├─ dashboardRoute: "/dashboard/patient"
└─ logout: () => function

useAuth Hook:
├─ Returns AuthContext
├─ Provides clean access to user/token
└─ Used in all authenticated pages


COMPLETE PATIENT JOURNEY
═════════════════════════════════════════════════════════════════

Step 1: Discovery
  └─ User visits http://localhost:5173/
     └─ Sees home page with "Register as Patient" button

Step 2: Registration
  └─ Click "Register as Patient"
     └─ Fill form: name, email, password, DOB, blood type
        └─ Submit → Patient account created
           └─ Redirect to login page

Step 3: Login
  └─ Click "Login"
     └─ Enter email and password
        └─ Submit
           └─ Backend validates and returns JWT token
              └─ Frontend stores token, updates context
                 └─ Auto-redirect to home page (patient view)

Step 4: Access Dashboard
  └─ Option A: Click "📊 Go to Dashboard" button on home
     └─ Option B: Click "My Dashboard" in navigation bar
        └─ Either way → /dashboard/patient ✅
           └─ Dashboard loads patient data from API
              └─ Display personal info, appointments, records

Step 5: Dashboard Actions
  └─ Patient can:
     ├─ View personal information
     ├─ View appointment history
     ├─ Book new appointments
     ├─ Cancel/reschedule appointments
     ├─ View medical records
     ├─ Download reports
     ├─ Browse doctors
     ├─ Browse hospitals
     └─ Logout

Step 6: Logout
  └─ Click "Logout" in navigation or dashboard
     └─ Backend clears session
        └─ Frontend clears token from localStorage
           └─ Context resets
              └─ Redirect to login page


═════════════════════════════════════════════════════════════════

✅ COMPLETE - All Patient Dashboard paths and links configured!

Status: READY FOR USE
Date: December 25, 2025
Theme: Blue & Black (#001f3f to #003d82)

═════════════════════════════════════════════════════════════════
