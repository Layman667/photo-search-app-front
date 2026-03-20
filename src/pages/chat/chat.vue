<template>
  <view class="chat-container">
    <view class="header">
      <text class="back-btn" @click="goBack">← 返回</text>
      <text class="title">AI 对话</text>
      <text class="clear-btn" @click="handleClear">清空</text>
    </view>

    <scroll-view class="message-list" scroll-y :scroll-top="scrollTop" scroll-with-animation>
      <view v-if="messages.length === 0" class="empty-section">
        <text class="empty-icon">🤖</text>
        <text class="empty-text">开始与 AI 助手对话吧</text>
      </view>

      <view v-for="(msg, index) in messages" :key="index" class="message-item" :class="msg.role">
        <view class="message-avatar">
          <text class="avatar-icon">{{ msg.role === 'user' ? '👤' : '🤖' }}</text>
        </view>
        <view class="message-content">
          <text class="message-text">{{ msg.content }}</text>
        </view>
      </view>

      <view v-if="loading" class="message-item assistant">
        <view class="message-avatar">
          <text class="avatar-icon">🤖</text>
        </view>
        <view class="message-content loading-content">
          <text class="loading-text">正在思考...</text>
        </view>
      </view>
    </scroll-view>

    <view class="input-section">
      <input
        class="message-input"
        type="text"
        placeholder="输入消息..."
        v-model="inputText"
        @confirm="handleSend"
      />
      <button class="send-btn" @click="handleSend" :disabled="!inputText.trim() || loading">
        发送
      </button>
    </view>
  </view>
</template>

<script>
import { chatWithDeepSeek } from '@/api/deepseek'

export default {
  data() {
    return {
      messages: [],
      inputText: '',
      loading: false,
      scrollTop: 0
    }
  },
  onLoad() {
    this.loadMessages()
  },
  methods: {
    loadMessages() {
      const cached = uni.getStorageSync('chatMessages')
      if (cached) {
        this.messages = cached
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },
    saveMessages() {
      uni.setStorageSync('chatMessages', this.messages)
    },
    async handleSend() {
      if (!this.inputText.trim() || this.loading) return

      const userMessage = this.inputText.trim()
      this.inputText = ''

      this.messages.push({
        role: 'user',
        content: userMessage
      })
      this.saveMessages()
      this.scrollToBottom()

      this.loading = true

      try {
        const res = await chatWithDeepSeek({
          messages: [
            { role: 'system', content: '你是一个智能AI助手，请用中文回答。' },
            ...this.messages
          ]
        })

        this.messages.push({
          role: 'assistant',
          content: res.data.reply
        })
        this.saveMessages()
        this.scrollToBottom()
      } catch (err) {
        console.error('对话失败:', err)
        uni.showToast({
          title: '对话失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    handleClear() {
      uni.showModal({
        title: '提示',
        content: '确定清空对话记录吗？',
        success: (res) => {
          if (res.confirm) {
            this.messages = []
            uni.removeStorageSync('chatMessages')
          }
        }
      })
    },
    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollTop = 999999
      })
    },
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 30rpx;
  background: #ffffff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.back-btn, .clear-btn {
  font-size: 28rpx;
  color: #667eea;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #1f2937;
}

.message-list {
  flex: 1;
  padding: 30rpx;
}

.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #6b7280;
}

.message-item {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-icon {
  font-size: 36rpx;
}

.message-content {
  max-width: 70%;
  padding: 24rpx;
  border-radius: 20rpx;
  background: #ffffff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.message-item.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.message-text {
  font-size: 28rpx;
  color: #1f2937;
  line-height: 1.6;
  word-break: break-word;
}

.message-item.user .message-text {
  color: #ffffff;
}

.loading-content {
  background: #f3f4f6;
}

.loading-text {
  font-size: 28rpx;
  color: #6b7280;
}

.input-section {
  display: flex;
  gap: 20rpx;
  padding: 30rpx;
  background: #ffffff;
  border-top: 1rpx solid #e5e7eb;
}

.message-input {
  flex: 1;
  height: 80rpx;
  padding: 0 30rpx;
  background: #f9fafb;
  border-radius: 40rpx;
  font-size: 28rpx;
  color: #1f2937;
}

.send-btn {
  width: 140rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 28rpx;
  border-radius: 40rpx;
  border: none;
}

.send-btn[disabled] {
  opacity: 0.5;
}
</style>
