# Super Admin Hospital View & Edit Feature

## Overview
Super Admin can now view complete hospital information and make edits to hospital details including name, contact info, address, location, description, and status.

## ✅ Features Implemented

### 1. **Hospital Detail View**
- **Route**: `/hospitals/:id`
- **Accessible by**: Super Admin, Admin (their own hospital), Patients (read-only)
- **Shows**: All hospital information in a formatted grid view

### 2. **Hospital Edit Functionality**
- **Accessible by**: Super Admin, Admin (their own hospital)
- **Edit Button**: "✏️ Edit Hospital" button in header
- **Fields Available**:
  - Hospital Name (required)
  - Email Address
  - Phone Number
  - Address
  - City
  - State
  - Country
  - Postal Code
  - Description
  - Status (Active/Inactive)

### 3. **Role-Based Views**
- **Super Admin**: Full view + Edit capability
- **Hospital Admin**: Full view + Edit capability (their own hospital)
- **Patient**: Limited view (no edit, no book button on this view)

## 🔄 User Workflow

### View Hospital Details (Super Admin)

1. **Navigate to Hospitals Page**
   - Click "Hospital Management" from Super Admin Dashboard
   - Or navigate to `/hospitals`

2. **Hospital List**
   - See all hospitals in a grid view
   - Each hospital card shows:
     - Hospital Name
     - Hospital ID
     - Email
     - Address
     - Status badge
     - **"👁️ View & Edit" button** ← NEW!

3. **Click "View & Edit" Button**
   - Opens hospital detail page
   - Shows all hospital information
   - Header displays: Hospital name, address, and status badge

### Edit Hospital Information (Super Admin)

1. **From Hospital Detail View**
   - Click "✏️ Edit Hospital" button in header

2. **Edit Form Appears**
   - Form displays with all hospital fields
   - Fields include validation

3. **Update Fields**
   - Modify any hospital information
   - Click "💾 Save Changes" to submit

4. **Success Response**
   - Green success message appears
   - Hospital information updates immediately
   - Edit form closes, returns to view mode

### Example Curl Request

```bash
# Get hospital details
curl -X GET http://localhost:8000/api/hospitals/14 \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"

# Update hospital details
curl -X PUT http://localhost:8000/api/hospitals/14 \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "City General Hospital",
    "email": "hospital@citygen.com",
    "phone": "+1-555-123-4567",
    "address": "456 Hospital Lane",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postal_code": "10001",
    "description": "Leading healthcare facility",
    "status": "active"
  }'
```

**Response:**
```json
{
  "status": "success",
  "hospital": {
    "id": 14,
    "name": "City General Hospital",
    "email": "hospital@citygen.com",
    "phone": "+1-555-123-4567",
    "address": "456 Hospital Lane",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postal_code": "10001",
    "description": "Leading healthcare facility",
    "status": "active",
    "created_at": "2026-02-09T10:00:00Z",
    "updated_at": "2026-02-09T15:30:00Z"
  }
}
```

## 📝 Implementation Details

### Frontend Changes

#### 1. **HospitalDetail.jsx** - Updated Component
**Location**: `c:\back\front\src\pages\HospitalDetail.jsx`

**Key Features**:
- Dual-purpose component (Patient view + Super Admin edit)
- Automatic role detection
- Conditional rendering based on user role
- Edit form with all hospital fields
- Real-time form state management

**State Variables**:
- `hospital`: Hospital data from API
- `loading`: Loading indicator
- `isEditing`: Toggle edit mode
- `message`: Success messages
- `error`: Error messages
- `editFormData`: Form data for editing

**Methods**:
- `handleUpdateHospital()`: Submits update to backend
- `handleEditChange()`: Track form input changes
- `useEffect()`: Load hospital data on mount

#### 2. **Hospitals.jsx** - Added View Button
**Location**: `c:\back\front\src\pages\Hospitals.jsx`

**Changes**:
- Added "👁️ View & Edit" button to each hospital card
- Button navigates to `/hospitals/:id` detail page
- Uses `useNavigate` hook for routing

```jsx
<button 
  onClick={() => navigate(`/hospitals/${hospital.id}`)} 
  className="btn-primary btn-view"
>
  👁️ View & Edit
</button>
```

#### 3. **HospitalDetail.css** - Comprehensive Styling
**Location**: `c:\back\front\src\styles\HospitalDetail.css`

**New Styles**:
- Header section layout (flex with hospital name and action buttons)
- Status badge styling (active=green, inactive=red)
- Info grid for displaying hospital information
- Edit form layout with responsive grid
- Form group styling for inputs and textareas
- Button styling (primary blue, secondary gray)
- Success/error message styling
- Responsive design for mobile devices
- Loading indicator

#### 4. **Hospitals.css** - Added Button Styling
**Location**: `c:\back\front\src\styles\Hospitals.css`

**New Styles**:
```css
.btn-view {
  background: #001f3f;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s;
  margin-top: 15px;
}

.btn-view:hover {
  background: #003d82;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 31, 63, 0.3);
}
```

### Backend Changes

#### 1. **HospitalController.php** - Enhanced Update Method
**Location**: `c:\back\back\app\Http\Controllers\api\HospitalController.php`

**Previous Limitation**:
- Only accepted: name, description, email, address, status
- Validation only for: name, email

**Updated**:
- Now accepts all hospital fields:
  - name, description, email, phone
  - address, city, state, country, postal_code, status

**Validation Rules**:
```php
'name' => 'sometimes|required|string|max:255',
'email' => 'nullable|email|unique:hospitals,email,'.$id,
'phone' => 'nullable|string|max:20',
'address' => 'nullable|string|max:255',
'city' => 'nullable|string|max:100',
'state' => 'nullable|string|max:100',
'country' => 'nullable|string|max:100',
'postal_code' => 'nullable|string|max:20',
'description' => 'nullable|string',
'status' => 'sometimes|required|in:active,inactive',
```

**Authorization Check**:
```php
// Only Super Admin or the hospital's Admin can update
if (!($user->isSuperAdmin() || 
      ($user->isAdmin() && $user->hospital_id == $hospital->id))) {
    return response()->json(['message' => 'Unauthorized'], 403);
}
```

#### 2. **Hospital.php** - Model Confirmation
**Location**: `c:\back\back\app\Models\Hospital.php`

All fields are already in the `$fillable` array:
```php
protected $fillable = [
    'name',
    'slug',
    'admin_email',
    'description',
    'email',
    'phone',
    'address',
    'city',
    'state',
    'country',
    'postal_code',
    'logo',
    'status',
];
```

### API Service
**Location**: `c:\back\front\src\services\api.js`

**Existing Methods Used**:
```javascript
getHospital: async (id, token) => {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
    headers,
  });
  return res.json();
},

updateHospital: async (id, data, token) => {
  const res = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}
```

## 🧪 Testing

### Test Case 1: View Hospital Details
1. Login as Super Admin
2. Navigate to `/hospitals` (Hospital Management)
3. Click "👁️ View & Edit" on any hospital
4. Verify all hospital information displays correctly
5. Verify status badge shows (Active/Inactive)

### Test Case 2: Edit Hospital Information
1. From hospital detail view, click "✏️ Edit Hospital"
2. Modify hospital name, email, phone, address
3. Click "💾 Save Changes"
4. Verify success message appears
5. Verify form closes and view mode shows updated info
6. Refresh page to confirm changes persisted

### Test Case 3: Validation
1. Try to save without hospital name (required field)
2. Verify error message displays
3. Try to enter invalid email
4. Verify email format validation works

### Test Case 4: Authorization
1. Login as patient user
2. Try to access `/hospitals/14` directly
3. Verify you can see hospital info but no edit button
4. Verify no "Edit Hospital" button appears

### Test Case 5: Admin Can Edit Own Hospital
1. Login as Hospital Admin
2. Navigate to `/hospitals` (Admin Hospitals)
3. Click "👁️ View & Edit" on their hospital
4. Click "✏️ Edit Hospital"
5. Verify form appears and allows editing
6. Update a field and save
7. Verify changes are saved

## 📊 Status Indicators

### Hospital Status Field
- **Active** (green badge): Hospital is operational
- **Inactive** (red badge): Hospital is not operational

Status can be changed from dropdown during edit:
```
Status: [Active ▼]
        [Active]
        [Inactive]
```

## 🔐 Security Features

### Authorization Checks
- ✅ Super Admin can view and edit any hospital
- ✅ Hospital Admin can only view and edit their own hospital
- ✅ Patients can only view hospital (no edit)
- ✅ Unauthorized access returns 403 Forbidden

### Input Validation
- ✅ Email format validation
- ✅ Name is required
- ✅ String length limits on all fields
- ✅ Valid status values (active/inactive)
- ✅ Phone number format (max 20 chars)

### Token Authentication
- ✅ Bearer token required for authenticated requests
- ✅ Invalid/expired tokens redirect to login
- ✅ All requests include authorization header

## 📈 Future Enhancements

### Phase 2 (Optional)
- [ ] Hospital logo upload
- [ ] Hospital departments quick view
- [ ] Hospital statistics dashboard
- [ ] Doctor count by department
- [ ] Appointment statistics
- [ ] Department management panel

### Phase 3 (Optional)
- [ ] Hospital services list
- [ ] Operating hours configuration
- [ ] Emergency contact management
- [ ] Insurance partnerships
- [ ] Hospital certifications/accreditations

## 📋 Summary

| Feature | Status | Frontend | Backend |
|---------|--------|----------|---------|
| View Hospital Details | ✅ Complete | HospitalDetail.jsx | HospitalController.show() |
| Edit Hospital Info | ✅ Complete | HospitalDetail.jsx | HospitalController.update() |
| View/Edit Button on List | ✅ Complete | Hospitals.jsx | - |
| Form Validation | ✅ Complete | React state | Laravel Validator |
| Authorization Checks | ✅ Complete | Role detection | isSuperAdmin/isAdmin |
| Status Badge Display | ✅ Complete | CSS styling | Database field |
| Responsive Design | ✅ Complete | CSS media queries | - |
| Success Messages | ✅ Complete | React state | API response |
| Error Handling | ✅ Complete | Try/catch blocks | Validation errors |

## 🚀 How to Use

### For Super Admin:
1. Go to Hospital Management page
2. Find the hospital you want to manage
3. Click "👁️ View & Edit" button
4. Click "✏️ Edit Hospital" to modify details
5. Update any fields you need
6. Click "💾 Save Changes"
7. Confirm success message appears

### For Patients:
1. Browse hospital details
2. View complete hospital information
3. Cannot edit (no edit button shown)
4. Can return to list with "Back to Hospitals" button

## 📞 Support

If you encounter any issues:
1. Check browser console for JavaScript errors
2. Check network tab to see API responses
3. Verify authentication token is valid
4. Ensure user has super_admin or admin role
5. Check database for hospital records
