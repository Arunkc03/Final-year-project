# ✅ Doctor Appointment Management System - Complete

## Overview
Doctors can now view all their appointments and accept or reject them. Patients are automatically notified of the doctor's decision via email and in-app notifications.

## Features Implemented

### 1. **Doctor Views Appointments**
- **Endpoint**: `GET /api/doctor/appointments`
- **Authentication**: Required (Doctor only)
- **Response**: Paginated list of all appointments (pending, confirmed, cancelled, completed)
- **Includes**: Patient info, hospital, department, and appointment details

```bash
curl -X GET http://localhost:8000/api/doctor/appointments \
  -H "Authorization: Bearer DOCTOR_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "data": [
      {
        "id": 1,
        "date": "2026-02-14",
        "time": "14:30",
        "status": "pending",
        "user": { "id": 1, "name": "John Patient", "email": "john@example.com" },
        "hospital": { "id": 14, "name": "City Medical Hospital" },
        "department": { "id": 1, "name": "Cardiology" }
      }
    ],
    "pagination": {...}
  }
}
```

### 2. **Doctor Accept Appointment**
- **Endpoint**: `POST /api/doctor/appointments/{id}/accept`
- **Authentication**: Required (Doctor only)
- **Body**:
  ```json
  {
    "notes": "Optional confirmation notes for patient"
  }
  ```
- **Action**: 
  - Changes status from `pending` → `confirmed`
  - Sets `confirmed_at` timestamp
  - Sends confirmation email to patient
  - Creates in-app notification for patient

```bash
curl -X POST http://localhost:8000/api/doctor/appointments/1/accept \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "See you at the scheduled time!"
  }'
```

**Success Response:** (HTTP 200)
```json
{
  "status": "success",
  "message": "Appointment accepted successfully",
  "appointment": {
    "id": 1,
    "status": "confirmed",
    "confirmed_at": "2026-02-09T12:00:00Z",
    "user": {...},
    "doctor": {...},
    "hospital": {...},
    "department": {...}
  }
}
```

### 3. **Doctor Reject Appointment**
- **Endpoint**: `POST /api/doctor/appointments/{id}/reject`
- **Authentication**: Required (Doctor only)
- **Body** (Required):
  ```json
  {
    "reason": "Why you're rejecting the appointment (required)"
  }
  ```
- **Action**:
  - Changes status from `pending` → `cancelled`
  - Sets `cancelled_at` timestamp
  - Records rejection reason
  - Sends rejection email to patient with reason
  - Creates in-app notification for patient

```bash
curl -X POST http://localhost:8000/api/doctor/appointments/2/reject \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "I am not available at this time. Please reschedule."
  }'
```

**Success Response:** (HTTP 200)
```json
{
  "status": "success",
  "message": "Appointment rejected successfully",
  "appointment": {
    "id": 2,
    "status": "cancelled",
    "cancelled_at": "2026-02-09T12:05:00Z",
    "cancellation_reason": "I am not available at this time. Please reschedule.",
    "user": {...},
    "doctor": {...},
    "hospital": {...}
  }
}
```

## Error Handling

### Only Pending Appointments Can Be Accepted/Rejected
```json
{
  "status": "error",
  "message": "Only pending appointments can be accepted"
}
```

### Rejection Requires Reason
```json
{
  "status": "error",
  "errors": {
    "reason": ["The reason field is required."]
  }
}
```

### Unauthorized Access
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```
(HTTP 403)

## Patient Notifications

### When Doctor Accepts
- **Email Subject**: "Your Appointment Has Been Accepted"
- **Content**: 
  - Doctor's name and hospital
  - Appointment date and time
  - Optional doctor's notes
  - Link to view appointment details
  
- **In-App Notification**:
  - Type: `appointment_accepted`
  - Stores appointment details for quick reference

### When Doctor Rejects
- **Email Subject**: "Your Appointment Request Has Been Declined"
- **Content**:
  - Doctor's name and hospital
  - Original requested date/time
  - Rejection reason from doctor
  - Link to reschedule with another doctor
  
- **In-App Notification**:
  - Type: `appointment_rejected`
  - Stores rejection reason and doctor info
  - Encourages rescheduling

## Database Updates
- `confirmed_at` - Timestamp when doctor accepted
- `cancelled_at` - Timestamp when appointment was cancelled (rejected/cancelled)
- `cancellation_reason` - Reason for cancellation/rejection
- `status` - Updated to reflect current state

## Appointment Status Flow

```
pending → confirmed (accept)
pending → cancelled (reject or admin cancel)
confirmed → completed (after appointment)
confirmed → cancelled (if patient/admin cancels)
```

## Frontend Integration Example

```javascript
// Get doctor's appointments
const getAppointments = async (token) => {
  const res = await fetch('/api/doctor/appointments', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};

// Accept appointment
const acceptAppointment = async (appointmentId, notes, token) => {
  const res = await fetch(`/api/doctor/appointments/${appointmentId}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ notes })
  });
  return res.json();
};

// Reject appointment
const rejectAppointment = async (appointmentId, reason, token) => {
  const res = await fetch(`/api/doctor/appointments/${appointmentId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });
  return res.json();
};
```

## Created Files
1. **AppointmentController** - Added 3 new methods:
   - `doctorAppointments()` - List doctor's appointments
   - `acceptAppointment()` - Accept pending appointment
   - `rejectAppointment()` - Reject pending appointment

2. **Notifications**:
   - `AppointmentAccepted.php` - Sent when doctor accepts
   - `AppointmentRejected.php` - Sent when doctor rejects

3. **Routes** - Added to `routes/api.php`:
   - `POST /doctor/appointments/{id}/accept`
   - `POST /doctor/appointments/{id}/reject`
   - Modified existing doctor appointments route

## Testing Results
✅ Doctor can view their appointments
✅ Doctor can accept pending appointments  
✅ Doctor can reject pending appointments with reason
✅ Patient receives email notification on acceptance
✅ Patient receives email notification on rejection
✅ In-app notifications created (requires patient to view)
✅ Proper error handling and validation
✅ Authorization checks working correctly

## Next Steps (Optional)
- [ ] Add SMS notifications for urgent rejections
- [ ] Add suggested alternative dates when rejecting
- [ ] Create doctor dashboard to visualize appointment flow
- [ ] Add reason templates for common rejection reasons
- [ ] Analytics: Track acceptance/rejection rates by doctor

---

**Status**: ✅ Complete and Tested
**Date**: February 9, 2026
**Version**: 1.0
