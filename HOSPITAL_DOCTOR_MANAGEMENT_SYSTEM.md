# Hospital Doctor Management System (HDAS)

Production-ready Hospital Doctor Appointment System built with Laravel REST API and React.js

## 📋 Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Database Design](#database-design)
- [API Endpoints](#api-endpoints)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Features](#features)

---

## 🎯 Overview

HDAS is a comprehensive hospital management system designed to streamline the appointment booking process, manage doctors' schedules, handle payments, and maintain medical reports. It supports multiple user roles with specific permissions:

- **Super Admin**: System-wide management
- **Admin**: Hospital-specific management
- **Doctor**: Schedule and appointment management
- **Patient**: Appointment booking and medical record access

---

## 🏗️ System Architecture

### Backend (Laravel 11)
- **Authentication**: JWT via Laravel Sanctum
- **Database**: MySQL
- **API Pattern**: RESTful with role-based access control
- **Architecture**: MVC with service layer

### Frontend (React 18)
- **State Management**: Context API
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Styling**: CSS3 with responsive design

---

## 🗄️ Database Design

### Core Tables

#### Users Table
```sql
- id, name, email, password, role
- hospital_id (FK)
- department_id (FK) - for doctors
- phone, avatar, date_of_birth, gender, address
- Doctor specific: license_number, specialization, qualification, experience_years, consultation_fee
- is_active, last_login_at
- timestamps with soft delete
```

#### Hospitals Table
```sql
- id, name, slug, admin_email
- description, email, phone
- address, city, state, country, postal_code
- logo, status
- timestamps with soft delete
```

#### Departments Table
```sql
- id, hospital_id (FK)
- name, slug, description
- head_doctor, total_beds, available_beds
- status (active/inactive)
- timestamps with soft delete
```

#### Appointments Table
```sql
- id, user_id (patient), doctor_id (FK), hospital_id (FK), department_id (FK)
- date, time
- status (pending/confirmed/completed/cancelled)
- payment_status, payment_amount
- reason, notes
- confirmed_at, completed_at, cancelled_at, cancellation_reason
- timestamps
```

#### Doctor Schedules Table
```sql
- id, doctor_id (FK), department_id (FK)
- date, start_time, end_time
- available_slots, booked_slots
- status (available/unavailable/cancelled)
- timestamps with soft delete
```

#### Payments Table
```sql
- id, appointment_id (FK), user_id (FK)
- amount, status (pending/completed/failed/refunded)
- payment_method, transaction_id
- description, paid_at
- timestamps
```

#### Reports Table
```sql
- id, hospital_id (FK), patient_id (FK), doctor_id (FK)
- title, description, file_path
- status (pending/approved/rejected)
- reviewed_by (FK), reviewed_at, notes
- timestamps with soft delete
```

#### Reviews Table
```sql
- id, patient_id (FK), doctor_id (FK), appointment_id (FK)
- rating (1-5), comment
- status (pending/approved/rejected)
- timestamps with soft delete
```

#### Notifications Table
```sql
- id, user_id (FK)
- title, message, type
- related_model, related_id
- is_read, read_at
- timestamps
```

#### Audit Logs Table
```sql
- id, user_id (FK), action, model, model_id
- old_values (JSON), new_values (JSON)
- ip_address, user_agent, description
- timestamps
```

---

## 📡 API Endpoints

### Authentication (Public)
```
POST   /api/register              - Patient registration
POST   /api/login                 - User login (all roles)
```

### Profile (Protected)
```
GET    /api/profile               - Get user profile
PUT    /api/profile               - Update profile
POST   /api/change-password       - Change password
POST   /api/logout                - Logout
```

### Notifications (Protected)
```
GET    /api/notifications         - List notifications
GET    /api/notifications/unread  - Get unread count
PUT    /api/notifications/{id}/read      - Mark as read
PUT    /api/notifications/mark-all-read  - Mark all as read
DELETE /api/notifications/{id}    - Delete notification
```

### Patient Endpoints
```
GET    /api/appointments          - List patient's appointments
POST   /api/appointments          - Book appointment
PUT    /api/appointments/{id}     - Update appointment
DELETE /api/appointments/{id}     - Cancel appointment
GET    /api/appointments-history  - Appointment history

GET    /api/payments              - List payments
POST   /api/payments              - Create payment
POST   /api/payments/{id}/process - Process payment

GET    /api/reviews               - List reviews
POST   /api/reviews               - Write review
PUT    /api/reviews/{id}          - Update review
DELETE /api/reviews/{id}          - Delete review
```

### Doctor Endpoints
```
GET    /api/schedules             - List doctor's schedules
POST   /api/schedules             - Create schedule
PUT    /api/schedules/{id}        - Update schedule
DELETE /api/schedules/{id}        - Delete schedule

GET    /api/appointments          - List doctor's appointments
PUT    /api/appointments/{id}     - Update appointment status

GET    /api/reports               - List doctor's reports
POST   /api/reports               - Create report

GET    /api/reviews               - List reviews received
```

### Admin Endpoints
```
# Hospitals
GET    /api/hospitals             - List hospitals
POST   /api/hospitals             - Create hospital
PUT    /api/hospitals/{id}        - Update hospital
DELETE /api/hospitals/{id}        - Delete hospital

# Departments
GET    /api/departments           - List departments
POST   /api/departments           - Create department
PUT    /api/departments/{id}      - Update department
DELETE /api/departments/{id}      - Delete department

# Doctors Management
GET    /api/doctors               - List doctors
POST   /api/doctors               - Create doctor
PUT    /api/doctors/{id}          - Update doctor
DELETE /api/doctors/{id}          - Delete doctor

# Appointments
GET    /api/appointments          - List all appointments
PUT    /api/appointments/{id}/confirm   - Confirm appointment
PUT    /api/appointments/{id}/complete  - Complete appointment
PUT    /api/appointments/{id}/cancel    - Cancel appointment

# Reports Management
GET    /api/reports               - List reports
PUT    /api/reports/{id}/approve  - Approve report
PUT    /api/reports/{id}/reject   - Reject report

# Reviews Management
GET    /api/reviews               - List reviews
PUT    /api/reviews/{id}/approve  - Approve review
PUT    /api/reviews/{id}/reject   - Reject review

# Payments
GET    /api/payments              - List payments
POST   /api/payments/{id}/refund  - Refund payment
GET    /api/payments-statistics   - Payment statistics

# Users
GET    /api/users                 - List users
PUT    /api/users/{id}            - Update user
```

### Super Admin Endpoints
```
# Admin Management
GET    /api/admins                - List admins
POST   /api/admins                - Create admin
PUT    /api/admins/{id}           - Update admin
DELETE /api/admins/{id}           - Delete admin

# System Management
GET    /api/system/logs           - View system logs
GET    /api/system/settings       - Get system settings
GET    /api/system/users          - View all users
GET    /api/system/hospitals      - View all hospitals
GET    /api/system/departments    - View all departments
```

### Public Endpoints
```
GET    /api/doctors               - List doctors
GET    /api/doctors/{id}          - Doctor details
GET    /api/doctors/{id}/reviews  - Doctor reviews
GET    /api/doctors/{doctorId}/schedules - Doctor schedules
GET    /api/departments           - List departments
GET    /api/hospitals             - List hospitals
```

---

## 🚀 Installation

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 16+
- MySQL 8.0+

### Backend Setup

1. **Clone and setup Laravel**
```bash
cd back
composer install
cp .env.example .env
php artisan key:generate
```

2. **Database Configuration**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hdas
DB_USERNAME=root
DB_PASSWORD=
```

3. **Run Migrations**
```bash
php artisan migrate
php artisan db:seed
```

4. **Generate JWT Secret**
```bash
php artisan jwt:secret
```

5. **Start Server**
```bash
php artisan serve
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd front
npm install
```

2. **Environment Configuration**
```env
REACT_APP_API_URL=http://localhost:8000/api
```

3. **Start Development Server**
```bash
npm run dev
```

---

## ⚙️ Configuration

### Laravel Configuration Files

#### `config/app.php`
```php
'timezone' => 'UTC',
'locale' => 'en',
```

#### `config/auth.php`
```php
'defaults' => [
    'guard' => 'sanctum',
    'passwords' => 'users',
],
```

#### `config/mail.php`
```php
// Configure for sending appointment/payment notifications
```

### React Configuration

#### `src/api/apiService.js`
- API base URL configuration
- Request/response interceptors
- Token management

#### `.env` Variables
```
REACT_APP_API_URL=API endpoint
REACT_APP_APP_NAME=App name
```

---

## 📚 Usage

### Patient Flow
1. **Register** as patient
2. **Browse doctors** and their schedules
3. **Book appointment** with available slots
4. **Make payment** for appointment
5. **View appointment history**
6. **Write reviews** after appointments

### Doctor Flow
1. **Login** to system
2. **Create/manage schedules**
3. **View appointments**
4. **Manage patient reports**
5. **View patient reviews**

### Admin Flow
1. **Manage departments**
2. **Manage doctors**
3. **Confirm/cancel appointments**
4. **Manage hospital information**
5. **View system reports**

### Super Admin Flow
1. **Manage admin accounts**
2. **Monitor system activities**
3. **View audit logs**
4. **System-wide statistics**

---

## ✨ Key Features

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Permission middleware
- Secure password handling

### 2. Appointment Management
- Real-time appointment booking
- Doctor schedule management
- Status tracking
- Automated notifications

### 3. Payment Processing
- Multiple payment methods
- Transaction tracking
- Refund management
- Payment history

### 4. Notification System
- Real-time notifications
- Email notifications (configurable)
- Notification preferences
- Read/unread status

### 5. Report Management
- Medical report uploads
- Status workflow (pending/approved/rejected)
- Report history
- Audit trail

### 6. Review System
- Patient reviews for doctors
- Rating system (1-5 stars)
- Review moderation
- Doctor ratings

### 7. Schedule Management
- Doctor availability slots
- Slot booking limits
- Schedule templates
- Conflict prevention

### 8. System Logging
- Comprehensive audit logs
- User activity tracking
- Data change history
- IP tracking

---

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **CORS**: Cross-origin request protection
- **Input Validation**: Server-side validation
- **Password Hashing**: Bcrypt password encryption
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Token validation
- **Rate Limiting**: Request throttling

---

## 📊 File Structure

### Backend
```
app/
├── Http/Controllers/api/
│   ├── UserController.php
│   ├── AppointmentController.php
│   ├── DoctorController.php
│   ├── DepartmentController.php
│   ├── DoctorScheduleController.php
│   ├── NotificationController.php
│   ├── ReviewController.php
│   ├── PaymentController.php
│   ├── AdminController.php
│   └── ...
├── Models/
│   ├── User.php
│   ├── Appointment.php
│   ├── Doctor.php
│   ├── Department.php
│   ├── DoctorSchedule.php
│   ├── Notification.php
│   ├── Review.php
│   ├── Payment.php
│   ├── Report.php
│   ├── AuditLog.php
│   └── ...
├── Services/
│   ├── NotificationService.php
│   ├── ReportService.php
│   └── ...
├── Http/Middleware/
│   ├── RoleMiddleware.php
│   └── ...
└── Mail/
    └── ...

database/
├── migrations/
└── seeders/
```

### Frontend
```
src/
├── api/
│   └── apiService.js
├── components/
│   ├── Auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Auth.css
│   ├── Common/
│   │   ├── Navigation.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── Dashboard.css
│   ├── Patient/
│   │   └── PatientDashboard.jsx
│   ├── Doctor/
│   │   └── DoctorDashboard.jsx
│   ├── Admin/
│   │   └── AdminDashboard.jsx
│   └── SuperAdmin/
│       └── SuperAdminDashboard.jsx
├── context/
│   └── AuthContext.jsx
├── hooks/
│   ├── useAuth.js
│   └── useFetch.js
├── pages/
└── utils/
```

---

## 🧪 Testing

### Backend Testing
```bash
php artisan test
```

### Frontend Testing
```bash
npm test
```

---

## 📦 Deployment

### Backend (Laravel)
1. Set production environment in `.env`
2. Run migrations: `php artisan migrate --force`
3. Cache configuration: `php artisan config:cache`
4. Generate API documentation
5. Set up automated backups

### Frontend (React)
1. Build production bundle: `npm run build`
2. Deploy to CDN or web server
3. Configure API endpoint for production
4. Set up caching headers

---

## 📞 Support & Documentation

- API Documentation: `/docs/api`
- Database Schema: `/docs/database`
- User Guides: `/docs/guides`

---

## 📝 License

This project is proprietary and confidential.

---

## 👥 Team

Built with ❤️ for healthcare management.

---

## 📌 Version

Current Version: **1.0.0**
Last Updated: **December 25, 2025**

---

## 🔄 Recent Updates

### Version 1.0.0 (Initial Release)
- Complete appointment booking system
- Payment processing
- Doctor schedule management
- Patient reviews and ratings
- Notification system
- Comprehensive audit logging
- Role-based access control
- Multi-hospital support

---

## 🎓 Getting Started

1. Read the installation guide above
2. Set up database and environment
3. Run the backend server
4. Start the frontend development server
5. Access the application at `http://localhost:3000`

---

**For more information and detailed documentation, please refer to the project guides in the `/docs` directory.**
