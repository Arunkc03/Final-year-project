<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\api\UserController;
use App\Http\Controllers\api\DashboardController;
use App\Http\Controllers\api\AppointmentController;
use App\Http\Controllers\api\DoctorController;
use App\Http\Controllers\api\HospitalController;
use App\Http\Controllers\api\ReportController;
use App\Http\Controllers\api\DepartmentController;
use App\Http\Controllers\api\DoctorScheduleController;
use App\Http\Controllers\api\NotificationController;
use App\Http\Controllers\api\ReviewController;
use App\Http\Controllers\api\PaymentController;
use App\Http\Controllers\api\KhaltiPaymentController;
use App\Http\Controllers\api\AdminController;
use App\Http\Controllers\api\GoogleAuthController;
use App\Http\Controllers\api\AIController;

/**
 * ========== PUBLIC ROUTES ==========
 * Accessible without authentication
 */

// Authentication
Route::post('/register', [UserController::class, 'registerPatient'])->name('register');
Route::post('/login', [UserController::class, 'login'])->name('login');
Route::post('/forgot-password', [UserController::class, 'forgotPassword'])->name('password.email');
Route::post('/reset-password', [UserController::class, 'resetPassword'])->name('password.reset');

// Google OAuth routes
Route::get('/auth/google', [GoogleAuthController::class, 'redirectToGoogle'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');
Route::post('/auth/google/token', [GoogleAuthController::class, 'handleGoogleToken'])->name('auth.google.token');

// Public hospital listings
Route::get('/hospitals', [HospitalController::class, 'publicIndex'])->name('hospitals.public');
Route::get('/public/hospital/{id}', [HospitalController::class, 'publicShow'])->name('hospitals.public.view');
Route::get('/hospitals/{id}', [HospitalController::class, 'publicShow'])->name('hospitals.public.show');

// Explicit public endpoints to avoid middleware/parameter collisions
Route::get('/public/hospitals', [HospitalController::class, 'publicIndex'])->name('hospitals.public.list');
Route::get('/public/doctors', [DoctorController::class, 'index'])->name('doctors.public.list');
Route::get('/public/doctors/{id}', [DoctorController::class, 'show'])->name('doctors.public.show');
Route::get('/public/departments', [DepartmentController::class, 'index'])->name('departments.public.list');
Route::get('/public/departments/{id}', [DepartmentController::class, 'show'])->name('departments.public.show');

// Patient-facing available lists (static paths to avoid parameter collision)
Route::get('/hospitals/available', [HospitalController::class, 'publicIndex'])->name('hospitals.available');
Route::get('/doctors/available', [DoctorController::class, 'index'])->name('doctors.available');

// Public doctor listings
Route::get('/doctors', [DoctorController::class, 'index'])->name('doctors.index');
Route::get('/doctors/{id}', [DoctorController::class, 'show'])->name('doctors.show');

// Public doctor reviews
Route::get('/doctors/{id}/reviews', [ReviewController::class, 'doctorReviews'])->name('doctors.reviews');

// Public departments listing
Route::get('/departments', [DepartmentController::class, 'index'])->name('departments.index');
Route::get('/departments/{id}', [DepartmentController::class, 'show'])->name('departments.show');

// Public doctor schedules
Route::get('/doctors/{doctorId}/schedules', [DoctorScheduleController::class, 'doctorSchedules'])->name('schedules.doctor');

// ========== KHALTI PAYMENT GATEWAY (Public) ==========
// These need to be public for callback from Khalti
Route::prefix('/khalti')->name('khalti.')->group(function () {
    Route::get('/config', [KhaltiPaymentController::class, 'getConfig'])->name('config');
    Route::get('/verify', [KhaltiPaymentController::class, 'verifyPayment'])->name('verify');
    Route::post('/webhook', [KhaltiPaymentController::class, 'handleWebhook'])->name('webhook');
});

/**
 * ========== PROTECTED ROUTES ==========
 * Require authentication
 */

Route::middleware('auth:sanctum')->group(function () {

    // ========== USER PROFILE ==========
    Route::get('/profile', [UserController::class, 'profile'])->name('profile');
    Route::put('/profile', [UserController::class, 'updateProfile'])->name('profile.update');
    Route::post('/profile/update', [UserController::class, 'updateProfile'])->name('profile.update.post');
    Route::post('/logout', [UserController::class, 'logout'])->name('logout');
    Route::post('/change-password', [UserController::class, 'changePassword'])->name('password.change');
    Route::post('/set-password', [UserController::class, 'setPassword'])->name('password.set');

    // ========== REPORTS (All authenticated users) ==========
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.all');
    Route::get('/reports/{id}', [ReportController::class, 'show'])->name('reports.show.all');
    Route::delete('/reports/{id}', [ReportController::class, 'destroy'])->name('reports.destroy');

    // ========== REVIEWS (All authenticated users; authorization in controller) ==========
    Route::prefix('/reviews')->name('reviews.')->group(function () {
        Route::get('/', [ReviewController::class, 'index'])->name('index');
        Route::post('/', [ReviewController::class, 'store'])->name('store');
        Route::put('/{id}', [ReviewController::class, 'update'])->name('update');
        Route::delete('/{id}', [ReviewController::class, 'destroy'])->name('destroy');
    });

    // ========== NOTIFICATIONS ==========
    Route::prefix('/notifications')->name('notifications.')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::get('/unread', [NotificationController::class, 'unread'])->name('unread');
        Route::get('/{id}', [NotificationController::class, 'show'])->name('show');
        Route::put('/{id}/read', [NotificationController::class, 'markAsRead'])->name('mark-read');
        Route::put('/{id}/unread', [NotificationController::class, 'markAsUnread'])->name('mark-unread');
        Route::put('/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
        Route::delete('/{id}', [NotificationController::class, 'destroy'])->name('destroy');
    });

    // ========== DASHBOARDS ==========
    Route::prefix('/dashboard')->name('dashboard.')->group(function () {
        Route::get('/patient', [DashboardController::class, 'patientDashboard'])
            ->middleware('role:patient')->name('patient');
        Route::get('/doctor', [DashboardController::class, 'doctorDashboard'])
            ->middleware('role:doctor')->name('doctor');
        Route::get('/admin', [DashboardController::class, 'adminDashboard'])
            ->middleware('role:admin,super_admin')->name('admin');
        Route::get('/super-admin', [DashboardController::class, 'superAdminDashboard'])
            ->middleware('role:super_admin')->name('super-admin');
    });

    // ========== PATIENT ROUTES ==========
    Route::middleware('role:patient')->group(function () {
        
        // Patient Hospital & Doctor Access (for dashboard)
        Route::get('/hospitals/available', [HospitalController::class, 'publicIndex'])->name('hospitals.patient.available');
        Route::get('/doctors/available', [DoctorController::class, 'index'])->name('doctors.patient.available');
        
        // Appointments
        Route::prefix('/appointments')->name('appointments.')->group(function () {
            Route::get('/', [AppointmentController::class, 'index'])->name('index');
            Route::get('/{id}', [AppointmentController::class, 'show'])->name('show');
            Route::post('/', [AppointmentController::class, 'store'])->name('store');
            Route::post('/{id}/reschedule', [AppointmentController::class, 'reschedule'])->name('reschedule');
            Route::put('/{id}', [AppointmentController::class, 'update'])->name('update');
            Route::delete('/{id}', [AppointmentController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/cancel', [AppointmentController::class, 'cancel'])->name('cancel');
        });

        // Payments
        Route::prefix('/payments')->name('payments.')->group(function () {
            Route::get('/', [PaymentController::class, 'index'])->name('index');
            Route::get('/{id}', [PaymentController::class, 'show'])->name('show');
            Route::post('/', [PaymentController::class, 'store'])->name('store');
            Route::post('/{id}/process', [PaymentController::class, 'process'])->name('process');
        });

        // Khalti Payments (Authenticated)
        Route::prefix('/khalti')->name('khalti.')->group(function () {
            Route::post('/initiate', [KhaltiPaymentController::class, 'initiatePayment'])->name('initiate');
            Route::get('/lookup/{paymentId}', [KhaltiPaymentController::class, 'lookupPayment'])->name('lookup');
        });

        // Appointment history
        Route::get('/appointments-history', [AppointmentController::class, 'history'])->name('appointment-history');

        // ========== AI RECOMMENDATIONS ==========
        
        });
    });

    // ========== DOCTOR ROUTES ==========
    Route::middleware('role:doctor')->group(function () {
        
        // Doctor Profile - Upload image
        Route::post('/doctor/upload-image', [DoctorController::class, 'uploadImage'])->name('doctor.upload-image');
        
        // Doctor Schedules
        Route::prefix('/schedules')->name('schedules.')->group(function () {
            Route::get('/', [DoctorScheduleController::class, 'index'])->name('index');
            Route::get('/{id}', [DoctorScheduleController::class, 'show'])->name('show');
            Route::post('/', [DoctorScheduleController::class, 'store'])->name('store');
            Route::put('/{id}', [DoctorScheduleController::class, 'update'])->name('update');
            Route::delete('/{id}', [DoctorScheduleController::class, 'destroy'])->name('destroy');
        });

        // Doctor specific appointments (uses /doctor/appointments to avoid conflict with patient routes)
        Route::get('/doctor/appointments', [AppointmentController::class, 'doctorAppointments'])->name('doctor.appointments');
        Route::post('/doctor/appointments/{id}/accept', [AppointmentController::class, 'acceptAppointment'])->name('doctor.appointments.accept');
        Route::post('/doctor/appointments/{id}/reject', [AppointmentController::class, 'rejectAppointment'])->name('doctor.appointments.reject');
        Route::post('/doctor/appointments/{id}/cancel', [AppointmentController::class, 'doctorCancelAppointment'])->name('doctor.appointments.cancel');
        Route::delete('/doctor/appointments/{id}', [AppointmentController::class, 'destroy'])->name('doctor.appointments.destroy');
        Route::post('/doctor/appointments/{id}/complete', [AppointmentController::class, 'completeAppointment'])->name('doctor.appointments.complete');
        
        // Appointments
        Route::get('/appointments', [AppointmentController::class, 'doctorAppointments'])->name('appointments');
        Route::get('/appointments/{id}', [AppointmentController::class, 'show'])->name('appointments.show');
        Route::put('/appointments/{id}', [AppointmentController::class, 'update'])->name('appointments.update');
        Route::post('/appointments/{id}/accept', [AppointmentController::class, 'acceptAppointment'])->name('appointments.accept');
        Route::post('/appointments/{id}/reject', [AppointmentController::class, 'rejectAppointment'])->name('appointments.reject');

        // Doctor Reports - POST for creating and reviewing reports
        Route::post('/reports', [ReportController::class, 'store'])->name('reports.store');
        Route::post('/reports/{id}/review', [ReportController::class, 'review'])->name('reports.review');
    });

    // ========== ADMIN ROUTES ==========
    Route::middleware('role:admin,super_admin')->group(function () {
        
        // Hospitals (Super Admin + Admin for their own)
        Route::prefix('/hospitals')->name('hospitals.')->group(function () {
            Route::get('/', [HospitalController::class, 'index'])->name('index');
            Route::get('/{id}', [HospitalController::class, 'show'])->name('show');
            Route::post('/', [HospitalController::class, 'store'])->middleware('role:super_admin')->name('store');
            Route::put('/{id}', [HospitalController::class, 'update'])->name('update');
            Route::put('/{hospitalId}/doctors/{doctorId}', [HospitalController::class, 'updateDoctor'])->name('doctors.update');
            Route::delete('/{id}', [HospitalController::class, 'destroy'])->middleware('role:super_admin')->name('destroy');
            Route::get('/{id}/statistics', [HospitalController::class, 'statistics'])->name('statistics');
        });

        // Departments
        Route::prefix('/departments')->name('departments.')->group(function () {
            Route::get('/', [DepartmentController::class, 'index'])->name('index');
            Route::get('/{id}', [DepartmentController::class, 'show'])->name('show');
            Route::post('/', [DepartmentController::class, 'store'])->name('store');
            Route::put('/{id}', [DepartmentController::class, 'update'])->name('update');
            Route::delete('/{id}', [DepartmentController::class, 'destroy'])->name('destroy');
            Route::get('/{id}/statistics', [DepartmentController::class, 'statistics'])->name('statistics');
        });

        // Doctors Management
        Route::prefix('/doctors')->name('doctors.')->group(function () {
            Route::get('/', [DoctorController::class, 'adminIndex'])->name('index');
            Route::get('/{id}', [DoctorController::class, 'show'])->name('show');
            Route::post('/', [DoctorController::class, 'store'])->name('store');
            Route::put('/{id}', [DoctorController::class, 'update'])->name('update');
            Route::post('/{id}/update', [DoctorController::class, 'update'])->name('update.post');
            Route::post('/{id}/upload-image', [DoctorController::class, 'uploadImage'])->name('upload-image');
            Route::delete('/{id}', [DoctorController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/toggle-status', [DoctorController::class, 'toggleStatus'])->name('toggle-status');
        });

        // Appointments Management
        Route::prefix('/appointments')->name('appointments.')->group(function () {
            Route::get('/', [AppointmentController::class, 'adminIndex'])->name('index');
            Route::get('/{id}', [AppointmentController::class, 'show'])->name('show');
            Route::put('/{id}', [AppointmentController::class, 'adminUpdate'])->name('update');
            Route::post('/{id}/reschedule', [AppointmentController::class, 'reschedule'])->name('reschedule');
            Route::put('/{id}/confirm', [AppointmentController::class, 'confirm'])->name('confirm');
            Route::put('/{id}/complete', [AppointmentController::class, 'complete'])->name('complete');
            Route::put('/{id}/cancel', [AppointmentController::class, 'adminCancel'])->name('cancel');
        });

        // Reports Management (update/approve/reject only - GET handled by general route)
        Route::prefix('/reports')->name('reports.')->group(function () {
            Route::put('/{id}', [ReportController::class, 'update'])->name('update');
            Route::put('/{id}/approve', [ReportController::class, 'approve'])->name('approve');
            Route::put('/{id}/reject', [ReportController::class, 'reject'])->name('reject');
        });

        // Reviews Management
        Route::prefix('/reviews')->name('reviews.')->group(function () {
            Route::put('/{id}/approve', [ReviewController::class, 'approve'])->name('approve');
            Route::put('/{id}/reject', [ReviewController::class, 'reject'])->name('reject');
        });

        // Payments
        Route::get('/payments', [PaymentController::class, 'index'])->name('payments');
        Route::get('/payments/{id}', [PaymentController::class, 'show'])->name('payments.show');
        Route::post('/payments/{id}/refund', [PaymentController::class, 'refund'])->name('payments.refund');
        Route::get('/payments-statistics', [PaymentController::class, 'statistics'])->name('payments.statistics');

        // Users Management
        Route::get('/users', [UserController::class, 'adminUsers'])->name('users.index');
        Route::get('/users/{id}', [UserController::class, 'show'])->name('users.show');
        Route::put('/users/{id}', [UserController::class, 'adminUpdate'])->name('users.update');
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    // ========== SUPER ADMIN ONLY ROUTES ==========
    Route::middleware('role:super_admin')->group(function () {
        
        // Admin Management
        Route::prefix('/admins')->name('admins.')->group(function () {
            Route::get('/', [AdminController::class, 'index'])->name('index');
            Route::get('/{id}', [AdminController::class, 'show'])->name('show');
            Route::post('/', [AdminController::class, 'store'])->name('store');
            Route::put('/{id}', [AdminController::class, 'update'])->name('update');
            Route::delete('/{id}', [AdminController::class, 'destroy'])->name('destroy');
        });

        // System Management
        Route::prefix('/system')->name('system.')->group(function () {
            Route::get('/logs', [AdminController::class, 'logs'])->name('logs');
            Route::get('/settings', [AdminController::class, 'settings'])->name('settings');
            Route::get('/users', [UserController::class, 'systemUsers'])->name('users');
            Route::get('/hospitals', [HospitalController::class, 'systemHospitals'])->name('hospitals');
            Route::get('/doctors', [DoctorController::class, 'adminIndex'])->name('doctors');
            Route::get('/departments', [DepartmentController::class, 'systemDepartments'])->name('departments');
        });
    });



/**
 * ========== FALLBACK ==========
 */
Route::fallback(function () {
    return response()->json([
        'status' => 'error',
        'message' => 'Endpoint not found',
    ], 404);
});