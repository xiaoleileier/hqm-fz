<template>
  <div class="nodes-container">
    <!-- 域名授权验证提示 - 如果不需要域名授权功能，移除此组件即可 -->
    
    <div class="nodes-inner">
      <!-- 视图切换卡片 -->
      <WelcomeCard 
        :current-view="currentView" 
        @switch-view="handleSwitchView" 
      />

      <!-- 节点列表状态 -->
      <div v-if="loading" class="nodes-loading">
        <LoadingSpinner />
        <p>{{ $t('nodes.loading') || '正在加载节点...' }}</p>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="nodes-error">
        <IconAlertTriangle :size="48" class="error-icon" />
        <p>{{ error }}</p>
        <button class="retry-button" @click="fetchNodes">{{ $t('common.retry') || '重试' }}</button>
      </div>

      <!-- 节点内容区域 -->
      <div v-else-if="nodes.length > 0" class="nodes-content">
        <!-- 地图视图 -->
        <div v-if="currentView === 'map'" class="map-view-container">
          <MapView 
            :nodes="nodes" 
            @show-detail="openNodeDetail" 
          />
        </div>

        <!-- 列表视图 -->
        <div v-else class="list-view-container">
          <div class="node-items">
            <div v-for="node in nodes" :key="node.id" class="node-item">
              <!-- 节点状态指示器 -->
              <div class="node-status">
                <div class="status-indicator" :class="{ 'online': node.is_online === 1 }"></div>
              </div>

              <!-- 节点信息 -->
              <div class="node-info">
                <!-- 节点名称 -->
                <h3 class="node-name">{{ node.name }}</h3>

                <!-- 倍率和协议信息 -->
                <div class="node-specs">
                  <!-- 倍率 -->
                  <span class="spec-item rate-spec" v-if="showNodeRate">
                    ⚡ {{ node.rate }}倍率
                  </span>

                  <!-- 协议信息 -->
                  <span class="spec-item protocol-spec" v-if="showNodeDetails">
                    🔗 {{ node.protocol || 'HTTP' }}
                  </span>

                  <!-- 分组信息 -->
                  <span class="spec-item group-spec" v-if="node.group_id && node.group_id.length > 0">
                    📦 {{ getGroupName(node.group_id[0]) }}
                  </span>
                </div>

                <!-- 节点描述 -->
                <p class="node-description" v-if="node.description">
                  {{ node.description }}
                </p>
              </div>

              <!-- 节点操作 -->
              <div class="node-actions">
                <!-- 查看详情按钮 -->
                <button 
                  v-if="allowViewNodeInfo"
                  class="action-btn detail-btn" 
                  @click="openNodeDetail(node)"
                  :title="$t('nodes.viewDetails') || '查看详情'"
                >
                  <IconServer :size="16" />
                  <span class="btn-text">{{ $t('nodes.viewDetails') || '详情' }}</span>
                </button>

                <!-- 选择节点按钮 -->
                <button 
                  class="action-btn select-btn" 
                  @click="selectNode(node)"
                  :disabled="!node.is_online"
                  :title="node.is_online ? ($t('nodes.selectNode') || '选择节点') : ($t('nodes.nodeOffline') || '节点离线')"
                >
                  <IconDotsVertical :size="16" />
                  <span class="btn-text">
                    {{ node.is_online ? ($t('nodes.selectNode') || '选择') : ($t('nodes.offline') || '离线') }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="nodes-empty">
        <IconServer :size="64" class="empty-icon" />
        <h3>{{ $t('nodes.empty.title') || '暂无可用节点' }}</h3>
        <p>{{ $t('nodes.empty.description') || '当前没有可用的服务器节点，请稍后再试' }}</p>
        <button class="retry-button" @click="fetchNodes">{{ $t('common.retry') || '重试' }}</button>
      </div>
    </div>

    <!-- 节点详情弹窗 -->
    <NodeDetailModal 
      v-if="showDetailModal"
      :node="selectedNode"
      @close="closeNodeDetail"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, inject, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import WelcomeCard from './components/WelcomeCard.vue';
import MapView from './components/MapView.vue';
import { 
  IconAlertTriangle,
  IconServer,
  IconDotsVertical
} from '@tabler/icons-vue';
import { fetchServerNodes } from '@/api/servers';
import { getUserInfo } from '@/api/user';
import { NODES_CONFIG } from '@/utils/baseConfig';
import NodeDetailModal from '@/components/common/NodeDetailModal.vue';

const { t } = useI18n();
const $toast = inject('$toast');

// 视图状态
const currentView = ref('list'); // 默认显示列表视图

// 数据状态
const loading = ref(true);
const error = ref('');
const nodes = ref([]);
const userInfo = ref(null);

// 配置状态
const showNodeDetails = ref(NODES_CONFIG.showNodeDetails); 
const showNodeRate = ref(NODES_CONFIG.showNodeRate);
const allowViewNodeInfo = ref(NODES_CONFIG.allowViewNodeInfo);

// 弹窗状态
const showDetailModal = ref(false);
const selectedNode = ref(null);

// 分组名称映射
const names = [
  { id: '1', name: 'Basis' },
  { id: '2', name: 'Standard' },
  { id: '3', name: 'Premium' }
];

const getGroupName = (id) => {
  const strId = String(id);
  const group = names.find((v) => v.id === strId);
  return group ? group.name : '其它';
};

// 视图切换处理
const handleSwitchView = (view) => {
  currentView.value = view;
  
  // 保存用户偏好到本地存储
  localStorage.setItem('preferredNodeView', view);
  
  // 显示切换提示
  if ($toast) {
    const viewName = view === 'map' ? '地图视图' : '列表视图';
    $toast.success(`已切换到${viewName}`);
  }
};

// 节点详情处理
const openNodeDetail = (node) => {
  selectedNode.value = node;
  showDetailModal.value = true;
};

const closeNodeDetail = () => {
  showDetailModal.value = false;
  setTimeout(() => {
    selectedNode.value = null;
  }, 300);
};

// 选择节点处理
const selectNode = (node) => {
  if (!node.is_online) {
    if ($toast) {
      $toast.warning(t('nodes.nodeOffline') || '节点离线，无法选择');
    }
    return;
  }
  
  // 这里可以添加选择节点的逻辑
  if ($toast) {
    $toast.success(`${node.name} 已选择`);
  }
};

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const result = await getUserInfo();
    if (result && result.data) {
      userInfo.value = result.data;
    }
  } catch (err) {
    console.error('Failed to fetch user info:', err);
    if ($toast) {
      $toast.error(t('common.userInfoError') || '获取用户信息失败');
    }
  }
};

// 获取节点数据
const fetchNodes = async () => {
  loading.value = true;
  error.value = '';

  try {
    const result = await fetchServerNodes();
    
    if (result && result.data) {
      nodes.value = result.data;
    } else {
      nodes.value = [];
    }
  } catch (err) {
    console.error('Failed to fetch nodes:', err);
    error.value = err.response?.message || (err && err.message ? err.message : t('common.networkError') || '网络错误');
    
    if ($toast) {
      $toast.error(error.value);
    }
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(() => {
  // 从本地存储恢复用户偏好
  const savedView = localStorage.getItem('preferredNodeView');
  if (savedView && ['list', 'map'].includes(savedView)) {
    currentView.value = savedView;
  }
  
  fetchUserInfo();
  fetchNodes();
});
</script>

<style lang="scss" scoped>
.nodes-container {
  padding: 1.25rem;
  padding-bottom: calc(1.25rem + 64px); 
  
  @media (min-width: 768px) {
    padding: 2rem;
    padding-bottom: 3rem; 
  }
}

.nodes-inner {
  max-width: 1200px;
  margin: 0 auto;
}

// 地图视图容器
.map-view-container {
  margin-top: 1.5rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color);
}

// 列表视图容器
.list-view-container {
  margin-top: 1.5rem;
}

// 节点列表样式
.node-items {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }
}

.node-item {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: var(--theme-color);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--theme-color), var(--theme-hover-color));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 1;
  }
}

.node-status {
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #f44336;
  transition: all 0.3s ease;

  &.online {
    background-color: #4caf50;
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
  }
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.node-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.spec-item {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  background-color: var(--input-bg-color);
  color: var(--secondary-text-color);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &.rate-spec {
    background-color: rgba(255, 193, 7, 0.1);
    color: #ff9800;
  }

  &.protocol-spec {
    background-color: rgba(33, 150, 243, 0.1);
    color: #2196f3;
  }

  &.group-spec {
    background-color: rgba(156, 39, 176, 0.1);
    color: #9c27b0;
  }
}

.node-description {
  font-size: 0.875rem;
  color: var(--secondary-text-color);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.node-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg-color);
  color: var(--text-color);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: var(--theme-color);
    color: white;
    border-color: var(--theme-color);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-text {
    @media (max-width: 480px) {
      display: none;
    }
  }
}

.detail-btn:hover:not(:disabled) {
  background: #2196f3;
  border-color: #2196f3;
}

.select-btn:hover:not(:disabled) {
  background: #4caf50;
  border-color: #4caf50;
}

// 加载状态
.nodes-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;

  p {
    margin-top: 1rem;
    color: var(--secondary-text-color);
    font-size: 1rem;
  }
}

// 错误状态
.nodes-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;

  .error-icon {
    color: #f44336;
    margin-bottom: 1rem;
  }

  p {
    color: var(--text-color);
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
}

// 空状态
.nodes-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;

  .empty-icon {
    color: var(--secondary-text-color);
    margin-bottom: 1rem;
    opacity: 0.6;
  }

  h3 {
    color: var(--text-color);
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--secondary-text-color);
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
}

.retry-button {
  background: var(--theme-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--theme-hover-color);
    transform: translateY(-1px);
  }
}

// 响应式优化
@media (max-width: 768px) {
  .node-item {
    padding: 1rem;
    flex-direction: column;
    gap: 0.75rem;
  }

  .node-actions {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }

  .action-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .node-specs {
    flex-direction: column;
    gap: 0.5rem;
  }

  .spec-item {
    font-size: 0.8rem;
  }
}
</style>

