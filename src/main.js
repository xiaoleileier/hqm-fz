
const {
  configFileName: CONFIG_FILE_NAME = 'config.js',
  configTimeout: CONFIG_TIMEOUT = 3000,
  maxRetries: MAX_RETRIES = 2
} = window.EZ_LOADER || {};


function loadConfigScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${CONFIG_FILE_NAME}?t=${Date.now()}`;
    script.async = true;

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Config load timeout'));
    }, CONFIG_TIMEOUT);

    script.onload = () => {
      if (window.EZ_CONFIG && Object.keys(window.EZ_CONFIG).length > 0) {
        cleanup();
        resolve();
      } else {
        cleanup();
        reject(new Error('EZ_CONFIG is empty'));
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Config script error'));
    };

    function cleanup() {
      clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
    }

    document.head.appendChild(script);
  });
}


async function ensureConfigLoaded() {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await loadConfigScript();
      return true;
    } catch (err) {
      console.warn(`加载配置失败，正在重试(${attempt + 1}/${MAX_RETRIES})`, err);
    }
  }
  return false;
}

(async () => {
  const loaded = await ensureConfigLoaded();
  if (!loaded) {
    alert('网站配置加载失败，系统将自动刷新页面');
    location.reload(true);
    return;
  }

  await import('./appInit.js');
})(); 
