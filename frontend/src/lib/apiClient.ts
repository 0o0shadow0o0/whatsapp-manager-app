import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle responses (e.g., for 401 errors)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access, e.g., redirect to login
      // This could be done by dispatching an event or calling a logout function from AuthContext
      // For simplicity, we'll just log it here. A more robust solution would involve the AuthContext.
      console.error('Unauthorized access - 401 error');
      // localStorage.removeItem('authToken');
      // localStorage.removeItem('authAdmin');
      // window.location.href = '/login'; // Force redirect
    }
    return Promise.reject(error);
  }
);

export default apiClient;

