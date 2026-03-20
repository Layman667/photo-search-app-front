<template>
  <view class="result-container">
    <view class="header">
      <text class="back-btn" @click="goBack">← 返回</text>
      <text class="title">搜题结果</text>
    </view>

    <view v-if="loading" class="loading-section">
      <text class="loading-icon">🔄</text>
      <text class="loading-text">正在识别题目...</text>
    </view>

    <view v-else-if="result" class="result-content">
      <!-- 题目图片 -->
      <view class="image-section" v-if="result.imagePath">
        <text class="section-title">📷 题目图片</text>
        <image class="question-image" :src="result.imagePath" mode="widthFix" />
      </view>

      <!-- 答案与解析 -->
      <view class="answer-section">
        <text class="section-title">📝 答案与解析</text>
        <view class="answer-content">
          <view v-for="(paragraph, index) in formattedParagraphs" :key="index" class="paragraph">
            <text class="paragraph-text">{{ paragraph }}</text>
          </view>
        </view>
      </view>

      <!-- 备注信息 -->
      <view class="remark-section" v-if="result.remark">
        <text class="remark-text">{{ result.remark }}</text>
      </view>

      <!-- 难度评级和类型分类 -->
      <view class="classify-section">
        <text class="section-title">🏷️ 题目分类</text>

        <!-- 难度评级 -->
        <view class="classify-item">
          <text class="classify-label">难度评级</text>
          <view class="star-selector">
            <text
              class="star-btn"
              v-for="star in 5"
              :key="star"
              :class="{ active: star <= selectedDifficulty }"
              @click="selectDifficulty(star)"
            >★</text>
          </view>
        </view>

        <!-- 题目类型 -->
        <view class="classify-item">
          <text class="classify-label">题目类型</text>
          <view class="type-input-wrapper">
            <input
              class="type-input"
              type="text"
              :placeholder="selectedType ? '' : '输入题目类型（如：几何题）'"
              :value="selectedType"
              @input="selectedType = $event.detail.value"
            />
          </view>
        </view>

        <!-- 保存分类按钮 -->
        <button class="save-classify-btn" @click="handleSaveClassify">💾 保存分类</button>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button class="action-btn collect-btn" @click="handleCollect">⭐ 收藏</button>
        <button class="action-btn mistake-btn" @click="handleAddToMistakes">📖 加入错题本</button>
      </view>

      <!-- 推荐相似题目按钮 -->
      <view class="recommend-section">
        <button class="recommend-btn" @click="handleRecommend">💡 推荐相似题目</button>
      </view>
    </view>

    <view v-else class="error-section">
      <text class="error-icon">❌</text>
      <text class="error-text">{{ errorMsg || '搜题失败，请重试' }}</text>
      <button class="retry-btn" @click="goBack">返回重试</button>
    </view>
  </view>
</template>

<script>
import { addHistory, addFavorite, addWrong } from '@/api/topic'

export default {
  data() {
    return {
      loading: false,
      result: null,
      errorMsg: '',
      formattedParagraphs: [],
      selectedDifficulty: 0,
      selectedType: ''
    }
  },
  onLoad(options) {
    if (options.result) {
      try {
        this.result = JSON.parse(decodeURIComponent(options.result))
        console.log('接收到的结果:', this.result)

        // 从题目管理页面跳转过来，直接加载已有分类信息
        if (options.fromManage === 'true') {
          this.selectedDifficulty = this.result.difficulty || 0
          this.selectedType = this.result.type && this.result.type !== '未分类' ? this.result.type : ''
        }

        // 格式化答案
        this.formatAnswer()

        if (options.fromSearch === 'true') {
          this.addToHistory()
        }

        // 非管理页面跳转时，尝试从后端拉取已有分类信息
        if (options.fromManage !== 'true' && this.result.imagePath) {
          this.loadExistingClassify()
        }
      } catch (e) {
        console.error('数据解析失败:', e)
        this.errorMsg = '数据解析失败'
      }
    } else {
      this.errorMsg = '未获取到搜题结果'
    }
  },
  methods: {
    formatAnswer() {
      if (!this.result || !this.result.answer) {
        this.formattedParagraphs = ['暂无答案']
        return
      }

      let answer = this.result.answer

      // 1. 处理 LaTeX 块级公式 \\[ ... \\]
      answer = answer.replace(/\\\\\[(.*?)\\\\\]/gs, (match, formula) => {
        return '\n' + this.cleanLatex(formula) + '\n'
      })

      // 2. 处理 LaTeX 行内公式 \\( ... \\)
      answer = answer.replace(/\\\\\((.*?)\\\\\)/g, (match, formula) => {
        return this.cleanLatex(formula)
      })

      // 3. 处理单反斜杠的 LaTeX
      answer = answer.replace(/\\\[(.*?)\\\]/gs, (match, formula) => {
        return '\n' + this.cleanLatex(formula) + '\n'
      })
      answer = answer.replace(/\\\((.*?)\\\)/g, (match, formula) => {
        return this.cleanLatex(formula)
      })

      // 4. 处理 Markdown 标题
      answer = answer.replace(/^#{1,6}\s+(.+)$/gm, '\n$1\n')

      // 5. 处理 Markdown 加粗、斜体、删除线
      answer = answer.replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      answer = answer.replace(/\*\*(.+?)\*\*/g, '$1')
      answer = answer.replace(/\*(.+?)\*/g, '$1')
      answer = answer.replace(/__(.+?)__/g, '$1')
      answer = answer.replace(/_(.+?)_/g, '$1')
      answer = answer.replace(/~~(.+?)~~/g, '$1')

      // 6. 处理 Markdown 列表
      answer = answer.replace(/^[\-\*\+]\s+/gm, '• ')
      answer = answer.replace(/^\d+\.\s+/gm, '')

      // 7. 处理代码块和行内代码
      answer = answer.replace(/```[\s\S]*?```/g, '')
      answer = answer.replace(/`([^`]+)`/g, '$1')

      // 8. 处理链接和图片
      answer = answer.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      answer = answer.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')

      // 9. 处理引用和水平线
      answer = answer.replace(/^>\s+/gm, '')
      answer = answer.replace(/^[\-\*_]{3,}$/gm, '')

      // 10. 处理 HTML 标签
      answer = answer.replace(/<[^>]+>/g, '')

      // 11. 清理多余的空白字符
      answer = answer.replace(/\n{3,}/g, '\n\n')
      answer = answer.replace(/[ \t]+/g, ' ')
      answer = answer.replace(/^\s+|\s+$/gm, '')

      // 12. 分段处理
      const paragraphs = answer.split('\n\n').filter(p => p.trim())
      this.formattedParagraphs = paragraphs.map(p => p.trim())

      console.log('格式化后的段落:', this.formattedParagraphs)
    },
    cleanLatex(latex) {
      // 清理 LaTeX 公式，转为纯文本
      let text = latex

      // 处理常见的 LaTeX 命令
      text = text.replace(/\\text\{([^}]+)\}/g, '$1')           // \text{文本}
      text = text.replace(/\\mathrm\{([^}]+)\}/g, '$1')         // \mathrm{文本}
      text = text.replace(/\\mathbf\{([^}]+)\}/g, '$1')         // \mathbf{文本}
      text = text.replace(/\\boldsymbol\{([^}]+)\}/g, '$1')     // \boldsymbol{文本}
      text = text.replace(/\\textbf\{([^}]+)\}/g, '$1')         // \textbf{文本}
      text = text.replace(/\\emph\{([^}]+)\}/g, '$1')           // \emph{文本}

      // 处理分数 \frac{分子}{分母}
      text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')

      // 处理上标和下标
      text = text.replace(/\^\{([^}]+)\}/g, '^$1')              // ^{上标}
      text = text.replace(/_\{([^}]+)\}/g, '_$1')               // _{下标}
      text = text.replace(/\^(\w)/g, '^$1')                     // ^x
      text = text.replace(/_(\w)/g, '_$1')                      // _x

      // 处理括号
      text = text.replace(/\\left\(/g, '(')
      text = text.replace(/\\right\)/g, ')')
      text = text.replace(/\\left\[/g, '[')
      text = text.replace(/\\right\]/g, ']')
      text = text.replace(/\\left\{/g, '{')
      text = text.replace(/\\right\}/g, '}')

      // 处理常见数学符号
      text = text.replace(/\\times/g, '×')
      text = text.replace(/\\div/g, '÷')
      text = text.replace(/\\pm/g, '±')
      text = text.replace(/\\approx/g, '≈')
      text = text.replace(/\\neq/g, '≠')
      text = text.replace(/\\leq/g, '≤')
      text = text.replace(/\\geq/g, '≥')
      text = text.replace(/\\implies/g, '⇒')
      text = text.replace(/\\cdot/g, '·')

      // 处理空格命令
      text = text.replace(/\\,/g, ' ')
      text = text.replace(/\\;/g, ' ')
      text = text.replace(/\\quad/g, ' ')
      text = text.replace(/\\qquad/g, '  ')

      // 移除其他反斜杠命令
      text = text.replace(/\\[a-zA-Z]+/g, '')

      // 清理多余的空格和符号
      text = text.replace(/\s+/g, ' ')
      text = text.replace(/\{\s*\}/g, '')
      text = text.replace(/[{}]/g, '')

      return text.trim()
    },
    async addToHistory() {
      if (!this.result || !this.result.imagePath || !this.result.answer) {
        return
      }
      try {
        await addHistory(this.result.imagePath, this.result.answer)
        console.log('搜题记录已添加')
      } catch (err) {
        console.error('添加搜题记录失败:', err)
      }
    },
    async handleCollect() {
      if (!this.result || !this.result.imagePath || !this.result.answer) {
        uni.showToast({
          title: '数据不完整',
          icon: 'none'
        })
        return
      }
      try {
        await addFavorite(this.result.imagePath, this.result.answer)
        uni.showToast({
          title: '收藏成功',
          icon: 'success'
        })
      } catch (err) {
        console.error('收藏失败:', err)
      }
    },
    async handleAddToMistakes() {
      if (!this.result || !this.result.imagePath || !this.result.answer) {
        uni.showToast({
          title: '数据不完整',
          icon: 'none'
        })
        return
      }
      try {
        await addWrong(this.result.imagePath, this.result.answer)
        uni.showToast({
          title: '已加入错题本',
          icon: 'success'
        })
      } catch (err) {
        console.error('加入错题本失败:', err)
      }
    },
    handleRecommend() {
      if (!this.result || !this.result.answer) {
        uni.showToast({
          title: '数据不完整',
          icon: 'none'
        })
        return
      }

      // 提取题目信息（取答案的前300个字符作为题目描述）
      const questionDesc = this.result.answer.substring(0, 300)
      const prompt = `请根据"${questionDesc}"，推荐两个同类型同难度的题目和答案，内容简洁一点回复`

      // 跳转到推荐页面（不传递图片）
      uni.navigateTo({
        url: '/pages/recommend/recommend?prompt=' + encodeURIComponent(prompt)
      })
    },
    selectDifficulty(star) {
      this.selectedDifficulty = star
    },
    async loadExistingClassify() {
      try {
        const token = uni.getStorageSync('token')
        if (!token) return
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
          // 在所有分组中找到当前题目
          for (const group of data.data.groups) {
            const found = group.questions.find(q => q.questionImage === this.result.imagePath)
            if (found) {
              this.selectedDifficulty = found.difficulty || 0
              this.selectedType = group.type !== '未分类' ? group.type : ''
              break
            }
          }
        }
      } catch (e) {
        console.error('获取已有分类失败:', e)
      }
    },
    async handleSaveClassify() {
      if (!this.result || !this.result.imagePath) {
        uni.showToast({
          title: '题目信息不完整',
          icon: 'none'
        })
        return
      }

      if (!this.selectedDifficulty && !this.selectedType) {
        uni.showToast({
          title: '请至少选择难度或类型',
          icon: 'none'
        })
        return
      }

      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          })
          return
        }

        const requestData = {
          questionImage: this.result.imagePath
        }

        if (this.selectedDifficulty) {
          requestData.difficulty = this.selectedDifficulty
        }

        if (this.selectedType) {
          requestData.type = this.selectedType
        }

        if (this.result.answer) {
          requestData.analysis = this.result.answer
        }

        const res = await uni.request({
          url: 'https://fsgcolwltvbb.sealoshzh.site/api/classify/set',
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: requestData
        })

        const { data } = res
        if (data && data.code === 200) {
          uni.showToast({
            title: '分类保存成功',
            icon: 'success'
          })
        } else {
          uni.showToast({
            title: data.message || '保存失败',
            icon: 'none'
          })
        }
      } catch (e) {
        console.error('保存分类失败:', e)
        uni.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    },
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.result-container {
  min-height: 100vh;
  background: #f9fafb;
  padding: 40rpx 30rpx;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
  position: relative;
}

.back-btn {
  font-size: 28rpx;
  color: #667eea;
  position: absolute;
  left: 0;
}

.title {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
  color: #1f2937;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.loading-icon {
  font-size: 80rpx;
  margin-bottom: 30rpx;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 28rpx;
  color: #6b7280;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.image-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.question-image {
  width: 100%;
  border-radius: 12rpx;
  margin-top: 20rpx;
}

.answer-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 24rpx;
}

.answer-content {
  background: #f9fafb;
  border-radius: 16rpx;
  padding: 24rpx;
  border-left: 6rpx solid #667eea;
}

.paragraph {
  margin-bottom: 24rpx;
}

.paragraph:last-child {
  margin-bottom: 0;
}

.paragraph-text {
  display: block;
  font-size: 28rpx;
  color: #1f2937;
  line-height: 1.8;
  word-break: break-word;
}

.remark-section {
  background: #fef3c7;
  border-radius: 16rpx;
  padding: 24rpx;
  border-left: 6rpx solid #f59e0b;
}

.remark-text {
  display: block;
  font-size: 26rpx;
  color: #92400e;
  line-height: 1.8;
}

/* 分类区域 */
.classify-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.classify-item {
  margin-bottom: 32rpx;
}

.classify-item:last-child {
  margin-bottom: 0;
}

.classify-label {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #4b5563;
  margin-bottom: 16rpx;
}

.star-selector {
  display: flex;
  gap: 12rpx;
}

.star-btn {
  font-size: 48rpx;
  color: #d1d5db;
  cursor: pointer;
  transition: all 0.2s ease;
}

.star-btn.active {
  color: #fbbf24;
  transform: scale(1.1);
}

.type-input-wrapper {
  background: #f9fafb;
  border-radius: 16rpx;
  padding: 0 24rpx;
  border: 2rpx solid #e5e7eb;
}

.type-input {
  width: 100%;
  height: 88rpx;
  font-size: 28rpx;
  color: #1f2937;
}

.save-classify-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 28rpx;
  font-weight: bold;
  border-radius: 20rpx;
  border: none;
  margin-top: 32rpx;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  border: none;
}

.collect-btn {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #ffffff;
}

.mistake-btn {
  background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
  color: #ffffff;
}

.recommend-section {
  margin-top: 20rpx;
}

.recommend-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  font-size: 28rpx;
  border-radius: 20rpx;
  border: none;
}

.error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.error-icon {
  font-size: 80rpx;
  margin-bottom: 30rpx;
}

.error-text {
  font-size: 28rpx;
  color: #6b7280;
  margin-bottom: 40rpx;
  text-align: center;
  padding: 0 40rpx;
}

.retry-btn {
  width: 300rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 28rpx;
  border-radius: 20rpx;
  border: none;
}
</style>
