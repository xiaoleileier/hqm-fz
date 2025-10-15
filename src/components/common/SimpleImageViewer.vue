<template>
  <div v-if="visible" class="simple-image-viewer" @click="closeViewer">
    <div class="viewer-content" @click.stop>
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="closeViewer">×</button>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="action-btn zoom-in" @click="zoomIn" title="放大">+</button>
        <button class="action-btn zoom-out" @click="zoomOut" title="缩小">−</button>
        <button class="action-btn reset" @click="resetZoom" title="重置">↻</button>
      </div>
      
      <!-- 图片 -->
      <img 
        :src="imageSrc" 
        :alt="imageAlt"
        class="viewer-image"
        :style="getImageStyle()"
        @load="onImageLoad"
        @error="onImageError"
      />
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-if="error" class="error">
        <p>图片加载失败</p>
      </div>
      
      <!-- 图片信息 -->
      <div v-if="imageInfo" class="image-info">
        {{ imageInfo }}
        <div class="zoom-info">
          缩放: {{ Math.round(zoomLevel * 100) }}%
        </div>
        <div v-if="isLongImage" class="scroll-hint">
          💡 可滚动查看完整图片
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  imageSrc: {
    type: String,
    required: true
  },
  imageAlt: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const error = ref(false)
const imageInfo = ref('')
const isLongImage = ref(false)
const zoomLevel = ref(1)
const baseScale = ref(1)

const closeViewer = () => {
  emit('close')
  // 重置缩放
  zoomLevel.value = 1
  baseScale.value = 1
}

// 缩放方法
const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 5) // 最大5倍
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.2) // 最小0.2倍
}

const resetZoom = () => {
  zoomLevel.value = 1
}

// 获取图片样式
const getImageStyle = () => {
  const totalScale = baseScale.value * zoomLevel.value
  
  if (isLongImage.value) {
    // 极长图：从左上角开始缩放
    return {
      transform: `scale(${totalScale})`,
      transformOrigin: 'top left'
    }
  } else {
    // 普通图片：从中心缩放
    return {
      transform: `translate(-50%, -50%) scale(${totalScale})`,
      transformOrigin: 'center'
    }
  }
}

const onImageLoad = () => {
  loading.value = false
  error.value = false
  
  nextTick(() => {
    const img = document.querySelector('.viewer-image')
    if (img) {
      imageInfo.value = `${img.naturalWidth} × ${img.naturalHeight}`
      
      // 检测是否为极长图（宽高比大于2:1）
      const aspectRatio = img.naturalHeight / img.naturalWidth
      if (aspectRatio > 2) {
        img.classList.add('long-image')
        isLongImage.value = true
        
        // 对于极长图，让宽度占满查看器的90%，高度按比例缩放
        const containerWidth = window.innerWidth * 0.9
        baseScale.value = containerWidth / img.naturalWidth
        
        // 设置图片原始尺寸
        img.style.width = `${img.naturalWidth}px`
        img.style.height = `${img.naturalHeight}px`
        img.style.position = 'absolute'
        img.style.top = '0'
        img.style.left = '0'
        
        // 自动滚动到图片顶部
        const container = document.querySelector('.viewer-content')
        if (container) {
          container.scrollTo({ top: 0, behavior: 'smooth' })
        }
      } else {
        isLongImage.value = false
        // 普通图片：适应容器大小
        const containerWidth = window.innerWidth * 0.8
        const containerHeight = window.innerHeight * 0.8
        const scaleX = containerWidth / img.naturalWidth
        const scaleY = containerHeight / img.naturalHeight
        baseScale.value = Math.min(scaleX, scaleY)
        
        // 设置图片原始尺寸
        img.style.width = `${img.naturalWidth}px`
        img.style.height = `${img.naturalHeight}px`
        img.style.position = 'absolute'
        img.style.top = '50%'
        img.style.left = '50%'
      }
      
      // 重置缩放级别
      zoomLevel.value = 1
    }
  })
}

const onImageError = () => {
  loading.value = false
  error.value = true
}

// 键盘事件
const handleKeydown = (event) => {
  if (!props.visible) return
  
  switch (event.key) {
    case 'Escape':
      closeViewer()
      break
    case '+':
    case '=':
      event.preventDefault()
      zoomIn()
      break
    case '-':
      event.preventDefault()
      zoomOut()
      break
    case '0':
      event.preventDefault()
      resetZoom()
      break
  }
}

// 鼠标滚轮事件
const handleWheel = (event) => {
  if (!props.visible) return
  
  // 如果按住Ctrl键，进行缩放
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    if (event.deltaY < 0) {
      zoomIn()
    } else {
      zoomOut()
    }
  } else {
    // 普通滚轮进行滚动
    event.preventDefault()
    const container = document.querySelector('.viewer-content')
    if (container) {
      container.scrollBy({ 
        top: event.deltaY, 
        behavior: 'smooth' 
      })
    }
  }
}

// 触摸滑动支持
let touchStartY = 0
let touchStartX = 0

const handleTouchStart = (event) => {
  if (!props.visible) return
  
  touchStartY = event.touches[0].clientY
  touchStartX = event.touches[0].clientX
}

const handleTouchMove = (event) => {
  if (!props.visible) return
  
  event.preventDefault()
  const container = document.querySelector('.viewer-content')
  if (container) {
    const touchY = event.touches[0].clientY
    const touchX = event.touches[0].clientX
    const deltaY = touchStartY - touchY
    const deltaX = touchStartX - touchX
    
    // 如果垂直滑动距离大于水平滑动距离，则进行滚动
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      container.scrollBy({ 
        top: deltaY, 
        behavior: 'auto' 
      })
    }
    
    touchStartY = touchY
    touchStartX = touchX
  }
}

// 监听事件
import { onMounted, onUnmounted } from 'vue'
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('wheel', handleWheel, { passive: false })
  document.addEventListener('touchstart', handleTouchStart, { passive: false })
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
})
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('wheel', handleWheel)
  document.removeEventListener('touchstart', handleTouchStart)
  document.removeEventListener('touchmove', handleTouchMove)
})

// 监听图片变化
import { watch } from 'vue'
watch(() => props.imageSrc, () => {
  if (props.imageSrc) {
    loading.value = true
    error.value = false
    imageInfo.value = ''
  }
})
</script>

<style lang="scss" scoped>
.simple-image-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.viewer-content {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 改为左对齐 */
  justify-content: flex-start; /* 改为顶部对齐，避免极长图被居中压缩 */
  padding: 0; /* 移除内边距，避免截断 */
  overflow: auto; /* 允许滚动查看极长图 */
  
  /* 优化滚动条样式 */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }
  
  /* 平滑滚动 */
  scroll-behavior: smooth;
}

.close-btn {
  position: fixed; /* 改为fixed定位，确保始终可见 */
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10000;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }
}

.action-buttons {
  position: fixed;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 8px;
  z-index: 10000;
}

.action-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }
  
  &.zoom-in {
    background: rgba(76, 175, 80, 0.8);
    
    &:hover {
      background: rgba(76, 175, 80, 1);
    }
  }
  
  &.zoom-out {
    background: rgba(255, 152, 0, 0.8);
    
    &:hover {
      background: rgba(255, 152, 0, 1);
    }
  }
  
  &.reset {
    background: rgba(33, 150, 243, 0.8);
    
    &:hover {
      background: rgba(33, 150, 243, 1);
    }
  }
}

.viewer-image {
  max-width: none; /* 移除最大宽度限制 */
  max-height: none; /* 移除最大高度限制 */
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transform-origin: top left; /* 设置变换原点为左上角 */
  
  /* 针对极长图的特殊处理 */
  &.long-image {
    width: auto;
    height: auto;
  }
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  font-size: 16px;
  
  p {
    margin-top: 12px;
  }
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.image-info {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  white-space: nowrap;
  z-index: 10000;
  backdrop-filter: blur(8px);
  text-align: center;
}

.zoom-info {
  font-size: 12px;
  color: #2196F3;
  margin-top: 2px;
  white-space: nowrap;
}

.scroll-hint {
  font-size: 12px;
  color: #4CAF50;
  margin-top: 4px;
  white-space: nowrap;
}

.error {
  color: #ff6b6b;
}
</style>
