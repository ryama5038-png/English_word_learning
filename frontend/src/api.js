import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const authApi = {
  getMe: () => api.get('/auth/me').then((r) => r.data),
  login: (username, password) =>
    api.post('/auth/login', { username, password }).then((r) => r.data),
  register: (username, password, characterType = null) =>
    api
      .post('/auth/register', {
        username,
        password,
        character_type: characterType,
      })
      .then((r) => r.data),
  selectCharacter: (characterType) =>
    api
      .post('/auth/character', { character_type: characterType })
      .then((r) => r.data),
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
  search: ({
    q = '',
    level = 'all',
    myBookOnly = false,
    bookmarkedOnly = false,
    recentOnly = false,
    recordSearch = false,
    limit = 150,
    offset = 0,
  }) =>
    api
      .get('/words', {
        params: {
          q,
          level,
          my_book_only: myBookOnly,
          bookmarked_only: bookmarkedOnly,
          recent_only: recentOnly,
          record_search: recordSearch,
          limit,
          offset,
        },
      })
      .then((r) => r.data),
  getVocabBook: ({
    mode = 'all',
    level = 'all',
    bookmarkedOnly = false,
    q = '',
    sortBy = 'id',
    limit = 30,
    offset = 0,
  }) =>
    api
      .get('/words/mybook', {
        params: {
          mode,
          level,
          bookmarked_only: bookmarkedOnly,
          q,
          sort_by: sortBy,
          limit,
          offset,
        },
      })
      .then((r) => r.data),
  getStudyPosition: () => api.get('/words/study-position').then((r) => r.data),
  saveStudyPosition: ({ lastStudiedWordId = null, lastStudiedOffset = 0 }) =>
    api
      .put('/words/study-position', {
        last_studied_word_id: lastStudiedWordId,
        last_studied_offset: lastStudiedOffset,
      })
      .then((r) => r.data),
  toggleBookmark: (wordId, isBookmarked = null) =>
    api
      .post(
        `/words/${wordId}/bookmark`,
        isBookmarked !== null ? { is_bookmarked: isBookmarked } : {}
      )
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
      .get('/quiz/questions', { params: { mode: category, category, limit: count, count } })
      .then((r) => r.data),
  getRangeQuestions: ({ startNum, endNum, limit = null }) =>
    api
      .post('/quiz/questions', {
        mode: 'range',
        start_num: Number(startNum),
        end_num: Number(endNum),
        limit: limit ? Number(limit) : null,
      })
      .then((r) => r.data),
  submitQuiz: (category, answers) =>
    api
      .post('/quiz/submit', { category, answers })
      .then((r) => r.data),
};

export default api;
