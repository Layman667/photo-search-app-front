import { get, post, request } from '@/utils/request'

/**
 * 添加搜题记录
 * @param {string} questionImage - 题目图片
 * @param {string} analysis - 答案解析
 * @returns {Promise}
 */
export function addHistory(questionImage, analysis) {
  return post('/api/history/add', {
    questionImage,
    analysis
  })
}

/**
 * 获取搜题历史列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页条数
 * @returns {Promise}
 */
export function getHistoryList(page = 1, pageSize = 20) {
  return get('/api/history/list', { page, pageSize })
}

/**
 * 删除单条搜题记录
 * @param {string} historyId - 历史记录ID
 * @returns {Promise}
 */
export function deleteHistory(historyId) {
  return request('/api/history/' + historyId, { method: 'DELETE' })
}

/**
 * 清空搜题历史
 * @returns {Promise}
 */
export function clearHistory() {
  return request('/api/history/clear', { method: 'DELETE' })
}

/**
 * 收藏题目
 * @param {string} questionImage - 题目图片
 * @param {string} analysis - 答案解析
 * @returns {Promise}
 */
export function addFavorite(questionImage, analysis) {
  return post('/api/favorite/add', {
    questionImage,
    analysis
  })
}

/**
 * 获取收藏列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页条数
 * @returns {Promise}
 */
export function getFavoriteList(page = 1, pageSize = 20) {
  return get('/api/favorite/list', { page, pageSize })
}

/**
 * 取消收藏
 * @param {string} favoriteId - 收藏ID
 * @returns {Promise}
 */
export function deleteFavorite(favoriteId) {
  return request('/api/favorite/' + favoriteId, { method: 'DELETE' })
}

/**
 * 批量取消收藏
 * @param {Array} favoriteIds - 收藏ID数组
 * @returns {Promise}
 */
export function batchRemoveFavorite(favoriteIds) {
  return post('/api/favorite/batch-remove', {
    favoriteIds
  })
}

/**
 * 添加错题
 * @param {string} questionImage - 题目图片
 * @param {string} analysis - 答案解析
 * @returns {Promise}
 */
export function addWrong(questionImage, analysis) {
  return post('/api/wrong/add', {
    questionImage,
    analysis
  })
}

/**
 * 获取错题列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页条数
 * @returns {Promise}
 */
export function getWrongList(page = 1, pageSize = 20) {
  return get('/api/wrong/list', { page, pageSize })
}

/**
 * 删除错题
 * @param {string} wrongId - 错题ID
 * @returns {Promise}
 */
export function deleteWrong(wrongId) {
  return request('/api/wrong/' + wrongId, { method: 'DELETE' })
}

/**
 * 清空错题本
 * @returns {Promise}
 */
export function clearWrong() {
  return request('/api/wrong/clear', { method: 'DELETE' })
}
