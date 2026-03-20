import { post } from '@/utils/request'

/**
 * DeepSeek 对话接口
 * @param {Object} params - 请求参数
 * @param {Array} params.messages - 消息列表（用法A）
 * @param {string} params.text - 文本内容（用法B）
 * @param {Array} params.images - 图片列表（用法B）
 * @param {number} params.max_tokens - 最大token数
 * @param {number} params.temperature - 温度参数
 * @returns {Promise}
 */
export function chatWithDeepSeek(params) {
  return post('/api/deepseek/chat', {
    model: 'deepseek-chat',
    max_tokens: params.max_tokens || 1024,
    temperature: params.temperature || 0.7,
    ...params
  })
}
