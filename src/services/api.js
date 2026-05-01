import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://mybritari-backend-production.up.railway.app/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('mybritari_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mybritari_token');
      localStorage.removeItem('mybritari_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register:             (data)  => api.post('/auth/register', data),
  login:                (data)  => api.post('/auth/login', data),
  acceptTerms:          ()      => api.post('/auth/accept-terms'),
  getMe:                ()      => api.get('/auth/me'),
  getProfile:           ()      => api.get('/auth/profile'),
  updateProfile:        (data)  => api.put('/auth/profile', data),
  changePassword:       (data)  => api.post('/auth/change-password', data),
  submitKYC:            (data)  => api.post('/auth/kyc', data),
  verifyEmail:          (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification:   ()      => api.post('/auth/resend-verification'),
  forgotPassword:       (data)  => api.post('/auth/forgot-password', data),
  resetPassword:        (data)  => api.post('/auth/reset-password', data),
};

export const estatesAPI = {
  getAll:  ()     => api.get('/estates'),
  getOne:  (id)   => api.get(`/estates/${id}`),
  unlock:  (code) => api.post('/estates/unlock', { code }),
};

export const contractsAPI = {
  getAll:      ()     => api.get('/contracts'),
  getOne:      (id)   => api.get(`/contracts/${id}`),
  getSchedule: (id)   => api.get(`/contracts/${id}/schedule`),
  reserve:     (data) => api.post('/contracts/reserve', data),
};

export const paymentsAPI = {
  getBankDetails:  ()     => api.get('/payments/bank-details'),
  getBankAccounts: ()     => api.get('/bank-accounts'),
  getHistory:      ()     => api.get('/payments'),
  getReceipts:     ()     => api.get('/payments/receipts'),
  submitReceipt:   (data) => api.post('/payments/bank-transfer', data),
  initializePaystack: (data) => api.post('/payments/initialize', data),
  verifyPaystack:     (ref)  => api.get(`/payments/verify?reference=${ref}`),
};

export const plansAPI = {
  getAll:      ()          => api.get('/plans'),
  getByEstate: (estateId)  => api.get(`/plans/estate/${estateId}`),
};

export const plotsAPI = {
  getByEstate: (estateId) => api.get(`/plots/estate/${estateId}`),
  holdPlot:    (plotId)   => api.post(`/plots/${plotId}/hold`),
  releasePlot: (plotId)   => api.delete(`/plots/${plotId}/hold`),
  getOne:      (plotId)   => api.get(`/plots/${plotId}`),
};

export const settingsAPI = {
  getAll: () => api.get('/settings'),
};

export const notificationsAPI = {
  getAll:      ()   => api.get('/notifications'),
  unreadCount: ()   => api.get('/notifications/unread-count'),
  markRead:    (id) => api.put(`/notifications/${id}/read`),
  markAllRead: ()   => api.put('/notifications/read-all'),
};

export const supportAPI = {
  getTickets:   ()     => api.get('/support'),
  createTicket: (data) => api.post('/support', data),
};

export const documentsAPI = {
  getMy:     ()   => api.get('/documents/my'),
  download:  (id) => api.get(`/documents/${id}/download`),
  getPDF:    (id) => api.get(`/documents/${id}/pdf`),
};

export const loansAPI = {
  getAll:  ()     => api.get('/loans'),
  request: (data) => api.post('/loans', data),
};

export const referralsAPI = {
  getMy: () => api.get('/referrals/my'),
};

export const inspectionsAPI = {
  getAll: ()     => api.get('/inspections'),
  book:   (data) => api.post('/inspections', data),
};

export const refundsAPI = {
  getAll: ()     => api.get('/refunds'),
  submit: (data) => api.post('/refunds', data),
};

export default api;
