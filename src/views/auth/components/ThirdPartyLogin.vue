<script setup>
import IconBrandGoogle from '@/components/icons/IconBrandGoogle.vue'
import IconBrandTelegram from '@/components/icons/IconBrandTelegram.vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { oauth } from "@/api/auth";
import TelegramModal from "./TelegramModal.vue";
import { ref } from "vue";

const props = defineProps({
  config: {
    telegram_bot_name: ''
  }
})

const route = useRoute()
const { t } = useI18n()
const telegramModalRef = ref(null)

const socialLoginPopup = (url) => {
  window.open(url, 'oauth', 'width=600,height=700')
}

const socialLogin = async (type) => {
  if(type == "google") {
    try {
      const { code } = route.query;
      const params = {
        type,
        code: code ? code : '',
        redirect: `${window.location.origin}/verify.html`,
      }
      const res = await oauth(params)

      const url = (res.data && res.data.url) || (typeof res.data === 'string' ? res.data : null)
      if (!url) throw new Error('后端未返回授权 URL')

      socialLoginPopup(url)
      console.log('打开授权页面：', url)
    } catch (err) {
      console.error('登录失败:', err)
    }
  } else if (type == "telegram") {
    // 弹窗
    telegramModalRef.value?.openModal()
  }

}
</script>

<template>
  <div class="oauth-section">
    <div class="oauth-buttons">
      <button 
        class="oauth-btn google-btn" 
        @click="socialLogin('google')"
        :disabled="false"
      >
        <IconBrandGoogle :size="20" />
        {{ t('auth.loginWithGoogle') }}
      </button>
      
      <button 
        class="oauth-btn telegram-btn" 
        @click="socialLogin('telegram')"
        :disabled="false"
      >
        <IconBrandTelegram :size="20" />
        {{ t('auth.loginWithTelegram') }}
      </button>
    </div>
  </div>
  <TelegramModal ref="telegramModalRef" :config="props.config" />
</template>

<style scoped lang="scss">
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
</style>
