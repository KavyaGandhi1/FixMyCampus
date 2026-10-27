import api from './axios';

export const commentApi = {
  getComments: async (issueId) => {
    const response = await api.get(`/issues/${issueId}/comments`);
    return response.data;
  },

  addComment: async (issueId, payload) => {
    const response = await api.post(`/issues/${issueId}/comments`, payload);
    return response.data;
  }
};

export const analyticsApi = {
  getAnalytics: async () => {
    const response = await api.get('/analytics');
    return response.data;
  }
};

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
