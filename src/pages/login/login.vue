<template>
  <view class="login-container">
    <view class="login-card">
      <view class="logo-section">
        <text class="logo-text">欢迎回来</text>
        <text class="subtitle">登录您的账户</text>
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

        <view class="options-row">
          <view class="remember-box" @click="formData.remember = !formData.remember">
            <view class="checkbox" :class="{ checked: formData.remember }">
              <text v-if="formData.remember" class="check-icon">✓</text>
            </view>
            <text class="option-text">记住密码</text>
          </view>
          <text class="forgot-link">忘记密码？</text>
        </view>

        <button class="login-btn" :class="{ active: isButtonActive }" @click="handleLogin">
          登录
        </button>

        <view class="register-section">
          <text class="register-text">还没有账户？</text>
          <text class="register-link" @click="goToRegister">立即注册</text>
        </view>
      </view>

      <view class="info-card">
        <text class="info-text">🔐 您的信息将被安全加密</text>
      </view>
    </view>
  </view>
</template>

<script>
import { login } from '@/api/user'

export default {
  data() {
    return {
      formData: {
        username: '',
        password: '',
        remember: false
      },
      focusedField: '',
      showPassword: false,
      isButtonActive: false
    }
  },
  methods: {
    async handleLogin() {
      // 表单验证
      if (!this.formData.username || !this.formData.password) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        })
        return
      }

      // 按钮按压效果
      this.isButtonActive = true

      try {
        // 调用登录接口
        const res = await login(
          this.formData.username.trim(),
          this.formData.password,
          this.formData.remember
        )

        // 登录成功，保存 token
        uni.setStorageSync('token', res.data.token)
        uni.setStorageSync('userId', res.data.userId)
        uni.setStorageSync('username', res.data.username)

        uni.showToast({
          title: '登录成功',
          icon: 'success'
        })

        // 跳转到首页（搜题页面）
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/search/search'
          })
        }, 1500)

      } catch (error) {
        console.error('登录失败:', error)
      } finally {
        setTimeout(() => {
          this.isButtonActive = false
        }, 200)
      }
    },
    goToRegister() {
      uni.navigateTo({
        url: '/pages/register/register'
      })
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.login-card {
  width: 100%;
  max-width: 680rpx;
  background: #ffffff;
  border-radius: 40rpx;
  padding: 60rpx 50rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
}

.logo-section {
  text-align: center;
  margin-bottom: 60rpx;
}

.logo-text {
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

.options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.remember-box {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #d1d5db;
  border-radius: 8rpx;
  margin-right: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.checkbox.checked {
  background: #4f46e5;
  border-color: #4f46e5;
}

.check-icon {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: bold;
}

.option-text {
  font-size: 28rpx;
  color: #6b7280;
}

.forgot-link {
  font-size: 28rpx;
  color: #4f46e5;
  text-decoration: underline;
  text-decoration-style: dashed;
  cursor: pointer;
}

.login-btn {
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

.login-btn.active {
  transform: scale(0.96);
}

.register-section {
  text-align: center;
  margin-top: 40rpx;
}

.register-text {
  font-size: 28rpx;
  color: #6b7280;
  margin-right: 10rpx;
}

.register-link {
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
