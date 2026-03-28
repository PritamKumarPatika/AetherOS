// AetherOS — API Utility
const API_BASE = '';

async function api(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }
  
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
      return;
    }
    
    if (endpoint.includes('/export/')) return res;
    
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      const errorMsg = data.error || data.message || `Server Error (${res.status})`;
      if (typeof window.showToast === 'function') window.showToast(errorMsg, 'error');
      return { error: errorMsg };
    }
    
    return data;
  } catch (err) {
    if (typeof window.showToast === 'function') window.showToast('Network error. Please check your connection.', 'error');
    console.error(`API Error on ${endpoint}:`, err);
    return { error: 'Network disconnected' };
  }
}

const API = {
  // Auth
  getUser: () => api('/api/auth/user'),
  register: (data) => api('/api/auth/register', { method: 'POST', body: data }),
  login: (data) => api('/api/auth/login', { method: 'POST', body: data }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  },
  updateSettings: (settings) => api('/api/auth/settings', { method: 'PUT', body: { settings } }),

  // Tasks
  getTasks: (params = '') => api(`/api/tasks${params ? '?' + params : ''}`),
  createTask: (data) => api('/api/tasks', { method: 'POST', body: data }),
  updateTask: (id, data) => api(`/api/tasks/${id}`, { method: 'PUT', body: data }),
  deleteTask: (id) => api(`/api/tasks/${id}`, { method: 'DELETE' }),
  addSubtask: (id, data) => api(`/api/tasks/${id}/subtask`, { method: 'POST', body: data }),
  trackTime: (id, minutes) => api(`/api/tasks/${id}/time`, { method: 'PUT', body: { minutes } }),

  // Projects
  getProjects: () => api('/api/projects'),
  getProject: (id) => api(`/api/projects/${id}`),
  createProject: (data) => api('/api/projects', { method: 'POST', body: data }),
  updateProject: (id, data) => api(`/api/projects/${id}`, { method: 'PUT', body: data }),
  deleteProject: (id) => api(`/api/projects/${id}`, { method: 'DELETE' }),
  getSubProjects: (pid) => api(`/api/projects/${pid}/subprojects`),
  createSubProject: (pid, data) => api(`/api/projects/${pid}/subprojects`, { method: 'POST', body: data }),
  getProjectTasks: (pid) => api(`/api/projects/${pid}/tasks`),
  getProjectNotes: (pid) => api(`/api/projects/${pid}/notes`),
  createProjectNote: (pid, data) => api(`/api/projects/${pid}/notes`, { method: 'POST', body: data }),
  getProjectNote: (nid) => api(`/api/projects/notes/${nid}`),
  updateProjectNote: (nid, data) => api(`/api/projects/notes/${nid}`, { method: 'PUT', body: data }),
  deleteProjectNote: (nid) => api(`/api/projects/notes/${nid}`, { method: 'DELETE' }),
  getProjectAttachments: (pid) => api(`/api/projects/${pid}/attachments`),
  deleteProjectAttachment: (aid) => api(`/api/projects/attachments/${aid}`, { method: 'DELETE' }),
  uploadProjectAttachment: async (pid, file) => {
    const form = new FormData();
    form.append('file', file);
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`/api/projects/${pid}/attachments`, { method: 'POST', body: form, headers });
    return res.json();
  },

  // Meetings
  getMeetings: (date) => api(`/api/meetings${date ? '?date=' + date : ''}`),
  createMeeting: (data) => api('/api/meetings', { method: 'POST', body: data }),
  updateMeeting: (id, data) => api(`/api/meetings/${id}`, { method: 'PUT', body: data }),
  deleteMeeting: (id) => api(`/api/meetings/${id}`, { method: 'DELETE' }),

  // Study
  getSubjects: () => api('/api/study/subjects'),
  createSubject: (data) => api('/api/study/subjects', { method: 'POST', body: data }),
  updateSubject: (id, data) => api(`/api/study/subjects/${id}`, { method: 'PUT', body: data }),
  deleteSubject: (id) => api(`/api/study/subjects/${id}`, { method: 'DELETE' }),
  getTopics: (subjectId) => api(`/api/study/subjects/${subjectId}/topics`),
  getAllTopics: () => api('/api/study/topics'),
  createTopic: (data) => api('/api/study/topics', { method: 'POST', body: data }),
  updateTopic: (id, data) => api(`/api/study/topics/${id}`, { method: 'PUT', body: data }),
  deleteTopic: (id) => api(`/api/study/topics/${id}`, { method: 'DELETE' }),
  addSubtopic: (tid, data) => api(`/api/study/topics/${tid}/subtopics`, { method: 'POST', body: data }),
  updateSubtopic: (tid, sid, data) => api(`/api/study/topics/${tid}/subtopics/${sid}`, { method: 'PUT', body: data }),
  deleteSubtopic: (tid, sid) => api(`/api/study/topics/${tid}/subtopics/${sid}`, { method: 'DELETE' }),
  saveTopicNotes: (tid, html) => api(`/api/study/topics/${tid}/notes`, { method: 'PUT', body: { notes_content: html } }),
  getAllNotes: () => api('/api/study/notes'),
  getNotes: (subjectId) => api(`/api/study/subjects/${subjectId}/notes`),
  createNote: (data) => api('/api/study/notes', { method: 'POST', body: data }),
  updateNote: (id, data) => api(`/api/study/notes/${id}`, { method: 'PUT', body: data }),
  deleteNote: (id) => api(`/api/study/notes/${id}`, { method: 'DELETE' }),
  toggleNotePin: (id) => api(`/api/study/notes/${id}/pin`, { method: 'PATCH' }),
  getRevisions: (params) => api(`/api/study/revisions?${params}`),
  createRevision: (data) => api('/api/study/revisions', { method: 'POST', body: data }),
  getGoals: (subjectId) => api(`/api/study/goals${subjectId ? '?subject_id='+subjectId : ''}`),
  createGoal: (data) => api('/api/study/goals', { method: 'POST', body: data }),
  updateGoal: (id, data) => api(`/api/study/goals/${id}`, { method: 'PUT', body: data }),
  deleteGoal: (id) => api(`/api/study/goals/${id}`, { method: 'DELETE' }),
  getStreaks: () => api('/api/study/streaks'),
  logStudyTime: (data) => api('/api/study/streaks', { method: 'POST', body: data }),
  getPaths: () => api('/api/study/paths'),
  createPath: (data) => api('/api/study/paths', { method: 'POST', body: data }),
  updatePath: (id, data) => api(`/api/study/paths/${id}`, { method: 'PUT', body: data }),
  deletePath: (id) => api(`/api/study/paths/${id}`, { method: 'DELETE' }),
  completeCheckpoint: (pid, idx) => api(`/api/study/paths/${pid}/checkpoint/${idx}`, { method: 'POST' }),
  
  // Badges & Rewards
  getAllBadges: () => api('/api/study/badges/all'),
  getEarnedBadges: () => api('/api/study/badges/earned'),
  getStudyProfile: () => api('/api/study/profile'),
  awardXP: (amount, reason) => api('/api/study/xp', { method: 'POST', body: { amount, reason } }),

  // Analytics
  getAnalytics: (period) => api(`/api/analytics/${period}`),

  // AI
  askAI: (query, context) => api('/api/ai/ask', { method: 'POST', body: { query, context } }),

  // Reminders
  getReminders: () => api('/api/reminders'),

  // Export
  exportTasks: () => api('/api/export/tasks'),
  exportProjects: () => api('/api/export/projects'),
};
