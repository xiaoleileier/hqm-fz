<script setup lang="js">
import { IconCopy, IconX, IconBrandTelegram } from "@tabler/icons-vue";
import {ref, watch} from "vue";
import { useRouter } from "vue-router";
import { getTelegramCode, checkTelegram } from "@/api/auth";
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useToast } from "@/composables/useToast";

const props = defineProps({
  config: {
    telegram_bot_name: ''
  }
})

const { showToast } = useToast();
const router = useRouter();

const showModal = ref(false);
const code = ref('');
const loading = ref(false);
const expires = ref(0);
let timer = null
let checkTimer = null

const startCountDown = () => {
  timer = setInterval(() => {
    expires.value--;
  }, 1000)
}

const check = () => {
  checkTimer = setInterval(async ()=> {
    try {
      const res = await checkTelegram({code: code.value});
      console.log(res);
      const { status, data } = res;
      if(status === 'success') {
        clearInterval(checkTimer);
        const { auth_data, is_admin, token } = data;
        localStorage.setItem('token', token)
        localStorage.setItem('is_admin', is_admin)
        localStorage.setItem('auth_data', auth_data)

        setTimeout(() => {
          localStorage.setItem('oauth_login_success', Date.now()) // 触发事件
          showModal.value = false;
          // 设置重定向标记，然后重新加载页面
          localStorage.setItem('oauth_redirect_to_profile', 'true');
          window.location.reload();
        }, 500)
      }
    } catch (error) {
      console.log(error)
    }
  }, 1000)

}

const getCode = async () => {
  clearInterval(timer)
  clearTimeout(checkTimer)
  loading.value = true;
  try {
    const res = await getTelegramCode();
    const { hash, expires_in } = res.data;
    code.value = hash;
    expires.value = expires_in;
    startCountDown()
    check();
  } catch (error) {
    console.log(error)
  } finally {
    loading.value = false;
  }
}

const copy = () => {
  navigator.clipboard.writeText(`/login ${ code.value }`)
      .then(() => {
        showToast('复制成功', 'success', 3000);
      })
      .catch(() => {
        showToast('复制失败', 'error', 3000);
      });
}

const openModal = () => {
  getCode()
  showModal.value = true;
}

const closeModal = () => {
  clearInterval(timer)
  clearTimeout(checkTimer)
  showModal.value = false;
}

const showHelp = () => {
  showToast('如果遇到问题，请确保：\n1. 已安装 Telegram 应用\n2. 网络连接正常\n3. 命令未过期', 'info');
}

watch(() => showModal.value, (newVal) => {
  if (!newVal) {
    clearInterval(timer)
    clearTimeout(checkTimer)
  }
}, { immediate: true, deep: true });

defineExpose({ openModal })
</script>

<template>
  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <!-- Header -->
        <div class="modal-header">
          <div class="header-content">
            <div class="telegram-icon">
              <IconBrandTelegram :size="24" />
            </div>
            <div class="header-text">
              <h3>Telegram 登录</h3>
            </div>
          </div>
          <button class="close-btn" @click="closeModal">
            <IconX :size="18" />
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <div class="message-loading" v-if="loading">
            <LoadingSpinner />
            <p>正在生成登录命令...</p>
          </div>

          <div v-else class="login-content">
            <!-- Step 1: Copy Command -->
            <div class="step-section">
              <div class="step-header">
                <span class="step-number">1</span>
                <span class="step-title">复制登录命令</span>
              </div>
              <div class="command-container">
                <div class="command-text">/login {{ code }}</div>
                <button class="copy-btn" @click="copy" :disabled="expires <= 0">
                  <IconCopy :size="16" />
                </button>
              </div>
              <div class="expires-info">
                <span class="expires-icon">⏰</span>
                <span class="expires-text">{{expires}}秒后过期</span>
              </div>
            </div>

            <!-- Step 2: Send to Bot -->
            <div class="step-section">
              <div class="step-header">
                <span class="step-number">2</span>
                <span class="step-title">发送给机器人</span>
              </div>
              <a :href="`https://t.me/${props.config?.telegram_bot_name || 'bot'}`" target="_blank" class="bot-link">
                <div class="bot-info">
                  <IconBrandTelegram :size="20" />
                  <span class="bot-name">@{{ props.config?.telegram_bot_name || 'bot' }}</span>
                  <span class="external-icon">↗</span>
                </div>
              </a>
            </div>

            <!-- Step 3: Wait for Verification -->
            <div class="step-section">
              <div class="step-header">
                <span class="step-number">3</span>
                <span class="step-title">等待验证</span>
              </div>
              <div class="waiting-container">
                <div class="pulse-dot"></div>
                <span>正在验证中...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModal">
            取消
          </button>
          <button class="help-btn" @click="showHelp">
            帮助
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
  padding: 1rem;
}

.modal-content {
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  background-color: var(--card-background);
  border-radius: 12px;
  overflow: hidden;
  animation: slideIn 0.3s ease;
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-color);
  flex-shrink: 0;

  .header-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .telegram-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #0088cc 0%, #00a8ff 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .header-text {
      h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-color);
      }
    }
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--bg-secondary);
      color: var(--text-color);
    }
  }
}

.modal-body {
  padding: 1.25rem;
  background-color: var(--bg-color);
  color: var(--text-color);
  flex: 1;
  overflow-y: auto;

  .login-content {
    .step-section {
      margin-bottom: 1.5rem;

      &:last-child {
        margin-bottom: 0;
      }

      .step-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;

        .step-number {
          width: 24px;
          height: 24px;
          background: var(--theme-color);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .step-title {
          font-weight: 600;
          color: var(--text-color);
          font-size: 0.95rem;
        }
      }

      .command-container {
        display: flex;
        align-items: center;
        background: var(--card-background);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 0.75rem;
        gap: 0.75rem;
        margin-bottom: 0.5rem;

        .command-text {
          flex: 1;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9rem;
          color: var(--text-color);
          background: none;
          border: none;
          padding: 0;
        }

        .copy-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: var(--theme-color);
          color: white;
          border: none;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover:not(:disabled) {
            background: rgba(var(--theme-color-rgb), 0.9);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }

      .expires-info {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 0.75rem;
        padding: 0.5rem;
        background: rgba(var(--theme-color-rgb), 0.05);
        border: 1px solid rgba(var(--theme-color-rgb), 0.15);
        border-radius: 6px;
        
        .expires-icon {
          font-size: 0.9rem;
          opacity: 0.8;
        }
        
        .expires-text {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
        }
      }

      .bot-link {
        text-decoration: none;
        color: inherit;

        .bot-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--card-background);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          transition: all 0.2s ease;

          &:hover {
            border-color: #0088cc;
            background: rgba(0, 136, 204, 0.05);
          }

          .bot-name {
            flex: 1;
            font-weight: 600;
            color: #0088cc;
            font-size: 0.9rem;
          }

          .external-icon {
            color: var(--text-muted);
            font-size: 1rem;
          }
        }
      }

      .waiting-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: rgba(var(--theme-color-rgb), 0.05);
        border: 1px solid rgba(var(--theme-color-rgb), 0.2);
        border-radius: 8px;

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: var(--theme-color);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        span {
          color: var(--text-muted);
          font-size: 0.85rem;
        }
      }
    }
  }
}

.modal-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-color);
  flex-shrink: 0;

  button {
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;

    &.cancel-btn {
      background-color: var(--card-background);
      border: 1px solid var(--border-color);
      color: var(--text-color);

      &:hover {
        background-color: var(--bg-secondary);
      }
    }

    &.help-btn {
      background: #0088cc;
      color: white;

      &:hover {
        background: #0077bb;
      }
    }
  }
}

.message-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  height: 200px;

  p {
    font-size: 0.9rem;
    text-align: center;
    margin-top: 0.75rem;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>