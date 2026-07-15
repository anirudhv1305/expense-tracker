import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('expense_tracker_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const client = {
  setUnauthorizedHandler: (handler) => {
    api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) handler();
        return Promise.reject(error);
      }
    );
  },
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  setupStatus: () => api.get(`/settings/status?_t=${Date.now()}`).then((r) => r.data),
  setup: (initialBalance) => api.post('/settings/setup', { initialBalance }).then((r) => r.data),
  dashboard: () => api.get('/dashboard').then((r) => r.data),
  history: () => api.get('/dashboard/history').then((r) => r.data),
  month: (monthId) => api.get(`/months/${monthId}`).then((r) => r.data),
  saveNote: (monthId, content) => api.put(`/months/${monthId}/notes`, { content }).then((r) => r.data),
  categories: () => api.get('/lookups/categories').then((r) => r.data),
  creditSources: () => api.get('/lookups/credit-sources').then((r) => r.data),
  createTransaction: (payload) => api.post('/transactions', payload).then((r) => r.data),
  updateTransaction: (id, payload) => api.put(`/transactions/${id}`, payload).then((r) => r.data),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`).then((r) => r.data),
  downloadCsv: (monthId) => api.get(`/exports/${monthId}/csv`, { responseType: 'blob' }),
  downloadExcel: (monthId) => api.get(`/exports/${monthId}/excel`, { responseType: 'blob' })
};
