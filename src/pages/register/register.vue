<template>
  <view class="register-container">
    <view class="register-card">
      <view class="header-section">
        <text class="back-btn" @click="goBack">← 返回</text>
        <text class="title">创建账户</text>
        <text class="subtitle">加入我们，开启新旅程</text>
      </view>

      <view class="form-section">
        <view class="input-group" :class="{ focused: focusedField === 'username' }">
          <view class="input-icon">
            <text class="icon">👤</text>
          </view>
          <input
            class="input-field"
            type="text"
            placeholder="请输入账号"
            v-model="formData.username"
            @focus="focusedField = 'username'"
            @blur="focusedField = ''"
          />
        </view>

        <view class="input-group" :class="{ focused: focusedField === 'password' }">
          <view class="input-icon">
            <text class="icon">🔒</text>
          </view>
          <input
            class="input-field"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
            v-model="formData.password"
            @focus="focusedField = 'password'"
            @blur="focusedField = ''"
          />
          <view class="eye-icon" @click="showPassword = !showPassword">
            <text class="icon">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</text>
          </view>
        </view>

        <view class="input-group" :class="{ focused: focusedField === 'confirmPassword', error: passwordError }">
          <view class="input-icon">
            <text class="icon">🔐</text>
          </view>
          <input
            class="input-field"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="请再次输入密码"
            v-model="formData.confirmPassword"
            @focus="focusedField = 'confirmPassword'"
            @blur="checkPassword"
          />
          <view class="eye-icon" @click="showConfirmPassword = !showConfirmPassword">
            <text class="icon">{{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}</text>
          </view>
        </view>

        <view v-if="passwordError" class="error-tip">
          <text class="error-text">⚠️ 两次密码输入不一致</text>
        </view>

        <button class="register-btn" :class="{ active: isButtonActive }" @click="handleRegister">
          注册
        </button>

        <view class="login-section">
          <text class="login-text">已有账户？</text>
          <text class="login-link" @click="goToLogin">立即登录</text>
        </view>
      </view>

      <view class="info-card">
        <text class="info-text">📝 注册即表示您同意我们的服务条款</text>
      </view>
    </view>
  </view>
</template>

<script>
import { register } from '@/api/user'

export default {
  data() {
    return {
      formData: {
        username: '',
        password: '',
        confirmPassword: ''
      },
      focusedField: '',
      showPassword: false,
      showConfirmPassword: false,
      passwordError: false,
      isButtonActive: false
    }
  },
  methods: {
    checkPassword() {
      this.focusedField = ''
      if (this.formData.confirmPassword && this.formData.password !== this.formData.confirmPassword) {
        this.passwordError = true
      } else {
        this.passwordError = false
      }
    },
    async handleRegister() {
      // 表单验证
      if (!this.formData.username || !this.formData.password || !this.formData.confirmPassword) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }

      if (this.formData.password !== this.formData.confirmPassword) {
        uni.showToast({
          title: '两次密码输入不一致',
          icon: 'none'
        })
        return
      }

      // 按钮按压效果
      this.isButtonActive = true

      try {
        // 调用注册接口
        const res = await register(
          this.formData.username.trim(),
          this.formData.password
        )

        uni.showToast({
          title: '注册成功',
          icon: 'success'
        })

        // 注册成功后跳转到登录页
        setTimeout(() => {
          this.goToLogin()
        }, 1500)

      } catch (error) {
        console.error('注册失败:', error)
      } finally {
        setTimeout(() => {
          this.isButtonActive = false
        }, 200)
      }
    },
    goBack() {
      uni.navigateBack()
    },
    goToLogin() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.register-card {
  width: 100%;
  max-width: 680rpx;
  background: #ffffff;
  border-radius: 40rpx;
  padding: 60rpx 50rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
}

.header-section {
  text-align: center;
  margin-bottom: 60rpx;
  position: relative;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 0;
  font-size: 28rpx;
  color: #4f46e5;
  cursor: pointer;
}

.title {
  display: block;
  font-size: 56rpx;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 16rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #6b7280;
}

.form-section {
  margin-bottom: 40rpx;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: #f9fafb;
  border: 2rpx solid #e5e7eb;
  border-radius: 24rpx;
  margin-bottom: 30rpx;
  padding: 0 30rpx;
  transition: all 0.3s ease;
}

.input-group.focused {
  border-color: #4f46e5;
  background: #ffffff;
  box-shadow: 0 0 0 6rpx rgba(79, 70, 229, 0.1);
}

.input-group.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.input-group.focused .input-icon .icon {
  color: #4f46e5;
}

.input-icon {
  margin-right: 20rpx;
}

.icon {
  font-size: 40rpx;
  color: #9ca3af;
  transition: color 0.3s ease;
}

.input-field {
  flex: 1;
  height: 100rpx;
  font-size: 30rpx;
  color: #1f2937;
  background: transparent;
}

.eye-icon {
  padding: 10rpx;
  cursor: pointer;
}

.error-tip {
  margin-top: -20rpx;
  margin-bottom: 30rpx;
  padding-left: 30rpx;
}

.error-text {
  font-size: 24rpx;
  color: #ef4444;
}

.register-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
  transition: all 0.2s ease;
}

.register-btn.active {
  transform: scale(0.96);
}

.login-section {
  text-align: center;
  margin-top: 40rpx;
}

.login-text {
  font-size: 28rpx;
  color: #6b7280;
  margin-right: 10rpx;
}

.login-link {
  font-size: 28rpx;
  color: #4f46e5;
  font-weight: bold;
  cursor: pointer;
}

.info-card {
  margin-top: 40rpx;
  padding: 24rpx;
  background: rgba(79, 70, 229, 0.05);
  backdrop-filter: blur(10rpx);
  border-radius: 20rpx;
  text-align: center;
}

.info-text {
  font-size: 24rpx;
  color: #6b7280;
}
</style>
