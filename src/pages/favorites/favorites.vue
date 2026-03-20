<template>
  <view class="favorites-container">
    <view class="header">
      <text class="back-btn" @click="goBack">← 返回</text>
      <text class="title">我的收藏</text>
    </view>

    <view v-if="loading" class="loading-section">
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else-if="list.length > 0" class="list-section">
      <view class="list-item" v-for="item in list" :key="item.favoriteId" @click="viewDetail(item)">
        <image v-if="item.questionImage" class="question-image" :src="item.questionImage" mode="widthFix" />
        <view class="item-content">
          <text class="analysis-text">{{ formatAnalysis(item.analysis) }}</text>
          <text class="time-text">{{ formatTime(item.createTime) }}</text>
        </view>
        <view class="delete-btn" @click.stop="handleDelete(item.favoriteId)">
          <text class="delete-icon">⭐</text>
        </view>
      </view>
    </view>

    <view v-else class="empty-section">
      <text class="empty-icon">⭐</text>
      <text class="empty-text">暂无收藏</text>
    </view>
  </view>
</template>

<script>
import { getFavoriteList, deleteFavorite } from '@/api/topic'

export default {
  data() {
    return {
      list: [],
      loading: false,
      page: 1,
      pageSize: 20
    }
  },
  onLoad() {
    this.loadList()
  },
  methods: {
    async loadList() {
      this.loading = true
      try {
        const res = await getFavoriteList(this.page, this.pageSize)
        this.list = res.data.list || []
      } catch (err) {
        console.error('加载收藏列表失败:', err)
      } finally {
        this.loading = false
      }
    },
    async handleDelete(favoriteId) {
      uni.showModal({
        title: '提示',
        content: '确定取消收藏吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await deleteFavorite(favoriteId)
              uni.showToast({ title: '取消收藏成功', icon: 'success' })
              this.loadList()
            } catch (err) {
              console.error('取消收藏失败:', err)
            }
          }
        }
      })
    },
    viewDetail(item) {
      uni.navigateTo({
        url: '/pages/result/result?result=' + encodeURIComponent(JSON.stringify({
          imagePath: item.questionImage,
          answer: item.analysis
        }))
      })
    },
    formatAnalysis(text) {
      return text ? text.substring(0, 100) + (text.length > 100 ? '...' : '') : '暂无内容'
    },
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return date.toLocaleString('zh-CN')
    },
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.favorites-container {
  min-height: 100vh;
  background: #f9fafb;
  padding: 40rpx 30rpx;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.back-btn {
  font-size: 28rpx;
  color: #667eea;
}

.title {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
  color: #1f2937;
}

.loading-section, .empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.loading-text, .empty-text {
  font-size: 28rpx;
  color: #6b7280;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 30rpx;
}

.list-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.list-item {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 20rpx;
}

.question-image {
  width: 150rpx;
  border-radius: 12rpx;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.analysis-text {
  font-size: 28rpx;
  color: #1f2937;
  line-height: 1.6;
}

.time-text {
  font-size: 24rpx;
  color: #9ca3af;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
}

.delete-icon {
  font-size: 36rpx;
}
</style>
