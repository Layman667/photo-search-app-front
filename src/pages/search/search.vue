<template>
  <view class="search-container">
    <view class="content">
      <view class="header">
        <text class="title">搜题</text>
        <text class="subtitle">拍照搜题，秒出答案</text>
      </view>

      <view class="search-box">
        <view class="search-input-wrapper">
          <text class="search-icon">🔍</text>
          <input
            class="search-input"
            type="text"
            placeholder="输入题目关键词搜索"
            v-model="searchKeyword"
            @confirm="handleSearch"
          />
        </view>
        <button class="search-btn" @click="handleSearch">搜索</button>
      </view>

      <!-- 打卡卡片 -->
      <view class="checkin-card" @click="handleCheckin">
        <view class="checkin-left">
          <text class="checkin-icon">✅</text>
          <view class="checkin-info">
            <text class="checkin-title">学习打卡</text>
            <text class="checkin-desc" v-if="checkinStatus.todayChecked">今日已打卡</text>
            <text class="checkin-desc" v-else>坚持学习，每日打卡</text>
          </view>
        </view>
        <view class="checkin-right">
          <text class="checkin-days">{{ checkinStatus.continuousDays }}</text>
          <text class="checkin-label">连续天数</text>
        </view>
      </view>

      <view class="camera-section">
        <view class="camera-card" @click="handleCamera">
          <text class="camera-icon">📷</text>
          <text class="camera-text">拍照搜题</text>
          <text class="camera-desc">对准题目拍照，快速找答案</text>
        </view>
        <view class="camera-card" @click="handleAlbum">
          <text class="camera-icon">🖼️</text>
          <text class="camera-text">相册选题</text>
          <text class="camera-desc">从相册选择题目图片</text>
        </view>
        <view class="camera-card ai-card" @click="handleAIChat">
          <text class="camera-icon">🤖</text>
          <text class="camera-text">AI 对话</text>
          <text class="camera-desc">与智能助手对话交流</text>
        </view>
      </view>

      <view class="history-section" v-if="searchHistory.length > 0">
        <view class="section-header">
          <text class="section-title">搜索历史</text>
          <text class="clear-btn" @click="clearHistory">清空</text>
        </view>
        <view class="history-list">
          <view
            class="history-item"
            v-for="(item, index) in searchHistory"
            :key="index"
            @click="searchKeyword = item"
          >
            <text class="history-icon">🕐</text>
            <text class="history-text">{{ item }}</text>
          </view>
        </view>
      </view>
    </view>

    <CustomTabBar :current="0" />
  </view>
</template>

<script>
import CustomTabBar from '@/components/CustomTabBar.vue'
import { searchQuestion } from '@/api/user'

export default {
  components: {
    CustomTabBar
  },
  data() {
    return {
      searchKeyword: '',
      searchHistory: [],
      checkinStatus: {
        todayChecked: false,
        continuousDays: 0,
        totalDays: 0
      }
    }
  },
  onLoad() {
    this.loadHistory()
    this.loadCheckinStatus()
  },
  onShow() {
    this.loadCheckinStatus()
  },
  methods: {
    async handleSearch() {
      if (!this.searchKeyword.trim()) {
        uni.showToast({
          title: '请输入搜索内容',
          icon: 'none'
        })
        return
      }

      // 保存搜索历史
      this.saveHistory(this.searchKeyword.trim())

      // 显示加载提示
      uni.showLoading({
        title: '搜索中...'
      })

      try {
        // 调用搜题接口（文本搜题）
        const result = await searchQuestion({
          text: this.searchKeyword.trim()
        })

        // 跳转到结果页面
        this.goToResult(result)

      } catch (error) {
        console.error('搜题失败:', error)
      } finally {
        // 确保 hideLoading 一定会被调用
        uni.hideLoading()
      }
    },
    handleCamera() {
      // 调用相机拍照
      uni.chooseImage({
        count: 1,
        sourceType: ['camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0]
          this.uploadAndSearch(tempFilePath)
        },
        fail: (err) => {
          console.error('拍照失败:', err)
        }
      })
    },
    handleAlbum() {
      // 从相册选择
      uni.chooseImage({
        count: 1,
        sourceType: ['album'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0]
          this.uploadAndSearch(tempFilePath)
        },
        fail: (err) => {
          console.error('选择图片失败:', err)
        }
      })
    },
    async uploadAndSearch(filePath) {
      uni.showLoading({
        title: '识别中...'
      })

      try {
        // 将图片转为 Base64（带前缀）
        const base64 = await this.fileToBase64(filePath)

        // 调用搜题接口（图片搜题）
        const result = await searchQuestion({
          image_base64: base64
        })

        // 跳转到结果页面，传递 base64 图片（避免 blob URL 失效问题）
        this.goToResult(result, base64)

      } catch (error) {
        console.error('图片搜题失败:', error)
      } finally {
        // 确保 hideLoading 一定会被调用
        uni.hideLoading()
      }
    },
    fileToBase64(filePath) {
      return new Promise((resolve, reject) => {
        // #ifdef H5
        // H5 环境：使用 Canvas 转换图片
        uni.getImageInfo({
          src: filePath,
          success: (info) => {
            // 创建 canvas 转换图片
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()

            img.crossOrigin = 'anonymous'
            img.onload = () => {
              canvas.width = img.width
              canvas.height = img.height
              ctx.drawImage(img, 0, 0)

              // 转为 base64（带前缀 data:image/jpeg;base64,）
              let base64WithPrefix = canvas.toDataURL('image/jpeg', 0.8)

              // 关键修复：清理 base64 字符串，移除所有空白字符和换行符
              base64WithPrefix = base64WithPrefix
                .replace(/\s/g, '')           // 移除所有空白字符（包括换行符、空格、制表符）
                .replace(/[\n\r]/g, '')       // 额外移除换行符
                .trim()                       // 去除首尾空格

              console.log('清理后的 base64 长度:', base64WithPrefix.length)
              console.log('是否包含换行符:', base64WithPrefix.includes('\n'))
              console.log('base64 前缀:', base64WithPrefix.substring(0, 30))

              resolve(base64WithPrefix)
            }

            img.onerror = (err) => {
              reject(err)
            }

            img.src = filePath
          },
          fail: (err) => {
            reject(err)
          }
        })
        // #endif

        // #ifndef H5
        // 小程序/App 环境：使用文件系���
        uni.getFileSystemManager().readFile({
          filePath: filePath,
          encoding: 'base64',
          success: (res) => {
            // 清理 base64 字符串
            let cleanBase64 = res.data
              .replace(/\s/g, '')
              .replace(/[\n\r]/g, '')
              .trim()

            // 添加前缀
            const base64WithPrefix = 'data:image/jpeg;base64,' + cleanBase64

            console.log('清理后的 base64 长度:', base64WithPrefix.length)
            console.log('是否包含换行符:', base64WithPrefix.includes('\n'))

            resolve(base64WithPrefix)
          },
          fail: (err) => {
            reject(err)
          }
        })
        // #endif
      })
    },
    goToResult(result, imagePath = '') {
      // 提取结果数据，适配阿里云返回格式
      let resultData = {}

      console.log('原始结果数据:', result)

      // 阿里云格式：{ showapi_res_body: { ret_code, remark, answer } }
      if (result.showapi_res_body) {
        const body = result.showapi_res_body

        // 检查是否成功
        if (body.ret_code === 0) {
          // 成功，提取答案
          resultData = {
            answer: body.answer || '暂无答案',
            remark: body.remark || '',
            imagePath: imagePath  // 添加图片路径
          }
        } else {
          // 失败，显示错误信息
          const errorMsg = body.remark || result.showapi_res_error || '识别失败'
          uni.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          })
          return
        }
      }
      // 兼容其他格式
      else if (result.data) {
        resultData = result.data
        resultData.imagePath = imagePath
      } else if (result.question || result.answer) {
        resultData = result
        resultData.imagePath = imagePath
      }

      console.log('处理后的结果数据:', resultData)

      // 跳转到结果页面，添加 fromSearch 标识
      uni.navigateTo({
        url: '/pages/result/result?fromSearch=true&result=' + encodeURIComponent(JSON.stringify(resultData))
      })
    },
    saveHistory(keyword) {
      if (!this.searchHistory.includes(keyword)) {
        this.searchHistory.unshift(keyword)
        if (this.searchHistory.length > 10) {
          this.searchHistory.pop()
        }
        uni.setStorageSync('searchHistory', this.searchHistory)
      }
    },
    loadHistory() {
      const history = uni.getStorageSync('searchHistory')
      if (history) {
        this.searchHistory = history
      }
    },
    clearHistory() {
      uni.showModal({
        title: '提示',
        content: '确定清空搜索历史吗？',
        success: (res) => {
          if (res.confirm) {
            this.searchHistory = []
            uni.removeStorageSync('searchHistory')
          }
        }
      })
    },
    handleAIChat() {
      uni.navigateTo({
        url: '/pages/chat/chat'
      })
    },
    async loadCheckinStatus() {
      try {
        const token = uni.getStorageSync('token')
        if (!token) return
        const res = await uni.request({
          url: 'https://fsgcolwltvbb.sealoshzh.site/api/checkin/status',
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        const { data } = res
        if (data && data.code === 200 && data.data) {
          this.checkinStatus = {
            todayChecked: data.data.todayChecked,
            continuousDays: data.data.continuousDays,
            totalDays: data.data.totalDays
          }
        }
      } catch (e) {
        console.error('获取打卡状态失败:', e)
      }
    },
    handleCheckin() {
      uni.navigateTo({
        url: '/pages/checkin/checkin'
      })
    }
  }
}
</script>

<style scoped>
.search-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4ff 0%, #ffffff 100%);
  padding-bottom: 120rpx;
}

.content {
  padding: 40rpx 30rpx;
}

.header {
  margin-bottom: 40rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 12rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #6b7280;
}

.search-box {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
  gap: 20rpx;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 0 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.search-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.search-input {
  flex: 1;
  height: 88rpx;
  font-size: 28rpx;
  color: #1f2937;
}

.search-btn {
  height: 88rpx;
  padding: 0 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 28rpx;
  border-radius: 24rpx;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

/* 打卡卡片 */
.checkin-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  padding: 32rpx 36rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.35);
  active-opacity: 0.85;
}

.checkin-card:active {
  transform: scale(0.97);
}

.checkin-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.checkin-icon {
  font-size: 56rpx;
}

.checkin-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.checkin-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}

.checkin-desc {
  font-size: 24rpx;
  color: rgba(255,255,255,0.8);
}

.checkin-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255,255,255,0.2);
  border-radius: 16rpx;
  padding: 12rpx 24rpx;
}

.checkin-days {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  line-height: 1;
}

.checkin-label {
  font-size: 22rpx;
  color: rgba(255,255,255,0.85);
  margin-top: 4rpx;
}

.camera-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 50rpx;
}

.camera-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx 20rpx;
  text-align: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.camera-card.ai-card {
  grid-column: 1 / -1;
}

.camera-card:active {
  transform: scale(0.96);
}

.camera-icon {
  display: block;
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.camera-text {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 8rpx;
}

.camera-desc {
  display: block;
  font-size: 24rpx;
  color: #9ca3af;
}

.history-section {
  margin-top: 40rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1f2937;
}

.clear-btn {
  font-size: 26rpx;
  color: #6b7280;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.history-item {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.history-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.history-text {
  font-size: 26rpx;
  color: #4b5563;
}
</style>
