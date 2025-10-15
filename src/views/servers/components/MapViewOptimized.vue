<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from "vue";
import * as echarts from "echarts";
import worldJson from "./json/world.json";
import locationsData from "./json/locations.json";
import { useStore } from "vuex";

// 定义emit事件
const emit = defineEmits(['show-detail']);

// 定义props
const props = defineProps({
  nodes: {
    type: Array,
    default: () => []
  }
});

const store = useStore();

// 节点选择器相关状态
const showNodeSelector = ref(false);
const selectedLocationNodes = ref([]);
const selectedLocationName = ref('');

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

// 优化的地理位置匹配器
const createLocationMatcher = () => {
  const locationMap = new Map();
  
  Object.entries(locationsData.locations).forEach(([location, coords]) => {
    locationMap.set(location.toLowerCase(), coords);
    
    // 添加别名映射
    const aliases = {
      'hk': '香港', 'us': '美国', 'sg': '新加坡', 'jp': '日本',
      'kr': '韩国', 'tw': '台湾', 'uk': '英国', 'de': '德国', 'fr': '法国'
    };
    
    if (aliases[location.toLowerCase()]) {
      locationMap.set(aliases[location.toLowerCase()].toLowerCase(), coords);
    }
  });
  
  return (nodeName) => {
    const name = nodeName.toLowerCase();
    
    // 精确匹配
    for (const [location, coords] of locationMap) {
      if (name.includes(location)) {
        return { location, coords };
      }
    }
    
    // 模糊匹配
    const fuzzyMatch = Array.from(locationMap.keys()).find(location => 
      location.includes(name) || name.includes(location)
    );
    
    if (fuzzyMatch) {
      return { location: fuzzyMatch, coords: locationMap.get(fuzzyMatch) };
    }
    
    return null;
  };
};

const locationMatcher = createLocationMatcher();

// 计算属性：按分组组织选中的节点
const groupedSelectedNodes = computed(() => {
  const groupedNodes = {};
  selectedLocationNodes.value.forEach(node => {
    if (node.group_id && Array.isArray(node.group_id) && node.group_id.length > 0) {
      const primaryGroupId = node.group_id[0];
      if (!groupedNodes[primaryGroupId]) {
        groupedNodes[primaryGroupId] = [];
      }
      groupedNodes[primaryGroupId].push(node);
    } else {
      if (!groupedNodes['default']) {
        groupedNodes['default'] = [];
      }
      groupedNodes['default'].push(node);
    }
  });

  const groupedNodesArray = [];
  Object.keys(groupedNodes).forEach(groupId => {
    const groupNodes = groupedNodes[groupId];
    const groupName = getGroupName(groupId);

    if (groupNodes.length > 0) {
      groupedNodesArray.push({
        groupId: groupId,
        groupName: groupName,
        nodes: groupNodes
      });
    }
  });

  groupedNodesArray.sort((a, b) => {
    if (a.groupId === 'default') return 1;
    if (b.groupId === 'default') return -1;
    return a.groupId.localeCompare(b.groupId);
  });

  return groupedNodesArray;
});

const chartRef = ref(null);
let chartInstance = null;
let resizeObserver = null;

const isMobile = computed(() => window.innerWidth < 768);
const isDarkTheme = computed(() => store.getters.currentTheme === 'dark');

// 关闭节点选择器
const closeNodeSelector = () => {
  showNodeSelector.value = false;
  selectedLocationNodes.value = [];
  selectedLocationName.value = '';
};

// 选择节点
const selectNode = (node) => {
  emit('show-detail', node);
  closeNodeSelector();
};

// 优化的节点数据处理
const processNodesData = () => {
  const nodesByLocation = {};

  props.nodes.forEach(node => {
    // 使用优化的地理位置匹配
    const match = locationMatcher(node.name);
    const locationName = match ? match.location : node.name.replace(/\d+/g, '').trim();

    if (!nodesByLocation[locationName]) {
      nodesByLocation[locationName] = [];
    }
    nodesByLocation[locationName].push(node);
  });

  const result = [];

  Object.keys(nodesByLocation).forEach(locationName => {
    const nodesInLocation = nodesByLocation[locationName];
    
    // 获取坐标
    let coordinates = [0, 0];
    const match = locationMatcher(locationName);
    if (match) {
      coordinates = match.coords;
    } else {
      // 随机坐标作为fallback
      coordinates = [Math.random() * 360 - 180, Math.random() * 170 - 85];
    }

    // 按group_id分组
    const groupedNodes = {};
    nodesInLocation.forEach(node => {
      if (node.group_id && Array.isArray(node.group_id) && node.group_id.length > 0) {
        const primaryGroupId = node.group_id[0];
        if (!groupedNodes[primaryGroupId]) {
          groupedNodes[primaryGroupId] = [];
        }
        groupedNodes[primaryGroupId].push(node);
      } else {
        if (!groupedNodes['default']) {
          groupedNodes['default'] = [];
        }
        groupedNodes['default'].push(node);
      }
    });

    result.push({
      name: locationName,
      value: [...coordinates, nodesInLocation.length],
      status: nodesInLocation.some(node => node.is_online === 1),
      locationNodes: nodesInLocation,
      groupedNodes: groupedNodes,
      locationName: locationName,
      symbolSize: isMobile.value ? 10 : 12,
      isNodeSeries: true
    });
  });

  return result;
};

// 优化的tooltip格式化器
const createTooltipFormatter = () => {
  return (params) => {
    if (params.seriesName === '节点' && params.data && params.data.isNodeSeries) {
      const { locationName, locationNodes, groupedNodes } = params.data;
      
      let content = `<div style="max-width: 300px;">`;
      content += `<div style="font-weight: bold; margin-bottom: 8px; color: var(--primary-color);">`;
      content += `${locationName}地区 (${locationNodes.length}个节点)`;
      content += `</div>`;
      
      Object.keys(groupedNodes).forEach(groupId => {
        const groupNodes = groupedNodes[groupId];
        const groupName = getGroupName(groupId);
        
        if (groupNodes.length > 0) {
          content += `<div style="margin-bottom: 6px;">`;
          content += `<div style="font-weight: 600; color: var(--text-color); margin-bottom: 4px;">${groupName}组:</div>`;
          
          groupNodes.forEach(node => {
            const status = node.is_online === 1 ? "在线" : "离线";
            const color = node.is_online === 1 ? "#4caf50" : "#ccc";
            content += `<div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 12px;">`;
            content += `<span style="color: ${color};">● ${node.name}</span>`;
            content += `<span style="color: ${color};">${status}</span>`;
            content += `</div>`;
          });
          
          content += `</div>`;
        }
      });
      
      content += `</div>`;
      return content;
    }
    return params.name;
  };
};

// 优化的ECharts配置
const createOptimizedOption = (processedData) => {
  return {
    title: {
      text: "全球节点分布图",
      left: "center",
      top: isMobile.value ? "5%" : "3%",
      textStyle: {
        color: isDarkTheme.value ? 'rgba(255,255,255,.9)' : '#333',
        fontSize: isMobile.value ? 16 : 18
      }
    },
    tooltip: {
      trigger: "item",
      backgroundColor: 'rgba(var(--card-background-rgb), 0.95)',
      borderColor: 'var(--border-color)',
      borderWidth: 1,
      textStyle: {
        color: 'var(--text-color)',
        fontSize: isMobile.value ? 12 : 14
      },
      formatter: createTooltipFormatter(),
      position: (point, params, dom, rect, size) => {
        if (isMobile.value) {
          return [point[0] - size.contentSize[0] / 2, point[1] - size.contentSize[1] - 10];
        }
        return [point[0] + 10, point[1] - 10];
      }
    },
    geo: {
      map: "world",
      roam: true,
      zoom: isMobile.value ? 1.2 : 1,
      center: isMobile.value ? [0, 20] : [0, 0],
      itemStyle: {
        areaColor: isDarkTheme.value ? "#2a2a2a" : "#f0f0f0",
        borderColor: isDarkTheme.value ? "#444" : "#999",
        borderWidth: 0.5
      },
      emphasis: {
        itemStyle: {
          areaColor: isDarkTheme.value ? "#3a3a3a" : "#d1e6fa",
        },
      },
      ...(isMobile.value && {
        silent: false,
        scaleLimit: {
          min: 0.8,
          max: 3
        }
      })
    },
    series: [{
      name: "节点",
      type: "effectScatter",
      coordinateSystem: "geo",
      data: processedData,
      symbolSize: isMobile.value ? 10 : 12,
      showEffectOn: "render",
      rippleEffect: {
        brushType: "stroke",
        scale: isMobile.value ? 2 : 3,
        period: isMobile.value ? 3 : 4
      },
      zlevel: 1,
      large: processedData.length > 1000,
      largeThreshold: 1000,
      progressive: 1000,
      progressiveThreshold: 3000,
      itemStyle: {
        color: function(params) {
          return params.data.status ? "#4caf50" : "#f44336";
        },
        shadowBlur: 3,
        shadowColor: 'rgba(0, 0, 0, 0.3)'
      },
      ...(isMobile.value && {
        silent: false,
        cursor: 'pointer'
      })
    }],
    animation: processedData.length < 500,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
};

// 处理节点点击
const handleNodeClick = (params) => {
  if (params.seriesName === '节点' && params.data && params.data.isNodeSeries) {
    selectedLocationNodes.value = params.data.locationNodes;
    selectedLocationName.value = params.data.locationName;
    showNodeSelector.value = true;
  }
};

// 初始化地图
const initChart = () => {
  if (!chartRef.value) return;

  echarts.registerMap("world", worldJson);

  if (chartInstance) {
    chartInstance.dispose();
  }

  chartInstance = echarts.init(chartRef.value, null, {
    renderer: 'canvas',
    useDirtyRect: true
  });

  const processedData = processNodesData();
  const option = createOptimizedOption(processedData);
  chartInstance.setOption(option);

  chartInstance.on('click', handleNodeClick);

  // 使用ResizeObserver替代window resize事件
  if (resizeObserver) {
    resizeObserver.disconnect();
  }

  resizeObserver = new ResizeObserver(() => {
    if (chartInstance) {
      chartInstance.resize();
    }
  });

  resizeObserver.observe(chartRef.value);

  return () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }
  };
};

// 监听nodes变化
watch(() => props.nodes, () => {
  if (chartInstance) {
    nextTick(() => {
      initChart();
    });
  }
}, { deep: true });

// 监听主题变化
watch(isDarkTheme, () => {
  if (chartInstance) {
    nextTick(() => {
      initChart();
    });
  }
});

onMounted(() => {
  nextTick(() => {
    initChart();
  });
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<template>
  <div ref="chartRef" style="width: 100%;" :style="{ height: isMobile ? '50vh' : '600px' }"></div>

  <!-- 节点选择弹窗 -->
  <transition name="fade">
    <div v-if="showNodeSelector" class="node-selector-modal" @click.self="closeNodeSelector">
      <div class="node-selector-content">
        <div class="node-selector-header">
          <h3>选择节点</h3>
          <button class="close-btn" @click="closeNodeSelector">×</button>
        </div>
        <div class="node-selector-body">
          <!-- 按分组显示节点 -->
          <div v-for="(group, index) in groupedSelectedNodes" :key="index" class="node-group">
            <h4 class="group-title">{{ group.groupName }}组</h4>
            <div
                v-for="node in group.nodes"
                :key="node.id"
                class="node-item"
                @click="selectNode(node)"
            >
              <div class="node-info">
                <span class="node-name">{{ node.name }}</span>
                <span class="node-status" :class="{ online: node.is_online === 1 }">
                {{ node.is_online === 1 ? '在线' : '离线' }}
              </span>
              </div>
              <div class="node-details">
                <span class="node-rate">倍率: x{{ node.rate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
.node-selector-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.node-selector-content {
  background-color: var(--card-background);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.node-selector-header {
  padding: 20px 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;

  h3 {
    margin: 0;
    color: var(--text-color);
    font-size: 18px;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: var(--text-color);
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--input-bg-color);
    }
  }
}

.node-selector-body {
  padding: 0 20px 20px;
  overflow-y: auto;
  flex: 1;
}

.node-group {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.group-title {
  margin: 0 0 12px 0;
  color: var(--primary-color);
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.node-item {
  padding: 12px;
  margin-bottom: 8px;
  background-color: var(--input-bg-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  &:hover {
    background-color: var(--primary-color-focus);
    border-color: var(--primary-color);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.node-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.node-name {
  font-weight: 500;
  color: var(--text-color);
  font-size: 14px;
}

.node-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background-color: #f44336;
  color: white;
  font-weight: 500;

  &.online {
    background-color: #4caf50;
  }
}

.node-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-rate {
  font-size: 12px;
  color: var(--secondary-text-color);
  font-weight: 500;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .node-selector-content {
    width: 95%;
    max-width: none;
    margin: 20px;
  }

  .node-selector-header {
    padding: 16px 16px 0;
    margin-bottom: 16px;

    h3 {
      font-size: 16px;
    }
  }

  .node-selector-body {
    padding: 0 16px 16px;
  }

  .node-item {
    padding: 10px;
  }

  .node-name {
    font-size: 13px;
  }

  .node-status {
    font-size: 11px;
    padding: 1px 6px;
  }

  .node-rate {
    font-size: 11px;
  }
}
</style>

