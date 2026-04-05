import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Required for httpOnly cookie auth
})

// Response interceptor — handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're not already on an auth page
      const path = window.location.pathname
      if (!path.startsWith('/login') && !path.startsWith('/signup') && path !== '/') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
