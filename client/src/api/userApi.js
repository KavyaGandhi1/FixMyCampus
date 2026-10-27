import api from './axios';

export const userApi = {
  getStaffMembers: async () => {
    const response = await api.get('/users/staff');
    return response.data;
  },

  getUsers: async (role) => {
    const response = await api.get('/users', { params: { role } });
    return response.data;
  }
};
