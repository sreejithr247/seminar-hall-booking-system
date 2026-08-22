import { api } from './api';
import {
  Hall, Booking, Department, Class, Club,
  HallUsageReport, DepartmentUsageReport,
  Request, User, ReviewRequestInput, CreateRequestInput,
} from './types';

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (username: string, password: string) => {
    const res = await api.post<{ user: User; token: string }>('/auth/login', { username, password });
    // Save token to localStorage so the request interceptor can use it
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', res.data.token);
    }
    return res;
  },

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get<{ user: User; requester?: { requester_id: number; requester_type: string } }>('/auth/me'),

  /** Any logged-in user: verify current password and set a new one */
  changeOwnPassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),
};

// ─── HALLS ───────────────────────────────────────────────────────────────────

export const hallsApi = {
  getAll: () => api.get<Hall[]>('/halls'),

  getAvailability: (hallId: number, date: string) =>
    api.get<Booking[]>(`/availability?hall_id=${hallId}&date=${date}`),

  create: (data: Omit<Hall, 'hall_id' | 'is_active'>) => api.post<Hall>('/halls', data),
  update: (id: number, data: Partial<Hall>) => api.put<Hall>(`/halls/${id}`, data),
  delete: (id: number) => api.delete(`/halls/${id}`),
};

// ─── DEPARTMENTS ─────────────────────────────────────────────────────────────

export const departmentsApi = {
  getAll: () => api.get<Department[]>('/departments'),
  create: (dept_name: string, dept_code: string) => api.post<Department>('/departments', { dept_name, dept_code }),
  update: (id: number, dept_name: string, dept_code: string) => api.put(`/departments/${id}`, { dept_name, dept_code }),
  delete: (id: number) => api.delete(`/departments/${id}`),
};

// ─── CLASSES ─────────────────────────────────────────────────────────────────

export const classesApi = {
  getByDept: (deptId: number) => api.get<Class[]>(`/classes?dept_id=${deptId}`),
  create: (data: { class_name: string; dept_id: number; year: string }) => api.post<Class>('/classes', data),
  delete: (id: number) => api.delete(`/classes/${id}`),
};

// ─── CLUBS ───────────────────────────────────────────────────────────────────

export const clubsApi = {
  getAll: (deptId?: number) => api.get<Club[]>(deptId ? `/clubs?dept_id=${deptId}` : '/clubs'),
  create: (data: { club_name: string; dept_id?: number; description?: string }) => api.post<Club>('/clubs', data),
  delete: (id: number) => api.delete(`/clubs/${id}`),
};

// ─── REQUESTS ────────────────────────────────────────────────────────────────

export const requestsApi = {
  // Requester
  create: (data: CreateRequestInput) => api.post<Request>('/requests', data),
  getMy: () => api.get<Request[]>('/requests/my'),

  // Coordinator
  getDeptPending: () => api.get<Request[]>('/requests/dept-pending'),
  deptReview: (id: number, payload: ReviewRequestInput) => api.patch(`/requests/${id}/dept-review`, payload),

  // Admin
  getAdminPending: () => api.get<Request[]>('/requests/admin-pending'),
  adminReview: (id: number, payload: ReviewRequestInput) => api.patch(`/requests/${id}/admin-review`, payload),
};

// ─── BOOKINGS ────────────────────────────────────────────────────────────────

export const bookingsApi = {
  getAll: () => api.get<Booking[]>('/bookings'),
  cancel: (id: number) => api.patch(`/bookings/${id}/cancel`),
};

// ─── USERS ───────────────────────────────────────────────────────────────────

export const usersApi = {
  getAll: (role?: string) => api.get<User[]>(role ? `/users?role=${role}` : '/users'),
  deactivate: (id: number) => api.delete(`/users/${id}`),
  /** Admin: set a new password for any user */
  changePassword: (userId: number, newPassword: string) =>
    api.patch(`/users/${userId}/password`, { new_password: newPassword }),
};

// ─── REPORTS ─────────────────────────────────────────────────────────────────

export const reportsApi = {
  hallUsage: () => api.get<HallUsageReport[]>('/reports/hall-usage'),
  deptUsage: () => api.get<DepartmentUsageReport[]>('/reports/department-usage'),
};
