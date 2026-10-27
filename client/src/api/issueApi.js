import api from './axios';

export const issueApi = {
  getIssues: async (params = {}) => {
    const response = await api.get('/issues', { params });
    return response.data;
  },

  getIssueById: async (id) => {
    const response = await api.get(`/issues/${id}`);
    return response.data;
  },

  createIssue: async (data, isFormData = false) => {
    const response = await api.post('/issues', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data;
  },

  updateIssueStatus: async (id, payload) => {
    const response = await api.patch(`/issues/${id}/status`, payload);
    return response.data;
  },

  assignIssue: async (id, payload) => {
    const response = await api.patch(`/issues/${id}/assign`, payload);
    return response.data;
  },

  updatePriority: async (id, payload) => {
    const response = await api.patch(`/issues/${id}/priority`, payload);
    return response.data;
  },

  checkDuplicates: async (payload) => {
    const response = await api.post('/issues/check-duplicates', payload);
    return response.data;
  }
};
