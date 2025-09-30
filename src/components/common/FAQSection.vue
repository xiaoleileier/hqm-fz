<template>
  <div class="faq-section">
    <div class="faq-container">
      <div class="faq-header">
        <div class="faq-title">
          <div class="faq-icon">
            <IconInfoCircle :size="20" />
          </div>
          <div class="faq-title-text">
            <h3>问题须知</h3>
            <p>购买前请仔细阅读以下重要信息</p>
          </div>
        </div>
      </div>
      
      <div class="faq-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="faq-loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        
        <!-- 错误状态 -->
        <div v-else-if="error" class="faq-error">
          <p>{{ error }}</p>
        </div>
        
        <!-- FAQ列表 -->
        <div v-else class="faq-list">
          <div class="faq-item" v-for="(item, index) in faqItems" :key="index">
            <div class="faq-question">
              <span class="faq-number">{{ index + 1 }}</span>
              <h4>{{ item.question }}</h4>
            </div>
            <div class="faq-answer">
              <p>{{ item.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { IconInfoCircle } from '@tabler/icons-vue'

export default {
  name: 'FAQSection',
  components: {
    IconInfoCircle
  },
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const faqItems = ref([])
    const loading = ref(true)
    const error = ref(null)

    // 默认FAQ数据（作为备用）
    const defaultFaqItems = [
      {
        question: '💰 退款问题',
        answer: '所有套餐一经购买不可退款，请仔细确认后再进行购买。'
      },
      {
        question: '🛡️ SLA保障说明',
        answer: '套餐描述的SLA保障为线路维护保障，优先级越高则维护越快。'
      },
      {
        question: '🌐 IPv6使用说明',
        answer: '部分套餐内包含IPv6线，如无法使用请联系您的网络运营商。请说明是工作需要或学习用途，切勿说是魔法使用，避免不必要的麻烦。'
      },
      {
        question: '🔧 技术支持',
        answer: '有问题请您带着详细信息与截图开启工单或者联系在线客服。客服不会赛博算命，不要上来就是"我用不了"，请提供具体的错误信息和操作步骤。'
      },
      {
        question: '📅 流量重置规则',
        answer: '常规套餐默认每月购买日重置流量，当月未使用完的流量不会累积到下个月。'
      },
      {
        question: '⚠️ 套餐购买须知',
        answer: '如果您在已有套餐的情况下购买新套餐，旧套餐将被折算或冲销，且无法恢复。所以请在订单页查看您的套餐是否被折算'
      },
      {
        question: '💡 建议',
        answer: '详细说明请前往教程查看详细图文说明'
      }
    ]

    // 加载FAQ数据
    const loadFaqData = async () => {
      try {
        loading.value = true
        const response = await fetch('/faq.txt')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const text = await response.text()
        const faqBlocks = text.split('---').map(block => block.trim()).filter(block => block.length > 0)

        const parsedFaqItems = faqBlocks.map(block => {
          const lines = block.split('\n').map(line => line.trim()).filter(line => line.length > 0)
          const currentFaq = {}
          lines.forEach(line => {
            const trimmedLine = line.trim()
            if (trimmedLine.includes(':')) {
              const [key, ...valueParts] = trimmedLine.split(':')
              const value = valueParts.join(':').trim()

              switch (key.trim()) {
                case 'question': currentFaq.question = value; break
                case 'answer': currentFaq.answer = value; break
              }
            }
          })
          return currentFaq
        })
        
        faqItems.value = parsedFaqItems.length > 0 ? parsedFaqItems : defaultFaqItems
      } catch (e) {
        error.value = '加载FAQ失败: ' + e.message
        console.error('加载FAQ失败:', e)
        // 使用默认数据作为备用
        faqItems.value = props.items.length > 0 ? props.items : defaultFaqItems
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadFaqData()
    })

    return {
      faqItems,
      loading,
      error
    }
  }
}
</script>

<style lang="scss" scoped>
.faq-section {
  margin-top: 50px;
  margin-bottom: 30px;

  .faq-container {
    background: rgba(248, 250, 252, 0.3);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(226, 232, 240, 0.4);
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }

      .faq-header {
        display: flex;
        align-items: center;
        padding: 24px 28px;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.08) 100%);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(59, 130, 246, 0.3);
        transition: all 0.3s ease;

      .faq-title {
        display: flex;
        align-items: center;
        gap: 16px;

        .faq-icon {
          color: #3b82f6;
          opacity: 0.8;
          width: 20px;
          height: 20px;
        }

        .faq-title-text {
          h3 {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 6px 0;
          }

          p {
            font-size: 15px;
            color: #64748b;
            margin: 0;
          }
        }
      }

    }

    .faq-content {
      overflow: visible;

      .faq-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        color: #64748b;
        
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        p {
          margin: 0;
          font-size: 14px;
        }
      }
      
      .faq-error {
        padding: 20px;
        text-align: center;
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
        border-radius: 8px;
        margin: 20px;
        
        p {
          margin: 0;
          font-size: 14px;
        }
      }

      .faq-list {
        padding: 0;

        .faq-item {
          padding: 24px 28px;
          border-bottom: 1px solid rgba(241, 245, 249, 0.2);
          transition: all 0.3s ease;
          position: relative;
          background: rgba(255, 255, 255, 0.05);

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(147, 197, 253, 0.08) 100%);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
          }

          .faq-question {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 12px;

            .faq-number {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              color: white;
              font-size: 14px;
              font-weight: 700;
              flex-shrink: 0;
              box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
            }

            h4 {
              font-size: 18px;
              font-weight: 600;
              color: #1e293b;
              margin: 0;
            }
          }

          .faq-answer {
            p {
              color: #64748b;
              line-height: 1.7;
              font-size: 15px;
              margin: 0;
              padding-left: 48px;
            }
          }
        }
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .faq-section {
    margin-top: 30px;
    margin-bottom: 20px;

    .faq-container {
      border-radius: 12px;

      .faq-header {
        padding: 20px 24px;

        .faq-title {
          gap: 12px;

          .faq-title-text {
            h3 {
              font-size: 18px;
            }

            p {
              font-size: 14px;
            }
          }
        }

        .faq-toggle {
          width: 36px;
          height: 36px;
        }
      }

      .faq-content {
        .faq-list {
          .faq-item {
            padding: 20px 24px;

            .faq-question {
              gap: 12px;
              margin-bottom: 10px;

              .faq-number {
                width: 28px;
                height: 28px;
                font-size: 13px;
              }

              h4 {
                font-size: 16px;
              }
            }

            .faq-answer {
              p {
                font-size: 14px;
                padding-left: 40px;
              }
            }
          }
        }
      }
    }
  }
}

// 深色主题适配
.dark-theme {
  .faq-section {
    .faq-container {
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-color: rgba(59, 130, 246, 0.4);

      .faq-header {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.08) 100%);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-bottom-color: rgba(59, 130, 246, 0.3);

        .faq-title {
          .faq-icon {
            color: #60a5fa;
          }

          .faq-title-text {
            h3 {
              color: #f1f5f9;
            }

            p {
              color: #94a3b8;
            }
          }
        }

      }

      .faq-content {
        .faq-list {
          .faq-item {
            border-bottom-color: rgba(59, 130, 246, 0.2);
            background: rgba(15, 23, 42, 0.1);

            &:hover {
              background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.1) 100%);
              backdrop-filter: blur(5px);
              -webkit-backdrop-filter: blur(5px);
            }

            .faq-question {
              .faq-number {
                background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
              }

              h4 {
                color: #f1f5f9;
              }
            }

            .faq-answer {
              p {
                color: #94a3b8;
              }
            }
          }
        }
      }
    }
  }
}

// 添加旋转动画
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
