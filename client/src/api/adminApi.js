import api from './axios';

export const adminApi = {
  getStaffList: async () => {
    const response = await api.get('/admin/staff');
    return response.data;
  },

  createStaff: async (staffData) => {
    const response = await api.post('/admin/staff', staffData);
    return response.data;
  },

  updateStaffStatus: async (staffId, status) => {
    const response = await api.patch(`/admin/staff/${staffId}/status`, { status });
    return response.data;
  },

  resendStaffInvitation: async (staffId) => {
    const response = await api.post(`/admin/staff/${staffId}/resend-invitation`);
    return response.data;
  }
};
