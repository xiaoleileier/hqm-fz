/**
 * MapView组件优化建议
 * 
 * 主要优化点：
 * 1. 性能优化 - 减少重复渲染
 * 2. 地理位置匹配优化 - 使用更智能的匹配算法
 * 3. 移动端体验优化 - 更好的触摸交互
 * 4. 内存管理优化 - 避免内存泄漏
 */

// 优化后的地理位置匹配逻辑
const createLocationMatcher = () => {
  const locationMap = new Map();
  
  // 构建地理位置映射表
  Object.entries(locationsData.locations).forEach(([location, coords]) => {
    locationMap.set(location.toLowerCase(), coords);
    
    // 添加别名映射
    const aliases = {
      'hk': '香港',
      'us': '美国', 
      'sg': '新加坡',
      'jp': '日本',
      'kr': '韩国',
      'tw': '台湾',
      'uk': '英国',
      'de': '德国',
      'fr': '法国'
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

// 优化的ECharts配置
const createOptimizedOption = (processedData, isDark, isMobile) => {
  return {
    title: {
      text: "全球节点分布图",
      left: "center",
      top: isMobile ? "5%" : "3%",
      textStyle: {
        color: isDark ? 'rgba(255,255,255,.9)' : '#333',
        fontSize: isMobile ? 16 : 18
      }
    },
    tooltip: {
      trigger: "item",
      backgroundColor: 'rgba(var(--card-background-rgb), 0.95)',
      borderColor: 'var(--border-color)',
      borderWidth: 1,
      textStyle: {
        color: 'var(--text-color)',
        fontSize: isMobile ? 12 : 14
      },
      formatter: createTooltipFormatter(),
      position: (point, params, dom, rect, size) => {
        // 移动端优化tooltip位置
        if (isMobile) {
          return [point[0] - size.contentSize[0] / 2, point[1] - size.contentSize[1] - 10];
        }
        return [point[0] + 10, point[1] - 10];
      }
    },
    geo: {
      map: "world",
      roam: true,
      zoom: isMobile ? 1.2 : 1,
      center: isMobile ? [0, 20] : [0, 0],
      itemStyle: {
        areaColor: isDark ? "#2a2a2a" : "#f0f0f0",
        borderColor: isDark ? "#444" : "#999",
        borderWidth: 0.5
      },
      emphasis: {
        itemStyle: {
          areaColor: isDark ? "#3a3a3a" : "#d1e6fa",
        },
      },
      // 移动端优化
      ...(isMobile && {
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
      symbolSize: isMobile ? 10 : 12,
      showEffectOn: "render",
      rippleEffect: {
        brushType: "stroke",
        scale: isMobile ? 2 : 3,
        period: isMobile ? 3 : 4
      },
      zlevel: 1,
      // 性能优化
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
      // 移动端优化
      ...(isMobile && {
        silent: false,
        cursor: 'pointer'
      })
    }],
    // 性能优化
    animation: processedData.length < 500,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
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
      
      // 按分组显示节点
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

// 优化的组件生命周期管理
const useOptimizedLifecycle = () => {
  const chartRef = ref(null);
  let chartInstance = null;
  let resizeObserver = null;
  
  const initChart = () => {
    if (!chartRef.value) return;
    
    // 注册地图
    echarts.registerMap("world", worldJson);
    
    // 销毁旧实例
    if (chartInstance) {
      chartInstance.dispose();
    }
    
    chartInstance = echarts.init(chartRef.value, null, {
      renderer: 'canvas', // 使用canvas渲染器，性能更好
      useDirtyRect: true // 启用脏矩形优化
    });
    
    // 设置配置
    const processedData = processNodesData();
    const option = createOptimizedOption(processedData, isDarkTheme.value, isMobile.value);
    chartInstance.setOption(option);
    
    // 添加点击事件
    chartInstance.on('click', handleNodeClick);
    
    // 设置resize observer
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
  
  return { chartRef, initChart };
};

