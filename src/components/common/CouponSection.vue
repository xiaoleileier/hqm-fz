<template>
  <div class="coupon-section-new">
    <div class="coupon-container-new">
      <div class="coupon-header-new" @click="toggleCoupons" @keydown.enter="toggleCoupons" @keydown.space.prevent="toggleCoupons" role="button" :aria-expanded="isExpanded" aria-label="切换优惠券显示" tabindex="0">
        <div class="coupon-title-new">
          <div class="coupon-icon-new">
            <IconTicket :size="20" />
          </div>
          <div class="coupon-title-text-new">
            <h3>优惠券</h3>
            <p>限时优惠，先到先得</p>
            <div class="coupon-hint-new" v-if="!isExpanded">
              <span class="hint-text-new">点击展开左右滑动查看可用优惠券</span>
            </div>
          </div>
        </div>
        <div class="coupon-toggle-new" :class="{ 'expanded': isExpanded }">
          <IconChevronDown :size="16" />
        </div>
      </div>
      
      <div class="coupon-content-new" :class="{ 'expanded': isExpanded }">
        <!-- 骨架屏加载状态 -->
        <div class="coupon-skeleton-new" v-if="loading">
          <div class="skeleton-card-new" v-for="n in 3" :key="n">
            <div class="skeleton-header-new"></div>
            <div class="skeleton-code-new"></div>
            <div class="skeleton-info-new">
              <div class="skeleton-line-new"></div>
              <div class="skeleton-line-new short"></div>
            </div>
                </div>
              </div>
              
        <div class="coupon-grid-new" v-else-if="coupons.length > 0" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
              <div
            class="coupon-card-enhanced"
                v-for="(coupon, index) in coupons"
                :key="index"
                :class="{ 'expired': isExpired(coupon) }"
            :style="{ 'animation-delay': `${index * 0.1}s` }"
          >
              <!-- 优惠券顶部区域 -->
              <div class="coupon-top-section">
                <div class="coupon-header-info">
                  <div class="coupon-title-section">
                    <h3 class="coupon-title-enhanced">{{ coupon.name }}</h3>
                  </div>
                  <!-- 优惠券状态移到右上角 -->
                  <div class="coupon-status-badge-enhanced" :class="{ 'expired': isExpired(coupon) }">
                    <IconAlertCircle v-if="!isExpired(coupon)" :size="12" />
                    <IconAlertCircle v-else :size="12" />
                    <span v-if="isExpired(coupon)">已过期</span>
                    <span v-else>可使用</span>
                  </div>
                </div>
                
              </div>
              
              <!-- 优惠券代码区域 -->
              <div class="coupon-code-section-enhanced">
                <div class="coupon-code-display-enhanced">
                  <span class="coupon-code-text-enhanced">{{ coupon.couponCode }}</span>
                  <button 
                    class="copy-code-button-enhanced" 
                    @click="copyCouponCode(coupon.couponCode)"
                    :aria-label="`复制优惠码 ${coupon.couponCode}`"
                    title="点击复制优惠码"
                  >
                    <IconCopy :size="14" />
                  </button>
              </div>
            </div>
            
              <!-- 优惠券详细信息 -->
              <div class="coupon-details-section-enhanced">
                <!-- 适用套餐标签 -->
                <div class="plan-info-enhanced" v-if="coupon.validPlans">
                  <div class="plan-label">
                    <IconTicket :size="14" />
                    <span>只适用以下套餐</span>
                  </div>
                  <div class="plan-tags">
                    <span 
                      v-for="plan in getValidPlansArray(coupon.validPlans)" 
                      :key="plan"
                      class="plan-tag"
                      :class="getPlanTagClass(plan)"
                    >
                      {{ plan }}
                        </span>
                    </div>
                  </div>
                  
                <!-- 有效期信息 -->
                <div class="time-info-enhanced" v-if="coupon.endDate">
                  <div class="time-label">
                    <IconAlertCircle :size="14" />
                    <span>有效期至</span>
                  </div>
                  <div class="time-content">
                    <div class="end-date-enhanced" :class="{ 'expired': isExpired(coupon) }">{{ formatDate(coupon.endDate) }}</div>
                    <div class="time-remaining-enhanced" :class="getTimeUrgencyClass(coupon.endDate)">
                      <IconAlertCircle :size="12" />
                      <span>{{ getRelativeTime(coupon.endDate) }}</span>
                </div>
                    <!-- 时间进度条 -->
                    <div class="time-progress-bar" v-if="!isExpired(coupon)">
                      <div class="progress-fill" :style="{ width: getTimeProgress(coupon.endDate) + '%' }"></div>
              </div>
              </div>
              </div>
              
            </div>
          </div>
        </div>
        
        <div v-else class="no-coupons-new">
          <IconTicket :size="48" />
          <p>暂无可用优惠券</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { IconTicket, IconChevronDown, IconChevronRight, IconCopy, IconAlertCircle, IconInfoCircle } from '@tabler/icons-vue'
import { config } from '@/config/index.js'
import { fetchCoupons, fetchPlans } from '@/api/shop.js'

export default {
  name: 'CouponSection',
  components: {
    IconTicket,
    IconChevronDown,
    IconChevronRight,
    IconCopy,
    IconAlertCircle,
    IconInfoCircle
  },
  setup() {
    const coupons = ref([])
    const loading = ref(true)
    const error = ref(null)
    const isExpanded = ref(false)
    const plans = ref([])
    const isMobile = ref(false)
    const touchStartX = ref(0)
    const touchStartY = ref(0)
    
    // 检测是否为移动端
    const checkIsMobile = () => {
      isMobile.value = window.innerWidth <= 768
    }
    
    // 触摸事件处理
    const handleTouchStart = (e) => {
      touchStartX.value = e.touches[0].clientX
      touchStartY.value = e.touches[0].clientY
    }
    
    const handleTouchEnd = (e) => {
      if (!isMobile.value) return
      
      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY
      const deltaX = touchEndX - touchStartX.value
      const deltaY = touchEndY - touchStartY.value
      
      // 水平滑动距离大于垂直滑动距离，且滑动距离足够
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        const couponGrid = e.target.closest('.coupon-grid-new')
        if (couponGrid) {
          const scrollAmount = deltaX > 0 ? -100 : 100
          couponGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
      }
    }
    
    // 获取主题色
    const primaryColor = computed(() => config.THEME_CONFIG?.primaryColor || '#D595DA')
    
    // 生成主题色的RGBA值
    const getThemeColor = (opacity = 1) => {
      const color = primaryColor.value
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
      const darkR = Math.max(0, r - 20)
      const darkG = Math.max(0, g - 20)
      const darkB = Math.max(0, b - 20)
      return `rgba(${darkR}, ${darkG}, ${darkB}, ${opacity})`
    }
    
    // 根据套餐ID获取套餐名称
    const getPlanNameById = (planId) => {
      const plan = plans.value.find(p => p.id === parseInt(planId))
      return plan ? plan.name : `套餐${planId}`
    }
    
    // 格式化套餐限制
    const formatPlanLimits = (planIds) => {
      if (!planIds || planIds.length === 0) return '所有套餐'
      
      const planNames = planIds.map(id => getPlanNameById(id))
      return planNames.join(',') // 改为逗号分隔，便于后续分割
    }
    
    // 检查优惠券是否过期
    const isExpired = (coupon) => {
      if (!coupon.endDate) return false
      return new Date(coupon.endDate) < new Date()
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // 获取相对时间
    const getRelativeTime = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      const now = new Date()
      const diff = date.getTime() - now.getTime()

      if (diff <= 0) return '已过期'

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      if (days > 0) {
        return `${days}天后过期`
      } else if (hours > 0) {
        return `${hours}小时后过期`
      } else {
        return '即将过期'
      }
    }

    // 获取套餐数组
    const getValidPlansArray = (validPlans) => {
      if (!validPlans) return []
      // 支持逗号分隔的套餐字符串
      return validPlans.split(',').map(plan => plan.trim()).filter(plan => plan)
    }

    // 获取套餐标签样式类
    const getPlanTagClass = (plan) => {
      const planLower = plan.toLowerCase()
      
      // 根据套餐名称动态匹配样式
      // 小份/基础套餐 - 绿色
      if (planLower.includes('小份') || planLower.includes('基础') || planLower.includes('basic') || 
          planLower.includes('starter') || planLower.includes('入门') || planLower.includes('mini')) {
        return 'plan-small'
      }
      
      // 中份/标准套餐 - 蓝色  
      if (planLower.includes('中份') || planLower.includes('标准') || planLower.includes('standard') || 
          planLower.includes('medium') || planLower.includes('普通') || planLower.includes('regular')) {
        return 'plan-medium'
      }
      
      // 大份/高级套餐 - 紫色
      if (planLower.includes('大份') || planLower.includes('高级') || planLower.includes('premium') || 
          planLower.includes('pro') || planLower.includes('large') || planLower.includes('plus') ||
          planLower.includes('max') || planLower.includes('ultimate')) {
        return 'plan-large'
      }
      
      // 企业套餐 - 橙色
      if (planLower.includes('企业') || planLower.includes('enterprise') || planLower.includes('business') ||
          planLower.includes('corporate') || planLower.includes('vip')) {
        return 'plan-enterprise'
      }
      
      // 特殊套餐 - 红色
      if (planLower.includes('特殊') || planLower.includes('special') || planLower.includes('exclusive') ||
          planLower.includes('limited') || planLower.includes('限时')) {
        return 'plan-special'
      }
      
      // 默认样式 - 主题色渐变（适用于任何不匹配的套餐）
      return 'plan-gradient'
    }

    // 获取时间紧迫性样式类
    const getTimeUrgencyClass = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      const now = new Date()
      const diff = date.getTime() - now.getTime()

      if (diff <= 0) return 'urgency-expired'
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      
      if (days <= 1) return 'urgency-critical'
      if (days <= 3) return 'urgency-warning'
      if (days <= 7) return 'urgency-notice'
      return 'urgency-normal'
    }

    // 获取时间进度百分比
    const getTimeProgress = (dateString) => {
      if (!dateString) return 0
      const endDate = new Date(dateString)
      const now = new Date()
      
      // 假设优惠券有效期为30天
      const totalDuration = 30 * 24 * 60 * 60 * 1000 // 30天
      const elapsed = now.getTime() - (endDate.getTime() - totalDuration)
      
      const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
      return Math.round(progress)
    }
      
    // 获取剩余时间
    const getTimeRemaining = (coupon) => {
      if (!coupon.endDate) return ''
      
      const now = new Date()
      const end = new Date(coupon.endDate)
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
        showToast(`优惠码 ${couponCode} 已复制到剪贴板`, 'success')
      } catch (err) {
        console.error('复制失败:', err)
        showToast('复制失败，请手动复制', 'error')
      }
    }
    
    // 显示提示信息
    const showToast = (message, type = 'info') => {
      const toast = document.createElement('div')
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
      `
      toast.textContent = message
      
      document.body.appendChild(toast)
      
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast)
          }
      }, 3000)
    }
    
    // 加载优惠券数据
    const loadCoupons = async () => {
      try {
        loading.value = true
        error.value = null
        
        const [couponsResponse, plansResponse] = await Promise.all([
          fetchCoupons(),
          fetchPlans()
        ])
        
        if (plansResponse && plansResponse.data) {
          plans.value = plansResponse.data
        }
        
        if (couponsResponse && couponsResponse.data) {
          const couponData = couponsResponse.data.map(coupon => {
            const isPercentage = coupon.type === 1
            const isExpired = coupon.ended_at ? new Date(coupon.ended_at * 1000) < new Date() : false
            
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
        }
      } catch (err) {
        console.error('加载优惠券失败:', err)
        error.value = err.message || '加载失败'
      } finally {
        loading.value = false
      }
    }
    
    onMounted(() => {
      loadCoupons()
      checkIsMobile()
      
      // 监听窗口大小变化
      window.addEventListener('resize', checkIsMobile)
    })
    
    return {
      coupons,
      loading,
      error,
      isExpanded,
      isMobile,
      isExpired,
      formatDate,
      getRelativeTime,
      getTimeRemaining,
      getValidPlansArray,
      getPlanTagClass,
      getTimeUrgencyClass,
      getTimeProgress,
      toggleCoupons,
      copyCouponCode,
      handleTouchStart,
      handleTouchEnd,
      primaryColor,
      getThemeColor,
      getThemeColorDark
    }
  }
}
</script>

<style lang="scss" scoped>
.coupon-section-new {
  margin-top: 30px;
  margin-bottom: 20px;
}

.coupon-container-new {
  background: var(--card-background, #ffffff);
  border-radius: 16px;
  border: 1px solid var(--border-color, #e2e8f0);
    overflow: visible;
  box-shadow: 0 4px 20px var(--shadow-color, rgba(0, 0, 0, 0.08));
  transition: all 0.3s ease;
}

.coupon-container-new:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.coupon-header-new {
      display: flex;
      justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
      cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, rgba(213, 149, 218, 0.08) 0%, rgba(213, 149, 218, 0.05) 100%);
  border-bottom: 1px solid rgba(213, 149, 218, 0.2);
}

.coupon-header-new:hover,
.coupon-header-new:focus {
  background: linear-gradient(135deg, rgba(213, 149, 218, 0.12) 0%, rgba(213, 149, 218, 0.08) 100%);
  outline: 2px solid rgba(213, 149, 218, 0.3);
  outline-offset: -2px;
}

.coupon-title-new {
        display: flex;
        align-items: center;
        gap: 16px;
}

.coupon-icon-new {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #D595DA 0%, #B885BB 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 12px rgba(213, 149, 218, 0.25);
}

.coupon-title-text-new h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color, #1e293b);
}

.coupon-title-text-new p {
            margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--text-secondary-color, #64748b);
  line-height: 1.4;
}

.coupon-hint-new .hint-text-new {
  font-size: 12px;
  color: #D595DA;
  background: rgba(213, 149, 218, 0.08);
  padding: 4px 8px;
  border-radius: 6px;
            font-weight: 500;
          }


.coupon-toggle-new {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
  background: linear-gradient(135deg, rgba(213, 149, 218, 0.1) 0%, rgba(213, 149, 218, 0.05) 100%);
  color: #D595DA;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(213, 149, 218, 0.2);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.coupon-toggle-new:hover {
  background: #D595DA;
          color: white;
          transform: scale(1.08) translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

.coupon-toggle-new.expanded {
          transform: rotate(180deg);
  background: #D595DA;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

.coupon-content-new {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.4s ease;
      padding: 0;
}

.coupon-content-new.expanded {
        max-height: none;
        padding: 0 0 8px 0;
        overflow-y: visible;
        -webkit-overflow-scrolling: touch;
}

/* 骨架屏样式 */
.coupon-skeleton-new {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
  padding: 16px 20px;
}

.skeleton-card-new {
  background: var(--card-background, #ffffff);
  border-radius: 16px;
  border: 1px solid var(--border-color, #e2e8f0);
  padding: 20px;
  animation: skeletonPulse 1.5s ease-in-out infinite;
}

.skeleton-header-new {
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
          border-radius: 4px;
  margin-bottom: 16px;
  animation: skeletonShimmer 1.5s infinite;
}

.skeleton-code-new {
  height: 40px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  margin-bottom: 16px;
  animation: skeletonShimmer 1.5s infinite;
}

.skeleton-info-new {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line-new {
  height: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
          border-radius: 4px;
  animation: skeletonShimmer 1.5s infinite;
}

.skeleton-line-new.short {
  width: 60%;
}

@keyframes skeletonPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes skeletonShimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.coupon-grid-new {
            display: flex;
  flex-direction: row;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 16px;
  padding: 16px 20px 8px 20px; /* 底部留出滚动条空间 */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: rgba(213, 149, 218, 0.3) transparent; /* Firefox */
  -ms-overflow-style: auto; /* IE and Edge */
}

.coupon-grid-new::-webkit-scrollbar {
  height: 6px; /* Chrome, Safari and Opera */
}

.coupon-grid-new::-webkit-scrollbar-track {
  background: rgba(213, 149, 218, 0.1);
  border-radius: 3px;
}

.coupon-grid-new::-webkit-scrollbar-thumb {
  background: rgba(213, 149, 218, 0.5);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.coupon-grid-new::-webkit-scrollbar-thumb:hover {
  background: rgba(213, 149, 218, 0.7);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .coupon-section-new {
          position: relative;
  }
  
  .coupon-card-enhanced {
    flex: 0 0 90vw; /* 使用视口宽度，确保卡片完整显示 */
    min-width: 90vw;
    max-width: 90vw;
    padding: 20px; /* 减少内边距 */
    gap: 16px; /* 减少间距 */
  }
  
  /* 调整网格容器，确保卡片间距合适 */
  .coupon-grid-new {
    padding: 16px 5vw 8px 5vw; /* 左右使用视口单位，确保卡片完整显示 */
    gap: 10px; /* 减少卡片间距 */
  }
  
  /* 超小屏幕适配 */
  @media (max-width: 480px) {
    .coupon-card-enhanced {
      flex: 0 0 85vw; /* 超小屏幕使用85%视口宽度 */
      min-width: 85vw;
      max-width: 85vw;
      padding: 16px; /* 进一步减少内边距 */
      gap: 12px; /* 进一步减少间距 */
    }
    
    /* 调整网格容器内边距 */
    .coupon-grid-new {
      padding: 12px 16px 8px 16px; /* 减少左右内边距 */
      gap: 12px; /* 减少卡片间距 */
    }
  }
  
  /* 移动端滚动条样式 */
  .coupon-grid-new::-webkit-scrollbar {
    height: 4px; /* 移动端更细的滚动条 */
  }
  
  .coupon-grid-new::-webkit-scrollbar-track {
    background: rgba(213, 149, 218, 0.08);
  }
  
  .coupon-grid-new::-webkit-scrollbar-thumb {
    background: rgba(213, 149, 218, 0.4);
  }
  
  .coupon-grid-new::-webkit-scrollbar-thumb:hover {
    background: rgba(213, 149, 218, 0.6);
  }
}

.coupon-card-enhanced {
  background: var(--card-background, #ffffff);
  border-radius: 20px;
  border: 1px solid var(--border-color, #e2e8f0);
          overflow: visible;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  animation: cardSlideInEnhanced 0.8s ease-out forwards;
            opacity: 0;
  transform: translateY(30px) scale(0.95);
  flex: 0 0 380px;
  min-width: 380px;
  max-width: 380px;
}

@keyframes cardSlideInEnhanced {
  to {
              opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.coupon-card-enhanced:hover {
  background: linear-gradient(135deg, rgba(var(--theme-color-rgb, 213, 149, 218), 0.12) 0%, rgba(var(--theme-color-rgb, 213, 149, 218), 0.08) 100%);
  transform: translateY(-8px) scale(1.03);
  box-shadow: 0 16px 40px rgba(var(--theme-color-rgb, 213, 149, 218), 0.2);
  border-color: rgba(var(--theme-color-rgb, 213, 149, 218), 0.4);
}

.coupon-card-enhanced.expired {
  opacity: 0.7;
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.08) 0%, rgba(107, 114, 128, 0.04) 100%);
  border-color: rgba(107, 114, 128, 0.3);
              position: relative;
            }

.coupon-card-enhanced.expired::before {
              content: '';
              position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 48%, rgba(239, 68, 68, 0.1) 49%, rgba(239, 68, 68, 0.1) 51%, transparent 52%);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 1;
}

.coupon-card-enhanced.expired:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 12px 28px rgba(107, 114, 128, 0.15);
}

.coupon-header-section-new {
              display: flex;
            justify-content: space-between;
            align-items: center;
  margin-bottom: 8px;
}

.coupon-badge-new {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #D595DA 0%, #B885BB 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
                font-size: 12px;
  font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.coupon-status-badge-new {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.coupon-status-badge-new:not(.expired) {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.coupon-status-badge-new.expired {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.coupon-code-section-new {
  background: linear-gradient(135deg, rgba(213, 149, 218, 0.15) 0%, rgba(213, 149, 218, 0.10) 100%);
  border: 2px dashed rgba(213, 149, 218, 0.3);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
                position: relative;
  overflow: hidden;
              }

.coupon-code-display-new {
  position: relative;
  z-index: 2;
                display: flex;
                align-items: center;
  justify-content: center;
                gap: 12px;
}

.coupon-code-text-new {
                  font-family: 'Courier New', monospace;
  font-size: 20px;
  font-weight: 900;
                  letter-spacing: 0.1em;
  color: #D595DA;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.copy-code-button-new {
  background: #D595DA;
  color: white;
  border: none;
                  border-radius: 8px;
                  padding: 8px;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  display: flex;
                  align-items: center;
                  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                  position: relative;
  overflow: hidden;
}

.copy-code-button-new::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
                    background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.copy-code-button-new:hover {
  background: #B885BB;
                    transform: scale(1.1);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                  }

.copy-code-button-new:active {
                    transform: scale(0.95);
                  }

.copy-code-button-new:active::before {
  width: 300px;
  height: 300px;
}


.coupon-name-new {
                font-size: 16px;
                font-weight: 600;
  color: var(--text-color, #1e293b);
  margin: 0 0 12px 0;
                line-height: 1.4;
              }

.coupon-details-new {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 精致信息行设计 */
.info-row-new {
            display: flex;
            justify-content: space-between;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color, rgba(226, 232, 240, 0.2));
  transition: all 0.2s ease;
}

.info-row-new:last-child {
  border-bottom: none;
}

.info-row-new:hover {
  background: rgba(213, 149, 218, 0.03);
  border-radius: 6px;
  padding: 10px 8px;
  margin: 0 -8px;
}

.info-label-wrapper-new {
              display: flex;
            align-items: center;
              gap: 8px;
  flex-shrink: 0;
}

.info-dot-new {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}

.info-dot-new::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 4px;
  background: currentColor;
  border-radius: 50%;
}

.plan-dot-new {
  background: rgba(34, 197, 94, 0.2);
  color: #16a34a;
}

.time-dot-new {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.time-dot-new.expired {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.note-dot-new {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

.info-label-new {
  font-size: 12px;
  color: var(--text-secondary-color, #64748b);
                    font-weight: 500;
  letter-spacing: 0.3px;
}

.info-value-new {
  font-size: 13px;
  color: var(--text-color, #1e293b);
  font-weight: 400;
  text-align: right;
  flex: 1;
  margin-left: 16px;
                    line-height: 1.4;
}

.date-new {
  display: block;
  margin-bottom: 3px;
}

.date-new.expired {
  color: #dc2626;
}

.remaining-new {
  font-size: 11px;
  color: #16a34a;
  font-weight: 500;
  background: rgba(34, 197, 94, 0.1);
                      padding: 2px 6px;
                      border-radius: 4px;
                      display: inline-block;
                    }
                    
.coupon-detail-item-new {
                display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  background: var(--secondary-bg-color, rgba(248, 250, 252, 0.5));
  border-radius: 8px;
  border-left: 3px solid var(--theme-color, #D595DA);
                  transition: all 0.2s ease;
}

.coupon-detail-item-new:hover {
  background: var(--hover-bg-color, rgba(248, 250, 252, 0.8));
  transform: translateX(2px);
}

.detail-icon-new {
  font-size: 14px;
  margin-top: 2px;
                    flex-shrink: 0;
                  }

.detail-content-new {
  flex: 1;
                      display: flex;
                      flex-direction: column;
                      gap: 2px;
}
                      
.detail-label-new {
  font-size: 11px;
                        font-weight: 600;
  color: var(--theme-color, #D595DA);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.detail-value-new {
  font-size: 13px;
  color: var(--text-secondary-color, #374151);
  line-height: 1.3;
}

.detail-value-new.expired-text {
  color: #dc2626;
}

.date-text-new {
  display: block;
  margin-bottom: 2px;
}

.time-remaining-new {
                font-size: 11px;
  color: #16a34a;
                font-weight: 600;
      }

.no-coupons-new {
                        text-align: center;
        padding: 60px 20px;
  color: var(--text-secondary-color, #64748b);
}

.no-coupons-new svg {
  color: var(--text-secondary-color, #94a3b8);
          margin-bottom: 16px;
        }

.no-coupons-new p {
          font-size: 16px;
          margin: 0;
  color: var(--text-secondary-color, #64748b);
}

/* 黑夜模式适配 - 使用项目主题系统 */
:root.dark-theme .coupon-section-new,
body.dark-theme .coupon-section-new {
  .coupon-container-new {
    background: var(--card-background, rgba(15, 23, 42, 0.9));
    border-color: var(--border-color, rgba(71, 85, 105, 0.3));
  }
  
  .coupon-card-new {
    background: var(--card-background, rgba(15, 23, 42, 0.9));
    border-color: var(--border-color, rgba(71, 85, 105, 0.3));
  }
  
  .coupon-code-section-new {
    background: linear-gradient(135deg, rgba(213, 149, 218, 0.20) 0%, rgba(213, 149, 218, 0.15) 100%);
    border-color: rgba(213, 149, 218, 0.4);
  }
  
  .coupon-code-text-new {
    background: var(--card-background, rgba(15, 23, 42, 0.95));
    color: var(--theme-color, #D595DA);
    border-color: var(--border-color, rgba(71, 85, 105, 0.5));
  }
  
  .coupon-detail-item-new {
    background: var(--secondary-bg-color, rgba(30, 41, 59, 0.5));
    border-left-color: var(--theme-color, #D595DA);
  }
  
  .coupon-detail-item-new:hover {
    background: var(--hover-bg-color, rgba(30, 41, 59, 0.8));
  }
  
  .detail-content-new .detail-label-new {
    color: var(--theme-color, #D595DA);
  }
  
  .detail-content-new .detail-value-new {
    color: var(--text-secondary-color, #cbd5e1);
  }
  
  .detail-content-new .detail-value-new.expired-text {
    color: #f87171;
  }
  
  .detail-content-new .time-remaining-new {
    color: #34d399;
  }
  
  .coupon-name-new {
    color: var(--text-color, #f1f5f9);
  }
  
  .coupon-header-new {
    background: linear-gradient(135deg, rgba(213, 149, 218, 0.12) 0%, rgba(213, 149, 218, 0.08) 100%);
    border-bottom-color: rgba(213, 149, 218, 0.25);
  }
  
  .coupon-title-text-new h3 {
    color: var(--text-color, #f1f5f9);
  }
  
  .coupon-title-text-new p {
    color: var(--text-secondary-color, #94a3b8);
  }
  
  .coupon-hint-new .hint-text-new {
    background: rgba(213, 149, 218, 0.15);
    color: var(--theme-color, #D595DA);
  }
  
  .no-coupons-new {
    color: var(--text-secondary-color, #94a3b8);
  }
  
  .no-coupons-new svg {
    color: var(--text-secondary-color, #64748b);
  }
  
  .no-coupons-new p {
    color: var(--text-secondary-color, #94a3b8);
  }
  
  /* 精致信息行黑夜模式 */
  .info-row-new {
    border-bottom-color: var(--border-color, rgba(71, 85, 105, 0.3));
  }
  
  .info-row-new:hover {
    background: rgba(213, 149, 218, 0.05);
  }
  
  .plan-dot-new {
    background: rgba(34, 197, 94, 0.25);
    color: #22c55e;
  }
  
  .time-dot-new {
    background: rgba(59, 130, 246, 0.25);
    color: #60a5fa;
  }
  
  .time-dot-new.expired {
    background: rgba(239, 68, 68, 0.25);
    color: #f87171;
  }
  
  .note-dot-new {
    background: rgba(168, 85, 247, 0.25);
    color: #c084fc;
  }
  
  .info-label-new {
    color: var(--text-secondary-color, #94a3b8);
  }
  
  .info-value-new {
    color: var(--text-color, #f1f5f9);
  }
  
  .date-new.expired {
    color: #f87171;
  }
  
  .remaining-new {
    color: #34d399;
    background: rgba(34, 197, 94, 0.15);
  }
}

/* 系统主题检测备用方案 */
@media (prefers-color-scheme: dark) {
  .coupon-section-new:not(.light-theme) {
    .coupon-container-new {
      background: var(--card-background, rgba(15, 23, 42, 0.9));
      border-color: var(--border-color, rgba(71, 85, 105, 0.3));
    }
    
    .coupon-card-new {
      background: var(--card-background, rgba(15, 23, 42, 0.9));
      border-color: var(--border-color, rgba(71, 85, 105, 0.3));
    }
    
    .coupon-code-section-new {
      background: linear-gradient(135deg, rgba(213, 149, 218, 0.20) 0%, rgba(213, 149, 218, 0.15) 100%);
      border-color: rgba(213, 149, 218, 0.4);
    }
    
    .coupon-code-text-new {
      background: var(--card-background, rgba(15, 23, 42, 0.95));
      color: var(--theme-color, #D595DA);
      border-color: var(--border-color, rgba(71, 85, 105, 0.5));
    }
    
    .coupon-detail-item-new {
      background: var(--secondary-bg-color, rgba(30, 41, 59, 0.5));
      border-left-color: var(--theme-color, #D595DA);
    }
    
    .coupon-detail-item-new:hover {
      background: var(--hover-bg-color, rgba(30, 41, 59, 0.8));
    }
    
    .detail-content-new .detail-label-new {
      color: var(--theme-color, #D595DA);
    }
    
    .detail-content-new .detail-value-new {
      color: var(--text-secondary-color, #cbd5e1);
    }
    
    .detail-content-new .detail-value-new.expired-text {
      color: #f87171;
    }
    
    .detail-content-new .time-remaining-new {
      color: #34d399;
    }
    
    .coupon-name-new {
      color: var(--text-color, #f1f5f9);
    }
    
    .coupon-header-new {
      background: linear-gradient(135deg, rgba(213, 149, 218, 0.12) 0%, rgba(213, 149, 218, 0.08) 100%);
      border-bottom-color: rgba(213, 149, 218, 0.25);
    }
    
    .coupon-title-text-new h3 {
      color: var(--text-color, #f1f5f9);
    }
    
    .coupon-title-text-new p {
      color: var(--text-secondary-color, #94a3b8);
    }
    
    .coupon-hint-new .hint-text-new {
      background: rgba(213, 149, 218, 0.15);
      color: var(--theme-color, #D595DA);
    }
    
    .no-coupons-new {
      color: var(--text-secondary-color, #94a3b8);
    }
    
    .no-coupons-new svg {
      color: var(--text-secondary-color, #64748b);
    }
    
    .no-coupons-new p {
      color: var(--text-secondary-color, #94a3b8);
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .coupon-section-new {
    margin-top: 20px;
    margin-bottom: 15px;
  }

  .coupon-container-new .coupon-header-new {
    padding: 16px 20px;
  }

  .coupon-container-new .coupon-title-new {
          gap: 12px;
  }

  .coupon-container-new .coupon-icon-new {
    width: 40px;
    height: 40px;
  }

  .coupon-container-new .coupon-title-text-new h3 {
              font-size: 18px;
            }

  .coupon-container-new .coupon-title-text-new p {
    font-size: 13px;
  }

  .coupon-container-new .coupon-toggle-new {
    width: 36px;
    height: 36px;
  }

  .coupon-container-new .coupon-content-new.expanded {
    max-height: none;
  }

  /* 移动端卡片样式调整 */
  .coupon-container-new .coupon-card-new {
    padding: 16px;
    gap: 12px;
  }

  .coupon-container-new .coupon-code-section-new {
    padding: 12px;
  }

  .coupon-container-new .coupon-code-display-new {
            flex-direction: column;
    gap: 8px;
  }

  .coupon-container-new .coupon-code-text-new {
    font-size: 18px;
    padding: 6px 12px;
  }

  .coupon-container-new .coupon-name-new {
    font-size: 15px;
  }

  .coupon-container-new .coupon-details-new {
                  gap: 8px;
  }

  .coupon-container-new .coupon-detail-item-new {
    padding: 6px 10px;
  }

  .coupon-container-new .detail-content-new .detail-label-new {
    font-size: 10px;
  }

  .coupon-container-new .detail-content-new .detail-value-new {
    font-size: 12px;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ===== 增强版优惠券样式 ===== */

/* 优惠券顶部区域 */
.coupon-top-section {
  display: flex;
              flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 2;
}

.coupon-header-info {
  display: flex;
  justify-content: space-between;
              align-items: flex-start;
  gap: 16px;
}

.coupon-title-section {
  flex: 1;
}

.coupon-title-enhanced {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color, #1e293b);
  margin: 0 0 6px 0;
  line-height: 1.3;
  background: linear-gradient(135deg, var(--theme-color, #D595DA) 0%, #B885BB 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}




.coupon-status-badge-enhanced {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.coupon-status-badge-enhanced:not(.expired) {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.coupon-status-badge-enhanced.expired {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* 优惠券代码区域增强版 */
.coupon-code-section-enhanced {
  background: linear-gradient(135deg, rgba(var(--theme-color-rgb, 213, 149, 218), 0.2) 0%, rgba(var(--theme-color-rgb, 213, 149, 218), 0.15) 100%);
  border: 2px dashed rgba(var(--theme-color-rgb, 213, 149, 218), 0.4);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.coupon-code-section-enhanced::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

.coupon-code-display-enhanced {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.coupon-code-text-enhanced {
                     font-family: 'Courier New', monospace;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.15em;
  color: var(--theme-color, #D595DA);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 20px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.copy-code-button-enhanced {
  background: linear-gradient(135deg, var(--theme-color, #D595DA) 0%, #B885BB 100%);
                     color: white;
  border: none;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(var(--theme-color-rgb, 213, 149, 218), 0.3);
  position: relative;
  overflow: hidden;
}

.copy-code-button-enhanced::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.copy-code-button-enhanced:hover {
  background: linear-gradient(135deg, #B885BB 0%, #9A6B9D 100%);
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(var(--theme-color-rgb, 213, 149, 218), 0.4);
}

.copy-code-button-enhanced:active {
  transform: scale(0.95);
}

.copy-code-button-enhanced:active::before {
  width: 300px;
  height: 300px;
}

/* 优惠券详细信息区域 */
.coupon-details-section-enhanced {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 套餐信息增强版 */
.plan-info-enhanced {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
                 font-weight: 600;
  color: var(--text-secondary-color, #64748b);
}

.plan-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px; /* 从8px减少到4px */
}

.plan-tag {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
}

.plan-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.plan-basic {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.4);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.plan-standard {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.4);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.plan-premium {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%);
  color: #a855f7;
  border: 1px solid rgba(168, 85, 247, 0.4);
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.2);
}

.plan-enterprise {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.4);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

/* 套餐样式 - 根据套餐类型动态应用 */
.plan-small {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.4);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

.plan-medium {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.4);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.plan-large {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%);
  color: #a855f7;
  border: 1px solid rgba(168, 85, 247, 0.4);
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.2);
}

/* 特殊套餐样式 */
.plan-special {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.4);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

/* 更美观的默认样式 */
.plan-gradient {
  background: linear-gradient(135deg, rgba(213, 149, 218, 0.2) 0%, rgba(213, 149, 218, 0.1) 100%);
  color: #d595da;
  border: 1px solid rgba(213, 149, 218, 0.4);
  box-shadow: 0 2px 8px rgba(213, 149, 218, 0.2);
}

.plan-default {
  background: linear-gradient(135deg, rgba(107, 114, 128, 0.2) 0%, rgba(107, 114, 128, 0.1) 100%);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.4);
  box-shadow: 0 2px 8px rgba(107, 114, 128, 0.2);
}

/* 时间信息增强版 */
.time-info-enhanced {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.time-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary-color, #64748b);
}

.time-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.end-date-enhanced {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color, #1e293b);
}

.end-date-enhanced.expired {
  color: #dc2626;
}

.time-remaining-enhanced {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.urgency-normal {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}

.urgency-notice {
                          background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.urgency-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  animation: warningPulse 2s infinite;
}

.urgency-critical {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
  animation: criticalPulse 1s infinite;
}

.urgency-expired {
  background: rgba(107, 114, 128, 0.15);
  color: #6b7280;
}

@keyframes warningPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes criticalPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

/* 时间进度条 */
.time-progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(226, 232, 240, 0.5);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #16a34a 0%, #22c55e 50%, #f59e0b 80%, #ef4444 100%);
  border-radius: 2px;
  transition: width 0.5s ease;
}


/* 移动端适配 */
@media (max-width: 768px) {
  .coupon-card-enhanced {
    padding: 20px;
    gap: 16px;
  }
  
  .coupon-header-info {
    flex-direction: column;
    gap: 12px;
  }
  
  .coupon-title-enhanced {
    font-size: 16px;
  }
  
  .coupon-code-text-enhanced {
    font-size: 18px;
    padding: 10px 16px;
  }
  
  .plan-tags {
    gap: 3px; /* 从6px减少到3px */
  }
  
  .plan-tag {
    padding: 4px 8px;
    font-size: 10px;
  }
}

/* 黑夜模式适配 */
@media (prefers-color-scheme: dark) {
  .coupon-card-enhanced {
    background: var(--card-background, #1e293b);
    border-color: var(--border-color, #334155);
  }
  
  /* 黑夜模式滚动条样式 */
  .coupon-grid-new {
    scrollbar-color: rgba(213, 149, 218, 0.4) transparent; /* Firefox */
  }
  
  .coupon-grid-new::-webkit-scrollbar-track {
    background: rgba(213, 149, 218, 0.15);
  }
  
  .coupon-grid-new::-webkit-scrollbar-thumb {
    background: rgba(213, 149, 218, 0.6);
  }
  
  .coupon-grid-new::-webkit-scrollbar-thumb:hover {
    background: rgba(213, 149, 218, 0.8);
  }
  
  .coupon-card-enhanced:hover {
    background: linear-gradient(135deg, rgba(var(--theme-color-rgb, 213, 149, 218), 0.15) 0%, rgba(var(--theme-color-rgb, 213, 149, 218), 0.1) 100%);
    border-color: rgba(var(--theme-color-rgb, 213, 149, 218), 0.4);
  }
  
  .coupon-card-enhanced.expired {
    background: linear-gradient(135deg, rgba(71, 85, 105, 0.1) 0%, rgba(71, 85, 105, 0.05) 100%);
    border-color: rgba(71, 85, 105, 0.3);
  }
  
  .coupon-title-enhanced {
    background: linear-gradient(135deg, #D595DA 0%, #B885BB 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .coupon-status-badge-enhanced:not(.expired) {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    border-color: rgba(34, 197, 94, 0.4);
  }
  
  .coupon-status-badge-enhanced.expired {
    background: rgba(239, 68, 68, 0.2);
                        color: #f87171;
    border-color: rgba(239, 68, 68, 0.4);
  }
  
  .coupon-code-section-enhanced {
    background: linear-gradient(135deg, rgba(var(--theme-color-rgb, 213, 149, 218), 0.25) 0%, rgba(var(--theme-color-rgb, 213, 149, 218), 0.2) 100%);
    border-color: rgba(var(--theme-color-rgb, 213, 149, 218), 0.5);
  }
  
  .coupon-code-text-enhanced {
    background: rgba(30, 41, 59, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
    color: #D595DA;
  }
  
  .plan-label {
    color: var(--text-secondary-color, #94a3b8);
  }
  
  .plan-basic {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border-color: rgba(59, 130, 246, 0.4);
  }
  
  .plan-standard {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    border-color: rgba(34, 197, 94, 0.4);
  }
  
  .plan-premium {
    background: rgba(168, 85, 247, 0.2);
    color: #c084fc;
    border-color: rgba(168, 85, 247, 0.4);
  }
  
  .plan-enterprise {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
    border-color: rgba(245, 158, 11, 0.4);
  }
  
  .plan-default {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
    border-color: rgba(107, 114, 128, 0.4);
  }
  
  .time-label {
    color: var(--text-secondary-color, #94a3b8);
  }
  
  .end-date-enhanced {
    color: var(--text-color, #f1f5f9);
  }
  
  .end-date-enhanced.expired {
    color: #f87171;
  }
  
  .urgency-normal {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }
  
  .urgency-notice {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }
  
  .urgency-warning {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
  }
  
  .urgency-critical {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
  
  .urgency-expired {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
  }
  
  .time-progress-bar {
    background: rgba(71, 85, 105, 0.3);
  }
  
  .progress-fill {
    background: linear-gradient(90deg, #22c55e 0%, #34d399 50%, #fbbf24 80%, #f87171 100%);
  }
}

/* 项目主题系统黑夜模式适配 */
:root.dark-theme,
body.dark-theme {
  .coupon-card-enhanced {
    background: var(--card-background, #1e293b);
    border-color: var(--border-color, #334155);
  }
  
  .coupon-card-enhanced:hover {
    background: linear-gradient(135deg, rgba(var(--theme-color-rgb, 213, 149, 218), 0.15) 0%, rgba(var(--theme-color-rgb, 213, 149, 218), 0.1) 100%);
    border-color: rgba(var(--theme-color-rgb, 213, 149, 218), 0.4);
  }
  
  .coupon-title-enhanced {
    background: linear-gradient(135deg, #D595DA 0%, #B885BB 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .coupon-code-text-enhanced {
    background: rgba(30, 41, 59, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
    color: #D595DA;
  }
}
</style>