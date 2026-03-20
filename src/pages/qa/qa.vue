<template>
  <view class="manage-container">
    <view class="content">
      <view class="header">
        <text class="title">题目管理</text>
        <text class="subtitle">按类型管理你的题目</text>
      </view>

      <!-- 分类卡片列表 -->
      <view class="category-list">
        <view
          class="category-card"
          v-for="(group, index) in questionGroups"
          :key="index"
        >
          <!-- 卡片头部 -->
          <view class="card-header" @click="toggleCard(index)">
            <view class="header-left">
              <text class="category-icon">{{ getCategoryIcon(group.type) }}</text>
              <view class="category-info">
                <text class="category-name">{{ group.type }}</text>
                <text class="category-count">{{ group.count }} 道题目</text>
              </view>
            </view>
            <text class="toggle-icon">{{ expandedCards[index] ? '▼' : '▶' }}</text>
          </view>

          <!-- 卡片内容（可折叠） -->
          <view class="card-content" v-if="expandedCards[index]">
            <view
              class="question-item"
              v-for="(question, qIndex) in group.questions"
              :key="qIndex"
              @click="goToDetail(question, group.type)"
            >
              <image
                class="question-thumb"
                :src="question.questionImage"
                mode="aspectFill"
              />
              <view class="question-info">
                <text class="question-difficulty">难度：{{ getDifficultyText(question.difficulty) }}</text>
                <view class="star-rating">
                  <text
                    class="star"
                    v-for="star in 5"
                    :key="star"
                    :class="{ active: star <= (question.difficulty || 0) }"
                  >★</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="questionGroups.length === 0 && !loading">
        <text class="empty-icon">📚</text>
        <text class="empty-text">暂无题目分类</text>
        <text class="empty-hint">去搜题页面搜索题目并设置分类吧</text>
      </view>
    </view>

    <CustomTabBar :current="1" />
  </view>
</template>

<script>
import CustomTabBar from '@/components/CustomTabBar.vue'
import { getHistoryList } from '@/api/topic'

export default {
  components: {
    CustomTabBar
  },
  data() {
    return {
      questionGroups: [],
      expandedCards: [],
      loading: false
    }
  },
  onLoad() {
    this.loadQuestions()
  },
  onShow() {
    this.loadQuestions()
  },
  methods: {
    async loadQuestions() {
      this.loading = true
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          })
          return
        }

        const res = await uni.request({
          url: 'https://fsgcolwltvbb.sealoshzh.site/api/classify/by-type',
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        const { data } = res
        if (data && data.code === 200 && data.data && data.data.groups) {
          // 对每个分组的题目按难度排序（由易到难）
          const groups = data.data.groups.map(group => {
            const sortedQuestions = [...group.questions].sort((a, b) => {
              return (a.difficulty || 0) - (b.difficulty || 0)
            })
            return { ...group, questions: sortedQuestions }
          })

          // 仅当"未分类"分组有题目时才显示，并移到最前面
          const uncategorizedIdx = groups.findIndex(g => g.type === '未分类')
          if (uncategorizedIdx >= 0 && groups[uncategorizedIdx].count > 0) {
            const [uncategorized] = groups.splice(uncategorizedIdx, 1)
            groups.unshift(uncategorized)
          } else if (uncategorizedIdx >= 0) {
            groups.splice(uncategorizedIdx, 1)
          }

          this.questionGroups = groups
          this.expandedCards = new Array(this.questionGroups.length).fill(false)
        }
      } catch (e) {
        console.error('获取题目列表失败:', e)
        uni.showToast({
          title: '获取失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    toggleCard(index) {
      this.expandedCards[index] = !this.expandedCards[index]
      this.$forceUpdate()
    },
    getCategoryIcon(type) {
      const iconMap = {
        '未分类': '📋',
        '几何题': '📐',
        '代数题': '🔢',
        '应用题': '📊',
        '函数题': '📈',
        '概率题': '🎲'
      }
      return iconMap[type] || '📝'
    },
    getDifficultyText(difficulty) {
      if (!difficulty) return '未评级'
      const textMap = {
        1: '非常简单',
        2: '简单',
        3: '中等',
        4: '困难',
        5: '非常困难'
      }
      return textMap[difficulty] || '未评级'
    },
    goToDetail(question, groupType) {
      // 跳转到result页面，传递题目信息
      const resultData = {
        imagePath: question.questionImage,
        answer: question.analysis || '暂无解析',
        difficulty: question.difficulty,
        type: groupType !== '未分类' ? groupType : ''
      }
      uni.navigateTo({
        url: '/pages/result/result?fromManage=true&result=' + encodeURIComponent(JSON.stringify(resultData))
      })
    }
  }
}
</script>

<style scoped>
.manage-container {
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

.category-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.category-card {
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.category-icon {
  font-size: 56rpx;
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.category-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}

.category-count {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
}

.toggle-icon {
  font-size: 32rpx;
  color: #ffffff;
  transition: transform 0.3s ease;
}

.card-content {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  background: #f9fafb;
}

.question-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.question-item:active {
  transform: scale(0.98);
}

.question-thumb {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background: #e5e7eb;
}

.question-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.question-difficulty {
  font-size: 26rpx;
  color: #4b5563;
}

.star-rating {
  display: flex;
  gap: 6rpx;
}

.star {
  font-size: 28rpx;
  color: #d1d5db;
}

.star.active {
  color: #fbbf24;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
}

.empty-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #4b5563;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #9ca3af;
  text-align: center;
}
</style>
