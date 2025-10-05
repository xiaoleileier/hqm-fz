<script setup>
  import { useRoute } from "vue-router";
  import { onMounted } from "vue";
  import { useI18n } from "vue-i18n";

  const route = useRoute()
  const { t } = useI18n()

  const getInfo = () => {
    try {
      console.log('验证页面加载，route.query:', route.query)
      const { token, is_admin, auth_data } = route.query
      if(token && auth_data) {
        console.log('收到token和auth_data，准备发送消息给父窗口')
        // 准备数据
        const loginData = {
          token,
          is_admin,
          auth_data
        };

        // 通知父窗口登录成功
        if (window.opener) {
          console.log('发送postMessage到父窗口')
          window.opener.postMessage({
            type: 'oauth_login_success',
            data: loginData
          }, window.location.origin);
        } else {
          console.log('没有window.opener，无法发送消息')
        }

        // 关闭当前窗口
        console.log('准备关闭窗口')
        setTimeout(() => {
          window.close();
        }, 500);
      } else {
        console.log('缺少必要的参数(token或auth_data)，准备关闭窗口')
        // 没有必要的参数则直接关闭窗口
        setTimeout(() => {
          window.close();
        }, 500);
      }
    } catch (e) {
      console.error('验证页面处理出错:', e);
      // 出错时也关闭窗口
      setTimeout(() => {
        window.close();
      }, 500);
    }
  }

  onMounted(() => {
    // 确保在下次DOM更新后执行
    setTimeout(() => {
      getInfo()
    }, 100);
  })
</script>

<template>
  <div class="login-wrapper">
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p class="">{{ $t('common.logging') }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-wrapper {
  display: flex;

  justify-content: center;

  align-items: center;

  width: 100vw;

  height: 100vh;

  overflow: hidden;

  .loading-container {
    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;



    .loading-spinner {
      width: 30px;

      height: 30px;

      border-radius: 50%;

      border: 3px solid rgba(var(--theme-color-rgb), 0.2);

      border-top-color: var(--theme-color);

      animation: spin 1s linear infinite;

      margin-bottom: 1rem;
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
