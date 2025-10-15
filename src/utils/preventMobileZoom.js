/**
 * 移动端输入框缩放控制
 * 专门解决登录注册页面的缩放问题
 */

// 检测移动设备
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 防止输入框焦点时页面缩放
const preventInputZoom = () => {
  if (!isMobileDevice()) return

  // 监听所有输入框
  const handleInputFocus = (e) => {
    const input = e.target
    
    // 确保字体大小不小于16px
    const computedStyle = window.getComputedStyle(input)
    const fontSize = parseFloat(computedStyle.fontSize)
    
    if (fontSize < 16) {
      input.style.fontSize = '16px'
    }
    
    // 温和的viewport调整，不禁止用户缩放
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover')
    }
  }

  const handleInputBlur = () => {
    // 延迟恢复，等待键盘收起
    setTimeout(() => {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover')
      }
    }, 300)
  }

  // 添加事件监听器
  document.addEventListener('focusin', handleInputFocus)
  document.addEventListener('focusout', handleInputBlur)

  // 清理函数
  return () => {
    document.removeEventListener('focusin', handleInputFocus)
    document.removeEventListener('focusout', handleInputBlur)
  }
}

// 初始化
let cleanup = null

const initMobileZoomPrevention = () => {
  if (cleanup) {
    cleanup()
  }
  cleanup = preventInputZoom()
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileZoomPrevention)
} else {
  initMobileZoomPrevention()
}

// 监听页面可见性变化
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    setTimeout(initMobileZoomPrevention, 100)
  }
})

export { initMobileZoomPrevention }
