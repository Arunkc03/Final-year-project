// API service for backend communication
const API_HOST = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_BASE_URL = `${API_HOST.replace(/\/+$/,'')}/api`;
const STORAGE_URL = `${API_HOST.replace(/\/+$/,'')}/storage`;

// Helper function to create authenticated request options
const createAuthHeaders = (token, additionalHeaders = {}) => {
  const headers = {
    ...additionalHeaders,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Only add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Log missing tokens to help debug 401 errors
    console.warn('⚠️ API call made without token. Current localStorage token:', localStorage.getItem('token'));
  }
  
  return headers;
};

const api = {
  // Storage URL for images
  getStorageUrl: () => STORAGE_URL,
  
  // Auth endpoints
  register: async (data) => {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  login: async (data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`;

        try {
          const errorData = await res.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (res.status === 401) {
            errorMessage = 'Invalid email or password.';
          }
        } catch {
          if (res.status === 401) {
            errorMessage = 'Invalid email or password.';
          }
        }

        const error = new Error(errorMessage);
        error.status = res.status;
        throw error;
      }
      
      return res.json();
    } catch (error) {
      console.error('Login API error:', error, 'API_BASE_URL:', API_BASE_URL);
      throw error;
    }
  },

  forgotPassword: async (email) => {
    const res = await fetch(`${API_BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.errors?.email?.[0] || 'Failed to send reset link');
    }

    return data;
  },

  resetPassword: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data?.message ||
        data?.errors?.password?.[0] ||
        data?.errors?.token?.[0] ||
        'Failed to reset password'
      );
    }

    return data;
  },

  logout: async (token) => {
    const res = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  // Dashboard endpoints
  getDashboard: async (dashboardRoute, token) => {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_BASE_URL}${dashboardRoute}`, {
      headers,
      credentials: 'include',
    });
    
    if (!res.ok) {
      const errorData = {
        status: res.status,
        statusText: res.statusText,
      };
      throw errorData;
    }
    
    return res.json();
  },

  // Hospital endpoints
  getHospitals: async () => {
    const res = await fetch(`${API_BASE_URL}/public/hospitals`);
    return res.json ? await res.json() : res;
  },

  getAdmins: async (token) => {
    if (!token) {
      console.error('❌ getAdmins: No token provided');
      return { status: 'error', message: 'Authentication required', data: [] };
    }
    
    const res = await fetch(`${API_BASE_URL}/admins`, {
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error('❌ getAdmins failed:', { status: res.status, data });
    }
    
    return data;
  },

  updateAdmin: async (id, data, token) => {
    const res = await fetch(`${API_BASE_URL}/admins/${id}`, {
      method: 'PUT',
      headers: createAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteAdmin: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/admins/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  getPatients: async (token) => {
    if (!token) {
      console.error('❌ getPatients: No token provided');
      return { status: 'error', message: 'Authentication required', data: [] };
    }
    
    const res = await fetch(`${API_BASE_URL}/users?role=patient`, {
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error('❌ getPatients failed:', { status: res.status, data });
    }
    
    return data;
  },

  deletePatient: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  getHospital: async (id, token) => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/public/hospital/${id}`, {
      headers,
    });
    return res.json();
  },

  // Public doctors endpoints
  getDoctors: async (hospitalId) => {
    const url = hospitalId 
      ? `${API_BASE_URL}/public/doctors?hospital_id=${hospitalId}`
      : `${API_BASE_URL}/public/doctors`;
    const res = await fetch(url);
    return res.json ? await res.json() : res;
  },

  getDoctorsAdmin: async (token) => {
    if (!token) {
      console.error('❌ getDoctorsAdmin: No token provided');
      return {
        status: 'error',
        message: 'Authentication required - no token found',
        data: [],
      };
    }

    const headers = createAuthHeaders(token);
    const candidateEndpoints = ['/system/doctors', '/doctors'];
    let lastPayload = null;
    let lastErrorStatus = null;

    for (const endpoint of candidateEndpoints) {
      try {
        console.log(`📡 Fetching doctors from ${endpoint} with token:`, token.substring(0, 20) + '...');
        const res = await fetch(`${API_BASE_URL}${endpoint}`, { 
          headers,
          credentials: 'include',
        });
        const payload = await res.json();
        lastPayload = payload;
        lastErrorStatus = res.status;

        if (res.ok && payload?.status === 'success') {
          console.log(`✅ Successfully fetched doctors from ${endpoint}`);
          return payload;
        } else if (!res.ok) {
          console.warn(`⚠️ ${endpoint} returned status ${res.status}:`, payload);
        }
      } catch (error) {
        console.error(`❌ Error fetching from ${endpoint}:`, error);
        lastPayload = {
          status: 'error',
          message: error?.message || 'Failed to fetch doctors',
        };
      }
    }

    return lastPayload || {
      status: 'error',
      message: `Failed to fetch doctors (last status: ${lastErrorStatus})`,
      data: [],
    };
  },

  getDoctorsByDepartment: async (departmentId, token) => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/public/doctors?department_id=${departmentId}`, { headers });
    return res.json();
  },

  getDoctor: async (id, token) => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/public/doctors/${id}`, { headers });
    return res.json();
  },

  createHospital: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/hospitals`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateHospital: async (id, data, token) => {
    const res = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
      method: 'PUT',
      headers: createAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteHospital: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  updateHospitalWithImage: async (id, formData, token) => {
    // Use POST with _method=PUT for FormData (Laravel method spoofing)
    formData.append('_method', 'PUT');
    const headers = { 'Accept': 'application/json' };
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    return res.json();
  },

  // Doctor endpoints (admin-protected)
  createDoctor: async (data, token) => {
    const isFormData = data instanceof FormData;
    const headers = createAuthHeaders(token);
    if (isFormData) {
      delete headers['Content-Type'];
    }
    const res = await fetch(`${API_BASE_URL}/doctors`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: isFormData ? data : JSON.stringify(data),
    });
    return res.json();
  },

  getDoctorAdmin: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/doctors/${id}`, {
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  deleteDoctor: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/doctors/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  updateDoctor: async (id, data, token) => {
    const isFormData = data instanceof FormData;
    // PHP cannot parse multipart/form-data for PUT requests, so use POST /update when sending files
    const url = isFormData
      ? `${API_BASE_URL}/doctors/${id}/update`
      : `${API_BASE_URL}/doctors/${id}`;
    const method = isFormData ? 'POST' : 'PUT';
    const headers = createAuthHeaders(token);
    if (isFormData) {
      delete headers['Content-Type'];
    }
    const res = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: isFormData ? data : JSON.stringify(data),
    });
    return res.json();
  },

  updateHospitalDoctor: async (hospitalId, doctorId, data, token) => {
    const isFormData = data instanceof FormData;
    const headers = createAuthHeaders(token);
    if (isFormData) {
      delete headers['Content-Type'];
    }
    const res = await fetch(`${API_BASE_URL}/hospitals/${hospitalId}/doctors/${doctorId}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: isFormData ? data : JSON.stringify(data),
    });
    return res.json();
  },

  // Report endpoints
  getReports: async (token) => {
    const res = await fetch(`${API_BASE_URL}/reports`, {
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  getReport: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/reports/${id}`, {
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  uploadReport: async (formData, token) => {
    const res = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      credentials: 'include',
      body: formData,
    });
    return res.json();
  },

  getDoctorReviews: async (doctorId) => {
    const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/reviews`);
    return res.json();
  },

  deleteReport: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  reviewReport: async (id, data, token) => {
    const res = await fetch(`${API_BASE_URL}/reports/${id}/review`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Department endpoints
  getDepartments: async (hospitalId, token) => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const url = hospitalId 
      ? `${API_BASE_URL}/public/departments?hospital_id=${hospitalId}` 
      : `${API_BASE_URL}/public/departments`;
    const res = await fetch(url, { headers });
    return res.json();
  },

  getDepartment: async (id, token) => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/public/departments/${id}`, { headers });
    return res.json();
  },

  createDepartment: async (data, token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/departments`, {
        method: 'POST',
        headers: createAuthHeaders(token),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      const text = await res.text();
      console.log('Department creation response status:', res.status);
      console.log('Department creation response:', text);
      
      if (!res.ok) {
        try {
          const errorData = JSON.parse(text);
          console.error('Department creation error:', errorData);
          throw new Error(errorData.message || `HTTP ${res.status}`);
        } catch (parseError) {
          console.error('Failed to parse error response:', text);
          throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
        }
      }
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Department API error:', error);
      throw error;
    }
  },

  deleteDepartment: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  // Appointment endpoints
  getAppointments: async (token) => {
    const res = await fetch(`${API_BASE_URL}/appointments`, {
      headers: createAuthHeaders(token),
      credentials: 'include',
    });

    // Some role-specific backends restrict /appointments for doctors.
    // Fallback to doctor endpoint to avoid 403 in doctor contexts.
    if (res.status === 403) {
      const doctorRes = await fetch(`${API_BASE_URL}/doctor/appointments`, {
        headers: createAuthHeaders(token),
        credentials: 'include',
      });
      return doctorRes.json();
    }

    return res.json();
  },

  getDoctorAppointments: async (token) => {
    const res = await fetch(`${API_BASE_URL}/doctor/appointments`, {
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  bookAppointment: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  acceptAppointment: async (id, notes, token) => {
    const res = await fetch(`${API_BASE_URL}/doctor/appointments/${id}/accept`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ notes }),
    });
    return res.json();
  },

  rejectAppointment: async (id, reason, token) => {
    const res = await fetch(`${API_BASE_URL}/doctor/appointments/${id}/reject`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({ reason: reason || 'No reason provided' }),
    });
    return res.json();
  },

  cancelAppointment: async (id, notes, token) => {
    const res = await fetch(`${API_BASE_URL}/doctor/appointments/${id}/cancel`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify({
        reason: notes || 'Deleted by doctor from dashboard',
      }),
    });
    return res.json();
  },

  deleteDoctorAppointment: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/doctor/appointments/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  // Schedule endpoints
  getSchedules: async (token) => {
    const res = await fetch(`${API_BASE_URL}/schedules`, {
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  getSchedule: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  createSchedule: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateSchedule: async (id, data, token) => {
    const res = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'PUT',
      headers: createAuthHeaders(token),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteSchedule: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  getDoctorSchedules: async (doctorId) => {
    const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/schedules`);
    return res.json();
  },

  // Generic request method for flexible API calls
  request: async (endpoint, token) => {
    const headers = token ? createAuthHeaders(token) : {};
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      credentials: token ? 'include' : 'omit',
    });
    return res.json();
  },

  // ========== KHALTI PAYMENT GATEWAY ==========
  khalti: {
    // Get Khalti public configuration
    getConfig: async () => {
      const res = await fetch(`${API_BASE_URL}/khalti/config`);
      return res.json();
    },

    // Initiate Khalti payment
    initiate: async (data, token) => {
      try {
        console.log('Khalti initiate request data:', data);
        
        const res = await fetch(`${API_BASE_URL}/khalti/initiate`, {
          method: 'POST',
          headers: createAuthHeaders(token),
          credentials: 'include',
          body: JSON.stringify(data),
        });
        
        const responseData = await res.json();
        console.log('Khalti initiate response status:', res.status);
        console.log('Khalti initiate full response data:', JSON.stringify(responseData, null, 2));
        
        if (!res.ok) {
          console.error('Khalti initiate error response:', responseData);
          
          // Extract detailed error message from response - prioritize message field
          let errorMessage = 'Payment initiation failed';
          
          if (responseData.message) {
            errorMessage = responseData.message;
          } else if (responseData.detail) {
            errorMessage = responseData.detail;
          } else if (responseData.errors && typeof responseData.errors === 'object') {
            // Handle validation errors object
            const errorKeys = Object.keys(responseData.errors);
            if (errorKeys.length > 0) {
              const firstErrorField = errorKeys[0];
              const firstError = responseData.errors[firstErrorField];
              errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
            }
          } else if (responseData.error) {
            errorMessage = String(responseData.error);
          }
          
          console.error('Extracted error message:', errorMessage);
          console.error('Full error response:', responseData);
          throw new Error(errorMessage);
        }
        
        // Check for error status in response data (even if HTTP was 200)
        if (responseData.status === 'error') {
          const errorMsg = responseData.message || 'Payment initiation failed';
          console.error('API returned error status:', errorMsg);
          console.error('Error details:', responseData);
          throw new Error(errorMsg);
        }
        
        return responseData;
      } catch (error) {
        console.error('Khalti API error:', error);
        throw error;
      }
    },

    // Verify Khalti payment (callback)
    verify: async (pidx) => {
      const res = await fetch(`${API_BASE_URL}/khalti/verify?pidx=${pidx}`);
      return res.json();
    },

    // Lookup payment status
    lookup: async (paymentId, token) => {
      const res = await fetch(`${API_BASE_URL}/khalti/lookup/${paymentId}`, {
        headers: createAuthHeaders(token),
        credentials: 'include',
      });
      return res.json();
    },
  },

  // AI Doctor Recommendation endpoints
  aiRecommendations: {
    getDoctorRecommendations: async (token) => {
      try {
        const res = await fetch(`${API_BASE_URL}/ai/doctor-recommendations`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
        return res.json();
      } catch (error) {
        console.error('AI Recommendations API error:', error);
        return { status: 'error', data: [], message: 'Unable to fetch recommendations' };
      }
    },

    getSimilarPatients: async (symptom, token) => {
      try {
        const res = await fetch(`${API_BASE_URL}/ai/similar-patients?symptom=${encodeURIComponent(symptom)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        return res.ok ? res.json() : { status: 'error', data: [] };
      } catch (error) {
        console.error('Similar Patients API error:', error);
        return { status: 'error', data: [] };
      }
    },

    getSpecialtyRecommendation: async (symptoms, token) => {
      try {
        const res = await fetch(`${API_BASE_URL}/ai/specialty-recommendation`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symptoms }),
        });
        
        return res.ok ? res.json() : { status: 'error', recommended_specialty: null };
      } catch (error) {
        console.error('Specialty Recommendation API error:', error);
        return { status: 'error', recommended_specialty: null };
      }
    },
  },

  // Profile endpoints
  updateProfile: async (formData, token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error('Profile update error response:', res.status, errorData);
        throw new Error(`API returned ${res.status}: ${res.statusText}`);
      }
      
      return res.json();
    } catch (error) {
      console.error('Profile update fetch error:', error);
      throw error;
    }
  },

  // Doctor image upload (for doctor's own profile)
  uploadDoctorImage: async (formData, token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/doctor/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error('Doctor image upload error:', res.status, errorData);
        throw new Error(`API returned ${res.status}: ${res.statusText}`);
      }
      
      return res.json();
    } catch (error) {
      console.error('Doctor image upload error:', error);
      throw error;
    }
  },

  // Submit review for doctor
  submitReview: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Get authenticated user's own reviews (all statuses — for doctor/admin views)
  getMyReviews: async (token) => {
    const res = await fetch(`${API_BASE_URL}/reviews`, {
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  // Delete a review (admin or review owner)
  deleteReview: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/reviews/${id}`, {
      method: 'DELETE',
      headers: createAuthHeaders(token),
      credentials: 'include',
    });
    return res.json();
  },

  // Doctor marks appointment as completed
  completeAppointment: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/doctor/appointments/${id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return res.json();
  },
};

export default api;
