import api from './axios';

export const analyticsApi = {
  getAnalytics: async () => {
    const response = await api.get('/analytics');
    return response.data;
  }
};
