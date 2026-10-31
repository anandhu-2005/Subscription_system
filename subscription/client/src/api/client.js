import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('subflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired or unauthorized
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('subflow_token');
        localStorage.removeItem('subflow_user');
      }
    }
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
};

export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const plansApi = {
  getAll: (params) => api.get('/plans', { params }),
  getById: (id) => api.get(`/plans/${id}`),
  create: (data) => api.post('/plans', data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  delete: (id) => api.delete(`/plans/${id}`),
};

export const customersApi = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const subscriptionsApi = {
  getAll: (params) => api.get('/subscriptions', { params }),
  getById: (id) => api.get(`/subscriptions/${id}`),
  create: (data) => api.post('/subscriptions', data),
  updateStatus: (id, data) => api.patch(`/subscriptions/${id}/status`, data),
  triggerInvoice: (id, data) => api.post(`/subscriptions/${id}/generate-invoice`, data),
  delete: (id) => api.delete(`/subscriptions/${id}`),
};

export const invoicesApi = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  runBilling: (data) => api.post('/invoices/run-billing', data),
  updateStatus: (id, data) => api.patch(`/invoices/${id}/status`, data),
};

export const paymentsApi = {
  getAll: (params) => api.get('/payments', { params }),
  record: (data) => api.post('/payments', data),
};

export const taxesApi = {
  getAll: (params) => api.get('/taxes', { params }),
  create: (data) => api.post('/taxes', data),
  update: (id, data) => api.put(`/taxes/${id}`, data),
  delete: (id) => api.delete(`/taxes/${id}`),
};

export const discountsApi = {
  getAll: (params) => api.get('/discounts', { params }),
  validate: (data) => api.post('/discounts/validate', data),
  create: (data) => api.post('/discounts', data),
  update: (id, data) => api.put(`/discounts/${id}`, data),
  delete: (id) => api.delete(`/discounts/${id}`),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;

