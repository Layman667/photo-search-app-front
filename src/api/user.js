import { post } from '@/utils/request'

/**
 * 用户注册
 * @param {string} username - 用户账号，长度 4-20
 * @param {string} password - 用户密码，长度 6-20
 * @returns {Promise}
 */
export function register(username, password) {
  return post('/api/user/register', {
    username,
    password
  })
}

/**
 * 用户登录
 * @param {string} username - 用户账号
 * @param {string} password - 用户密码
 * @param {boolean} remember - 是否记住密码
 * @returns {Promise}
 */
export function login(username, password, remember = false) {
  return post('/api/user/login', {
    username,
    password,
    remember
  })
}

/**
 * 忘记密码（预留）
 * @param {string} username - 用户账号
 * @param {string} email - 用户邮箱
 * @returns {Promise}
 */
export function forgotPassword(username, email) {
  return post('/api/user/forgot-password', {
    username,
    email
  })
}

/**
 * 拍照搜题
 * @param {Object} params - 搜题参数
 * @param {string} params.text - 题目文本（可选）
 * @param {string} params.image_base64 - 图片 Base64（可选）
 * @param {string} params.image_url - 图片 URL（可选）
 * @returns {Promise}
 */
export function searchQuestion(params) {
  return post('/api/search', params)
}
