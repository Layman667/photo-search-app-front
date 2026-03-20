<template>
  <view class="profile-container">
    <view class="content">
      <view class="header-bg">
        <view class="user-card">
          <view class="avatar">{{ userInfo.avatar }}</view>
          <view class="user-info">
            <text class="username">{{ userInfo.username }}</text>
            <text class="user-id">ID: {{ userInfo.userId }}</text>
          </view>
        </view>
      </view>

      <view class="stats-section">
        <view class="stat-item">
          <text class="stat-number">{{ userStats.questions }}</text>
          <text class="stat-label">我的提问</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ userStats.answers }}</text>
          <text class="stat-label">我的回答</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ userStats.collections }}</text>
          <text class="stat-label">我的收藏</text>
        </view>
      </view>

      <view class="menu-section">
        <view class="menu-item" @click="handleMenuItem('history')">
          <text class="menu-icon">📚</text>
          <text class="menu-text">搜题历史</text>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @click="handleMenuItem('favorites')">
          <text class="menu-icon">⭐</text>
          <text class="menu-text">我的收藏</text>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @click="handleMenuItem('mistakes')">
          <text class="menu-icon">📖</text>
          <text class="menu-text">错题本</text>
          <text class="menu-arrow">→</text>
        </view>
        <view class="menu-item" @click="handleMenuItem('settings')">
          <text class="menu-icon">⚙️</text>
          <text class="menu-text">设置</text>
          <text class="menu-arrow">���</text>
        </view>
        <view class="menu-item" @click="handleMenuItem('about')">
          <text class="menu-icon">ℹ️</text>
          <text class="menu-text">关于我们</text>
          <text class="menu-arrow">→</text>
        </view>
      </view>

      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>

    <CustomTabBar :current="2" />
  </view>
</template>

<script>
import CustomTabBar from '@/components/CustomTabBar.vue'

export default {
  components: {
    CustomTabBar
  },
  data() {
    return {
      userInfo: {
        avatar: '👤',
        username: '加载中...',
        userId: ''
      },
      userStats: {
        questions: 0,
        answers: 0,
        collections: 0
      }
    }
  },
  onShow() {
    this.loadUserInfo()
  },
  methods: {
    loadUserInfo() {
      const username = uni.getStorageSync('username')
      const userId = uni.getStorageSync('userId')

      if (username && userId) {
        this.userInfo.username = username
        this.userInfo.userId = userId
      }

      // TODO: 从接口获取用户统计数据
    },
    handleMenuItem(type) {
      let url = ''
      switch (type) {
        case 'history':
          url = '/pages/history/history'
          break
        case 'favorites':
          url = '/pages/favorites/favorites'
          break
        case 'mistakes':
          url = '/pages/wrong/wrong'
          break
        case 'settings':
        case 'about':
          uni.showToast({
            title: '功能开发中',
            icon: 'none'
          })
          return
      }
      if (url) {
        uni.navigateTo({ url })
      }
    },
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除本地存储
            uni.removeStorageSync('token')
            uni.removeStorageSync('userId')
            uni.removeStorageSync('username')

            // 跳转到登录页
            uni.reLaunch({
              url: '/pages/login/login'
            })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: #f9fafb;
  padding-bottom: 120rpx;
}

.content {
  min-height: 100vh;
}

.header-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 30rpx 100rpx;
}

.user-card {
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64rpx;
  margin-right: 30rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.user-info {
  flex: 1;
}

.username {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 12rpx;
}

.user-id {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.stats-section {
  display: flex;
  background: #ffffff;
  margin: -60rpx 30rpx 30rpx;
  border-radius: 24rpx;
  padding: 40rpx 0;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.stat-item {
  flex: 1;
  text-align: center;
  border-right: 2rpx solid #e5e7eb;
}

.stat-item:last-child {
  border-right: none;
}

.stat-number {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 12rpx;
}

.stat-label {
  display: block;
  font-size: 26rpx;
  color: #6b7280;
}

.menu-section {
  background: #ffffff;
  margin: 0 30rpx 30rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx 30rpx;
  border-bottom: 2rpx solid #f3f4f6;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 40rpx;
  margin-right: 24rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #1f2937;
}

.menu-arrow {
  font-size: 32rpx;
  color: #9ca3af;
}

.logout-btn {
  width: calc(100% - 60rpx);
  height: 96rpx;
  background: #ffffff;
  color: #ef4444;
  font-size: 32rpx;
  border-radius: 24rpx;
  border: 2rpx solid #fecaca;
  margin: 0 30rpx;
}
</style>
