// 请求工具封装
const BASE_URL = 'https://fsgcolwltvbb.sealoshzh.site'

/**
 * 统一请求方法
 * @param {string} url - 请求路径
 * @param {object} options - 请求配置
 * @returns {Promise}
 */
export function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestConfig = {
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header
      }
    }

    // 自动添加 Authorization Header
    const token = uni.getStorageSync('token')
    if (token) {
      requestConfig.header['Authorization'] = 'Bearer ' + token
    }

    // 调试日志：打印完整请求信息
    console.log('========== 请求开始 ==========')
    console.log('请求 URL:', requestConfig.url)
    console.log('请求方法:', requestConfig.method)
    console.log('请求头:', requestConfig.header)
    console.log('请求体:', requestConfig.data)
    console.log('================================')

    uni.request({
      ...requestConfig,
      success: (res) => {
        // 调试日志：打印响应信息
        console.log('========== 响应返回 ==========')
        console.log('响应状态码:', res.statusCode)
        console.log('响应数据:', res.data)
        console.log('================================')

        // 特殊处理：搜题接口返回阿里云原始格式
        if (url === '/api/search') {
          // 阿里云返回格式：{ showapi_res_body: { ret_code, remark, data } }
          if (res.statusCode === 200 || res.statusCode === 450) {
            // 检查是否是阿里云格式
            if (res.data.showapi_res_body) {
              const body = res.data.showapi_res_body

              // 检查业务状态码
              if (body.ret_code === 0) {
                // 成功
                resolve(res.data)
              } else {
                // 阿里云业务错误
                const errorMsg = body.remark || '识别失败'
                console.log('阿里云业务错误:', body)
                uni.showToast({
                  title: errorMsg,
                  icon: 'none',
                  duration: 2000
                })
                reject(res.data)
              }
            } else {
              // 其他格式直接返回
              resolve(res.data)
            }
          } else if (res.statusCode === 400) {
            // 参数错误
            const errorMsg = res.data.message || '参数错误'
            uni.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 2000
            })
            reject(res.data)
          } else if (res.statusCode === 502) {
            // 网络错误
            const errorMsg = res.data.message || '服务异常'
            uni.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 2000
            })
            reject(res.data)
          } else {
            // 其他错误
            const errorMsg = res.data.remark || res.data.message || '请求失败'
            uni.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 2000
            })
            reject(res.data)
          }
          return
        }

        // 常规接口处理
        const { code, message, data } = res.data

        if (code === 200) {
          resolve({ code, message, data })
        } else {
          // 业务错误
          uni.showToast({
            title: message || '请求失败',
            icon: 'none',
            duration: 2000
          })
          reject({ code, message, data })
        }
      },
      fail: (err) => {
        // 网络错误
        uni.showToast({
          title: '网络请求失败',
          icon: 'none',
          duration: 2000
        })
        reject(err)
      }
    })
  })
}

/**
 * GET 请求
 */
export function get(url, params = {}) {
  return request(url, {
    method: 'GET',
    data: params
  })
}

/**
 * POST 请求
 */
export function post(url, data = {}) {
  return request(url, {
    method: 'POST',
    data
  })
}
