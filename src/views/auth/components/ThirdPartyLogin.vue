<script setup>
import IconGoogle from '@/components/icons/IconGoogle.vue'
import IconTelegram from '@/components/icons/IconTelegram.vue'
import { useRoute } from 'vue-router'
import { oauth } from "@/api/auth";
import TelegramModal from "./TelegramModal.vue";
import { ref } from "vue";

const props = defineProps({
  config: {
    telegram_bot_name: ''
  }
})

const route = useRoute()
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
  <div class="third-party-login">
    <button type="submit" class="btn" @click="socialLogin('google')">
      <IconGoogle class="icon-social" />
    </button>
    <button type="submit" class="btn" @click="socialLogin('telegram')">
      <IconTelegram class="icon-social" />
    </button>
  </div>
  <TelegramModal ref="telegramModalRef" :config="props.config" />
</template>

<style scoped lang="scss">
.third-party-login {
  width: 100%;
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;

  .btn {
    padding: 0;
    margin: 0 16px 0;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }

  .icon-social {
    display: block;
  }
}
</style>
