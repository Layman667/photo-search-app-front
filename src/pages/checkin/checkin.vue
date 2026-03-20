<template>
  <view class="checkin-container">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <text class="back-btn" @click="goBack">←</text>
      <text class="nav-title">学习打卡</text>
      <view class="placeholder"></view>
    </view>

    <!-- 主内容区 -->
    <view class="content">
      <!-- 打卡状态卡片 -->
      <view class="status-card">
        <view class="status-icon">
          <text class="icon-emoji">{{ checkinStatus.todayChecked ? '✅' : '📅' }}</text>
        </view>
        <text class="status-title">{{ checkinStatus.todayChecked ? '今日已打卡' : '今日未打卡' }}</text>
        <text class="status-desc">{{ checkinStatus.todayChecked ? '继续保持，明天再来' : '点击下方按钮完成打卡' }}</text>

        <!-- 统计信息 -->
        <view class="stats-row">
          <view class="stat-item">
            <text class="stat-value">{{ checkinStatus.continuousDays }}</text>
            <text class="stat-label">连续天数</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ checkinStatus.totalDays }}</text>
            <text class="stat-label">累计天数</text>
          </view>
        </view>
      </view>

      <!-- 打卡按钮 -->
      <button
        class="checkin-btn"
        :class="{ 'disabled': checkinStatus.todayChecked || isChecking }"
        :disabled="checkinStatus.todayChecked || isChecking"
        @click="handleCheckin"
      >
        <text v-if="isChecking">打卡中...</text>
        <text v-else-if="checkinStatus.todayChecked">已完成打卡</text>
        <text v-else>立即打卡</text>
      </button>

      <!-- 打卡日历 -->
      <view class="calendar-section">
        <text class="section-title">打卡日历</text>
        <view class="calendar-grid">
          <view
            class="calendar-day"
            v-for="(day, index) in calendarDays"
            :key="index"
            :class="{ 'checked': day.checked, 'today': day.isToday }"
          >
            <text class="day-number">{{ day.day }}</text>
            <text class="day-mark" v-if="day.checked">✓</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 庆祝动效 -->
    <view class="celebration-overlay" v-if="showCelebration" @click="closeCelebration">
      <view class="celebration-content">
        <text class="celebration-emoji">🎉</text>
        <text class="celebration-title">打卡成功！</text>
        <text class="celebration-message">已连续打卡 {{ checkinStatus.continuousDays }} 天</text>
        <text class="celebration-encourage">{{ encourageText }}</text>

        <!-- 烟花效果 -->
        <view class="fireworks">
          <view class="firework" v-for="i in 20" :key="i" :style="getFireworkStyle(i)"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      checkinStatus: {
        todayChecked: false,
        continuousDays: 0,
        totalDays: 0,
        lastCheckinTime: ''
      },
      isChecking: false,
      showCelebration: false,
      calendarDays: []
    }
  },
  computed: {
    encourageText() {
      const days = this.checkinStatus.continuousDays
      if (days >= 30) return '坚持不懈，你真棒！'
      if (days >= 14) return '半个月了，继续加油！'
      if (days >= 7) return '一周达成，再接再厉！'
      if (days >= 3) return '连续三天，很不错！'
      return '开始你的学习之旅！'
    }
  },
  onLoad() {
    this.loadCheckinStatus()
    this.generateCalendar()
  },
  methods: {
    async loadCheckinStatus() {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          })
          setTimeout(() => {
            uni.navigateTo({
              url: '/pages/login/login'
            })
          }, 1500)
          return
        }

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
            totalDays: data.data.totalDays,
            lastCheckinTime: data.data.lastCheckinTime
          }
        }
      } catch (e) {
        console.error('获取打卡状态失败:', e)
        uni.showToast({
          title: '获取状态失败',
          icon: 'none'
        })
      }
    },
    async handleCheckin() {
      if (this.checkinStatus.todayChecked || this.isChecking) return

      this.isChecking = true

      try {
        const token = uni.getStorageSync('token')
        const res = await uni.request({
          url: 'https://fsgcolwltvbb.sealoshzh.site/api/checkin',
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {}
        })

        const { data } = res
        if (data && data.success) {
          // 更新状态
          this.checkinStatus = {
            todayChecked: data.data.todayChecked,
            continuousDays: data.data.continuousDays,
            totalDays: data.data.totalDays
          }

          // 显示庆祝动效
          this.showCelebration = true

          // 3秒后自动关闭
          setTimeout(() => {
            this.showCelebration = false
          }, 3000)
        } else {
          uni.showToast({
            title: data.message || '打卡失败',
            icon: 'none'
          })
        }
      } catch (e) {
        console.error('打卡失败:', e)
        uni.showToast({
          title: '打卡失败，请重试',
          icon: 'none'
        })
      } finally {
        this.isChecking = false
      }
    },
    generateCalendar() {
      const today = new Date()
      const currentDay = today.getDate()
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

      this.calendarDays = []
      for (let i = 1; i <= daysInMonth; i++) {
        this.calendarDays.push({
          day: i,
          checked: i < currentDay || (i === currentDay && this.checkinStatus.todayChecked),
          isToday: i === currentDay
        })
      }
    },
    getFireworkStyle(index) {
      const angle = (360 / 20) * index
      const distance = 150 + Math.random() * 100
      const duration = 0.8 + Math.random() * 0.4

      return {
        '--angle': `${angle}deg`,
        '--distance': `${distance}rpx`,
        'animation-duration': `${duration}s`,
        'animation-delay': `${Math.random() * 0.3}s`
      }
    },
    closeCelebration() {
      this.showCelebration = false
    },
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.checkin-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4ff 0%, #ffffff 100%);
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: #ffffff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.back-btn {
  font-size: 40rpx;
  color: #1f2937;
  width: 60rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1f2937;
}

.placeholder {
  width: 60rpx;
}

.content {
  padding: 40rpx 30rpx;
}

.status-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  text-align: center;
  box-shadow: 0 12rpx 32rpx rgba(102, 126, 234, 0.4);
  margin-bottom: 40rpx;
}

.status-icon {
  margin-bottom: 24rpx;
}

.icon-emoji {
  font-size: 120rpx;
}

.status-title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 12rpx;
}

.status-desc {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 40rpx;
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 60rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20rpx;
  padding: 32rpx 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-value {
  font-size: 56rpx;
  font-weight: bold;
  color: #ffffff;
  line-height: 1;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.3);
}

.checkin-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 24rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.35);
  margin-bottom: 50rpx;
}

.checkin-btn.disabled {
  background: #d1d5db;
  box-shadow: none;
}

.calendar-section {
  margin-top: 20rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 24rpx;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 16rpx;
}

.calendar-day {
  aspect-ratio: 1;
  background: #ffffff;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.calendar-day.today {
  border: 3rpx solid #667eea;
}

.calendar-day.checked {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.day-number {
  font-size: 24rpx;
  color: #4b5563;
}

.calendar-day.checked .day-number {
  color: #ffffff;
}

.day-mark {
  position: absolute;
  bottom: 8rpx;
  font-size: 20rpx;
  color: #ffffff;
}

/* 庆祝动效 */
.celebration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.celebration-content {
  background: #ffffff;
  border-radius: 32rpx;
  padding: 80rpx 60rpx;
  text-align: center;
  position: relative;
  overflow: hidden;
  animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes scaleIn {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.celebration-emoji {
  display: block;
  font-size: 160rpx;
  margin-bottom: 32rpx;
  animation: bounce 0.6s ease infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20rpx);
  }
}

.celebration-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 16rpx;
}

.celebration-message {
  display: block;
  font-size: 28rpx;
  color: #6b7280;
  margin-bottom: 12rpx;
}

.celebration-encourage {
  display: block;
  font-size: 26rpx;
  color: #667eea;
  font-weight: bold;
}

/* 烟花效果 */
.fireworks {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
}

.firework {
  position: absolute;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb, #4facfe);
  animation: explode 1s ease-out forwards;
}

@keyframes explode {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(cos(var(--angle)) * var(--distance)),
      calc(sin(var(--angle)) * var(--distance))
    ) scale(0);
    opacity: 0;
  }
}
</style>
