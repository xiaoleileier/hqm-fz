<template>

  <div class="slide-tabs-container" :class="{ 'ticket-page': isTicketPage }">

    <div class="slide-tabs-wrapper">

      <div class="slide-tabs-nav" ref="tabsNav">

        <template v-for="(item, index) in navItems" :key="`${item.name}-${languageKey}`">

          <router-link 

            :to="item.path"

            class="nav-item"

            :class="{ 'active': currentRoute === item.name || (route && route.meta && route.meta.activeNav === item.name) }"

            @click.prevent="navigateTo(item, index)"

          >

            <div class="nav-icon">

              <component :is="getIcon(item.icon)" />

            </div>

            <span class="nav-text">{{ t(`menu.${item.i18nKey}`) }}</span>

            <span v-if="item.name === 'Invite' && showInviteBadge" class="badge-dot">{{ t('menu.commission') }}</span>

            <span v-if="item.name === 'Shop' && showShopBadge" class="badge-dot">{{ t('menu.hotSale') }}</span>

          </router-link>

        </template>

        <div class="indicator-container">

          <div class="slider-indicator" :style="sliderStyle"></div>

        </div>

      </div>

    </div>

  </div>

</template>



<script>

import { ref, onMounted, watch, nextTick, onBeforeUnmount, computed, reactive, onUnmounted } from 'vue';

import { useRoute, useRouter } from 'vue-router';

import { useI18n } from 'vue-i18n';

import { INVITE_CONFIG, SHOP_CONFIG, NAVIGATION_CONFIG } from '@/utils/baseConfig';

import IconDashboard from '@/components/icons/IconDashboard.vue';

import IconShop from '@/components/icons/IconShop.vue';

import IconInvite from '@/components/icons/IconInvite.vue';

import IconFileText from '@/components/icons/IconFileText.vue';

import IconWallet from '@/components/icons/IconWallet.vue';

import IconUser from '@/components/icons/IconUser.vue';

import IconMore from '@/components/icons/IconMore.vue';

import {

  IconServer,     

  IconChartBar,

  IconHeadset   

} from '@tabler/icons-vue';  



export default {

  name: 'SlideTabsNav',

  setup() {

    const route = useRoute();

    const router = useRouter();
    
    const { t } = useI18n();

    const tabsNav = ref(null);

    const currentRoute = ref('');

    const currentIndex = ref(0);

    const previousIndex = ref(0);

    const isInitialized = ref(false);

    const isTransitionEnabled = ref(false);

    const isComponentMounted = ref(false);

    const languageKey = ref(Date.now());

    

    const showInviteBadge = computed(() => {

      return INVITE_CONFIG && INVITE_CONFIG.showCommissionBadge === true;

    });

    

    const showShopBadge = computed(() => {

      return SHOP_CONFIG && SHOP_CONFIG.showHotSaleBadge === true;

    });



    const sliderState = reactive({

      width: 0,

      transform: 'translateY(0px)',

      opacity: 0,

      transition: 'none'
      
    });

    

    const sliderStyle = computed(() => ({

      width: isSmallScreen.value ? `${sliderState.width}px` : '100%',

      height: isSmallScreen.value ? '100%' : `${sliderState.width}px`,

      transform: sliderState.transform,

      opacity: sliderState.opacity,

      transition: sliderState.transition

    }));



    const isSmallScreen = ref(false);


    const checkScreenSize = () => {

      isSmallScreen.value = window.innerWidth < 905;

    };




    // 替换原有的 navItems 定义
    const getNavItems = () => {

        // 检查当前路由，如果是工单页面则使用简化导航
        const isTicketPage = route.name === 'Tickets' || route.path.includes('/tickets') || route.path.includes('/mobile/tickets');
        
        if (isTicketPage) {
            // 工单页面使用最初的四个导航项加更多
            return [
                { title: 'Dashboard', path: '/dashboard', name: 'Dashboard', icon: 'IconDashboard', i18nKey: 'dashboard' },
                { title: 'Shop', path: '/shop', name: 'Shop', icon: 'IconShop', i18nKey: 'shop' },
                { title: 'Invite', path: '/invite', name: 'Invite', icon: 'IconInvite', i18nKey: 'invite' },
                { title: 'Tickets', path: isSmallScreen.value ? '/mobile/tickets' : '/tickets', name: 'Tickets', icon: 'IconHeadset', i18nKey: 'tickets' },
                { title: 'More', path: '/more', name: 'More', icon: 'IconMore', i18nKey: 'more' }
            ];
        } else if (isSmallScreen.value) {
            // 手机端使用简化的四个导航项加更多
            return [
                { title: 'Dashboard', path: '/dashboard', name: 'Dashboard', icon: 'IconDashboard', i18nKey: 'dashboard' },
                { title: 'Shop', path: '/shop', name: 'Shop', icon: 'IconShop', i18nKey: 'shop' },
                { title: 'Invite', path: '/invite', name: 'Invite', icon: 'IconInvite', i18nKey: 'invite' },
                { title: 'More', path: '/more', name: 'More', icon: 'IconMore', i18nKey: 'more' }
            ];
        } else {
            // PC端使用完整的导航项
            return [
                { title: 'Dashboard', path: '/dashboard', name: 'Dashboard', icon: 'IconDashboard', i18nKey: 'dashboard' },
                { title: 'Shop', path: '/shop', name: 'Shop', icon: 'IconShop', i18nKey: 'shop' },
                { title: 'Invite', path: '/invite', name: 'Invite', icon: 'IconInvite', i18nKey: 'invite' },
                { title: 'Docs', path: '/docs', name: 'Docs', icon: 'IconFileText', i18nKey: 'docs' },
                { title: 'Nodes', path: '/nodes', name: 'Nodes', icon: 'IconServer', i18nKey: 'nodes' },
                { title: 'Orders', path: '/orders', name: 'Orders', icon: 'IconShop', i18nKey: 'orders' },
                { title: 'Tickets', path: isSmallScreen.value ? '/mobile/tickets' : '/tickets', name: 'Tickets', icon: 'IconHeadset', i18nKey: 'tickets' },
                { title: 'Profile', path: '/profile', name: 'Profile', icon: 'IconUser', i18nKey: 'profile' },
                { title: 'Traffic', path: '/trafficlog', name: 'TrafficLog', icon: 'IconChartBar', i18nKey: 'traffic' },
                { title: 'Wallet', path: '/wallet/deposit', name: 'Deposit', icon: 'IconWallet', i18nKey: 'wallet' },
                { title: 'More', path: '/more', name: 'More', icon: 'IconMore', i18nKey: 'more' }
            ];
        }
        
    };

    const navItems = computed(() => getNavItems());
    
    // 检查是否为工单页面
    const isTicketPage = computed(() => {
      return route.name === 'Tickets' || route.path.includes('/tickets') || route.path.includes('/mobile/tickets');
    });

    

    const getIcon = (iconName) => {

      switch(iconName) {

        case 'IconDashboard': return IconDashboard;

        case 'IconShop': return IconShop;

        case 'IconInvite': return IconInvite;

        case 'IconMore': return IconMore;

        case 'IconFileText': return IconFileText;

        case 'IconHeadset': return IconHeadset;

        case 'IconServer': return IconServer;

        case 'IconChartBar': return IconChartBar;

        case 'IconWallet': return IconWallet;

        case 'IconUser': return IconUser;

        default: return null;

      }

    };

    

    let positionTimers = [];



    const navigateTo = (item, index) => {

      if (!isComponentMounted.value) return;

      

      previousIndex.value = currentIndex.value;

      currentIndex.value = index;

      updateSliderPosition(index, true);

      

      nextTick(() => {

        if (isComponentMounted.value) {

          // 特殊处理工单跳转
          if (item.i18nKey === 'tickets') {

            const targetPath = isSmallScreen.value ? '/mobile/tickets' : '/tickets';

            router.push(targetPath);

          } else {

            router.push(item.path);

          }

        }

      });

    };



    const updateSliderPosition = (index, animate = true) => {
      if (!isComponentMounted.value || index < 0 || !tabsNav.value) return;

      // 清除之前的定时器
      positionTimers.forEach(timer => clearTimeout(timer));
      positionTimers = [];

      try {
        nextTick(() => {
          if (!isComponentMounted.value || !tabsNav.value) return;

          const navItemElements = tabsNav.value.querySelectorAll('.nav-item');
          
          if (navItemElements.length > 0 && index >= 0 && index < navItemElements.length) {
            const activeItem = navItemElements[index];
            const { offsetWidth, offsetLeft, offsetHeight, offsetTop } = activeItem;

            // 优化动画设置
            if (animate) {
              sliderState.transition = 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), width 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
            } else {
              sliderState.transition = 'none';
            }

            // 根据屏幕尺寸决定使用水平还是垂直布局
            if (isSmallScreen.value) {
              sliderState.width = offsetWidth;
              sliderState.transform = `translateX(${offsetLeft}px)`;
            } else {
              sliderState.width = offsetHeight;
              sliderState.transform = `translateY(${offsetTop}px)`;
            }

            sliderState.opacity = 1;
            isInitialized.value = true;
          }
        });
      } catch (error) {
        console.warn('SlideTabsNav: Error updating slider position', error);
      }
    };



    const findIndexByRouteName = (routeName) => {

      if (route && route.meta && route.meta.activeNav) {

        const activeNavName = route.meta.activeNav;

        const activeIndex = navItems.value.findIndex(item => item.name === activeNavName);

        

        if (activeIndex !== -1) {

          return activeIndex;

        }

      }

      

      const index = navItems.value.findIndex(item => item.name === routeName);

      return index !== -1 ? index : 0; 
    };

    

    const handleResize = () => {

      if (isComponentMounted.value) {

        updateSliderPosition(currentIndex.value, false);

        

        safeTimeout(() => {

          updateSliderPosition(currentIndex.value, true);

        }, 200);

      }

    };



    let stopRouteWatch = null;

    

    const handleVisibilityChange = () => {

      if (!isComponentMounted.value) return;

      

      if (!document.hidden && currentIndex.value >= 0) {

        updateSliderPosition(currentIndex.value, false);

        

        if (isComponentMounted.value) {

          const timer = setTimeout(() => {

            if (isComponentMounted.value) {

              updateSliderPosition(currentIndex.value, true);

            }

          }, 200);

          

          positionTimers.push(timer);

        }

      }

    };



    const safeTimeout = (callback, delay) => {

      const timer = setTimeout(() => {

        if (isComponentMounted.value) {

          callback();

        }

      }, delay);

      

      positionTimers.push(timer);

      return timer;

    };



    let positionCheckInterval = null;

    

    const checkAndFixSliderPosition = () => {

      if (!isComponentMounted.value || !tabsNav.value) return;

      

      try {

        const navItemElements = tabsNav.value.querySelectorAll('.nav-item');

        

        let activeIndex;

        if (route && route.meta && route.meta.activeNav) {

          const activeNavName = route.meta.activeNav;

          const indexByActiveNav = navItems.value.findIndex(item => item.name === activeNavName);

          if (indexByActiveNav !== -1) {

            activeIndex = indexByActiveNav;

          } else {

            activeIndex = findIndexByRouteName(route.name);

          }

        } else {

          activeIndex = findIndexByRouteName(route.name);

        }

        

        if (navItemElements.length > 0 && activeIndex >= 0 && activeIndex < navItemElements.length) {

          const activeItem = navItemElements[activeIndex];

          const { offsetWidth, offsetLeft, offsetHeight, offsetTop } = activeItem;

          

          const currentTransform = sliderState.transform;

          const expectedTransform = isSmallScreen.value ? `translateX(${offsetLeft}px)` : `translateY(${offsetTop}px)`;

          const expectedSize = isSmallScreen.value ? offsetWidth : offsetHeight;

          

          if (currentTransform !== expectedTransform || sliderState.width !== expectedSize) {

            updateSliderPosition(activeIndex, true);

          }

        }

      } catch (error) {

        console.warn('SlideTabsNav: Error checking slider position', error);

      }

    };

    

    const handleScroll = debounce(() => {
      if (isComponentMounted.value) {
        checkAndFixSliderPosition();
      }
    }, 300);

    

    const onLanguageChanged = () => {
      languageKey.value = Date.now();
      
      sliderState.transition = 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), width 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
      sliderState.opacity = 0.3;

      // 简化定时器，减少性能开销
      safeTimeout(() => {
        if (isComponentMounted.value && tabsNav.value) {
          sliderState.opacity = 1;
          updateSliderPosition(currentIndex.value, true);
        }
      }, 200);
    };



    // 监听路由变化，为body添加类名
    watch(isTicketPage, (newValue) => {
      if (newValue) {
        document.body.classList.add('ticket-page');
      } else {
        document.body.classList.remove('ticket-page');
      }
    }, { immediate: true });

    onMounted(() => {

      isComponentMounted.value = true;

      

      // 初始化屏幕尺寸检测
      checkScreenSize();

      window.addEventListener('resize', checkScreenSize);



      document.addEventListener('visibilitychange', handleVisibilityChange);

      

      window.addEventListener('languageChanged', onLanguageChanged);

      

      isTransitionEnabled.value = false;

      

      stopRouteWatch = watch(() => route.name, (newRoute) => {

        if (!isComponentMounted.value) return;

        

        if (newRoute) {

          currentRoute.value = newRoute;

          

          let newIndex;

          if (route.meta && route.meta.activeNav) {

            const activeNavName = route.meta.activeNav;

            const indexByActiveNav = navItems.value.findIndex(item => item.name === activeNavName);

            if (indexByActiveNav !== -1) {

              newIndex = indexByActiveNav;

            } else {

              newIndex = findIndexByRouteName(newRoute);

            }

          } else {

            newIndex = findIndexByRouteName(newRoute);

          }

          

          previousIndex.value = currentIndex.value;

          currentIndex.value = newIndex;

          

          updateSliderPosition(newIndex, true);

        }

      }, { immediate: true });

      

      nextTick(() => {

        if (!isComponentMounted.value) return;

        

        const index = findIndexByRouteName(route.name);

        updateSliderPosition(index, false);

        

        safeTimeout(() => {

          isTransitionEnabled.value = true;

        }, 300);

      });

      

      // 简化初始化定时器
      safeTimeout(() => {
        if (tabsNav.value) {
          const index = findIndexByRouteName(route.name);
          updateSliderPosition(index, true);
        }
      }, 300);

      

      window.addEventListener('load', () => {

        if (isComponentMounted.value && tabsNav.value) {

          const index = findIndexByRouteName(route.name);

          updateSliderPosition(index, false);

          safeTimeout(() => {

            updateSliderPosition(index, true);

          }, 100);

        }

      });

      

      const debouncedResize = debounce(handleResize, 200);
      window.addEventListener('resize', debouncedResize);

      

      window.addEventListener('scroll', handleScroll, { passive: true });

      

      positionCheckInterval = setInterval(() => {
        if (isComponentMounted.value) {
          checkAndFixSliderPosition();
        }
      }, 5000);

      

      safeTimeout(() => {

        handleResize();

      }, 1500);

      

      window.addEventListener('popstate', () => {

        if (isComponentMounted.value && tabsNav.value) {

          safeTimeout(() => {

            const index = findIndexByRouteName(route.name);

            updateSliderPosition(index, false);

            safeTimeout(() => {

              updateSliderPosition(index, true);

            }, 50);

          }, 0);

        }

      });

    });

    

    onUnmounted(() => {

      if (stopRouteWatch) {

        stopRouteWatch();

        stopRouteWatch = null;

      }

      

      if (positionCheckInterval) {

        clearInterval(positionCheckInterval);

        positionCheckInterval = null;

      }

      

      window.removeEventListener('popstate', () => {});

    });

    

    onBeforeUnmount(() => {

      isComponentMounted.value = false;


      // 移除屏幕尺寸监听器
      window.removeEventListener('resize', checkScreenSize);


      

      positionTimers.forEach(timer => clearTimeout(timer));

      positionTimers = [];

      

      document.removeEventListener('visibilitychange', handleVisibilityChange);

      window.removeEventListener('languageChanged', onLanguageChanged);

      window.removeEventListener('resize', handleResize);

      window.removeEventListener('scroll', handleScroll);

      

      tabsNav.value = null;

    });



    return {

      navItems,

      tabsNav,

      currentRoute,

      navigateTo,

      sliderStyle,

      getIcon,

      languageKey,

      route,

      showInviteBadge,

      showShopBadge,

      isTicketPage,
      
      t

    };

  }

};



function debounce(fn, delay) {

  let timer = null;

  return function(...args) {

    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {

      fn.apply(this, args);

    }, delay);

  };

}

</script>



<style lang="scss" scoped>

.slide-tabs-container {

  margin-bottom: 20px;

  position: fixed;

  top: 50%;

  left: 20px;

  transform: translateY(-50%);

  z-index: 10;

  width: auto;

  

  .slide-tabs-wrapper {

    background: rgba(var(--card-background-rgb), 0.7);

    backdrop-filter: blur(10px);

    -webkit-backdrop-filter: blur(10px);

    border-radius: 30px;

    padding: 5px;

    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

    border: 1px solid var(--border-color);

    display: inline-block;

    overflow: hidden;

  }



  .slide-tabs-nav {

    display: flex;

    flex-direction: column;

    position: relative;

    

    .indicator-container {

      position: absolute;

      top: 0;

      left: 0;

      width: 100%;

      height: 100%;

      pointer-events: none;

      z-index: 1;

    }

    

    .nav-item {

      padding: 12px 16px;

      border-radius: 26px;

      font-weight: 500;

      font-size: 14px;

      color: var(--secondary-text-color);

      text-decoration: none;

      text-align: center;

      position: relative;

      z-index: 2;

      transition: color 0.3s;

      white-space: nowrap;

      display: flex;

      align-items: center;

      gap: 8px;

      margin-bottom: 4px;

      

      

      .badge-dot {

        position: absolute;

        top: -3px;

        right: -2px;

        background-color:#ff3030;

        color: white;

        border-radius: 10px;

        padding: 1px 5px;

        font-size: 8px;

        font-weight: bold;

        line-height: 1.2;

        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

        transform: scale(0.9);

        white-space: nowrap;

      }

      
      
      &:last-child {

        border: 1px solid var(--theme-color);

        background-color: rgba(var(--theme-color-rgb), 0.05);

        

        .nav-icon svg {

          color: var(--theme-color);

        }

        

        &:hover {

          background-color: rgba(var(--theme-color-rgb), 0.1);

        }

        

        &.active {

          background-color: rgba(var(--theme-color-rgb), 0.15);

        }

      }

      

      

      .nav-icon {

        display: flex;

        align-items: center;

        justify-content: center;

        

        svg {

          width: 18px;

          height: 18px;

          transition: color 0.3s ease, transform 0.3s ease;

          transform: scale(1);

        }

      }

      

      &.active {

        color: var(--text-color);

        

        .nav-icon svg {

          color: var(--theme-color);

          transform: scale(1.15);

        }

      }

      

      &:hover {

        color: var(--text-color);

      }

    }

    

    .slider-indicator {

      position: absolute;

      top: 0;

      left: 0;

      width: 100%;

      background-color: rgba(var(--theme-color-rgb), 0.1);

      border-radius: 26px;

      z-index: 1;

      box-shadow: 0 4px 15px rgba(var(--theme-color-rgb), 0.1);

      border: 1px solid var(--theme-color);

      will-change: transform, width;

      transition-property: transform, width;  

    }

  }

}



@media (max-width: 768px) {

  .slide-tabs-container {

    .slide-tabs-nav {

      flex-direction: row;

      .nav-item {

        padding: 6px 10px;

        font-size: 12px;

        flex-direction: column;

        gap: 4px;

        justify-content: center;

        height: 64px;

        margin-bottom: 0;

        

        

        .badge-dot {

          top: -1px;

          right: auto; 

          left: 50%; 

          transform: translateX(-50%) scale(0.9); 

        }

        

        &:last-child {

          height: 64px;

          min-width: 64px;  

        }

        

        .nav-icon {

          display: block; 

          height: 24px;

          display: flex;

          align-items: center;

          justify-content: center;

          

          svg {

            width: 22px;

            height: 22px;

            transition: color 0.3s ease;

          }

        }

        

        .nav-text {

          font-weight: 500;

          line-height: 1.2;

        }

        

        &.active {

          .nav-text {

            color: var(--theme-color);

          }

          .nav-icon svg {

            transform: scale(1); 

          }

        }

      }

    }

  }

}



@media (max-width: 768px) {

  .slide-tabs-container {

    top: auto;

    bottom: 20px;  

    left: 50%;

    transform: translateX(-50%);

    width: 92%;

    max-width: 450px;

    margin-bottom: 0;

    

    .slide-tabs-wrapper {

      width: 100%;

      display: block;

      border-radius: 20px;

      padding: 3px;

    }

    

    .slide-tabs-nav {

      width: 100%;

      justify-content: space-around;

      

      .slider-indicator {

        display: none; 

      }

    }

  }

}



@media (max-width: 480px) {

  .slide-tabs-container {

    bottom: 12px; 

    width: 94%;

    

    .slide-tabs-wrapper {

      border-radius: 18px;

    }

    

    .slide-tabs-nav {

      .nav-item {

        padding: 5px 8px;

        font-size: 11px;

        height: 58px;

        

        .nav-icon {

          svg {

            width: 20px;

            height: 20px;

          }

        }

      }

    }

  }

}

/* 工单页面特殊样式 - 顶部居中导航 */
@media (min-width: 769px) {
  .slide-tabs-container.ticket-page {
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .slide-tabs-container.ticket-page .slide-tabs-nav {
    flex-direction: row;
  }
  
  .slide-tabs-container.ticket-page .nav-item {
    margin-bottom: 0;
    margin-right: 4px;
  }
  
  .slide-tabs-container.ticket-page .slider-indicator {
    height: 100%;
    width: auto;
  }
}

/* 为主内容区域添加左边距，避免被左侧导航栏遮挡 */
@media (min-width: 769px) {
  /* 为整个页面添加左边距 */
  body {
    margin-left: 250px !important;
  }
  
  /* 工单页面不需要左边距 */
  body.ticket-page {
    margin-left: 0 !important;
  }
  
  /* 为Vue应用根元素添加左边距 */
  #app {
    margin-left: 0 !important;
  }
  
  /* 确保所有页面内容都有足够的左边距 */
  .main-content,
  .page-content,
  .container,
  .app-container,
  .content-wrapper,
  .page-wrapper,
  .main-wrapper,
  .layout-container {
    margin-left: 0 !important;
  }
  
  /* 为可能的固定定位元素调整 */
  .fixed-content,
  .absolute-content {
    left: 250px !important;
  }
}

</style> 
