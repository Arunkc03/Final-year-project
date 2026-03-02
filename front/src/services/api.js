// API service for backend communication
const API_HOST = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_BASE_URL = `${API_HOST.replace(/\/+$/,'')}/api`;
const STORAGE_URL = `${API_HOST.replace(/\/+$/,'')}/storage`;

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
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      return res.json();
    } catch (error) {
      console.error('Login API error:', error, 'API_BASE_URL:', API_BASE_URL);
      throw error;
    }
  },

  logout: async (token) => {
    const res = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    return res.json();
  },

  // Dashboard endpoints
  getDashboard: async (dashboardRoute, token) => {
    const res = await fetch(`${API_BASE_URL}${dashboardRoute}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
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

  getHospital: async (id, token) => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/public/hospital/${id}`, {
      headers,
    });
    return res.json();
  },

  // Public doctors endpoints
  getDoctors: async () => {
    const res = await fetch(`${API_BASE_URL}/public/doctors`);
    return res.json ? await res.json() : res;
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
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
  },

  deleteHospital: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return res.json();
  },

  updateHospitalWithImage: async (id, formData, token) => {
    // Use POST with _method=PUT for FormData (Laravel method spoofing)
    formData.append('_method', 'PUT');
    const res = await fetch(`${API_BASE_URL}/hospitals/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return res.json();
  },

  // Doctor endpoints (admin-protected)
  createDoctor: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getDoctorAdmin: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/doctors/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },

  deleteDoctor: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/doctors/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },

  // Report endpoints
  getReports: async (token) => {
    const res = await fetch(`${API_BASE_URL}/reports`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },

  getReport: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/reports/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },

  uploadReport: async (formData, token) => {
    const res = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return res.json();
  },

  reviewReport: async (id, data, token) => {
    const res = await fetch(`${API_BASE_URL}/reports/${id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
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

  // Appointment endpoints
  getAppointments: async (token) => {
    const res = await fetch(`${API_BASE_URL}/appointments`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },

  getDoctorAppointments: async (token) => {
    const res = await fetch(`${API_BASE_URL}/doctor/appointments`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },

  bookAppointment: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  acceptAppointment: async (id, notes, token) => {
    const res = await fetch(`${API_BASE_URL}/doctor/appointments/${id}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ notes }),
    });
    return res.json();
  },

  rejectAppointment: async (id, reason, token) => {
    const res = await fetch(`${API_BASE_URL}/doctor/appointments/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ reason: reason || 'No reason provided' }),
    });
    return res.json();
  },

  // Schedule endpoints
  getSchedules: async (token) => {
    const res = await fetch(`${API_BASE_URL}/schedules`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },

  getSchedule: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },

  createSchedule: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateSchedule: async (id, data, token) => {
    const res = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteSchedule: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },

  getDoctorSchedules: async (doctorId) => {
    const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}/schedules`);
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
        const res = await fetch(`${API_BASE_URL}/khalti/initiate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
        
        const responseData = await res.json();
        console.log('Khalti initiate response status:', res.status);
        console.log('Khalti initiate response data:', responseData);
        
        if (!res.ok) {
          console.error('Khalti initiate error:', responseData);
          throw new Error(responseData.message || `HTTP ${res.status}`);
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
        headers: { 'Authorization': `Bearer ${token}` },
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
};

export default api;
