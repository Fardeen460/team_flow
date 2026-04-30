import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// ─── Users ────────────────────────────────────────────
export const usersAPI = {
  list: () => api.get('/users/'),
  updateMe: (data) => api.patch('/users/me', data),
  updateRole: (id, data) => api.patch(`/users/${id}/role`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
}

// ─── Projects ─────────────────────────────────────────
export const projectsAPI = {
  list: () => api.get('/projects/'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects/', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`),
}

// ─── Tasks ────────────────────────────────────────────
export const tasksAPI = {
  list: (params) => api.get('/tasks/', { params }),
  myTasks: () => api.get('/tasks/my-tasks'),
  dashboard: () => api.get('/tasks/dashboard'),
  create: (projectId, data) => api.post(`/tasks/${projectId}`, data),
  get: (id) => api.get(`/tasks/${id}`),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
}

export default api
