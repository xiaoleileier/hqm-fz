# Telegram 机器人名称获取指南

## API 信息

### 函数
```javascript
getWebsiteConfig()
```

### 端点
```
GET /guest/comm/config
```

### 用途
获取网站配置信息，包括Telegram机器人名称等

## Telegram 机器人相关字段

API 返回的配置对象中可能包含以下Telegram机器人相关字段：

```javascript
{
  // 可能的字段名（按优先级排序）
  telegram_bot_name: "string",      // 最常用的字段名
  telegram_bot: "string",           // 备选字段名
  bot_name: "string",               // 通用机器人名称字段
  telegram_bot_username: "string"   // Telegram用户名格式
}
```

## 前端获取逻辑

### 1. 初始化配置对象

```javascript
const config = reactive({
  tos_url: '',
  is_email_verify: 0,
  is_recaptcha: 0,
  is_invite_force: 0,
  recaptcha_site_key: '',
  email_whitelist_suffix: [],
  // Telegram 机器人字段
  telegram_bot_name: '',
  telegram_bot: '',
  bot_name: '',
  telegram_bot_username: ''
});
```

### 2. 加载配置

```javascript
// 在 onMounted 中加载配置
try {
  configLoading.value = true;
  const configResponse = await getWebsiteConfig();
  if (configResponse.data) {
    Object.assign(config, configResponse.data);
  }
} catch (error) {
  console.error('加载网站配置失败:', error);
} finally {
  configLoading.value = false;
}
```

### 3. 获取机器人名称

```javascript
const getBotName = () => {
  return config.value?.telegram_bot_name || 
         config.value?.telegram_bot || 
         config.value?.bot_name || 
         config.value?.telegram_bot_username || 
         window.EZ_CONFIG?.telegram_bot_name || 
         window.EZ_CONFIG?.telegram_bot || 
         window.EZ_CONFIG?.bot_name || 
         window.EZ_CONFIG?.telegram_bot_username || 
         '@your_login_bot';  // 默认值
};
```

## 使用示例

### 在模板中使用

```vue
<template>
  <div class="bot-info">
    <div class="bot-avatar">
      <IconBrandTelegram :size="24" />
    </div>
    <div class="bot-details">
      <h4>{{ getBotName() }}</h4>
      <p>{{ $t('auth.telegramBotDesc') }}</p>
    </div>
  </div>
</template>
```

### 在步骤说明中使用

```vue
<template>
  <div class="step-item">
    <span class="step-number">2</span>
    <span class="step-text">搜索机器人：<span class="bot-name">{{ getBotName() }}</span></span>
  </div>
</template>
```

## 字段优先级

1. `telegram_bot_name` - 最常用的字段名
2. `telegram_bot` - 备选字段名
3. `bot_name` - 通用机器人名称字段
4. `telegram_bot_username` - Telegram用户名格式
5. `window.EZ_CONFIG` 中的对应字段（全局配置）
6. `@your_login_bot` - 默认值

## 注意事项

1. **字段名可能不同**：不同后端可能使用不同的字段名
2. **需要容错处理**：API可能不返回某些字段
3. **全局配置备用**：检查 `window.EZ_CONFIG` 作为备用
4. **默认值**：提供合理的默认值避免显示空值

## 调试方法

```javascript
// 在浏览器控制台中调试
console.log('当前配置:', config.value);
console.log('机器人名称:', getBotName());
console.log('EZ_CONFIG:', window.EZ_CONFIG);
```

## 相关文件

- `src/api/auth.js` - API函数定义
- `src/views/auth/split/Login.vue` - Split布局登录页面
- `src/views/auth/split/Register.vue` - Split布局注册页面
- `src/views/auth/center/Login.vue` - Center布局登录页面
- `src/views/auth/center/Register.vue` - Center布局注册页面
