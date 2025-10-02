<template>

  <div class="auth-container">

    <!-- 域名授权验证提示 -->





    <!-- 背景装饰 -->

    <div class="background-decoration">

      <div class="floating-ball ball-1"></div>

      <div class="floating-ball ball-2"></div>

      <div class="floating-ball ball-3"></div>

    </div>



    <!-- 顶部工具栏：语言选择器和主题切换 -->

    <div class="top-toolbar">

      <ThemeToggle />

      <LanguageSelector />

    </div>



    <div class="auth-card">

      <div class="auth-header">

        <div class="auth-logo">

          <img

            :src="logoPath"

            alt="Logo"

            @error="handleLogoError"

            @click="goTo('/')"

          />

        </div>

        <h1 class="auth-title">{{ $t('auth.loginTitle') }}</h1>

        <p class="auth-subtitle">{{ $t('auth.loginSubtitle') }}</p>

      </div>



      <form class="auth-form" @submit.prevent="handleLogin">

        <div class="form-group">

          <label for="email">{{ $t('common.email') }} <span class="required">*</span></label>

          <div class="input-with-icon">

            <IconMail class="input-icon" />

            <input

              type="email"

              id="email"

              v-model="formData.email"

              class="form-control"

              :placeholder="$t('auth.emailPlaceholder')"

              required

            />

          </div>

          <div v-if="errors.email" class="error-message">{{ errors.email }}</div>

        </div>



        <div class="form-group">

          <label for="password">{{ $t('common.password') }} <span class="required">*</span></label>

          <div class="input-with-icon">

            <IconLock class="input-icon" />

            <input

              :type="showPassword ? 'text' : 'password'"

              id="password"

              v-model="formData.password"

              class="form-control"

              :placeholder="$t('auth.passwordPlaceholder')"

              required

            />

            <div class="password-toggle" @click="showPassword = !showPassword">

              <IconEye v-if="!showPassword" />

              <IconEyeOff v-else />

            </div>

          </div>

          <div v-if="errors.password" class="error-message">{{ errors.password }}</div>

        </div>



        <div class="form-options">

          <div class="remember-me">

            <label class="checkbox-container">

              <input type="checkbox" v-model="formData.rememberMe" />

              <span class="checkmark"></span>

              <span class="checkbox-label">{{ $t('common.rememberMe') }}</span>

            </label>

          </div>

          <router-link to="/forgot-password" class="forgot-password">

            {{ $t('common.forgotPassword') }}

          </router-link>

        </div>



        <button

          type="submit"

          class="btn btn-primary btn-block"

          :disabled="loading"

        >

          <span v-if="loading" class="loading-wrapper">

            <span>{{ $t('common.loading') }}</span>

          </span>

          <span v-else>

            {{ $t('common.login') }}

            <IconArrowRight class="icon-right" />

          </span>

        </button>

      </form>



      <!-- OAuth 登录选项 -->
      <div class="oauth-section">
        <div class="auth-divider">
          <span class="auth-divider-text">{{ $t('auth.orLoginWith') }}</span>
        </div>
        
        <div class="oauth-buttons">
          <button 
            class="oauth-btn google-btn" 
            @click="handleGoogleLogin"
            :disabled="loading"
          >
            <IconBrandGoogle :size="20" />
            {{ $t('auth.loginWithGoogle') }}
          </button>
          
          <button 
            class="oauth-btn telegram-btn" 
            @click="handleTelegramLogin"
            :disabled="loading"
          >
            <IconBrandTelegram :size="20" />
            {{ $t('auth.loginWithTelegram') }}
          </button>
        </div>
      </div>

      <div class="auth-footer">

        <div class="auth-divider">

          <span class="auth-divider-text">{{ $t('auth.noAccount') }}</span>

        </div>



        <router-link to="/register" class="btn btn-secondary btn-block">

          {{ $t('auth.createAccount') }}

        </router-link>

      </div>

    </div>



    <!-- Telegram 登录弹窗 -->
    <div class="telegram-modal" v-if="showTelegramModal" @click="closeTelegramModal">
      <div class="telegram-modal-content" @click.stop>
        <div class="telegram-modal-header">
          <div class="header-left">
            <div class="telegram-icon">
              <IconBrandTelegram :size="20" />
            </div>
            <h3>{{ $t('auth.telegramLoginTitle') }}</h3>
          </div>
          <button class="modal-close" @click="closeTelegramModal">
            <IconX :size="18" />
          </button>
        </div>
        
        <div class="telegram-modal-body">
          <!-- 机器人信息 -->
          <div class="bot-info">
            <div class="bot-avatar">
              <IconBrandTelegram :size="24" />
            </div>
            <div class="bot-details">
              <h4>{{ getBotName() }}</h4>
              <p>{{ $t('auth.telegramBotDesc') }}</p>
            </div>
          </div>
          
          <!-- 验证码区域 -->
          <div class="verification-section">
            <div class="section-title">
              <span class="step-badge">1</span>
              <h4>{{ $t('auth.telegramStep1') }}</h4>
            </div>
            <p class="section-desc">{{ $t('auth.telegramStep1Desc') }}</p>
            
            <div class="code-container">
              <div class="code-input">
                <code>/login {{ telegramHash }}</code>
                <button class="copy-button" @click="copyLoginHash">
                  <IconCopy :size="16" />
                </button>
              </div>
            </div>
          </div>
          
          <!-- 操作步骤 -->
          <div class="action-section">
            <div class="section-title">
              <span class="step-badge">2</span>
              <h4>{{ $t('auth.telegramStep2') }}</h4>
            </div>
            <div class="step-list">
              <div class="step-item">
                <span class="step-number">1</span>
                <span class="step-text">打开 Telegram 应用</span>
              </div>
              <div class="step-item">
                <span class="step-number">2</span>
                <span class="step-text">搜索机器人：<span class="bot-name">{{ getBotName() }}</span></span>
              </div>
              <div class="step-item">
                <span class="step-number">3</span>
                <span class="step-text">将验证码发送给机器人</span>
              </div>
              <div class="step-item">
                <span class="step-number">4</span>
                <span class="step-text">等待验证完成</span>
              </div>
            </div>
          </div>
          
          <!-- 状态指示器 -->
          <div class="telegram-status" v-if="telegramStatus">
            <div class="status-indicator" :class="telegramStatus">
              <IconLoader v-if="telegramStatus === 'checking'" class="spinning" />
              <IconCheck v-else-if="telegramStatus === 'success'" />
              <IconX v-else-if="telegramStatus === 'error'" />
            </div>
            <span class="status-text">{{ getTelegramStatusText() }}</span>
          </div>
        </div>
        
        <div class="telegram-modal-footer">
          <button class="btn btn-secondary" @click="closeTelegramModal">
            {{ $t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 邮箱输入弹窗 -->
    <div class="email-modal" v-if="showEmailModal" @click="closeEmailModal">
      <div class="email-modal-content" @click.stop>
        <div class="email-modal-header">
          <h3>{{ $t('auth.emailRequiredTitle') }}</h3>
          <button class="modal-close" @click="closeEmailModal">
            <IconX :size="20" />
          </button>
        </div>
        
        <div class="email-modal-body">
          <p>{{ $t('auth.emailRequiredDesc') }}</p>
          <div class="form-group">
            <label>{{ $t('common.email') }}</label>
            <input 
              type="email" 
              v-model="emailInput" 
              :placeholder="$t('auth.emailPlaceholder')"
              class="form-control"
            />
            <div v-if="emailError" class="error-message">{{ emailError }}</div>
          </div>
        </div>
        
        <div class="email-modal-footer">
          <button class="btn btn-secondary" @click="closeEmailModal">
            {{ $t('common.cancel') }}
          </button>
          <button 
            class="btn btn-primary" 
            @click="completeTelegramReg"
            :disabled="!emailInput || emailLoading"
          >
            <span v-if="emailLoading" class="loading-wrapper">
              <span>{{ $t('common.loading') }}</span>
            </span>
            <span v-else>{{ $t('auth.completeRegistration') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 自定义弹窗 -->

    <AuthPopup

      :show-popup="showAuthPopup"

      :title="authPopupConfig.title"

      :content="authPopupConfig.content"

      :cooldown-hours="authPopupConfig.cooldownHours"

      :close-wait-seconds="authPopupConfig.closeWaitSeconds"

      @close="handleAuthPopupClose"

    />

  </div>

</template>



<script>

import { ref, reactive, onMounted } from 'vue';

import { useRouter } from 'vue-router';

import { useI18n } from 'vue-i18n';

import { useToast } from '@/composables/useToast';

import ThemeToggle from '@/components/common/ThemeToggle.vue';

import LanguageSelector from '@/components/common/LanguageSelector.vue';

import IconMail from '@/components/icons/IconMail.vue';

import IconLock from '@/components/icons/IconLock.vue';

import IconArrowRight from '@/components/icons/IconArrowRight.vue';

import IconEye from '@/components/icons/IconEye.vue';

import IconEyeOff from '@/components/icons/IconEyeOff.vue';

import IconBrandGoogle from '@/components/icons/IconBrandGoogle.vue';

import IconBrandTelegram from '@/components/icons/IconBrandTelegram.vue';

import IconX from '@/components/icons/IconX.vue';

import IconCopy from '@/components/icons/IconCopy.vue';

import IconSend from '@/components/icons/IconSend.vue';

import IconLoader from '@/components/icons/IconLoader.vue';

import IconCheck from '@/components/icons/IconCheck.vue';

import { 
  login, 
  checkLoginStatus, 
  getGoogleAuthUrl, 
  getTelegramAuthHash, 
  checkTelegramLoginStatus, 
  completeTelegramRegistration,
  getWebsiteConfig
} from '@/api/auth';

import { validateEmail, validateRequired } from '@/utils/validators';



import DomainAuthAlert from '@/components/common/DomainAuthAlert.vue';

import { handleTokenLogin, hasVerifyToken } from '@/utils/tokenLogin';

import { AUTH_CONFIG } from '@/utils/baseConfig';

import AuthPopup from '@/components/auth/AuthPopup.vue';

import { shouldShowAuthPopup } from '@/utils/authPopupState';

import { useNavigator } from '@/composables/useNavigator'

export default {

  name: 'LoginView',

  components: {

    ThemeToggle,

    LanguageSelector,

    IconMail,

    IconLock,

    IconArrowRight,

    IconEye,

    IconEyeOff,

    IconBrandGoogle,

    IconBrandTelegram,

    IconX,

    IconCopy,

    IconSend,

    IconLoader,

    IconCheck,

    DomainAuthAlert,

    AuthPopup

  },



  setup() {

    const router = useRouter();

    const { t } = useI18n();

    const { showToast } = useToast();

    const { goTo } = useNavigator()



    const logoPath = ref('./images/logo.png');

    const handleLogoError = () => {

      logoPath.value = '/images/logo.png';

    };



    const formData = reactive({

      email: '',

      password: '',

      rememberMe: false

    });



    const errors = reactive({

      email: '',

      password: ''

    });



    const loading = ref(false);
    const configLoading = ref(false);

    const config = reactive({
      tos_url: '',
      is_email_verify: 0,
      is_recaptcha: 0,
      is_invite_force: 0,
      recaptcha_site_key: '',
      email_whitelist_suffix: [],
      telegram_bot_name: '',
      telegram_bot: '',
      bot_name: '',
      telegram_bot_username: ''
    });

    // OAuth 相关状态
    const showTelegramModal = ref(false);
    const showEmailModal = ref(false);
    const telegramHash = ref('');
    const telegramStatus = ref('');
    const telegramPollInterval = ref(null);
    const emailInput = ref('');
    const emailError = ref('');
    const emailLoading = ref(false);

    const showPassword = ref(false);



    const showAuthPopup = ref(false);

    const authPopupConfig = reactive({

      title: AUTH_CONFIG.popup?.title || '',

      content: AUTH_CONFIG.popup?.content || '',

      cooldownHours: AUTH_CONFIG.popup?.cooldownHours || 24,

      closeWaitSeconds: AUTH_CONFIG.popup?.closeWaitSeconds || 0

    });



    const handleAuthPopupClose = () => {

      showAuthPopup.value = false;

    };







    onMounted(async () => {
      // 首先处理OAuth回调，优先级最高
      handleOAuthCallback();





      const hasToken = hasVerifyToken();



      if (hasToken) {

        loading.value = true;



        try {

          const tokenLoginResult = await handleTokenLogin({

            onLoginSuccess: () => {

              console.log('令牌验证登录成功');

            }

          });





          if (tokenLoginResult.success) {

            return;

          }

        } catch (error) {

          console.error('令牌登录过程中出错:', error);

        } finally {

          loading.value = false;

        }

      }



      const urlParams = new URLSearchParams(window.location.search);

      const isJustLoggedOut = urlParams.get('logout') === 'true';



      if (isJustLoggedOut) {

        console.log('检测到用户刚刚登出，清除所有登录状态');

        showToast(t('auth.logoutSuccess'), 'success', 3000);



        if (window.history && window.history.replaceState) {

          const newUrl = window.location.href.replace('?logout=true', '').replace('&logout=true', '');

          window.history.replaceState({}, document.title, newUrl);

        }



        return;

      }



      showAuthPopup.value = shouldShowAuthPopup(AUTH_CONFIG.popup);



      try {

        if (window._isLoggingOut === true) {

          console.log('检测到全局登出标记，跳过登录状态检查');

          return;

        }



        const loginStatus = checkLoginStatus();



        if (loginStatus) {

          console.log('用户已登录，准备跳转到控制面板');

          showToast(t('auth.alreadyLoggedIn'), 'info');

          setTimeout(() => {

            router.push('/dashboard');

          }, 500);

        }

      } catch (error) {

        console.error("登录状态检查失败", error);

      }
      
      // 加载网站配置
      try {
        if(window.EZ_CONFIG.API_CONFIG.showCheckBackend) {
          configLoading.value = true;
        }
        
        const response = await getWebsiteConfig();
        
        if (response) {
          // 检查响应结构，如果包含data字段则使用data，否则直接使用response
          const configData = response.data || response;
          
          // 直接更新每个字段，确保null值也能正确覆盖
          Object.keys(configData).forEach(key => {
            if (configData[key] !== undefined) {
              config[key] = configData[key];
            }
          });
        }
      } catch (error) {
        console.error('加载网站配置失败:', error);
      } finally {
        configLoading.value = false;
      }

    });

    // OAuth回调处理
    const handleOAuthCallback = async () => {
      // 检查URL参数
      const urlParams = new URLSearchParams(window.location.search);
      
      // 处理OAuth成功 - 检查是否有token参数
      const token = urlParams.get('token');
      const authData = urlParams.get('auth_data');
      const isAdmin = urlParams.get('is_admin');
      
      if (token) {
        
        // 保存认证信息
        localStorage.setItem('token', token);
        if (authData) {
          localStorage.setItem('auth_data', authData);
        }
        if (isAdmin) {
          localStorage.setItem('is_admin', isAdmin);
        }
        
        // 设置登录状态标志，确保checkLoginStatus返回true
        window.isUserLoggedIn = true;
        
        // 清除URL参数
        clearUrlParams();
        
        // 重新加载语言文件（登录后需要加载完整的语言文件）
        try {
          const { reloadMessages } = await import('@/i18n');
          await reloadMessages();
        } catch (error) {
          console.warn('重新加载语言文件失败:', error);
        }
        
        // 立即跳转，语言文件会在后台加载
        router.push('/dashboard');
        showToast(t('auth.loginSuccess'), 'success');
        return;
      }
      
      // 处理OAuth成功 - 检查success参数
      if (urlParams.get('success') === '1') {
        const successToken = urlParams.get('token');
        const successAuthData = urlParams.get('auth_data');
        const successIsAdmin = urlParams.get('is_admin');
        
        if (successToken) {
          // 保存认证信息
          localStorage.setItem('token', successToken);
          if (successAuthData) {
            localStorage.setItem('auth_data', successAuthData);
          }
          if (successIsAdmin) {
            localStorage.setItem('is_admin', successIsAdmin);
          }
          
          // 设置登录状态标志，确保checkLoginStatus返回true
          window.isUserLoggedIn = true;
          
          // 清除URL参数
          clearUrlParams();
          
          // 重新加载语言文件（登录后需要加载完整的语言文件）
          try {
            const { reloadMessages } = await import('@/i18n');
            await reloadMessages();
          } catch (error) {
            console.warn('重新加载语言文件失败:', error);
          }
          
          // 立即跳转，语言文件会在后台加载
          router.push('/dashboard');
          showToast(t('auth.loginSuccess'), 'success');
        }
      }
      
      // 处理OAuth失败
      if (urlParams.get('error') === 'oauth_failed') {
        showToast(t('auth.googleLoginFailed'), 'error');
        clearUrlParams();
      }
    };
    
    // 清除URL参数
    const clearUrlParams = () => {
      const url = new URL(window.location);
      url.searchParams.delete('success');
      url.searchParams.delete('error');
      url.searchParams.delete('token');
      url.searchParams.delete('auth_data');
      url.searchParams.delete('is_admin');
      
      window.history.replaceState({}, '', url);
    };

    const validateForm = () => {

      let isValid = true;



      errors.email = '';

      errors.password = '';



      if (!validateRequired(formData.email)) {

        errors.email = t('validation.emailRequired');

        isValid = false;

      } else if (!validateEmail(formData.email)) {

        errors.email = t('validation.emailInvalid');

        isValid = false;

      }



      if (!validateRequired(formData.password)) {

        errors.password = t('validation.passwordRequired');

        isValid = false;

      }



      return isValid;

    };



    const handleLogin = async () => {

      if (!validateForm()) {

        return;

      }



      loading.value = true;



      try {

        const response = await login(formData);



        showToast(response.message || t('auth.loginSuccess'), 'success', 3000);

        // 重新加载语言文件（登录后需要加载完整的语言文件）
        try {
          const { reloadMessages } = await import('@/i18n');
          await reloadMessages();
        } catch (error) {
          console.warn('重新加载语言文件失败:', error);
        }

        router.push('/dashboard');

      } catch (error) {

        showToast(error.response?.message || error.message || t('auth.loginFailed'), 'error');

      } finally {

        loading.value = false;

      }

    };

    // Google 登录
    const handleGoogleLogin = async () => {
      try {
        const inviteCode = router.currentRoute.value.query.invite_code || '';
        const redirectUrl = window.location.origin + '/#/login';
        
        // 1. 获取Google授权URL
        const response = await getGoogleAuthUrl(inviteCode, redirectUrl);
        
        if (response && response.data && response.data.url) {
          // 2. 直接跳转到Google授权页面
          window.location.href = response.data.url;
        } else {
          throw new Error('获取Google授权URL失败');
        }
      } catch (error) {
        console.error('Google登录失败:', error);
        showToast(error.message || t('auth.googleLoginFailed'), 'error');
      }
    };

    // Telegram 登录
    const handleTelegramLogin = async () => {
      try {
        const response = await getTelegramAuthHash();
        
        if (response && response.data && response.data.hash) {
          telegramHash.value = response.data.hash;
          showTelegramModal.value = true;
          startTelegramPolling(response.data.hash);
        }
      } catch (error) {
        showToast(error.message || t('auth.telegramLoginFailed'), 'error');
      }
    };

    // 开始轮询 Telegram 登录状态
    const startTelegramPolling = (hash) => {
      telegramStatus.value = 'checking';
      
      telegramPollInterval.value = setInterval(async () => {
        try {
          const response = await checkTelegramLoginStatus(hash);
          
          if (response.status === 'success') {
            clearInterval(telegramPollInterval.value);
            telegramStatus.value = 'success';
            
            // 保存token并跳转
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('auth_data', response.data.auth_data);
            
            // 设置登录状态标志，确保checkLoginStatus返回true
            window.isUserLoggedIn = true;
            
            // 重新加载语言文件（登录后需要加载完整的语言文件）
            try {
              const { reloadMessages } = await import('@/i18n');
              await reloadMessages();
            } catch (error) {
              console.warn('重新加载语言文件失败:', error);
            }
            
            // Telegram注册成功后立即跳转到profile页面进行邮箱验证
            window.location.href = '/#/profile';
          } else if (response.status === 'need_email') {
            clearInterval(telegramPollInterval.value);
            showTelegramModal.value = false;
            showEmailModal.value = true;
          } else if (response.status === 'error') {
            clearInterval(telegramPollInterval.value);
            telegramStatus.value = 'error';
            showToast(response.error || t('auth.telegramLoginError'), 'error');
          }
        } catch (error) {
          console.error('检查Telegram登录状态失败:', error);
        }
      }, 2000);
      
      // 5分钟后停止轮询
      setTimeout(() => {
        if (telegramPollInterval.value) {
          clearInterval(telegramPollInterval.value);
          telegramStatus.value = 'error';
        }
      }, 300000);
    };

    // 关闭 Telegram 弹窗
    const closeTelegramModal = () => {
      showTelegramModal.value = false;
      if (telegramPollInterval.value) {
        clearInterval(telegramPollInterval.value);
      }
      telegramStatus.value = '';
    };

    // 关闭邮箱弹窗
    const closeEmailModal = () => {
      showEmailModal.value = false;
      emailInput.value = '';
      emailError.value = '';
    };

    // 复制 hash
    // 复制 /login 验证码
    const copyLoginHash = async () => {
      try {
        await navigator.clipboard.writeText(`/login ${telegramHash.value}`);
        showToast(t('common.copied'), 'success');
      } catch (error) {
        showToast(t('common.copyFailed'), 'error');
      }
    };

    // 完成 Telegram 注册
    const completeTelegramReg = async () => {
      if (!emailInput.value) {
        emailError.value = t('auth.emailRequired');
        return;
      }
      
      emailLoading.value = true;
      emailError.value = '';
      
      try {
        const response = await completeTelegramRegistration(telegramHash.value, emailInput.value);
        
        if (response.status === 'success') {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('auth_data', response.data.auth_data);
          
          showToast(t('auth.registrationSuccess'), 'success');
          setTimeout(() => {
            // 强制刷新页面以确保所有资源正确加载
            window.location.href = '/#/dashboard';
          }, 1000);
        } else {
          emailError.value = response.error || t('auth.registrationFailed');
        }
      } catch (error) {
        emailError.value = error.message || t('auth.registrationFailed');
      } finally {
        emailLoading.value = false;
      }
    };

    // 获取 Telegram 状态文本
    const getTelegramStatusText = () => {
      switch (telegramStatus.value) {
        case 'checking':
          return t('auth.telegramChecking');
        case 'success':
          return t('auth.telegramSuccess');
        case 'error':
          return t('auth.telegramError');
        default:
          return '';
      }
    };

    // 获取机器人名称
    const getBotName = () => {
      return config.telegram_bot_name || 
             config.telegram_bot || 
             config.bot_name || 
             config.telegram_bot_username || 
             window.EZ_CONFIG?.telegram_bot_name || 
             window.EZ_CONFIG?.telegram_bot || 
             window.EZ_CONFIG?.bot_name || 
             window.EZ_CONFIG?.telegram_bot_username || 
             '@your_login_bot';
    };

    // 获取 Telegram 第二步描述（带样式的机器人地址）
    const getTelegramStep2Desc = () => {
      const botUsername = getBotName();
      
      return t('auth.telegramStep2Desc', { 
        bot_username: `<span class="bot-username">${botUsername}</span>` 
      });
    };

    return {

      formData,

      errors,

      loading,
      configLoading,

      showPassword,

      handleLogin,

      config,



      logoPath,

      handleLogoError,

      showAuthPopup,

      authPopupConfig,

      handleAuthPopupClose,

      goTo,

      // OAuth 相关
      handleGoogleLogin,
      handleTelegramLogin,
      showTelegramModal,
      showEmailModal,
      telegramHash,
      telegramStatus,
      emailInput,
      emailError,
      emailLoading,
      closeTelegramModal,
      closeEmailModal,
      copyLoginHash,
      completeTelegramReg,
      getTelegramStatusText,
      getBotName,
      getTelegramStep2Desc,

    };

  }

};

</script>



<style lang="scss" scoped>

.top-toolbar {

  position: fixed;

  top: 20px;

  right: 20px;

  display: flex;

  gap: 10px;

  z-index: 10;

}



.required {

  color: #ff4d4f;

  margin-left: 4px;

  font-size: 16px;

  vertical-align: middle;

}



.input-with-icon {

  position: relative;

  width: 100%;



  .input-icon {

    position: absolute;

    left: 12px;

    top: 50%;

    transform: translateY(-50%);

    color: var(--secondary-text-color);

    width: 20px;

    height: 20px;

  }



  .password-toggle {

    position: absolute;

    right: 12px;

    top: 50%;

    transform: translateY(-50%);

    color: var(--secondary-text-color);

    cursor: pointer;

    padding: 4px;

    display: flex;

    align-items: center;

    justify-content: center;

    transition: color 0.2s ease;



    &:hover {

      color: var(--theme-color);

    }

  }



  .form-control {

    padding-left: 40px;

    height: 45px;

    border-radius: 8px;

    border: 1px solid var(--input-border-color, transparent);

    background-color: var(--input-bg-color, #f9f9f9);

    transition: all 0.3s ease;

    color: var(--primary-text-color);



    &[type="password"],

    &[type="text"] {

      padding-right: 40px;

    }



    &:focus {

      outline: none;

      border-color: var(--theme-color);

      box-shadow: 0 0 0 2px var(--primary-color-focus);

      background-color: var(--input-focus-bg-color, #fff);

    }



    &::placeholder {

      color: var(--placeholder-color, #aaa);

    }

  }

}



.form-options {

  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 1.5rem;



  .remember-me .checkbox-container {

    display: flex;

    align-items: center;

    position: relative;

    padding-left: 30px;

    cursor: pointer;

    user-select: none;



    input {

      position: absolute;

      opacity: 0;

      cursor: pointer;

      height: 0;

      width: 0;



      &:checked ~ .checkmark {

        background-color: var(--theme-color);

        border-color: var(--theme-color);



        &:after {

          display: block;

        }

      }

    }



    .checkmark {

      position: absolute;

      top: 0;

      left: 0;

      height: 20px;

      width: 20px;

      background-color: transparent;

      border: 2px solid var(--border-color);

      border-radius: 4px;

      transition: all 0.2s ease;



      &:after {

        content: "";

        position: absolute;

        display: none;

        left: 5px;

        top: 0.5px;

        width: 5px;

        height: 10px;

        border: solid white;

        border-width: 0 2px 2px 0;

        transform: rotate(45deg);

      }

    }



    .checkbox-label {

      color: var(--secondary-text-color);

      font-size: 0.875rem;

    }

  }



  .forgot-password {

    color: var(--theme-color);

    font-size: 0.875rem;

    text-decoration: none;

    transition: color 0.3s ease, opacity 0.3s ease;



    &:hover {

      opacity: 0.8;

    }

  }

}



.btn {

  height: 45px;

  border-radius: 8px;

  transition: all 0.3s;

  display: flex;

  align-items: center;

  justify-content: center;



  &.btn-primary {

    background-color: var(--theme-color);

    border: none;

    color: white;

    font-weight: 600;



    &:hover:not(:disabled) {

      background-color: var(--primary-color-hover);

    }



    &:disabled {

      opacity: 0.6;

      cursor: not-allowed;

    }



    .icon-right {

      margin-left: 8px;

    }

  }

}



.error-message {

  display: block;

  color: #ff4d4f;

  font-size: 0.8rem;

  margin-top: 0.3rem;

}





@media (max-width: 576px) {

  .auth-card {

    padding: 1.5rem;

  }



  .form-options {

    flex-direction: row;

    justify-content: space-between;

    align-items: center;

    flex-wrap: wrap;

    gap: 0.5rem;



    .remember-me {

      flex: 0 0 auto;

    }



    .forgot-password {

      flex: 0 0 auto;

      margin-left: auto;

    }

  }

}





@media (min-width: 576px) and (max-width: 992px) {

  .auth-container {

    padding: 2rem;

  }

}





.dark-theme {

  .input-with-icon {

    .input-icon {

      color: var(--secondary-text-color);

    }



    .form-control {

      background-color: var(--input-bg-color, #333);

      border-color: var(--input-border-color, #444);



      &:focus {

        background-color: var(--input-focus-bg-color, #3a3a3a);

        border-color: var(--theme-color);

      }



      &::placeholder {

        color: var(--placeholder-color, #777);

      }

    }

  }



  .checkbox-container {

    .checkbox-label {

      color: var(--secondary-text-color);

    }



    .checkmark {

      background-color: transparent;

      border-color: var(--border-color, #555);

    }

  }

}



.auth-footer {

  margin-top: 24px;



  a.btn {

    display: flex !important;

    align-items: center !important;

    justify-content: center !important;

    text-decoration: none;

    height: 45px !important;

    line-height: normal !important;

  }

}



.btn.btn-secondary.btn-block {

  height: 45px !important;

  display: flex !important;

  align-items: center !important;

  justify-content: center !important;

  line-height: normal !important;

  color: var(--text-color);

  border: 1px solid var(--border-color);

  background-color: transparent;

  transition: all 0.3s ease;



  &:hover {

    border-color: var(--theme-color);

    background-color: rgba(var(--theme-color-rgb), 0.05);

    color: var(--theme-color) !important;

    -webkit-text-fill-color: var(--theme-color) !important;

    background-image: none !important;

  }

}



.loading-wrapper {

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  transition: all 0.3s ease;



  svg {

    display: none;

  }



  &::before {

    content: "";

    width: 16px;

    height: 16px;

    border: 2px solid rgba(255, 255, 255, 0.3);

    border-radius: 50%;

    border-top-color: white;

    animation: spin 1s linear infinite;

    margin-right: 8px;

  }



  span {

    display: inline-block;

    animation: pulse 1.5s infinite ease-in-out;

  }

}



@keyframes pulse {

  0%, 100% { opacity: 1; }

  50% { opacity: 0.7; }

}



@keyframes spin {

  from { transform: rotate(0deg); }

  to { transform: rotate(360deg); }

}



@keyframes cardAppear {

  0% {

    opacity: 0;

  }

  100% {

    opacity: 1;

  }

}



@keyframes formAppear {

  0% {

    opacity: 0;

  }

  100% {

    opacity: 1;

  }

}



.auth-logo {

  margin-bottom: 1.5rem;

  text-align: center;

  img {

    width: 60px;

    height: 60px;

    min-width: 60px;

    min-height: 60px;

    border-radius: 12px;

    object-fit: cover;

    cursor: pointer;

    user-select: none;

  }

}

// OAuth 登录样式
.oauth-section {
  margin-top: 24px;
  
  .oauth-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
  }
  
  .oauth-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background-color: var(--card-background);
    color: var(--text-color);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover:not(:disabled) {
      background-color: var(--hover-background);
      border-color: var(--theme-color);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    &.google-btn {
      &:hover:not(:disabled) {
        background-color: #f8f9fa;
        border-color: #4285f4;
        color: #333;
      }
    }
    
    &.telegram-btn {
      &:hover:not(:disabled) {
        background-color: #f0f8ff;
        border-color: #0088cc;
        color: #333;
      }
    }
  }
}

// Telegram 弹窗样式
.telegram-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  
  .telegram-modal-content {
    background: var(--card-background);
    border-radius: 16px;
    width: 90%;
    max-width: 420px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--border-color);
    
    .telegram-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      
      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .telegram-icon {
          width: 36px;
          height: 36px;
          background: #0088cc;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        h3 {
          margin: 0;
          color: var(--text-color);
          font-size: 18px;
          font-weight: 600;
        }
      }
      
      .modal-close {
        background: none;
        border: none;
        color: var(--secondary-text-color);
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        transition: all 0.2s ease;
        
        &:hover {
          background-color: var(--hover-background);
          color: var(--text-color);
        }
      }
    }
    
    .telegram-modal-body {
      padding: 24px;
      
      // 机器人信息
      .bot-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: rgba(0, 136, 204, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(0, 136, 204, 0.1);
        margin-bottom: 24px;
        
        .bot-avatar {
          width: 40px;
          height: 40px;
          background: #0088cc;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .bot-details {
          flex: 1;
          
          h4 {
            margin: 0 0 4px 0;
            color: var(--text-color);
            font-size: 16px;
            font-weight: 600;
          }
          
          p {
            margin: 0;
            color: var(--secondary-text-color);
            font-size: 14px;
          }
        }
      }
      
      // 验证码区域
      .verification-section {
        margin-bottom: 24px;
        
        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          
          .step-badge {
            width: 24px;
            height: 24px;
            background: #22c55e;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
          }
          
          h4 {
            margin: 0;
            color: var(--text-color);
            font-size: 16px;
            font-weight: 600;
          }
        }
        
        .section-desc {
          margin: 0 0 16px 0;
          color: var(--secondary-text-color);
          font-size: 14px;
          line-height: 1.5;
        }
        
        .code-container {
          .code-input {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            background: var(--background-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            
            code {
              flex: 1;
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              font-size: 14px;
              color: var(--text-color);
              background: none;
              padding: 0;
              font-weight: 600;
            }
            
            .copy-button {
              background: var(--theme-color);
              color: white;
              border: none;
              padding: 8px;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s ease;
              
              &:hover {
                background: var(--theme-hover-color);
                transform: scale(1.05);
              }
            }
          }
        }
      }
      
      // 操作步骤
      .action-section {
        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          
          .step-badge {
            width: 24px;
            height: 24px;
            background: var(--theme-color);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
          }
          
          h4 {
            margin: 0;
            color: var(--text-color);
            font-size: 16px;
            font-weight: 600;
          }
        }
        
        .step-list {
          .step-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 0;
            
            .step-number {
              width: 20px;
              height: 20px;
              background: var(--background-color);
              border: 1px solid var(--border-color);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 600;
              color: var(--text-color);
            }
            
            .step-text {
              color: var(--text-color);
              font-size: 14px;
              line-height: 1.5;
              
              .bot-name {
                color: var(--theme-color);
                font-weight: 600;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                background: rgba(var(--theme-color-rgb), 0.1);
                padding: 2px 6px;
                border-radius: 4px;
              }
            }
          }
        }
      }
      
      .telegram-status {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: var(--background-color);
        border-radius: 8px;
        margin-top: 20px;
        border: 1px solid var(--border-color);
        
        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          
          &.checking {
            background: rgba(var(--warning-color-rgb), 0.1);
            color: var(--warning-color);
          }
          
          &.success {
            background: rgba(var(--success-color-rgb), 0.1);
            color: var(--success-color);
          }
          
          &.error {
            background: rgba(var(--error-color-rgb), 0.1);
            color: var(--error-color);
          }
          
          .spinning {
            animation: spin 1s linear infinite;
          }
        }
        
        .status-text {
          color: var(--text-color);
          font-size: 14px;
          font-weight: 500;
        }
      }
    }
    
    .telegram-modal-footer {
      display: flex;
      justify-content: flex-end;
      padding: 16px 24px 20px;
      border-top: 1px solid var(--border-color);
    }
  }
}

// 邮箱弹窗样式
.email-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  .email-modal-content {
    background-color: var(--card-background);
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    
    .email-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      
      h3 {
        margin: 0;
        color: var(--text-color);
        font-size: 18px;
        font-weight: 600;
      }
      
      .modal-close {
        background: none;
        border: none;
        color: var(--secondary-text-color);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        
        &:hover {
          background-color: var(--hover-background);
        }
      }
    }
    
    .email-modal-body {
      padding: 24px;
      
      p {
        margin: 0 0 16px 0;
        color: var(--secondary-text-color);
        font-size: 14px;
        line-height: 1.5;
      }
      
      .form-group {
        margin-bottom: 0;
        
        label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-color);
          font-size: 14px;
          font-weight: 500;
        }
        
        .form-control {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background-color: var(--background-color);
          color: var(--text-color);
          font-size: 14px;
          
          &:focus {
            outline: none;
            border-color: var(--theme-color);
            box-shadow: 0 0 0 3px rgba(var(--theme-color-rgb), 0.1);
          }
        }
        
        .error-message {
          margin-top: 8px;
          color: #ef4444;
          font-size: 12px;
        }
      }
    }
    
    .email-modal-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 20px 24px;
      border-top: 1px solid var(--border-color);
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

</style>
