<template>
  <div class="coupon-section">
    <div class="coupon-container">
      <div class="coupon-header" @click="toggleCoupons" :style="{ 
        '--theme-color': primaryColor,
        '--theme-color-15': getThemeColor(0.15),
        '--theme-color-08': getThemeColor(0.08),
        '--theme-color-20': getThemeColor(0.2),
        '--theme-color-12': getThemeColor(0.12),
        '--theme-color-30': getThemeColor(0.3),
        '--theme-color-10': getThemeColor(0.1),
        '--theme-color-25': getThemeColor(0.25),
        '--theme-color-05': getThemeColor(0.05),
        '--theme-color-08-hover': getThemeColor(0.08),
        '--theme-color-05-hover': getThemeColor(0.05),
        '--theme-color-dark': getThemeColorDark(1)
      }">
        <div class="coupon-title">
          <div class="coupon-icon">
            <IconTicket :size="20" />
          </div>
          <div class="coupon-title-text">
            <h3>优惠券</h3>
            <p>限时优惠，先到先得</p>
            <div class="coupon-hint" v-if="!isExpanded">
              <span class="hint-text">点击展开查看可用优惠券</span>
            </div>
          </div>
        </div>
        <div class="coupon-toggle" :class="{ 'expanded': isExpanded }">
          <IconChevronDown :size="16" />
        </div>
      </div>
      
      <div class="coupon-content" :class="{ 'expanded': isExpanded }">
            <div class="coupon-list" v-if="coupons.length > 0">
              <!-- 滚动提示 -->
              <div class="scroll-hint" v-if="coupons.length > 2">
                <div class="scroll-hint-content">
                  <span class="scroll-icon">↕️</span>
                  <span class="scroll-text">可滚动查看更多优惠券</span>
                </div>
              </div>
              
              <div
                class="coupon-item"
                v-for="(coupon, index) in coupons"
                :key="index"
                :class="{ 'expired': isExpired(coupon) }"
              >
            <div class="coupon-left">
              <div class="coupon-code-display">
                <div class="coupon-label">优惠券</div>
                <div class="coupon-code-container">
                  <span class="coupon-code-text">{{ coupon.couponCode }}</span>
                  <button 
                    class="copy-code-button" 
                    @click="copyCouponCode(coupon.couponCode)"
                    title="点击复制优惠码"
                  >
                    <IconCopy :size="16" />
                  </button>
                </div>
              </div>
            </div>
            
            <div class="coupon-right">
              <div class="coupon-info">
                <h4 class="coupon-name">{{ coupon.name }}</h4>
                
                <div class="coupon-details">
                  <div class="coupon-detail-item" v-if="coupon.validPlans">
                    <span class="detail-label">可用套餐：</span>
                    <span class="detail-value">{{ coupon.validPlans }}</span>
                  </div>
                  
                  <div class="coupon-detail-item" v-if="coupon.endDate">
                    <span class="detail-label">⏰ 截止时间：</span>
                    <div class="detail-value" :class="{ 'expired-text': isExpired(coupon) }">
                      <div class="date-display">
                        <span class="date-text">{{ formatDate(coupon.endDate) }}</span>
                        <span class="time-remaining" v-if="!isExpired(coupon)">
                          {{ getTimeRemaining(coupon) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="coupon-detail-item" v-if="coupon.specialNote">
                    <span class="detail-label">特殊说明：</span>
                    <span class="detail-value">{{ coupon.specialNote }}</span>
                  </div>
                  
                </div>
              </div>
              
              <div class="coupon-status">
                <span v-if="isExpired(coupon)" class="status-expired">已过期</span>
                <span v-else class="status-valid">可使用</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="no-coupons">
          <IconTicket :size="48" />
          <p>暂无可用优惠券</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { IconTicket, IconChevronDown, IconCopy } from '@tabler/icons-vue'
import { config } from '@/config/index.js'
import { fetchCoupons, fetchPlans } from '@/api/shop.js'

export default {
  name: 'CouponSection',
  components: {
    IconTicket,
    IconChevronDown,
    IconCopy
  },
  setup() {
    const coupons = ref([])
    const loading = ref(true)
    const error = ref(null)
    const isExpanded = ref(false)
    const plans = ref([]) // 存储套餐列表
    
    // 获取主题色
    const primaryColor = computed(() => config.THEME_CONFIG?.primaryColor || '#D595DA')
    
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
    
    // 生成主题色的深色版本
    const getThemeColorDark = (opacity = 1) => {
      const color = primaryColor.value
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      // 稍微加深颜色
      const darkR = Math.max(0, r - 20)
      const darkG = Math.max(0, g - 20)
      const darkB = Math.max(0, b - 20)
      return `rgba(${darkR}, ${darkG}, ${darkB}, ${opacity})`
    }
    
    // 根据套餐ID获取套餐名称
    const getPlanNameById = (planId) => {
      const plan = plans.value.find(p => p.id === parseInt(planId))
      return plan ? plan.name : `套餐ID: ${planId}`
    }
    
    // 格式化套餐限制信息
    const formatPlanLimits = (limitPlanIds) => {
      if (!limitPlanIds) return '所有套餐'
      
      // 确保 limitPlanIds 是字符串类型
      const planIdsString = String(limitPlanIds)
      const planIds = planIdsString.split(',').map(id => id.trim()).filter(id => id)
      
      if (planIds.length === 0) return '所有套餐'
      
      const planNames = planIds.map(id => getPlanNameById(id))
      
      if (planNames.length === 1) {
        return planNames[0]
      } else if (planNames.length <= 3) {
        return planNames.join('、')
      } else {
        return `${planNames.slice(0, 2).join('、')} 等${planNames.length}个套餐`
      }
    }
    
    // 加载套餐列表
    const loadPlans = async () => {
      try {
        const response = await fetchPlans()
        if (response && response.data) {
          plans.value = response.data
        }
      } catch (err) {
        console.error('加载套餐列表失败:', err)
      }
    }
    
    // 从API加载优惠券数据
    const loadCoupons = async () => {
      try {
        loading.value = true
        
        // 先加载套餐列表
        await loadPlans()
        
        // 然后加载优惠券
        const response = await fetchCoupons()
        
        if (!response || !response.data) {
          throw new Error('无法加载优惠券数据')
        }
        
        // 转换API数据格式为组件需要的格式
        const couponData = response.data.map(coupon => {
          const isExpired = coupon.ended_at && new Date(coupon.ended_at * 1000) < new Date()
          const isPercentage = coupon.type === 1
          
          return {
            id: coupon.id,
            name: coupon.name,
            discount: isPercentage ? `${coupon.value}` : `${coupon.value}`,
            unit: isPercentage ? '%' : '元',
            type: isPercentage ? '百分比折扣' : '固定金额',
            description: `优惠码：${coupon.code}`,
            validPlans: formatPlanLimits(coupon.limit_plan_ids),
            endDate: coupon.ended_at ? new Date(coupon.ended_at * 1000).toISOString() : null,
            specialNote: coupon.limit_use ? `限用${coupon.limit_use}次` : null,
            couponCode: coupon.code,
            limitUse: coupon.limit_use,
            limitUseWithUser: coupon.limit_use_with_user,
            limitPeriod: coupon.limit_period,
            startedAt: coupon.started_at,
            endedAt: coupon.ended_at,
            isExpired: isExpired
          }
        })
        
        coupons.value = couponData
        error.value = null
      } catch (err) {
        console.error('加载优惠券失败:', err)
        error.value = err.message
        coupons.value = []
      } finally {
        loading.value = false
      }
    }
    
    // 检查优惠券是否过期
    const isExpired = (coupon) => {
      // 如果coupon是对象，使用isExpired属性
      if (typeof coupon === 'object' && coupon.isExpired !== undefined) {
        return coupon.isExpired
      }
      // 如果coupon是日期字符串，使用原来的逻辑
      if (typeof coupon === 'string') {
        const now = new Date()
        const end = new Date(coupon)
        return now > end
      }
      return false
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
    
    // 计算剩余时间
    const getTimeRemaining = (coupon) => {
      let endDate
      if (typeof coupon === 'object' && coupon.endDate) {
        endDate = coupon.endDate
      } else if (typeof coupon === 'string') {
        endDate = coupon
      } else {
        return ''
      }
      
      if (!endDate) return ''
      const now = new Date()
      const end = new Date(endDate)
      const diff = end.getTime() - now.getTime()
      
      if (diff <= 0) return '已过期'
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (days > 0) {
        return `剩余 ${days} 天`
      } else if (hours > 0) {
        return `剩余 ${hours} 小时`
      } else if (minutes > 0) {
        return `剩余 ${minutes} 分钟`
      } else {
        return '即将过期'
      }
    }
    
    // 切换优惠券展开/折叠
    const toggleCoupons = () => {
      isExpanded.value = !isExpanded.value
    }
    
    // 复制优惠码
    const copyCouponCode = async (couponCode) => {
      try {
        await navigator.clipboard.writeText(couponCode)
        // 成功提示
        showCopySuccess(couponCode)
      } catch (err) {
        console.error('复制失败:', err)
        // 降级方案：使用传统方法
        try {
          const textArea = document.createElement('textarea')
          textArea.value = couponCode
          document.body.appendChild(textArea)
          textArea.select()
          const success = document.execCommand('copy')
          document.body.removeChild(textArea)
          
          if (success) {
            showCopySuccess(couponCode)
          } else {
            showCopyFailed(couponCode)
          }
        } catch (fallbackErr) {
          console.error('降级复制也失败:', fallbackErr)
          showCopyFailed(couponCode)
        }
      }
    }
    
    // 显示复制成功提示
    const showCopySuccess = (couponCode) => {
      // 创建临时提示元素
      const toast = document.createElement('div')
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
      `
      toast.textContent = `优惠码 ${couponCode} 已复制到剪贴板`
      
      // 添加动画样式
      const style = document.createElement('style')
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `
      document.head.appendChild(style)
      
      document.body.appendChild(toast)
      
      // 3秒后自动移除
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease'
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast)
          }
          if (style.parentNode) {
            style.parentNode.removeChild(style)
          }
        }, 300)
      }, 3000)
    }
    
    // 显示复制失败提示
    const showCopyFailed = (couponCode) => {
      // 创建失败提示元素
      const modal = document.createElement('div')
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
      `
      
      const content = document.createElement('div')
      content.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        margin: 20px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        animation: scaleIn 0.3s ease;
      `
      
      content.innerHTML = `
        <div style="text-align: center;">
          <div style="color: #ef4444; font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px;">复制失败</h3>
          <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
            自动复制失败，请手动复制以下优惠码：
          </p>
          <div style="background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <div style="font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; color: #1f2937; letter-spacing: 1px;">
              ${couponCode}
            </div>
          </div>
          <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
            <button id="manual-copy-btn" style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">选择并复制</button>
            <button id="close-modal-btn" style="
              background: #6b7280;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">关闭</button>
          </div>
        </div>
      `
      
      // 添加动画样式
      const style = document.createElement('style')
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `
      document.head.appendChild(style)
      
      modal.appendChild(content)
      document.body.appendChild(modal)
      
      // 选择优惠码文本
      const codeElement = content.querySelector('div[style*="font-family: Courier New"]')
      const selectText = () => {
        const range = document.createRange()
        range.selectNodeContents(codeElement)
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(range)
      }
      
      // 立即选择文本
      setTimeout(selectText, 100)
      
      // 手动复制按钮
      const manualCopyBtn = content.querySelector('#manual-copy-btn')
      manualCopyBtn.addEventListener('click', () => {
        selectText()
        try {
          document.execCommand('copy')
          showCopySuccess(couponCode)
          closeModal()
        } catch (err) {
          console.error('手动复制也失败:', err)
        }
      })
      
      // 关闭按钮
      const closeBtn = content.querySelector('#close-modal-btn')
      const closeModal = () => {
        modal.style.animation = 'fadeIn 0.3s ease reverse'
        setTimeout(() => {
          if (modal.parentNode) {
            modal.parentNode.removeChild(modal)
          }
          if (style.parentNode) {
            style.parentNode.removeChild(style)
          }
        }, 300)
      }
      
      closeBtn.addEventListener('click', closeModal)
      
      // 点击背景关闭
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal()
        }
      })
      
      // ESC键关闭
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          closeModal()
          document.removeEventListener('keydown', handleEsc)
        }
      }
      document.addEventListener('keydown', handleEsc)
    }
    
    onMounted(() => {
      loadCoupons()
    })
    
    return {
      coupons,
      loading,
      error,
      isExpanded,
      isExpired,
      formatDate,
      getTimeRemaining,
      toggleCoupons,
      copyCouponCode,
      primaryColor,
      getThemeColor,
      getThemeColorDark
    }
  }
}
</script>

<style lang="scss" scoped>
.coupon-section {
  margin-top: 30px;
  margin-bottom: 20px;

  .coupon-container {
    background: rgba(248, 250, 252, 0.4);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid rgba(226, 232, 240, 0.6);
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
    }

    &:hover {
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      transform: translateY(-4px);
      border-color: rgba(226, 232, 240, 0.8);
    }

    .coupon-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 28px 32px;
      background: linear-gradient(135deg, var(--theme-color-15) 0%, var(--theme-color-08) 100%);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border-bottom: 1px solid var(--theme-color-30);
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.6s ease;
      }

      &:hover {
        background: linear-gradient(135deg, var(--theme-color-20) 0%, var(--theme-color-12) 100%);
        transform: translateY(-1px);

        &::before {
          left: 100%;
        }
      }

      .coupon-title {
        display: flex;
        align-items: center;
        gap: 16px;

        .coupon-icon {
          color: var(--theme-color);
          opacity: 0.9;
          width: 24px;
          height: 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
          transition: all 0.3s ease;

          &:hover {
            transform: scale(1.1) rotate(5deg);
          }
        }

        .coupon-title-text {
          h3 {
            font-size: 22px;
            font-weight: 800;
            color: #1e293b;
            margin: 0 0 8px 0;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            letter-spacing: -0.025em;
          }

          p {
            font-size: 15px;
            color: #64748b;
            margin: 0 0 10px 0;
            font-weight: 500;
          }

          .coupon-hint {
            .hint-text {
              font-size: 13px;
              color: var(--theme-color);
              background: linear-gradient(135deg, var(--theme-color-10) 0%, var(--theme-color-05) 100%);
              padding: 6px 12px;
              border-radius: 16px;
              font-weight: 600;
              border: 1px solid var(--theme-color-20);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
              transition: all 0.3s ease;

              &:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              }
            }
          }
        }
      }

      .coupon-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--theme-color-10) 0%, var(--theme-color-05) 100%);
        color: var(--theme-color);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid var(--theme-color-20);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: var(--theme-color);
          border-radius: 50%;
          transition: all 0.4s ease;
          transform: translate(-50%, -50%);
        }

        &:hover {
          background: var(--theme-color);
          color: white;
          transform: scale(1.08) translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);

          &::before {
            width: 100%;
            height: 100%;
          }
        }

        &.expanded {
          transform: rotate(180deg);
          background: var(--theme-color);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        svg {
          position: relative;
          z-index: 1;
          transition: all 0.3s ease;
        }
      }
    }

    .coupon-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.4s ease;
      padding: 0;

      &.expanded {
        max-height: 500px;
        padding: 0 0 8px 0;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        position: relative;
        
        // 滚动提示
        &::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 6px;
          height: 100%;
          background: linear-gradient(to bottom, 
            rgba(0, 0, 0, 0.1) 0%, 
            rgba(0, 0, 0, 0.05) 50%, 
            rgba(0, 0, 0, 0.1) 100%);
          border-radius: 3px;
          z-index: 1;
          pointer-events: none;
        }
        
        // 自定义滚动条
        &::-webkit-scrollbar {
          width: 8px;
        }
        
        &::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
          margin: 4px 0;
        }
        
        &::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, 
            var(--theme-color) 0%, 
            var(--theme-color-dark) 100%);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          
          &:hover {
            background: linear-gradient(to bottom, 
              var(--theme-color-dark) 0%, 
              var(--theme-color) 100%);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }
          
          &:active {
            background: var(--theme-color-dark);
          }
        }
        
        // 滚动条角落
        &::-webkit-scrollbar-corner {
          background: transparent;
        }
      }

      .coupon-list {
        .scroll-hint {
          margin: 8px 20px 12px 20px;
          padding: 8px 12px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.05) 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          text-align: center;
          animation: fadeInUp 0.5s ease;
          
          .scroll-hint-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            
            .scroll-icon {
              font-size: 14px;
              animation: bounce 2s infinite;
            }
            
            .scroll-text {
              font-size: 12px;
              color: #3b82f6;
              font-weight: 500;
            }
          }
        }
        
        .coupon-item {
          display: flex;
          margin: 8px 20px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.3);
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          min-height: 100px;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          &:hover {
            background: linear-gradient(135deg, var(--theme-color-08-hover) 0%, var(--theme-color-05-hover) 100%);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            transform: translateY(-2px) scale(1.01);
            box-shadow: 0 6px 20px var(--theme-color-15);
            border-color: var(--theme-color-30);

            &::before {
              opacity: 1;
            }
          }

          &.expired {
            opacity: 0.6;
            background: rgba(107, 114, 128, 0.05);
            border-color: rgba(107, 114, 128, 0.2);

            &:hover {
              background: rgba(107, 114, 128, 0.08);
              transform: none;
              box-shadow: none;
            }
          }

          .coupon-left {
            background: linear-gradient(135deg, var(--theme-color) 0%, var(--theme-color-dark) 100%);
            color: white;
            padding: 16px 20px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            min-width: 200px;
            position: relative;
            overflow: hidden;

            &::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
              animation: shimmer 3s ease-in-out infinite;
            }
            
            // 白天模式使用黑色文字，深色模式使用白色文字
            .coupon-code-display {
              position: relative;
              z-index: 2;

              .coupon-code-text {
                color: #1e293b !important;
                text-shadow: 0 2px 4px rgba(255, 255, 255, 0.8);
                font-weight: 900;
                filter: contrast(1.2) brightness(1.1);
                letter-spacing: 0.1em;
                font-family: 'Courier New', monospace;
                font-size: 18px;
              }
            }
            
            .coupon-type {
              color: #4b5563 !important;
              text-shadow: 0 1px 3px rgba(255, 255, 255, 0.7);
              font-weight: 700;
              position: relative;
              z-index: 2;
              letter-spacing: 0.025em;
            }

            &::after {
              content: '';
              position: absolute;
              right: -10px;
              top: 50%;
              transform: translateY(-50%);
              width: 20px;
              height: 20px;
              background: rgba(248, 250, 252, 0.4);
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              z-index: 3;
            }

            .coupon-code-display {
              text-align: left;
              margin-bottom: 0;
              display: flex;
              flex-direction: column;
              gap: 8px;

              .coupon-label {
                font-size: 12px;
                font-weight: 700;
                opacity: 0.8;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #1e293b !important;
                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
                position: relative;
                z-index: 2;
              }

              .coupon-code-container {
                display: flex;
                align-items: center;
                gap: 12px;

                .coupon-code-text {
                  font-size: 24px;
                  font-weight: 900;
                  line-height: 1;
                  font-family: 'Courier New', monospace;
                  letter-spacing: 0.1em;
                  flex: 1;
                  color: #1e293b !important;
                  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.8);
                  position: relative;
                  z-index: 2;
                }

                .copy-code-button {
                  background: rgba(255, 255, 255, 0.2);
                  color: #1e293b;
                  border: 2px solid rgba(255, 255, 255, 0.3);
                  border-radius: 8px;
                  padding: 8px;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  backdrop-filter: blur(10px);
                  -webkit-backdrop-filter: blur(10px);
                  position: relative;
                  z-index: 2;

                  &:hover {
                    background: rgba(255, 255, 255, 0.3);
                    border-color: rgba(255, 255, 255, 0.5);
                    transform: scale(1.1);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                  }

                  &:active {
                    transform: scale(0.95);
                  }
                }
              }
            }

            .coupon-type {
              font-size: 12px;
              font-weight: 700;
              opacity: 0.95;
              text-align: right;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              white-space: nowrap;
            }
          }

          .coupon-right {
            flex: 1;
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .coupon-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 8px;

              .coupon-name {
                font-size: 16px;
                font-weight: 600;
                color: #1e293b;
                margin: 0;
              }

              .coupon-desc {
                color: #64748b;
                font-size: 13px;
                margin: 0;
                line-height: 1.4;
              }

              .coupon-details {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;

                .coupon-detail-item {
                  display: flex;
                  align-items: center;
                  margin-bottom: 0;
                  font-size: 12px;
                  padding: 4px 8px;
                  background: rgba(248, 250, 252, 0.5);
                  border-radius: 6px;
                  border-left: 2px solid var(--theme-color);
                  transition: all 0.2s ease;
                  white-space: nowrap;

                  &:hover {
                    background: rgba(248, 250, 252, 0.8);
                    transform: translateY(-1px);
                  }

                  .detail-label {
                    color: var(--theme-color);
                    font-weight: 600;
                    margin-right: 4px;
                    flex-shrink: 0;
                  }

                  .detail-value {
                    color: #374151;
                    font-weight: 500;
                    line-height: 1.4;

                    &.expired-text {
                      color: #ef4444;
                      font-weight: 600;
                      background: rgba(239, 68, 68, 0.1);
                      padding: 2px 6px;
                      border-radius: 4px;
                      display: inline-block;
                    }
                    
                    .date-display {
                      display: flex;
                      flex-direction: column;
                      gap: 2px;
                      
                      .date-text {
                        font-weight: 600;
                        color: #1e293b;
                        font-size: 12px;
                      }
                      
                      .time-remaining {
                        background: rgba(59, 130, 246, 0.1);
                        color: #1e40af;
                        padding: 1px 4px;
                        border-radius: 3px;
                        font-size: 10px;
                        font-weight: 500;
                        text-align: center;
                        border: 1px solid rgba(59, 130, 246, 0.2);
                      }
                    }
                  }
                  
                }
              }
            }

            .coupon-status {
              .status-valid {
                background: var(--theme-color);
                color: white;
                padding: 4px 10px;
                border-radius: 16px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
              }

              .status-expired {
                background: #ef4444;
                color: white;
                padding: 4px 10px;
                border-radius: 16px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
              }
            }
          }
        }
      }

      .no-coupons {
        text-align: center;
        padding: 60px 20px;
        color: #64748b;

        svg {
          color: #94a3b8;
          margin-bottom: 16px;
        }

        p {
          font-size: 16px;
          margin: 0;
        }
      }
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .coupon-section {
    margin-top: 20px;
    margin-bottom: 15px;

    .coupon-container {
      border-radius: 12px;

      .coupon-header {
        padding: 20px 24px;

        .coupon-title {
          gap: 12px;

          .coupon-title-text {
            h3 {
              font-size: 18px;
            }

            p {
              font-size: 14px;
            }
          }
        }
      }

      .coupon-content {
        .coupon-list {
          .coupon-item {
            margin: 8px 15px;
            flex-direction: column;
            min-height: auto;

            .coupon-left {
              min-width: auto;
              padding: 12px 16px;
              flex-direction: row;
              justify-content: space-between;

              &::after {
                display: none;
              }

              .coupon-code-display {
                margin-bottom: 0;
                gap: 6px;

                .coupon-label {
                  font-size: 11px;
                }

                .coupon-code-container {
                  gap: 8px;

                  .coupon-code-text {
                    font-size: 20px;
                  }

                  .copy-code-button {
                    padding: 6px;
                    
                    svg {
                      width: 14px;
                      height: 14px;
                    }
                  }
                }
              }
            }

            .coupon-right {
              padding: 12px 16px;
              flex-direction: column;
              gap: 8px;
              align-items: flex-start;

              .coupon-info {
                .coupon-details {
                  .coupon-detail-item {
                    margin-bottom: 4px;
                    font-size: 11px;
                    padding: 3px 6px;
                  }
                }
              }

              .coupon-status {
                align-self: flex-start;
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
  .coupon-section {
    .coupon-container {
      background: rgba(15, 23, 42, 0.4);
      border-color: var(--theme-color-40);

      .coupon-header {
        background: linear-gradient(135deg, var(--theme-color-20) 0%, var(--theme-color-10) 100%);
        border-bottom-color: var(--theme-color-40);

        &:hover {
          background: linear-gradient(135deg, var(--theme-color-25) 0%, var(--theme-color-15) 100%);
        }

        .coupon-title {
          .coupon-icon {
            color: var(--theme-color);
          }

          .coupon-title-text {
            h3 {
              color: #f1f5f9;
            }

            p {
              color: #94a3b8;
            }

            .coupon-hint {
              .hint-text {
                color: var(--theme-color);
                background: var(--theme-color-20);
              }
            }
          }
        }

        .coupon-toggle {
          background: var(--theme-color-20);
          color: var(--theme-color);
          border-color: var(--theme-color-30);

          &:hover {
            background: var(--theme-color);
            color: #1e293b;
          }

          &.expanded {
            background: var(--theme-color);
            color: #1e293b;
          }
        }
      }

      .coupon-content {
        &.expanded {
          // 深色模式滚动提示
          &::before {
            background: linear-gradient(to bottom, 
              rgba(255, 255, 255, 0.1) 0%, 
              rgba(255, 255, 255, 0.05) 50%, 
              rgba(255, 255, 255, 0.1) 100%);
          }
          
          // 深色模式滚动条
          &::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }
          
          &::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, 
              var(--theme-color) 0%, 
              var(--theme-color-dark) 100%);
            border-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            
            &:hover {
              background: linear-gradient(to bottom, 
                var(--theme-color-dark) 0%, 
                var(--theme-color) 100%);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
            }
          }
        }
        
        .coupon-list {
          .scroll-hint {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.08) 100%);
            border-color: rgba(59, 130, 246, 0.3);
            
            .scroll-hint-content {
              .scroll-text {
                color: #93c5fd;
              }
            }
          }
          
          .coupon-item {
            background: rgba(15, 23, 42, 0.1);
            border-color: var(--theme-color-20);

            &:hover {
              background: linear-gradient(135deg, var(--theme-color-12) 0%, var(--theme-color-08) 100%);
            }

            &.expired {
              background: rgba(51, 65, 85, 0.1);
              border-color: rgba(107, 114, 128, 0.3);
            }
            
             .coupon-left {
               // 深色主题下使用白色文字
               .coupon-code-display {
                 .coupon-label {
                   color: rgba(255, 255, 255, 0.9) !important;
                   text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
                 }

                 .coupon-code-container {
                   .coupon-code-text {
                     color: white !important;
                     text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
                     font-weight: 900;
                     filter: contrast(1.2) brightness(1.1);
                     letter-spacing: 0.1em;
                     font-family: 'Courier New', monospace;
                     font-size: 18px;
                   }

                   .copy-code-button {
                     background: rgba(255, 255, 255, 0.15);
                     color: white;
                     border-color: rgba(255, 255, 255, 0.3);

                     &:hover {
                       background: rgba(255, 255, 255, 0.25);
                       border-color: rgba(255, 255, 255, 0.5);
                       color: white;
                     }
                   }
                 }
               }
               
               .coupon-type {
                 color: rgba(255, 255, 255, 0.95) !important;
                 text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
                 font-weight: 600;
               }
             }

            .coupon-right {
              .coupon-info {
                .coupon-name {
                  color: #f1f5f9;
                }

                .coupon-desc {
                  color: #94a3b8;
                }

                .coupon-details {
                  .coupon-detail-item {
                    background: rgba(15, 23, 42, 0.3);
                    border-left-color: var(--theme-color);
                    
                    &:hover {
                      background: rgba(15, 23, 42, 0.5);
                    }

                    .detail-label {
                      color: var(--theme-color);
                      
                      &::before {
                        background: var(--theme-color);
                      }
                    }

                    .detail-value {
                      color: #f1f5f9;

                      &.expired-text {
                        color: #f87171;
                        background: rgba(248, 113, 113, 0.2);
                      }
                      
                      .date-display {
                        .date-text {
                          color: #f1f5f9;
                        }
                        
                        .time-remaining {
                          background: rgba(59, 130, 246, 0.15);
                          color: #93c5fd;
                          border-color: rgba(59, 130, 246, 0.3);
                        }
                      }
                    }
                    
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

// 添加动画效果
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-3px);
  }
  60% {
    transform: translateY(-2px);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(30deg);
  }
  50% {
    transform: translateX(100%) translateY(100%) rotate(30deg);
  }
  100% {
    transform: translateX(-100%) translateY(-100%) rotate(30deg);
  }
}

</style>
