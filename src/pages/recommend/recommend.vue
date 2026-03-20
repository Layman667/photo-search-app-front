<template>
  <view class="recommend-container">
    <view class="header">
      <text class="back-btn" @click="goBack">← 返回</text>
      <text class="title">相似题目推荐</text>
    </view>

    <view v-if="loading" class="loading-section">
      <text class="loading-icon">🔄</text>
      <text class="loading-text">正在生成推荐...</text>
    </view>

    <view v-else-if="recommendation" class="content-section">
      <view class="recommendation-card">
        <text class="card-title">💡 AI 推荐</text>
        <view class="recommendation-content">
          <view v-for="(paragraph, index) in formattedParagraphs" :key="index" class="paragraph">
            <text class="paragraph-text">{{ paragraph }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="error-section">
      <text class="error-icon">❌</text>
      <text class="error-text">{{ errorMsg || '推荐失败，请重试' }}</text>
      <button class="retry-btn" @click="loadRecommendation">重新推荐</button>
    </view>
  </view>
</template>

<script>
import { chatWithDeepSeek } from '@/api/deepseek'

export default {
  data() {
    return {
      loading: false,
      recommendation: '',
      errorMsg: '',
      formattedParagraphs: [],
      prompt: '',
      image: ''
    }
  },
  onLoad(options) {
    if (options.prompt) {
      this.prompt = decodeURIComponent(options.prompt)
      this.image = options.image ? decodeURIComponent(options.image) : ''

      // 先尝试从缓存加载
      const cached = uni.getStorageSync('lastRecommendation')
      if (cached && cached.prompt === this.prompt) {
        this.recommendation = cached.result
        this.formatContent()
      } else {
        this.loadRecommendation()
      }
    } else {
      this.errorMsg = '参数错误'
    }
  },
  methods: {
    async loadRecommendation() {
      this.loading = true
      this.errorMsg = ''

      try {
        // 统一使用用法A（messages），不发送图片
        const params = {
          messages: [
            { role: 'system', content: '你是一个智能题目推荐助手，请用中文回答。' },
            { role: 'user', content: this.prompt }
          ]
        }

        const res = await chatWithDeepSeek(params)
        this.recommendation = res.data.reply

        // 保存到缓存
        uni.setStorageSync('lastRecommendation', {
          prompt: this.prompt,
          result: this.recommendation
        })

        this.formatContent()
      } catch (err) {
        console.error('推荐失败:', err)
        this.errorMsg = '推荐失败，请重试'
      } finally {
        this.loading = false
      }
    },
    formatContent() {
      if (!this.recommendation) {
        this.formattedParagraphs = ['暂无推荐']
        return
      }

      let content = this.recommendation

      // 1. 处理 LaTeX 块级公式 \\[ ... \\]
      content = content.replace(/\\\\\[(.*?)\\\\\]/gs, (match, formula) => {
        return '\n' + this.cleanLatex(formula) + '\n'
      })

      // 2. 处理 LaTeX 行内公式 \\( ... \\)
      content = content.replace(/\\\\\((.*?)\\\\\)/g, (match, formula) => {
        return this.cleanLatex(formula)
      })

      // 3. 处理单反斜杠的 LaTeX
      content = content.replace(/\\\[(.*?)\\\]/gs, (match, formula) => {
        return '\n' + this.cleanLatex(formula) + '\n'
      })
      content = content.replace(/\\\((.*?)\\\)/g, (match, formula) => {
        return this.cleanLatex(formula)
      })

      // 4. 处理 Markdown 标题
      content = content.replace(/^#{1,6}\s+(.+)$/gm, '\n$1\n')

      // 5. 处理 Markdown 加粗、斜体、删除线
      content = content.replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      content = content.replace(/\*\*(.+?)\*\*/g, '$1')
      content = content.replace(/\*(.+?)\*/g, '$1')
      content = content.replace(/__(.+?)__/g, '$1')
      content = content.replace(/_(.+?)_/g, '$1')
      content = content.replace(/~~(.+?)~~/g, '$1')

      // 6. 处理 Markdown 列表
      content = content.replace(/^[\-\*\+]\s+/gm, '• ')
      content = content.replace(/^\d+\.\s+/gm, '')

      // 7. 处理代码块和行内代码
      content = content.replace(/```[\s\S]*?```/g, '')
      content = content.replace(/`([^`]+)`/g, '$1')

      // 8. 处理链接和图片
      content = content.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      content = content.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')

      // 9. 处理引用和水平线
      content = content.replace(/^>\s+/gm, '')
      content = content.replace(/^[\-\*_]{3,}$/gm, '')

      // 10. 处理 HTML 标签
      content = content.replace(/<[^>]+>/g, '')

      // 11. 清理多余的空白字符
      content = content.replace(/\n{3,}/g, '\n\n')
      content = content.replace(/[ \t]+/g, ' ')
      content = content.replace(/^\s+|\s+$/gm, '')

      // 12. 分段处理
      const paragraphs = content.split('\n\n').filter(p => p.trim())
      this.formattedParagraphs = paragraphs.map(p => p.trim())
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
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.recommend-container {
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

.content-section {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.recommendation-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #10b981;
  margin-bottom: 24rpx;
}

.recommendation-content {
  background: #f9fafb;
  border-radius: 16rpx;
  padding: 24rpx;
  border-left: 6rpx solid #10b981;
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  font-size: 28rpx;
  border-radius: 20rpx;
  border: none;
}
</style>
