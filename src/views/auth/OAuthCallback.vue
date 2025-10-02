<template>
  <div class="oauth-callback-container">
    <div class="oauth-callback-content">
      <div class="loading-spinner"></div>
      <h2>{{ $t('auth.processingOAuth') }}</h2>
      <p>{{ $t('auth.pleaseWait') }}</p>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { checkOAuthCallback, handleGoogleOAuthCallback } from '@/api/auth';
import { handleLoginSuccess } from '@/api/auth';

export default {
  name: 'OAuthCallback',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { t } = useI18n();

    onMounted(async () => {
      try {
        console.log('OAuth回调页面加载，当前URL:', window.location.href);
        console.log('路由查询参数:', route.query);
        console.log('是否有window.opener:', !!window.opener);
        
        // 首先检查路由查询参数
        const hasQueryParams = route.query.token || route.query.auth_data || route.query.is_admin || 
                              route.query.code || route.query.state || route.query.error;
        
        if (hasQueryParams) {
          console.log('检测到路由查询参数:', route.query);
          
          // 如果是直接的token回调
          if (route.query.token || route.query.auth_data || route.query.is_admin) {
            // 保存登录信息
            if (route.query.token) {
              localStorage.setItem('token', route.query.token);
            }
            if (route.query.auth_data) {
              localStorage.setItem('auth_data', route.query.auth_data);
            }
            if (route.query.is_admin) {
              localStorage.setItem('is_admin', route.query.is_admin);
            }
            
            // 通知父窗口登录成功
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_SUCCESS',
                token: route.query.token,
                auth_data: route.query.auth_data,
                is_admin: route.query.is_admin
              }, window.location.origin);
            }
            
            // 如果不是弹窗，直接跳转到dashboard
            if (!window.opener) {
              router.push('/dashboard');
              return;
            }
            
            // 关闭弹窗
            setTimeout(() => {
              window.close();
            }, 1000);
            return;
          }
          
          // 如果是OAuth错误
          if (route.query.error) {
            console.error('OAuth授权失败:', route.query.error);
            
            // 通知父窗口授权失败
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_ERROR',
                error: route.query.error || 'OAuth授权失败'
              }, window.location.origin);
            }
            
            // 关闭弹窗
            setTimeout(() => {
              window.close();
            }, 2000);
            return;
          }
        }
        
        // 然后检查标准的OAuth回调
        const oauthCallback = checkOAuthCallback();
        console.log('checkOAuthCallback结果:', oauthCallback);
        
        if (oauthCallback.isOAuthCallback) {
          if (oauthCallback.hasError) {
            console.error('OAuth授权失败:', oauthCallback.error);
            
            // 通知父窗口授权失败
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_ERROR',
                error: oauthCallback.error || 'OAuth授权失败'
              }, window.location.origin);
            }
            
            // 关闭弹窗
            setTimeout(() => {
              window.close();
            }, 2000);
            return;
          }
          
          if (oauthCallback.code) {
            console.log('处理OAuth回调:', oauthCallback.code);
            
            try {
              const response = await handleGoogleOAuthCallback(oauthCallback.code, oauthCallback.state);
              
              if (response && response.data) {
                // 保存登录信息
                if (response.data.token) {
                  localStorage.setItem('token', response.data.token);
                }
                if (response.data.auth_data) {
                  localStorage.setItem('auth_data', response.data.auth_data);
                }
                if (response.data.is_admin) {
                  localStorage.setItem('is_admin', response.data.is_admin);
                }
                
                // 通知父窗口登录成功
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'OAUTH_SUCCESS',
                    token: response.data.token,
                    auth_data: response.data.auth_data,
                    is_admin: response.data.is_admin
                  }, window.location.origin);
                }
                
                // 如果不是弹窗，直接跳转到dashboard
                if (!window.opener) {
                  router.push('/dashboard');
                  return;
                }
                
                // 关闭弹窗
                setTimeout(() => {
                  window.close();
                }, 1000);
              } else {
                throw new Error('OAuth响应数据不完整');
              }
            } catch (error) {
              console.error('OAuth回调处理失败:', error);
              
              // 通知父窗口登录失败
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_ERROR',
                  error: error.message || 'OAuth登录失败'
                }, window.location.origin);
              }
              
              // 关闭弹窗
              setTimeout(() => {
                window.close();
              }, 2000);
            }
          }
        } else {
          // 不是OAuth回调，重定向到登录页面
          console.log('不是OAuth回调，重定向到登录页面');
          router.push('/login');
        }
      } catch (error) {
        console.error('OAuth回调检查失败:', error);
        
        // 通知父窗口出错
        if (window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_ERROR',
            error: 'OAuth回调处理出错'
          }, window.location.origin);
        }
        
        // 关闭弹窗
        setTimeout(() => {
          window.close();
        }, 2000);
      }
    });

    return {};
  }
};
</script>

<style lang="scss" scoped>
.oauth-callback-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--background-color);
  padding: 20px;
}

.oauth-callback-content {
  text-align: center;
  max-width: 400px;
  
  h2 {
    color: var(--text-color);
    margin: 20px 0 10px 0;
    font-size: 24px;
    font-weight: 600;
  }
  
  p {
    color: var(--secondary-text-color);
    margin: 0;
    font-size: 16px;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(var(--theme-color-rgb), 0.2);
  border-radius: 50%;
  border-top-color: var(--theme-color);
  animation: spin 1s linear infinite;
  margin: 0 auto;
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
