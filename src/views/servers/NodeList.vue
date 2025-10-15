<template>
  <div class="nodes-container">
    <div class="nodes-inner">
      <!-- 欢迎卡片 -->
      <div class="dashboard-card welcome-card">
        <div class="card-header">
          <h2 class="card-title">{{ $t('nodes.welcome.title') || '节点列表' }}</h2>
          <!-- 视图切换按钮 -->
          <div class="view-toggle-buttons">
            <button 
              class="view-toggle-btn" 
              :class="{ active: currentView === 'list' }"
              @click="switchView('list')"
            >
              <IconList :size="18" />
              <span class="btn-text">列表视图</span>
            </button>
            <button 
              class="view-toggle-btn" 
              :class="{ active: currentView === 'map' }"
              @click="switchView('map')"
            >
              <IconMap :size="18" />
              <span class="btn-text">地图视图</span>
            </button>
          </div>
        </div>
        <div class="card-body">
          <p>{{ $t('nodes.welcome.description') || '查看并使用可用的服务器节点' }}</p>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="nodes-loading">
        <LoadingSpinner />
        <p>{{ $t('nodes.loading') || '正在加载节点...' }}</p>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="nodes-error">
        <p>{{ error }}</p>
        <button class="retry-button" @click="fetchNodes">{{ $t('common.retry') || '重试' }}</button>
      </div>

      <!-- 节点列表内容 -->
      <div v-else-if="nodes.length > 0" class="nodes-content">
        <!-- 地图视图 -->
        <div v-if="currentView === 'map'" class="map-view-container">
          <MapView 
            :nodes="nodes" 
            @show-detail="showNodeDetail" 
          />
        </div>

        <!-- 列表视图 -->
        <div v-else class="list-view-container">
          <div class="node-list">
            <!-- 统一显示所有节点 -->
            <div class="node-items">
              <NodeItem
                v-for="node in nodes"
                :key="node.id"
                :node="node"
                :show-node-details="showNodeDetails"
                :show-node-rate="showNodeRate"
                :allow-view-node-info="allowViewNodeInfo"
                @show-detail="showNodeDetail"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 无套餐时的购买引导 -->
      <div v-else-if="!hasPlan" class="nodes-no-plan">
        <div class="no-plan-content">
          <div class="no-plan-icon">
            <IconShoppingCart :size="48" />
          </div>
          <div class="no-plan-message">
            <h3 class="no-plan-title">{{ $t('nodes.noPlanTitle') || '您还没有购买套餐' }}</h3>
            <p class="no-plan-description">{{ $t('nodes.noPlanDescription') || '购买套餐后即可查看和使用所有可用节点' }}</p>
            <div class="no-plan-actions">
              <button class="action-button primary" @click="goToShop">
                <IconShoppingCart :size="18" />
                <span>{{ $t('nodes.buyPlan') || '立即购买套餐' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 有套餐但无节点时的空状态 -->
      <div v-else class="nodes-empty">
        <p>{{ $t('nodes.noNodes') || '暂无可用节点' }}</p>
        <button class="retry-button" @click="fetchNodes">{{ $t('common.retry') || '重试' }}</button>
      </div>
    </div>

    <!-- 节点详情弹窗 -->
    <NodeDetailModal 
      v-if="allowViewNodeInfo"
      :show="showDetailModal" 
      :node="selectedNode" 
      :userInfo="userInfo"
      @close="closeNodeDetail"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, inject, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import NodeItem from './components/NodeItem.vue';
import MapView from './components/MapView.vue';
import { fetchServerNodes } from '@/api/servers';
import { getUserInfo } from '@/api/user';
import { NODES_CONFIG } from '@/utils/baseConfig';
import NodeDetailModal from '@/components/common/NodeDetailModal.vue';
import { IconList, IconMap, IconShoppingCart } from '@tabler/icons-vue';

const { t } = useI18n();
const $toast = inject('$toast');
const router = useRouter();

// 数据状态
const loading = ref(true);
const error = ref('');
const nodes = ref([]);
const userInfo = ref(null);
const hasPlan = ref(false);

// 配置状态
const showNodeDetails = ref(NODES_CONFIG.showNodeDetails); 
const showNodeRate = ref(NODES_CONFIG.showNodeRate);
const allowViewNodeInfo = ref(NODES_CONFIG.allowViewNodeInfo);

// 弹窗状态
const showDetailModal = ref(false);
const selectedNode = ref(null);

// 视图切换状态
const currentView = ref('list'); // 默认显示列表视图

// 定义事件发射
const emit = defineEmits(['showDetail']);


// 视图切换处理
const switchView = (view) => {
  currentView.value = view;
  
  // 保存用户偏好到本地存储
  localStorage.setItem('preferredNodeView', view);
  
  // 显示切换提示
  if ($toast) {
    const viewName = view === 'map' ? '地图视图' : '列表视图';
    $toast.showToast.success(`已切换到${viewName}`);
  }
};

// 显示节点详情
const showNodeDetail = (node) => {
  selectedNode.value = node;
  showDetailModal.value = true;
};

// 关闭节点详情
const closeNodeDetail = () => {
  showDetailModal.value = false;
  setTimeout(() => {
    selectedNode.value = null;
  }, 300);
};

// 跳转到商店页面
const goToShop = () => {
  router.push('/shop');
};

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const result = await getUserInfo();
    if (result && result.data) {
      userInfo.value = result.data;
      // 检查是否有套餐
      hasPlan.value = result.data.plan_id !== null && result.data.plan_id !== undefined;
    }
  } catch (err) {
    console.error('Failed to fetch user info:', err);
    if ($toast) {
      $toast.showToast.error(t('common.userInfoError') || '获取用户信息失败');
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
      $toast.showToast.error(error.value);
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

  // 并行获取用户信息和节点数据
  Promise.all([
    fetchUserInfo(),
    fetchNodes()
  ]);
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

.dashboard-card {
  background-color: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    border-color: rgba(var(--theme-color-rgb), 0.3);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    
    .card-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }
  }

  // 视图切换按钮样式
  .view-toggle-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .view-toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background-color: var(--card-bg);
    color: var(--text-color);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  
    .btn-text {
      @media (max-width: 768px) {
        display: none;
      }
    }
  
    &:hover {
      background-color: rgba(var(--theme-color-rgb), 0.05);
      border-color: var(--theme-color);
    }
  
    &.active {
      background-color: var(--theme-color);
      color: white;
      border-color: var(--theme-color);
    }
  }
  
  @media (max-width: 768px) {
    .view-toggle-btn {
      padding: 0.5rem;
    }
  }
  
  .card-body {
    p {
      color: var(--text-muted);
      margin: 0;
      line-height: 1.5;
    }
  }
}

.welcome-card {
  margin-bottom: 24px;
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

.node-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.node-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

@media (min-width: 768px) {
  .node-items {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

@media (min-width: 1024px) {
  .node-items {
    grid-template-columns: repeat(3, 1fr);
  }
}

// 无套餐时的购买引导样式
.nodes-no-plan {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  
  .no-plan-content {
    max-width: 500px;
    margin: 0 auto;
  }
  
  .no-plan-icon {
    margin-bottom: 1.5rem;
    color: var(--theme-color);
  }
  
  .no-plan-message {
    .no-plan-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 0.75rem;
    }
    
    .no-plan-description {
      font-size: 1rem;
      color: var(--secondary-text-color);
      margin-bottom: 2rem;
      line-height: 1.5;
    }
  }
  
  .no-plan-actions {
    .action-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--theme-color);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--theme-hover-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--theme-color-rgb), 0.3);
      }
      
      &.primary {
        background: linear-gradient(135deg, var(--theme-color), var(--theme-hover-color));
      }
    }
  }
}
</style>
