<template>
  <div class="dashboard-card checkin-card" :style="themeStyle">
    <!-- 卡片头部 -->
    <div class="card-header">
      <h2 class="card-title">
        <IconGift :size="20" class="title-icon"/>
        {{ $t('dashboard.checkin') }}
      </h2>
    </div>
    
    <!-- 卡片内容 -->
    <div class="card-body">
      <div class="checkin-content">
        <!-- 描述文字 -->
        <div class="checkin-description">
          <p>{{ $t('dashboard.checkinDesc') }}</p>
          <p class="checkin-tip">{{ $t('dashboard.checkinTip') }}</p>
        </div>
        
        <!-- 签到按钮 -->
        <div class="checkin-buttons">
          <!-- 普通签到按钮 -->
          <button class="checkin-btn standard-checkin" @click="showStandardConfirm" :disabled="loading.standard || hasCheckedInToday">
            <IconGift :size="18" v-if="!loading.standard"/>
            <div v-else class="loading-spinner"></div>
            <span>{{ hasCheckedInToday ? $t('dashboard.alreadyCheckedIn') : $t('dashboard.standardCheckin') }}</span>
          </button>

          <!-- 运气签到按钮 -->
          <button class="checkin-btn lucky-checkin" @click="showLuckyModal = true" :disabled="loading.lucky || hasCheckedInToday">
            <IconDice :size="18" v-if="!loading.lucky"/>
            <div v-else class="loading-spinner"></div>
            <span>{{ hasCheckedInToday ? $t('dashboard.alreadyCheckedIn') : $t('dashboard.luckyCheckin') }}</span>
          </button>
        </div>

        <!-- 签到结果提示 -->
        <div v-if="checkinResult" class="checkin-result" :class="checkinResult.type">
          <div class="result-icon">
            <IconCheck v-if="checkinResult.type === 'success'" :size="20"/>
            <IconX v-else :size="20"/>
          </div>
          <div class="result-message">{{ checkinResult.message }}</div>
        </div>
      </div>
    </div>

    <!-- 普通签到确认模态框 -->
    <div v-if="showStandardConfirmModal" class="modal-overlay" @click="closeStandardConfirmModal">
      <div class="modal-card standard-checkin-modal" @click.stop>
        <!-- 模态框头部 -->
        <div class="modal-header">
          <h3>{{ $t('dashboard.standardCheckin') }}</h3>
          <button class="close-button" @click="closeStandardConfirmModal">
            <IconX :size="20"/>
          </button>
        </div>
        
        <!-- 模态框内容 -->
        <div class="modal-body">
          <div class="confirm-content">
            <div class="confirm-icon">
              <IconGift :size="48" class="confirm-icon-gift"/>
            </div>
            <h4>{{ $t('dashboard.standardCheckinConfirm') }}</h4>
            <p>{{ $t('dashboard.standardCheckinDesc') }}</p>
            <p class="warning-text">{{ $t('dashboard.checkinOnceWarning') }}</p>
          </div>
          
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="closeStandardConfirmModal">
              {{ $t('common.cancel') }}
            </button>
            <button class="btn btn-primary" @click="handleStandardCheckin" :disabled="loading.standard">
              <div v-if="loading.standard" class="loading-spinner"></div>
              {{ loading.standard ? $t('common.loading') : $t('dashboard.confirmCheckin') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 运气签到模态框 -->
    <div v-if="showLuckyModal" class="modal-overlay" @click="closeLuckyModal">
      <div class="modal-card lucky-checkin-modal" @click.stop>
        <!-- 模态框头部 -->
        <div class="modal-header">
          <h3>{{ $t('dashboard.luckyCheckin') }}</h3>
          <button class="close-button" @click="closeLuckyModal">
            <IconX :size="20"/>
          </button>
        </div>
        
        <!-- 模态框内容 -->
        <div class="modal-body">
          <div class="lucky-checkin-form">
            <div class="form-group">
              <label>{{ $t('dashboard.inputTraffic') }}</label>
              <div class="input-group">
                <input 
                  v-model="luckyInput" 
                  type="number" 
                  class="form-input" 
                  :placeholder="$t('dashboard.inputPlaceholder')"
                  min="1"
                  max="1000"
                />
                <div class="input-suffix">
                  <select v-model="luckyUnit" class="unit-select">
                    <option value="GB">GB</option>
                    <option value="MB">MB</option>
                  </select>
                </div>
              </div>
              <div class="form-hint">{{ $t('dashboard.luckyCheckinHint') }}</div>
              <div class="warning-text">{{ $t('dashboard.checkinOnceWarning') }}</div>
            </div>
          </div>
        </div>
        
        <!-- 模态框操作按钮 -->
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeLuckyModal">
            {{ $t('common.cancel') }}
          </button>
          <button 
            class="btn btn-primary" 
            @click="handleLuckyCheckin"
            :disabled="!luckyInput || loading.lucky"
          >
            <IconDice :size="16" v-if="!loading.lucky"/>
            <div v-else class="loading-spinner"></div>
            {{ $t('dashboard.confirmCheckin') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { standardCheckin, luckyCheckin } from '@/api/user'
import { config } from '@/config/index.js'
import IconGift from '@/components/icons/IconGift.vue'
import IconDice from '@/components/icons/IconDice.vue'
import IconCheck from '@/components/icons/IconCheck.vue'
import IconX from '@/components/icons/IconX.vue'

export default {
  name: 'CheckinCard',
  components: {
    IconGift,
    IconDice,
    IconCheck,
    IconX
  },
  setup() {
    const { t } = useI18n()
    
    // 获取主题色
    const primaryColor = computed(() => config.DEFAULT_CONFIG?.primaryColor || '#D595DA')
    
    // 生成主题色的RGBA值
    const getThemeColor = (opacity = 1) => {
      const color = primaryColor.value
      // 将十六进制颜色转换为RGB
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    
    // 生成主题色的RGB值（不含alpha）
    const themeColorRgb = computed(() => {
      const color = primaryColor.value
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      return `${r}, ${g}, ${b}`
    })
    
    // 主题样式
    const themeStyle = computed(() => ({
      '--theme-color': primaryColor.value,
      '--theme-color-rgb': themeColorRgb.value
    }))
    
    // 状态管理
    const loading = reactive({
      standard: false,
      lucky: false
    })
    
    const showLuckyModal = ref(false)
    const showStandardConfirmModal = ref(false)
    const luckyInput = ref('')
    const luckyUnit = ref('GB')
    const checkinResult = ref(null)
    const hasCheckedInToday = ref(false) // 今日是否已签到
    
    // 显示普通签到确认模态框
    const showStandardConfirm = () => {
      if (hasCheckedInToday.value) {
        checkinResult.value = {
          type: 'error',
          message: t('dashboard.alreadyCheckedIn')
        }
        return
      }
      showStandardConfirmModal.value = true
    }
    
    // 普通签到处理
    const handleStandardCheckin = async () => {
      loading.standard = true
      checkinResult.value = null
      
      try {
        const response = await standardCheckin()
        if (response.data) {
          checkinResult.value = {
            type: 'success',
            message: response.message
          }
          hasCheckedInToday.value = true // 标记今日已签到
        } else {
          checkinResult.value = {
            type: 'error',
            message: response.message
          }
        }
      } catch (error) {
        checkinResult.value = {
          type: 'error',
          message: error.response?.data?.message || t('common.errorOccurred')
        }
      } finally {
        loading.standard = false
        showStandardConfirmModal.value = false
        // 3秒后清除结果提示
        setTimeout(() => {
          checkinResult.value = null
        }, 3000)
      }
    }
    
    // 运气签到处理
    const handleLuckyCheckin = async () => {
      if (!luckyInput.value) return
      
      if (hasCheckedInToday.value) {
        checkinResult.value = {
          type: 'error',
          message: t('dashboard.alreadyCheckedIn')
        }
        closeLuckyModal()
        return
      }
      
      loading.lucky = true
      checkinResult.value = null
      
      try {
        const input = `${luckyInput.value}${luckyUnit.value}`
        const response = await luckyCheckin(input)
        
        if (response.data) {
          checkinResult.value = {
            type: 'success',
            message: response.message
          }
          hasCheckedInToday.value = true // 标记今日已签到
          closeLuckyModal()
        } else {
          checkinResult.value = {
            type: 'error',
            message: response.message
          }
        }
      } catch (error) {
        checkinResult.value = {
          type: 'error',
          message: error.response?.data?.message || t('common.errorOccurred')
        }
      } finally {
        loading.lucky = false
        setTimeout(() => {
          checkinResult.value = null
        }, 3000)
      }
    }
    
    // 关闭模态框
    const closeLuckyModal = () => {
      showLuckyModal.value = false
      luckyInput.value = ''
      luckyUnit.value = 'GB'
    }
    
    const closeStandardConfirmModal = () => {
      showStandardConfirmModal.value = false
    }
    
    return {
      loading,
      showLuckyModal,
      showStandardConfirmModal,
      luckyInput,
      luckyUnit,
      checkinResult,
      hasCheckedInToday,
      showStandardConfirm,
      handleStandardCheckin,
      handleLuckyCheckin,
      closeLuckyModal,
      closeStandardConfirmModal,
      themeStyle
    }
  }
}
</script>

<style scoped>
.checkin-card {
  /* 使用项目统一的卡片样式，不需要特殊背景 */
}

.checkin-card .card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  color: var(--theme-color);
}

.checkin-content {
  text-align: center;
}

.checkin-description {
  margin-bottom: 20px;
}

.checkin-description p {
  color: var(--secondary-text-color);
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

.checkin-tip {
  color: var(--secondary-text-color);
  font-size: 12px;
  margin: 8px 0 0 0 !important;
  opacity: 0.8;
  font-style: italic;
}

.checkin-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.checkin-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
  justify-content: center;
}

.standard-checkin {
  background-color: var(--theme-color);
  color: white;
  border: 1px solid var(--theme-color);
}

.standard-checkin:hover:not(:disabled) {
  background-color: rgba(var(--theme-color-rgb), 0.85);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(var(--theme-color-rgb), 0.3);
}

.lucky-checkin {
  background: linear-gradient(135deg, #ff6b6b, #ffa500);
  color: white;
  border: none;
  position: relative;
  overflow: hidden;
}

.lucky-checkin::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.lucky-checkin:hover:not(:disabled)::before {
  left: 100%;
}

.lucky-checkin:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff5252, #ff9800);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
}

.checkin-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.checkin-result {
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.checkin-result.success {
  background-color: var(--success-background);
  border: 1px solid var(--success-color);
  color: var(--success-color);
}

.checkin-result.error {
  background-color: var(--error-background);
  border: 1px solid var(--error-color);
  color: var(--error-color);
}

.result-message {
  font-size: 14px;
  font-weight: 500;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.lucky-checkin-modal,
.standard-checkin-modal {
  background-color: var(--card-background);
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: rgba(var(--theme-color-rgb), 0.03);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-color);
  padding: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-button:hover {
  background-color: rgba(var(--theme-color-rgb), 0.1);
  color: var(--theme-color);
}

.modal-body {
  padding: 20px;
}

.lucky-checkin-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: var(--text-color);
  font-size: 14px;
}

.input-group {
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.input-group:focus-within {
  border-color: var(--theme-color);
  box-shadow: 0 0 0 2px rgba(var(--theme-color-rgb), 0.2);
}

.form-input {
  flex: 1;
  padding: 12px;
  border: none;
  outline: none;
  background-color: var(--card-background);
  color: var(--text-color);
  font-size: 14px;
}

.form-input::placeholder {
  color: var(--secondary-text-color);
}

.input-suffix {
  border-left: 1px solid var(--border-color);
}

.unit-select {
  padding: 12px;
  border: none;
  outline: none;
  background-color: var(--card-background);
  color: var(--text-color);
  cursor: pointer;
  font-size: 14px;
}

.form-hint {
  font-size: 12px;
  color: var(--secondary-text-color);
  line-height: 1.4;
}

.warning-text {
  font-size: 12px;
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 8px;
  border-left: 3px solid #ff6b6b;
  white-space: nowrap;
  overflow: visible;
}

.confirm-content {
  text-align: center;
  padding: 20px 0;
}

.confirm-icon {
  margin-bottom: 16px;
}

.confirm-icon-gift {
  color: var(--theme-color);
}

.confirm-content h4 {
  margin: 0 0 12px 0;
  color: var(--text-color);
  font-size: 18px;
}

.confirm-content p {
  margin: 8px 0;
  color: var(--secondary-text-color);
  font-size: 14px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.btn-secondary {
  background-color: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background-color: rgba(var(--theme-color-rgb), 0.05);
  border-color: var(--theme-color);
  color: var(--theme-color);
}

.btn-primary {
  background-color: var(--theme-color);
  color: white;
  border: 1px solid var(--theme-color);
}

.btn-primary:hover:not(:disabled) {
  background-color: rgba(var(--theme-color-rgb), 0.85);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(var(--theme-color-rgb), 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .checkin-buttons {
    flex-direction: column;
  }
  
  .checkin-btn {
    width: 100%;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
  
  .lucky-checkin-modal {
    width: 95%;
    margin: 20px;
  }
}
</style>
