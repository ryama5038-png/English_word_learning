import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const authApi = {
  getMe: () => api.get('/auth/me').then((r) => r.data),
  login: (username, password) =>
    api.post('/auth/login', { username, password }).then((r) => r.data),
  register: (username, password) =>
    api.post('/auth/register', { username, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};

export const petApi = {
  getIdleTalk: (excludeWordId) =>
    api
      .get('/pet/idle-talk', {
        params: excludeWordId ? { exclude_word_id: excludeWordId } : {},
      })
      .then((r) => r.data),
  performAction: (actionType, targetEnergy = null) =>
    api
      .post('/pet/action', {
        action_type: actionType,
        target_energy: targetEnergy,
      })
      .then((r) => r.data),
};

export const wordsApi = {
  getStats: () => api.get('/words/stats').then((r) => r.data),
  search: ({ q = '', level = 'all', myBookOnly = false, recentOnly = false, recordSearch = false }) =>
    api
      .get('/words', {
        params: {
          q,
          level,
          my_book_only: myBookOnly,
          recent_only: recentOnly,
          record_search: recordSearch,
        },
      })
      .then((r) => r.data),
  logSearch: (wordId) =>
    api.post(`/words/${wordId}/search-log`).then((r) => r.data),
  createCustom: (payload) =>
    api.post('/words/custom', payload).then((r) => r.data),
  toggleBook: (wordId) =>
    api.post(`/words/${wordId}/toggle-book`).then((r) => r.data),
};

export const quizApi = {
  getQuestions: (category = 'basic', count = 5) =>
    api
      .get('/quiz/questions', { params: { category, count } })
      .then((r) => r.data),
  submitQuiz: (category, answers) =>
    api
      .post('/quiz/submit', { category, answers })
      .then((r) => r.data),
};

export default api;
