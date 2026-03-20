<template>
  <view class="custom-tabbar">
    <view
      class="tab-item"
      v-for="(item, index) in tabList"
      :key="index"
      @click="switchTab(index)"
    >
      <text class="tab-icon" :class="{ active: currentIndex === index }">{{ item.icon }}</text>
      <text class="tab-text" :class="{ active: currentIndex === index }">{{ item.text }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CustomTabBar',
  props: {
    current: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      currentIndex: 0,
      tabList: [
        {
          icon: '🔍',
          text: '搜题',
          pagePath: '/pages/search/search'
        },
        {
          icon: '📚',
          text: '题目管理',
          pagePath: '/pages/qa/qa'
        },
        {
          icon: '👤',
          text: '我的',
          pagePath: '/pages/profile/profile'
        }
      ]
    }
  },
  watch: {
    current(newVal) {
      this.currentIndex = newVal
    }
  },
  mounted() {
    this.currentIndex = this.current
  },
  methods: {
    switchTab(index) {
      if (this.currentIndex === index) return

      this.currentIndex = index
      uni.redirectTo({
        url: this.tabList[index].pagePath
      })
    }
  }
}
</script>

<style scoped>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  z-index: 999;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10rpx 0;
}

.tab-icon {
  font-size: 44rpx;
  margin-bottom: 6rpx;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.tab-icon.active {
  opacity: 1;
  transform: scale(1.1);
}

.tab-text {
  font-size: 22rpx;
  color: #6b7280;
  transition: all 0.3s ease;
}

.tab-text.active {
  color: #667eea;
  font-weight: bold;
}
</style>
