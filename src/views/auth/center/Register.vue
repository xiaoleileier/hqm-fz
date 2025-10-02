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



    <div class="auth-card" v-if="configLoading">

      <div class="loading-container">

        <div class="loading-spinner"></div>

        <p class="">{{ $t('common.loading') }}</p>

      </div>

    </div>



    <div class="auth-card" v-else>

      <div class="auth-header">

        <div class="auth-logo">

          <img

            :src="logoPath"

            alt="Logo"

            @error="handleLogoError"

            @click="goTo('/')"

          />

        </div>

        <h1 class="auth-title">{{ $t('auth.registerTitle') }}</h1>

        <p class="auth-subtitle">{{ config.app_description || $t('auth.registerSubtitle') }}</p>

      </div>



      <form class="auth-form" @submit.prevent="handleRegister">

        <div class="form-group">

          <label for="email" class="form-label">{{ $t('common.email') }} <span class="required">*</span></label>



          <!-- 有邮箱白名单的情况 -->

          <div class="input-with-suffix" v-if="config.email_whitelist_suffix && config.email_whitelist_suffix.length > 0">

            <div class="input-with-icon email-prefix">

              <IconMail class="input-icon" />

              <input

                type="text"

                id="emailPrefix"

                class="form-control"

                v-model="emailPrefix"

                :placeholder="$t('auth.emailPrefixPlaceholder')"

                @input="handleEmailPrefixChange"

                :disabled="codeSent"

                required

              />

            </div>

            <div class="email-suffix-separator">@</div>

            <div class="email-suffix" @click="toggleSuffixDropdown" :class="{ disabled: codeSent }">

              <div class="suffix-text">{{ selectedSuffix }}</div>

              <IconChevronDown class="suffix-icon" :class="{ 'rotate-180': showSuffixDropdown }" />



              <div class="suffix-dropdown" v-if="showSuffixDropdown">

                <div

                  v-for="suffix in config.email_whitelist_suffix"

                  :key="suffix"

                  class="suffix-option"

                  :class="{ active: suffix === selectedSuffix }"

                  @click.stop="selectSuffix(suffix)"

                >

                  {{ suffix }}

                </div>

              </div>

            </div>

          </div>



          <!-- 无邮箱白名单的情况 -->

          <div class="input-with-icon" v-else>

            <IconMail class="input-icon" />

            <input

              type="email"

              id="email"

              class="form-control"

              v-model="formData.email"

              :placeholder="$t('auth.emailPlaceholder')"

              :disabled="codeSent"

              required

            />

          </div>

          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>

        </div>



        <!-- 验证码输入框 (仅当is_email_verify为1时显示) -->

        <div class="form-group" v-if="config.is_email_verify === 1">

          <label for="verificationCode" class="form-label">{{ $t('common.verificationCode') }} <span class="required">*</span></label>

          <div class="input-with-button">

            <div class="input-with-icon verification-input">

              <IconCode class="input-icon" />

              <input

                type="text"

                id="verificationCode"

                class="form-control"

                v-model="formData.verificationCode"

                :placeholder="$t('auth.codePlaceholder')"

                required

              />

            </div>

            <button

              type="button"

              class="send-code-btn"

              @click="sendVerificationCode"

              :disabled="!isValidEmail(formData.email) || cooldown > 0 || loading"

            >

              <IconSend v-if="cooldown === 0" class="icon-left" />

              <span v-if="cooldown > 0" class="">{{ cooldown }}s</span>

              <span v-else class="">{{ $t('common.sendCode') }}</span>

            </button>

          </div>

          <span v-if="errors.verificationCode" class="error-message">{{ errors.verificationCode }}</span>

        </div>



        <div class="form-group">

          <label for="password" class="form-label">{{ $t('common.password') }} <span class="required">*</span></label>

          <div class="input-with-icon">

            <IconLock class="input-icon" />

            <input

              :type="showPassword ? 'text' : 'password'"

              id="password"

              class="form-control"

              v-model="formData.password"

              :placeholder="$t('auth.passwordPlaceholder')"

              required

            />

            <div class="password-toggle" @click="showPassword = !showPassword">

              <IconEye v-if="!showPassword" />

              <IconEyeOff v-else />

            </div>

          </div>

          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>

        </div>



        <div class="form-group">

          <label for="confirmPassword" class="form-label">{{ $t('common.confirmPassword') }} <span class="required">*</span></label>

          <div class="input-with-icon">

            <IconLock class="input-icon" />

            <input

              :type="showConfirmPassword ? 'text' : 'password'"

              id="confirmPassword"

              class="form-control"

              v-model="formData.confirmPassword"

              :placeholder="$t('auth.confirmPasswordPlaceholder')"

              required

            />

            <div class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">

              <IconEye v-if="!showConfirmPassword" />

              <IconEyeOff v-else />

            </div>

          </div>

          <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>

        </div>



        <!-- 邀请码输入框 (显示在所有情况下，但根据is_invite_force决定是否必填) -->

        <div class="form-group">

          <label for="inviteCode" class="form-label">

            {{ $t('auth.inviteCode') }}

            <span class="required" v-if="config.is_invite_force === 1">*</span>

            <span class="optional" v-else>{{ $t('common.optional') }}</span>

          </label>

          <div class="input-with-icon">

            <IconTicket class="input-icon" />

            <input

              type="text"

              id="inviteCode"

              class="form-control"

              v-model="formData.inviteCode"

              :placeholder="$t('auth.inviteCodePlaceholder')"

              :required="config.is_invite_force === 1"

              :disabled="inviteCodeFromUrl"

              :readonly="inviteCodeFromUrl"

            />

          </div>

          <span v-if="errors.inviteCode" class="error-message">{{ errors.inviteCode }}</span>

        </div>



        <!-- 验证码组件 -->

        <div class="form-group" v-if="config.is_recaptcha === 1">

          <label class="form-label">{{ $t('auth.captcha') }} <span class="required">*</span></label>

          <div class="captcha-container">

            <!-- Google reCAPTCHA -->

            <div v-if="captchaConfig.type === 'google'" class="google-captcha" @click.stop>

              <div id="form-recaptcha"></div>

            </div>



            <!-- Cloudflare Turnstile -->

            <div v-else-if="captchaConfig.type === 'cloudflare'" class="cloudflare-captcha" @click.stop>

              <div id="form-turnstile"></div>

            </div>

          </div>

        </div>



        <div class="form-group agreement-checkbox">

          <label class="checkbox-container">

            <input type="checkbox" v-model="formData.agreeTerms" />

            <span class="checkmark"></span>

            <span class="checkbox-label">

              {{ $t('auth.agreeToTerms') }}

              <a :href="config.tos_url || '#'" target="_blank" class="">{{ $t('auth.termsOfService') }}</a>

              <span class="required">*</span>

            </span>

          </label>

          <span v-if="errors.agreeTerms" class="error-message">{{ errors.agreeTerms }}</span>

        </div>



        <div class="form-group">

          <button

            type="submit"

            class="btn btn-primary btn-block"

            :disabled="loading || !formData.agreeTerms"

          >

            <span v-if="loading" class="loading-wrapper">

              <span class="">{{ $t('common.loading') }}</span>

            </span>

            <span v-else class="">

              {{ $t('auth.createAccount') }}

              <IconArrowRight class="icon-right" />

            </span>

          </button>

        </div>

      </form>



      <!-- OAuth 注册选项 -->
      <div class="oauth-section">
        <div class="auth-divider">
          <span class="auth-divider-text">{{ $t('auth.orRegisterWith') }}</span>
        </div>
        
        <div class="oauth-buttons">
          <button 
            class="oauth-btn google-btn" 
            @click="handleGoogleRegister"
            :disabled="loading"
          >
            <IconBrandGoogle :size="20" />
            {{ $t('auth.registerWithGoogle') }}
          </button>
          
          <button 
            class="oauth-btn telegram-btn" 
            @click="handleTelegramRegister"
            :disabled="loading"
          >
            <IconBrandTelegram :size="20" />
            {{ $t('auth.registerWithTelegram') }}
          </button>
        </div>
      </div>

      <div class="auth-footer">

        <div class="auth-divider">

          <span class="auth-divider-text">{{ $t('auth.alreadyHaveAccount') }}</span>

        </div>



        <router-link to="/login" class="btn btn-secondary btn-block">

          {{ $t('common.login') }}

        </router-link>

      </div>

    </div>



    <!-- Telegram 注册弹窗 -->
    <div class="telegram-modal" v-if="showTelegramModal" @click="closeTelegramModal">
      <div class="telegram-modal-content" @click.stop>
        <div class="telegram-modal-header">
          <div class="header-left">
            <div class="telegram-icon">
              <IconBrandTelegram :size="20" />
            </div>
            <h3>{{ $t('auth.telegramRegisterTitle') }}</h3>
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

    <!-- 验证码弹窗 -->

    <div class="captcha-modal" v-if="showCaptchaModal" :class="{ 'closing': isClosingModal }">

      <div class="captcha-modal-overlay" @click="closeCaptchaModal"></div>

      <div class="captcha-modal-content" :class="{ 'closing': isClosingModal }">

        <div class="captcha-modal-header">

          <h3>{{ $t('auth.captcha') }}</h3>

          <button class="close-btn" @click="closeCaptchaModal">

            <span>&times;</span>

          </button>

        </div>

        <div class="captcha-modal-body">

          <p>{{ $t('auth.captchaRequired') }}</p>



          <!-- Google reCAPTCHA -->

          <div v-if="captchaConfig.type === 'google'" class="google-captcha">

            <div id="modal-recaptcha"></div>

          </div>



          <!-- Cloudflare Turnstile -->

          <div v-else-if="captchaConfig.type === 'cloudflare'" class="cloudflare-captcha">

            <div id="modal-turnstile"></div>

          </div>

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

import { reactive, ref, onMounted, onBeforeUnmount, computed, getCurrentInstance, onActivated } from 'vue';

import { useRouter } from 'vue-router';

import { useI18n } from 'vue-i18n';

import { useToast } from '@/composables/useToast';

import ThemeToggle from '@/components/common/ThemeToggle.vue';

import LanguageSelector from '@/components/common/LanguageSelector.vue';

import { isValidEmail } from '@/utils/validators';

import IconMail from '@/components/icons/IconMail.vue';

import IconCode from '@/components/icons/IconCode.vue';

import IconLock from '@/components/icons/IconLock.vue';

import IconTicket from '@/components/icons/IconTicket.vue';

import IconSend from '@/components/icons/IconSend.vue';

import IconArrowRight from '@/components/icons/IconArrowRight.vue';

import IconEye from '@/components/icons/IconEye.vue';

import IconEyeOff from '@/components/icons/IconEyeOff.vue';

import IconChevronDown from '@/components/icons/IconChevronDown.vue';

import IconBrandGoogle from '@/components/icons/IconBrandGoogle.vue';

import IconBrandTelegram from '@/components/icons/IconBrandTelegram.vue';

import IconX from '@/components/icons/IconX.vue';

import IconCopy from '@/components/icons/IconCopy.vue';

import IconLoader from '@/components/icons/IconLoader.vue';

import IconCheck from '@/components/icons/IconCheck.vue';

import { 
  register, 
  checkLoginStatus, 
  getWebsiteConfig, 
  sendEmailVerify,
  getGoogleAuthUrl,
  getTelegramAuthHash,
  checkTelegramLoginStatus,
  completeTelegramRegistration
} from '@/api/auth';



import DomainAuthAlert from '@/components/common/DomainAuthAlert.vue';

import { CAPTCHA_CONFIG, AUTH_CONFIG } from '@/utils/baseConfig';

import AuthPopup from '@/components/auth/AuthPopup.vue';

import { shouldShowAuthPopup } from '@/utils/authPopupState';

import { useNavigator } from '@/composables/useNavigator'

window.onCaptchaVerified = function(response) {

  if (window._registerInstance) {

    window._registerInstance.handleCaptchaResponse(response);

  }

};



window.onCaptchaModalVerified = function(response) {

  if (window._registerInstance) {

    window._registerInstance.handleCaptchaModalResponse(response);

  }

};



let isGoogleRecaptchaRendered = false;



export default {

  name: 'RegisterView',

  components: {

    ThemeToggle,

    LanguageSelector,

    IconMail,

    IconCode,

    IconLock,

    IconTicket,

    IconSend,

    IconArrowRight,

    IconEye,

    IconEyeOff,

    IconChevronDown,

    IconBrandGoogle,

    IconBrandTelegram,

    IconX,

    IconCopy,

    IconLoader,

    IconCheck,

    DomainAuthAlert,

    AuthPopup

  },

  setup() {

    const { t } = useI18n();

    const router = useRouter();

    const { showToast } = useToast();

    const { goTo } = useNavigator()

    const loading = ref(false);

    const configLoading = ref(false);

    const codeSent = ref(false);

    const cooldown = ref(0);

    const inviteCodeFromUrl = ref(false);



    const showCaptchaModal = ref(false);

    const captchaModalResponse = ref('');

    const isClosingModal = ref(false);



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

    // OAuth 相关状态
    const showTelegramModal = ref(false);
    const showEmailModal = ref(false);
    const telegramHash = ref('');
    const telegramStatus = ref('');
    const telegramPollInterval = ref(null);
    const emailInput = ref('');
    const emailError = ref('');
    const emailLoading = ref(false);



    const logoPath = ref('./images/logo.png');

    const handleLogoError = () => {

      logoPath.value = '/images/logo.png';

    };




    const config = reactive({

      tos_url: '',

      is_email_verify: 0,

      is_invite_force: 0,

      email_whitelist_suffix: [],

      is_recaptcha: 0,

      recaptcha_site_key: '',

      app_description: '',

      app_url: '',

      telegram_bot_name: '',

      telegram_bot: '',

      bot_name: '',

      telegram_bot_username: ''

    });



    const captchaConfig = reactive({

      type: CAPTCHA_CONFIG.captchaType,

      siteKey: '',

      verifyUrl: CAPTCHA_CONFIG[CAPTCHA_CONFIG.captchaType]?.verifyUrl || ''

    });



    const captchaResponse = ref('');

    const app = getCurrentInstance();



    if (app && app.proxy) {

      window._registerInstance = {

        handleCaptchaResponse: (response) => {

          captchaResponse.value = response;

        },

        handleCaptchaModalResponse: (response) => {



          if (response && typeof response === 'string' && response.trim().length > 0) {

            captchaModalResponse.value = response;



            setTimeout(() => {

              closeCaptchaModal();

              sendVerificationCodeWithCaptcha(response);

            }, 100);

          }

        }

      };

    }



    const emailPrefix = ref('');

    const selectedSuffix = ref('');

    const showSuffixDropdown = ref(false);



    const formData = reactive({

      email: '',

      verificationCode: '',

      password: '',

      confirmPassword: '',

      inviteCode: '',

      agreeTerms: AUTH_CONFIG.autoAgreeTerms

    });



    const errors = reactive({

      email: '',

      verificationCode: '',

      password: '',

      confirmPassword: '',

      inviteCode: '',

      agreeTerms: ''

    });



    const showPassword = ref(false);

    const showConfirmPassword = ref(false);



    const needCaptchaForEmailVerify = computed(() => {

      return config.is_recaptcha === 1;

    });



    const fetchWebsiteConfig = async () => {

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



          if (Array.isArray(config.email_whitelist_suffix) && config.email_whitelist_suffix.length > 0) {

            selectedSuffix.value = config.email_whitelist_suffix[0];

          }



          if (config.is_recaptcha === 1) {

            captchaConfig.siteKey = config.recaptcha_site_key;

          }

        }

      } catch (error) {

        showToast(t('messages.configLoadFailed'), 'error');

      } finally {

        configLoading.value = false;

      }

    };



    const handleClickOutside = (event) => {

      const suffixDropdown = document.querySelector('.email-suffix');

      if (suffixDropdown && !suffixDropdown.contains(event.target)) {

        showSuffixDropdown.value = false;

      }

    };



    const toggleSuffixDropdown = (event) => {

      event.stopPropagation();

      showSuffixDropdown.value = !showSuffixDropdown.value;

    };



    const selectSuffix = (suffix) => {

      selectedSuffix.value = suffix;

      showSuffixDropdown.value = false;

      updateEmail();

    };



    const updateEmail = () => {

      if (emailPrefix.value && selectedSuffix.value) {

        formData.email = `${emailPrefix.value}@${selectedSuffix.value}`;

      } else {

        formData.email = emailPrefix.value;

      }

    };



    const handleEmailPrefixChange = () => {

      updateEmail();

    };



    const showCaptchaModalDialog = () => {

      showCaptchaModal.value = true;

      captchaModalResponse.value = '';



      const renderModalCaptcha = async () => {

        setTimeout(() => {

          if (captchaConfig.type === 'google' && window.grecaptcha) {

            const container = document.getElementById('modal-recaptcha');

            if (container) {

              container.innerHTML = '';



              window.grecaptcha.render('modal-recaptcha', {

                'sitekey': captchaConfig.siteKey,

                'callback': 'onCaptchaModalVerified',

                'theme': document.body.classList.contains('dark-theme') ? 'dark' : 'light'

              });

            }

          } else if (captchaConfig.type === 'cloudflare' && window.turnstile) {

            const container = document.getElementById('modal-turnstile');

            if (container) {

              container.innerHTML = '';



              if (window.turnstile.reset) {

                try {

                  window.turnstile.reset();

                } catch (e) {

                  console.log('无法重置Turnstile验证码，将重新渲染');

                }

              }



              try {

                window.turnstile.render('#modal-turnstile', {

                  'sitekey': captchaConfig.siteKey,

                  'callback': function(token) {

                    if (window._registerInstance) {

                      window._registerInstance.handleCaptchaModalResponse(token);

                    }

                  },

                  'theme': document.body.classList.contains('dark-theme') ? 'dark' : 'light',

                  'retry': 'auto',
                  'retry-interval': 5000,
                  'refresh-expired': 'manual',
                  'tabindex': 0,
                  'execution': 'render'
                });

              } catch (error) {

                console.error('Turnstile渲染错误:', error);



                const scripts = document.getElementsByTagName('script');

                for (let i = scripts.length - 1; i >= 0; i--) {

                  if (scripts[i].src.includes('turnstile')) {

                    scripts[i].parentNode.removeChild(scripts[i]);

                  }

                }



                setTimeout(() => {

                  const script = document.createElement('script');

                  script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=captchaScriptLoaded&render=explicit`;

                  script.async = true;

                  script.defer = true;

                  document.head.appendChild(script);

                }, 500);

              }

            } else {

              console.error('找不到modal-turnstile容器');

            }

          } else {

            console.error('验证码脚本未加载或配置不正确', {

              type: captchaConfig.type,

              hasGoogle: !!window.grecaptcha,

              hasTurnstile: !!window.turnstile

            });

          }

        }, 300);
      };



      renderModalCaptcha();

    };



    const closeCaptchaModal = () => {

      isClosingModal.value = true;



      setTimeout(() => {

        showCaptchaModal.value = false;

        isClosingModal.value = false;

      }, 300);

    };



    const sendVerificationCodeWithCaptcha = async (captchaData) => {

      try {

        loading.value = true;



        const sendData = {

          email: formData.email,

          isForgetPassword: false

        };



        if (captchaData) {

          sendData.recaptcha_data = captchaData;

        }



        const response = await sendEmailVerify(sendData);



        if (response && response.data === true) {

          codeSent.value = true;

          startCooldown();

          showToast(response.message || t('auth.codeSent'), 'success');



          if (AUTH_CONFIG.verificationCode && AUTH_CONFIG.verificationCode.showCheckSpamTip) {

            const delay = AUTH_CONFIG.verificationCode.checkSpamTipDelay || 1000;

            setTimeout(() => {

              showToast(t('auth.checkSpam'), 'info');

            }, delay);

          }

        } else {

          throw new Error(response.message || t('auth.sendCodeFailed'));

        }

      } catch (error) {

        showToast(error.response?.message || error.message || t('auth.sendCodeFailed'), 'error');

      } finally {

        loading.value = false;

      }

    };



    const sendVerificationCode = async () => {

      errors.email = '';



      if (!formData.email) {

        errors.email = t('auth.emailRequired');

        return;

      }



      if (!isValidEmail(formData.email)) {

        errors.email = t('auth.emailInvalid');

        return;

      }



      if (config.is_recaptcha === 1 && captchaConfig.siteKey) {

        showCaptchaModalDialog();

      } else {

        sendVerificationCodeWithCaptcha();

      }

    };



    const startCooldown = () => {

      cooldown.value = 60;

      const timer = setInterval(() => {

        cooldown.value--;

        if (cooldown.value <= 0) {

          clearInterval(timer);

        }

      }, 1000);

    };



    const validateForm = () => {

      let isValid = true;



      errors.email = '';

      errors.verificationCode = '';

      errors.password = '';

      errors.confirmPassword = '';

      errors.inviteCode = '';

      errors.agreeTerms = '';



      if (config.is_email_verify !== 1) {

        formData.verificationCode = '';

      }



      if (!formData.email) {

        errors.email = t('auth.emailRequired');

        isValid = false;

      } else if (!isValidEmail(formData.email)) {

        errors.email = t('auth.emailInvalid');

        isValid = false;

      }



      if (config.is_email_verify === 1) {

        if (!formData.verificationCode) {

          errors.verificationCode = t('auth.codeRequired');

          isValid = false;

        }

      }



      if (!formData.password) {

        errors.password = t('auth.passwordRequired');

        isValid = false;

      } else if (formData.password.length < 8) {

        errors.password = t('auth.passwordTooShort');

        isValid = false;

      }



      if (!formData.confirmPassword) {

        errors.confirmPassword = t('auth.confirmPasswordRequired');

        isValid = false;

      } else if (formData.password !== formData.confirmPassword) {

        errors.confirmPassword = t('auth.passwordsDoNotMatch');

        isValid = false;

      }



      if (config.is_invite_force === 1 && !formData.inviteCode) {

        errors.inviteCode = t('auth.inviteCodeRequired');

        isValid = false;

      }



      if (!formData.agreeTerms) {

        errors.agreeTerms = t('auth.mustAgreeToTerms');

        isValid = false;

      }



      if (config.is_recaptcha === 1) {

        const formCaptchaElement = document.querySelector('[name="g-recaptcha-response"]') ||

                                 document.querySelector('[name="cf-turnstile-response"]');



        const isCaptchaVerified = !!formCaptchaElement?.value || !!captchaResponse.value;



        if (!isCaptchaVerified) {

          showToast(t('auth.captchaRequired'), 'error');

          isValid = false;

        }

      }



      return isValid;

    };



    const handleRegister = async () => {

      if (!validateForm()) return;



      try {

        loading.value = true;



        const registerData = {

          email: formData.email,

          password: formData.password

        };



        if (config.is_email_verify === 1) {

          registerData.email_code = parseInt(formData.verificationCode);

        }



        if (formData.inviteCode) {

          registerData.invite_code = formData.inviteCode;

        }



        if (config.is_recaptcha === 1) {

          const formCaptchaElement = document.querySelector('[name="g-recaptcha-response"]') ||

                                   document.querySelector('[name="cf-turnstile-response"]');



          if (formCaptchaElement && formCaptchaElement.value) {

            registerData.recaptcha_data = formCaptchaElement.value;

          } else if (captchaResponse.value) {

            registerData.recaptcha_data = captchaResponse.value;

          }

        }



        const response = await register(registerData);



        showToast(response.message || t('auth.registerSuccess'), 'success');



        setTimeout(() => {

          router.push('/dashboard');

        }, 300);

      } catch (error) {

        showToast(error.response?.message || error.message || t('auth.registerFailed'), 'error');

        if (window.grecaptcha) {

          window.grecaptcha.reset();

        }

      } finally {

        loading.value = false;

      }

    };



    onMounted(() => {
      // 首先处理OAuth回调，优先级最高
      handleOAuthCallback();




      const urlParams = new URLSearchParams(window.location.search);

      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));



      if (urlParams.has('logout') === true || hashParams.has('logout') === true) {

        showToast(t('auth.logoutSuccess'), 'success');



        if (window.history && window.history.replaceState) {

          const newUrl = window.location.href.replace('?logout=true', '').replace('&logout=true', '');

          window.history.replaceState({}, document.title, newUrl);

        }



        fetchWebsiteConfig();

        document.addEventListener('click', handleClickOutside);

        return;

      }



      try {

        if (window._isLoggingOut === true) {

          fetchWebsiteConfig();

          document.addEventListener('click', handleClickOutside);

          return;

        }



        const loginStatus = checkLoginStatus();



        if (loginStatus) {

          showToast(t('auth.alreadyLoggedIn'), 'info');

          setTimeout(() => {

            router.push('/dashboard');

          }, 500);

          return;

        }



        if (urlParams.has('code')) {

          formData.inviteCode = urlParams.get('code');

          inviteCodeFromUrl.value = true;

        } else if (hashParams.has('code')) {

          formData.inviteCode = hashParams.get('code');

          inviteCodeFromUrl.value = true;

        } else {

          const fullUrl = window.location.href;

          const codeMatch = fullUrl.match(/[?&]code=([^&]+)/);

          if (codeMatch && codeMatch[1]) {

            formData.inviteCode = codeMatch[1];

            inviteCodeFromUrl.value = true;

          }

        }

      } catch (error) {

      }



      fetchWebsiteConfig().then(() => {

        if (config.is_recaptcha === 1) {

          loadCaptchaScript();

        }



        showAuthPopup.value = shouldShowAuthPopup(AUTH_CONFIG.popup);

      });



      document.addEventListener('click', handleClickOutside);



      window.addEventListener('focus', () => {

        if (config.is_recaptcha === 1) {

          setTimeout(() => {

            renderFormCaptcha();

          }, 300);

        }

      });

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
        
        // 等待localStorage写入完成
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 重新加载语言文件（登录后需要加载完整的语言文件）
        try {
          const { reloadMessages } = await import('@/i18n');
          await reloadMessages();
          
          // 等待语言变化事件处理完成
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.warn('重新加载语言文件失败:', error);
        }
        
        // 立即跳转，语言文件会在后台加载
        router.push('/dashboard');
        showToast(t('auth.registerSuccess'), 'success');
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
          
          // 等待localStorage写入完成
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // 重新加载语言文件（登录后需要加载完整的语言文件）
          try {
            const { reloadMessages } = await import('@/i18n');
            await reloadMessages();
            
            // 等待语言变化事件处理完成
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.warn('重新加载语言文件失败:', error);
          }
          
          // 立即跳转，语言文件会在后台加载
          router.push('/dashboard');
          showToast(t('auth.registerSuccess'), 'success');
        }
      }
      
      // 处理OAuth失败
      if (urlParams.get('error') === 'oauth_failed') {
        showToast(t('auth.googleRegisterFailed'), 'error');
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

    onActivated(() => {

      if (config.is_recaptcha === 1 && captchaConfig.type === 'cloudflare' && captchaConfig.siteKey) {

        console.log('注册组件激活，重新加载Cloudflare Turnstile验证组件');

        loadCaptchaScript().then(() => {

          if (window.turnstile && window.turnstile.reset) {

            try {

              window.turnstile.reset();



              const formContainer = document.getElementById('form-turnstile');

              if (formContainer && window.turnstile.render) {

                formContainer.innerHTML = '';



                window.turnstile.render('#form-turnstile', {

                  'sitekey': captchaConfig.siteKey,

                  'callback': function(token) {

                    if (window._registerInstance) {

                      window._registerInstance.handleCaptchaResponse(token);

                    }

                  },

                  'theme': document.body.classList.contains('dark-theme') ? 'dark' : 'light',

                  'retry': 'auto',
                  'retry-interval': 5000,
                  'refresh-expired': 'manual',
                  'tabindex': 0,
                  'execution': 'render'
                });

              }

            } catch (e) {

              console.log('Turnstile重置失败，将重新渲染验证码组件', e);

              const scripts = document.getElementsByTagName('script');

              for (let i = scripts.length - 1; i >= 0; i--) {

                if (scripts[i].src.includes('turnstile')) {

                  scripts[i].parentNode.removeChild(scripts[i]);

                }

              }



              setTimeout(() => {

                const script = document.createElement('script');

                script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=captchaScriptLoaded&render=explicit`;

                script.async = true;

                script.defer = true;

                document.head.appendChild(script);

              }, 500);

            }

          }

        });

      }

    });



    onBeforeUnmount(() => {

      document.removeEventListener('click', handleClickOutside);



      isGoogleRecaptchaRendered = false;



      if (window.turnstile && window.turnstile.reset) {

        try {

          window.turnstile.reset();

        } catch (e) {

          console.log('Turnstile重置失败', e);

        }

      }



      const formTurnstileContainer = document.getElementById('form-turnstile');

      if (formTurnstileContainer) {

        formTurnstileContainer.innerHTML = '';

      }



      const modalTurnstileContainer = document.getElementById('modal-turnstile');

      if (modalTurnstileContainer) {

        modalTurnstileContainer.innerHTML = '';

      }



      captchaResponse.value = '';

      captchaModalResponse.value = '';



      window.captchaScriptLoaded = undefined;

      window.onCaptchaVerified = undefined;

      window.onCaptchaModalVerified = undefined;



      window._registerInstance = null;

    });



    const handleCaptchaResponse = (response) => {

      captchaResponse.value = response;

    };



    const handleCaptchaModalResponse = (response) => {



      if (response && typeof response === 'string' && response.trim().length > 0) {

        captchaModalResponse.value = response;



        setTimeout(() => {

          closeCaptchaModal();

          sendVerificationCodeWithCaptcha(response);

        }, 100);

      }

    };



    const renderFormCaptcha = () => {

      if (config.is_recaptcha !== 1 || !captchaConfig.siteKey) {

        return;

      }



      setTimeout(() => {

        if (captchaConfig.type === 'google' && window.grecaptcha) {

          const container = document.getElementById('form-recaptcha');

          if (container && !isGoogleRecaptchaRendered) {

            container.innerHTML = '';



            try {

              window.grecaptcha.render('form-recaptcha', {

                'sitekey': captchaConfig.siteKey,

                'callback': function(token) {

                  if (window._registerInstance) {

                    window._registerInstance.handleCaptchaResponse(token);

                  }

                },

                'theme': document.body.classList.contains('dark-theme') ? 'dark' : 'light'

              });

              isGoogleRecaptchaRendered = true;

            } catch (error) {

              console.error('Google reCAPTCHA渲染错误:', error);

              if (error.toString().includes('has already been rendered')) {

                isGoogleRecaptchaRendered = true;

              } else {

                isGoogleRecaptchaRendered = false;

              }

            }

          }

        } else if (captchaConfig.type === 'cloudflare' && window.turnstile) {

          const container = document.getElementById('form-turnstile');

          if (container) {

            container.innerHTML = '';



            try {

              window.turnstile.render('#form-turnstile', {

                'sitekey': captchaConfig.siteKey,

                'callback': function(token) {

                  if (window._registerInstance) {

                    window._registerInstance.handleCaptchaResponse(token);

                  }

                },

                'theme': document.body.classList.contains('dark-theme') ? 'dark' : 'light',

                'retry': 'auto',
                'retry-interval': 5000,
                'refresh-expired': 'manual',
                'tabindex': 0,
                'execution': 'render'
              });

            } catch (error) {

              console.error('表单验证码渲染错误:', error);

            }

          }

        }

      }, 500);
    };



    const loadCaptchaScript = () => {

      return new Promise((resolve) => {

        if (config.is_recaptcha !== 1 || !config.recaptcha_site_key) {

          resolve();

          return;

        }



        if (window.turnstile && captchaConfig.type === 'cloudflare') {

          console.log('Turnstile已存在，尝试重置而不是重新加载脚本');



          try {

            if (window.turnstile.reset) {

              window.turnstile.reset();

            }



            const formContainer = document.getElementById('form-turnstile');

            if (formContainer) {

              formContainer.innerHTML = '';



              setTimeout(() => {

                window.turnstile.render('#form-turnstile', {

                  'sitekey': captchaConfig.siteKey,

                  'callback': 'onCaptchaVerified',

                  'theme': document.body.classList.contains('dark-theme') ? 'dark' : 'light',

                  'refresh-expired': 'auto'

                });



                resolve();

              }, 100);

              return;

            }

          } catch (e) {

            console.error('重置Turnstile失败，将尝试重新加载脚本', e);

          }

        }



        const cleanupExistingCaptcha = () => {

          const recaptchaContainer = document.getElementById('form-recaptcha');

          if (recaptchaContainer) {

            recaptchaContainer.innerHTML = '';

          }



          const turnstileContainer = document.getElementById('form-turnstile');

          if (turnstileContainer) {

            turnstileContainer.innerHTML = '';

          }



          const modalRecaptchaContainer = document.getElementById('modal-recaptcha');

          if (modalRecaptchaContainer) {

            modalRecaptchaContainer.innerHTML = '';

          }



          const modalTurnstileContainer = document.getElementById('modal-turnstile');

          if (modalTurnstileContainer) {

            modalTurnstileContainer.innerHTML = '';

          }

        };



        cleanupExistingCaptcha();



        if (!window.turnstile || captchaConfig.type !== 'cloudflare') {

          const script = document.createElement('script');



          if (captchaConfig.type === 'google') {

            const googleVerifyUrl = 'https://www.recaptcha.net';

            script.src = `${googleVerifyUrl}/recaptcha/api.js?onload=captchaScriptLoaded&render=explicit`;

          } else if (captchaConfig.type === 'cloudflare') {

            script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=captchaScriptLoaded&render=explicit`;

          }



          script.async = true;

          script.defer = true;



          window.captchaScriptLoaded = () => {

            console.log('验证码脚本加载完成');

            renderFormCaptcha();

            setTimeout(() => {

              resolve();

            }, 100);

          };



          document.head.appendChild(script);

        } else {

          renderFormCaptcha();

          resolve();

        }

      });

    };

    // Google 注册
    const handleGoogleRegister = async () => {
      try {
        const inviteCode = router.currentRoute.value.query.invite_code || '';
        const redirectUrl = window.location.origin + '/#/register';
        
        // 1. 获取Google授权URL
        const response = await getGoogleAuthUrl(inviteCode, redirectUrl);
        
        if (response && response.data && response.data.url) {
          // 2. 直接跳转到Google授权页面
          window.location.href = response.data.url;
        } else {
          throw new Error('获取Google授权URL失败');
        }
      } catch (error) {
        console.error('Google注册失败:', error);
        showToast(error.message || t('auth.googleRegisterFailed'), 'error');
      }
    };

    // Telegram 注册
    const handleTelegramRegister = async () => {
      try {
        const response = await getTelegramAuthHash();
        
        if (response && response.data && response.data.hash) {
          telegramHash.value = response.data.hash;
          showTelegramModal.value = true;
          startTelegramPolling(response.data.hash);
        }
      } catch (error) {
        showToast(error.message || t('auth.telegramRegisterFailed'), 'error');
      }
    };

    // 开始轮询 Telegram 注册状态
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
            showToast(response.error || t('auth.telegramRegisterError'), 'error');
          }
        } catch (error) {
          console.error('检查Telegram注册状态失败:', error);
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

      codeSent,

      cooldown,

      sendVerificationCode,

      handleRegister,

      isValidEmail,

      showPassword,

      showConfirmPassword,

      config,

      emailPrefix,

      selectedSuffix,

      showSuffixDropdown,

      toggleSuffixDropdown,

      selectSuffix,

      handleEmailPrefixChange,

      inviteCodeFromUrl,



      logoPath,

      handleLogoError,

      captchaConfig,

      handleCaptchaResponse,

      showCaptchaModal,

      closeCaptchaModal,

      handleCaptchaModalResponse,

      needCaptchaForEmailVerify,

      isClosingModal,

      renderFormCaptcha,

      showAuthPopup,

      authPopupConfig,

      handleAuthPopupClose,

      goTo,

      // OAuth 相关
      handleGoogleRegister,
      handleTelegramRegister,
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



.loading-container {

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  min-height: 300px;



  .loading-spinner {

    width: 30px;

    height: 30px;

    border: 3px solid rgba(var(--theme-color-rgb), 0.2);

    border-radius: 50%;

    border-top-color: var(--theme-color);

    animation: spin 1s linear infinite;

    margin-bottom: 1rem;

  }

}



@keyframes spin {

  from { transform: rotate(0deg); }

  to { transform: rotate(360deg); }

}



.required {

  color: var(--error-color, #ff4d4f);

  margin-left: 4px;

  font-size: 16px;

  vertical-align: middle;

}



.optional {

  color: var(--text-muted, #999);

  margin-left: 4px;

  font-size: 12px;

  font-weight: normal;

  vertical-align: baseline;

}



.input-with-suffix {

  display: flex;

  align-items: stretch;

  width: 100%;

  border-radius: 8px;

  background-color: var(--input-bg-color, #f9f9f9);

  border: 1px solid var(--input-border-color, transparent);

  transition: all 0.3s ease;

  position: relative;



  &:hover {

    background-color: var(--input-hover-bg-color, #f5f5f5);

  }



  &:focus-within {

    border-color: var(--theme-color);

    box-shadow: 0 0 0 2px rgba(var(--theme-color-rgb), 0.2);

    background-color: var(--input-focus-bg-color, #fff);

  }



  .email-prefix {

    flex: 1;

    margin: 0;



    .form-control {

      border: none;

      border-radius: 8px 0 0 8px;

      height: 45px;

      font-size: 14px;

      letter-spacing: 0.2px;

      background-color: transparent;



      &:focus {

        box-shadow: none;

      }

    }

  }



  .email-suffix-separator {

    display: flex;

    align-items: center;

    justify-content: center;

    padding: 0 4px;

    color: var(--secondary-text-color);

    font-size: 14px;

    background-color: transparent;

    opacity: 0.8;

  }



  .email-suffix {

    position: relative;

    display: flex;

    align-items: center;

    padding: 0 12px;

    min-width: 130px;

    cursor: pointer;

    border-left: 1px solid var(--input-border-color, rgba(0, 0, 0, 0.08));

    background-color: transparent;

    transition: all 0.3s ease;

    border-radius: 0 8px 8px 0;



    &.disabled {

      opacity: 0.7;

      cursor: not-allowed;

    }



    &:hover:not(.disabled) {

      background-color: var(--input-hover-bg-color, #f5f5f5);

    }



    .suffix-text {

      flex: 1;

      white-space: nowrap;

      overflow: hidden;

      text-overflow: ellipsis;

      color: var(--primary-text-color);

      font-size: 14px;

      padding: 0 4px;

      font-weight: 500;

    }



    .suffix-icon {

      width: 16px;

      height: 16px;

      margin-left: 8px;

      transition: transform 0.3s ease;

      color: var(--secondary-text-color);

      opacity: 0.8;



      &.rotate-180 {

        transform: rotate(180deg);

      }

    }



    .suffix-dropdown {

      position: absolute;

      top: calc(100% + 8px);

      left: -1px;

      right: -1px;

      background-color: var(--card-background);

      border-radius: 8px;

      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      z-index: 100;

      max-height: 240px;

      overflow-y: auto;

      animation: dropdownFadeIn 0.2s ease;

      border: 1px solid var(--input-border-color, rgba(0, 0, 0, 0.08));

      min-width: 160px;



      &::-webkit-scrollbar {

        width: 6px;

        height: 6px;

      }



      &::-webkit-scrollbar-track {

        background: transparent;

        border-radius: 3px;

      }



      &::-webkit-scrollbar-thumb {

        background-color: var(--scrollbar-thumb-color, rgba(0, 0, 0, 0.2));

        border-radius: 3px;



        &:hover {

          background-color: var(--scrollbar-thumb-hover-color, rgba(0, 0, 0, 0.3));

        }

      }



      .suffix-option {

        padding: 10px 16px;

        cursor: pointer;

        transition: all 0.2s;

        color: var(--primary-text-color);

        font-size: 14px;

        display: flex;

        align-items: center;



        &:hover, &.active {

          background-color: rgba(var(--theme-color-rgb), 0.1);

          color: var(--theme-color);

        }



        &:first-child {

          border-top-left-radius: 8px;

          border-top-right-radius: 8px;

        }



        &:last-child {

          border-bottom-left-radius: 8px;

          border-bottom-right-radius: 8px;

        }

      }

    }

  }

}



@keyframes dropdownFadeIn {

  from {

    opacity: 0;

    transform: translateY(-10px);

  }

  to {

    opacity: 1;

    transform: translateY(0);

  }

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

      box-shadow: 0 0 0 2px rgba(var(--theme-color-rgb), 0.2);

      background-color: var(--input-focus-bg-color, #fff);

    }



    &::placeholder {

      color: var(--placeholder-color, #aaa);

    }

  }

}



.input-with-button {

  display: flex;

  align-items: stretch;

  height: 45px;

  width: 100%;



  .verification-input {

    flex: 1;



    .form-control {

      border-top-right-radius: 0;

      border-bottom-right-radius: 0;

      height: 100%;

    }

  }



  .send-code-btn {

    border-top-left-radius: 0;

    border-bottom-left-radius: 0;

    border-top-right-radius: 8px;

    border-bottom-right-radius: 8px;

    padding: 0 15px;

    min-width: 100px;

    white-space: nowrap;

    font-size: 0.875rem;

    border: none;

    background-color: var(--theme-color);

    color: white;

    margin: 0;

    height: 100%;

    display: flex;

    align-items: center;

    justify-content: center;

    cursor: pointer;

    transition: background-color 0.3s, opacity 0.3s, transform 0.3s;



    &:hover:not(:disabled) {

      background-color: var(--primary-color-hover);

    }



    &:disabled {

      opacity: 0.6;

      cursor: not-allowed;

      transform: translateY(0);

    }



    &:not(:disabled) {

      transform: translateY(0);

      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);



      &:hover {

        transform: translateY(-2px);

        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);

      }

    }



    .icon-left {

      margin-right: 5px;

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



  &.btn-secondary {

    position: relative;

    overflow: hidden;



    &.btn-block {

      transition: all 0.3s ease;



      &:hover {

        color: var(--theme-color) !important;

        border-color: var(--theme-color) !important;

        background-color: rgba(var(--theme-color-rgb), 0.05) !important;

        -webkit-text-fill-color: var(--theme-color) !important;

        background-image: none !important;

      }

    }

  }

}



.agreement-checkbox {

  margin-top: 1.5rem;



  .checkbox-container {

    display: flex;

    align-items: flex-start;

    position: relative;

    padding-left: 30px;

    cursor: pointer;

    font-size: 0.9rem;

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

      line-height: 1.5;



      a {

        position: relative;

        color: var(--theme-color);

        text-decoration: none;

        background: linear-gradient(90deg, var(--theme-color) 0%, var(--theme-hover-color, #4bc8a2) 100%);

        background-size: 200% 100%;

        -webkit-background-clip: text;

        background-clip: text;

        -webkit-text-fill-color: transparent;

        transition: all 0.3s ease-in-out;



        &:hover {

          background-position: 100% 0;

        }

      }

    }

  }

}



.error-message {

  display: block;

  color: var(--error-color, #ff4d4f);

  font-size: 0.8rem;

  margin-top: 0.3rem;

}





@media (max-width: 576px) {

  .auth-card {

    padding: 1.5rem;

  }



  .auth-header {

    margin-bottom: 1.5rem;



    .auth-logo img {

      height: 50px;

    }



    .auth-title {

      font-size: 1.5rem;

    }

  }



  .input-with-button {

    flex-direction: row;

    height: 45px;

    gap: 0;



    .verification-input .form-control {

      border-top-right-radius: 0;

      border-bottom-right-radius: 0;

    }



    .send-code-btn {

      width: auto;

      min-width: 100px;

      border-top-left-radius: 0;

      border-bottom-left-radius: 0;

      border-top-right-radius: 8px;

      border-bottom-right-radius: 8px;

      height: 100%;

    }

  }

}





@media (min-width: 576px) and (max-width: 992px) {

  .auth-container {

    padding: 2rem;

  }

}





.dark-theme {

  .loading-container .loading-spinner {

    color: var(--theme-color);

  }



  .input-with-suffix {

    background-color: var(--input-bg-color, #333);

    border-color: var(--input-border-color, #444);



    &:hover {

      background-color: var(--input-hover-bg-color, #383838);

    }



    &:focus-within {

      border-color: var(--theme-color);

      background-color: var(--input-focus-bg-color, #3a3a3a);

    }



    .email-suffix {

      border-left-color: var(--input-border-color, #444);



      &:hover:not(.disabled) {

        background-color: var(--input-hover-bg-color, #383838);

      }



      .suffix-dropdown {

        background-color: var(--card-background);

        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

        border-color: var(--input-border-color, #444);



        &:before {

          background-color: var(--card-background);

          border-color: var(--input-border-color, #444);

        }



        .suffix-option {

          &:hover {

            background-color: rgba(var(--theme-color-rgb), 0.15);

          }

        }

      }

    }

  }



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



  .input-with-button {

    .send-code-btn {

      background-color: var(--theme-color);



      &:hover:not(:disabled) {

        background-color: var(--primary-color-hover);

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



  .btn-primary {

    background-color: var(--theme-color);



    &:hover:not(:disabled) {

      background-color: var(--primary-color-hover);

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

  color: var(--text-color) !important;

  border: 1px solid var(--border-color) !important;

  background-color: transparent !important;

  transition: all 0.3s ease !important;



  &:hover {

    border-color: var(--theme-color) !important;

    background-color: rgba(var(--theme-color-rgb), 0.05) !important;

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



.auth-card {

  opacity: 0;

  animation: fadeIn 0.3s ease forwards;

}



@keyframes fadeIn {

  from {

    opacity: 0;

  }

  to {

    opacity: 1;

  }

}



@keyframes gradient-shift {

  0% {

    background-position: 0% 50%;

  }

  50% {

    background-position: 100% 50%;

  }

  100% {

    background-position: 0% 50%;

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



.captcha-container {

  display: flex;

  justify-content: center;

  margin: 10px 0;



  .google-captcha,

  .cloudflare-captcha {

    display: flex;

    justify-content: center;

    margin: 10px 0;

    min-height: 78px;



    #form-recaptcha,

    #form-turnstile {

      display: inline-block;

      min-width: 302px;

      min-height: 78px;

    }

  }

}





.captcha-modal {

  position: fixed;

  top: 0;

  left: 0;

  right: 0;

  bottom: 0;

  z-index: 1000;

  display: flex;

  align-items: center;

  justify-content: center;

  opacity: 1;

  transition: opacity 0.3s ease;



  &.closing {

    opacity: 0;

  }



  .captcha-modal-overlay {

    position: absolute;

    top: 0;

    left: 0;

    right: 0;

    bottom: 0;

    background-color: rgba(0, 0, 0, 0.5);

    backdrop-filter: blur(3px);

  }



  .captcha-modal-content {

    position: relative;

    width: 100%;

    max-width: 420px;

    background-color: var(--card-background);

    border-radius: 12px;

    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);

    z-index: 1001;

    overflow: hidden;

    animation: modalFadeIn 0.3s ease;

    transform: translateY(0);

    transition: transform 0.3s ease, opacity 0.3s ease;

    opacity: 1;



    &.closing {

      transform: translateY(-20px);

      opacity: 0;

    }



    .captcha-modal-header {

      display: flex;

      align-items: center;

      justify-content: space-between;

      padding: 16px 20px;

      border-bottom: 1px solid var(--border-color);



      h3 {

        margin: 0;

        font-size: 18px;

        font-weight: 600;

        color: var(--primary-text-color);

      }



      .close-btn {

        background: none;

        border: none;

        cursor: pointer;

        font-size: 24px;

        line-height: 1;

        color: var(--secondary-text-color);

        padding: 0;

        width: 24px;

        height: 24px;

        display: flex;

        align-items: center;

        justify-content: center;

        transition: color 0.2s;



        &:hover {

          color: var(--primary-text-color);

        }

      }

    }



    .captcha-modal-body {

      padding: 20px;



      p {

        margin-top: 0;

        margin-bottom: 16px;

        color: var(--secondary-text-color);

      }



      .google-captcha,

      .cloudflare-captcha {

        display: flex;

        justify-content: center;

        margin: 15px 0;

        min-height: 78px;



        #modal-recaptcha,

        #modal-turnstile {

          display: inline-block;

          min-width: 302px;

          min-height: 78px;

        }

      }

    }

  }

}



@keyframes modalFadeIn {

  from {

    opacity: 0;

    transform: translateY(-20px);

  }

  to {

    opacity: 1;

    transform: translateY(0);

  }

}

// OAuth 注册样式
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
