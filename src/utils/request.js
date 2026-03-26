// 引入状态管理，获取登录 token
import { useUserStore } from '@/store/modules/userStore';

// 创建请求实例
const request = async (options) => {
  const userStore = useUserStore();
   //let baseUrl = 'https://alena-subradical-ava.ngrok-free.dev';
   let baseUrl = 'http://127.0.0.1:8080'; 
   
   // #ifdef H5
   if (process.env.NODE_ENV === 'development') {
     baseUrl = ''; 
   }
   // #endif
   
   const header = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    // 采用多重保险：携带 Authorization (Bearer) 以及 token/authentication 直接字段
    // 许多后端拦截器（如苍穹外卖等模板）默认识别 'token' 或 'authentication'
    'Authorization': userStore.token ? `Bearer ${userStore.token}` : '',
    'token': userStore.token || '',
    'authentication': userStore.token || '',
  };

  try {
    // 构造请求 URL（将 options.params 序列化到查询串，兼容 uni.request）
    let requestUrl = baseUrl + (options.url || '');
    const method = (options.method || 'GET').toUpperCase();
    const params = options.params || {};
    const hasParams = params && Object.keys(params).length > 0;
    if (hasParams) {
      const filtered = Object.keys(params).filter(k => params[k] !== null && typeof params[k] !== 'undefined')
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
      if (filtered) {
        requestUrl += (requestUrl.includes('?') ? '&' : '?') + filtered;
      }
    }

    // 发起请求（uni.request 在小程序端使用 data 作为请求体/查询参数）
    // 调试日志：打印完整请求信息，便于 DevTools 对比后端收到的 URL/headers/body
    console.log('发起API请求:', method, requestUrl);
    console.log('请求 headers:', { ...header, ...options.header });
    console.log('请求 params:', options.params || {});
    console.log('请求 body:', options.data || {});

    let res;
    try {
      // 构造最终 header：对 GET 请求移除 Content-Type，避免部分后端对 GET+application/json 返回 400
      const finalHeader = { ...header, ...options.header };
      if (method === 'GET' && finalHeader['Content-Type']) delete finalHeader['Content-Type'];

      res = await uni.request({
        url: requestUrl,
        method,
        // 小程序端避免在 GET 请求发送空 body，某些后端会因此返回 400
        data: method === 'GET' ? undefined : (options.data || {}),
        header: finalHeader,
        responseType: options.responseType || 'json',
        timeout: options.timeout || 10000, // 默认10秒超时
        sslVerify: options.sslVerify || false // 处理SSL验证参数
      });
      console.log('uni.request 原始返回:', JSON.stringify(res));
    } catch (e) {
      console.log('uni.request 调用异常:', e);
      throw e;
    }

    // 响应拦截：统一处理结果
    // 注意：uni.request 返回的是一个对象，不是 [error, response] 数组
    const response = res;
    
    // 检查响应是否存在
    if (!response) {
      uni.showToast({ title: '网络请求失败', icon: 'none' });
      throw new Error('网络异常');
    }

    // HTTP状态码处理
    if (response.statusCode !== 200) {
      // Token过期或未授权
      if (response.statusCode === 401 || response.statusCode === 403) {
        userStore.logout();
        uni.showToast({ 
          title: '登录已过期，请重新登录', 
          icon: 'none',
          duration: 2000
        });
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/main/login' });
        }, 2000);
        throw new Error('登录已过期');
      }
      
      // 服务器错误
      if (response.statusCode >= 500) {
        uni.showToast({ title: '服务器错误，请稍后重试', icon: 'none' });
        throw new Error('服务器错误');
      }
      
      // 其他错误
      uni.showToast({ 
        title: `请求失败(${response.statusCode})`, 
        icon: 'none' 
      });
      throw new Error(`HTTP错误: ${response.statusCode}`);
    }

    const result = response.data;
    
    console.log('完整API响应:', JSON.stringify(response, null, 2));
    console.log('响应data:', JSON.stringify(result, null, 2));
    console.log('是否包含data字段:', !!result.data);
    console.log('data字段类型:', typeof result.data);
    console.log('data是否为数组:', Array.isArray(result.data));
    
    // 递归处理数据，转换下划线命名为驼峰命名并清理字符串
    const processData = (data) => {
      if (Array.isArray(data)) {
        return data.map(item => processData(item));
      } else if (data && typeof data === 'object') {
        const formattedItem = {};
        for (const [key, value] of Object.entries(data)) {
          // 下划线转驼峰
          const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          
          // 处理值
          let processedValue = value;
          if (typeof value === 'string') {
            // 清理字符串：移除反引号、末尾逗号和多余空格
            processedValue = processedValue.replace(/`/g, '').replace(/,$/, '').trim();
            
            // 尝试将纯数字字符串转换为数字类型，避免前端 toFixed 等方法报错
            if (processedValue !== '' && !isNaN(processedValue) && isFinite(processedValue)) {
              // 排除掉可能是 ID 的长字符串或以 0 开头的非零小数
              if (processedValue.length < 15 && !(processedValue.startsWith('0') && processedValue.length > 1 && !processedValue.startsWith('0.'))) {
                processedValue = Number(processedValue);
              }
            }
          } else if (value && typeof value === 'object') {
            // 递归处理嵌套对象或数组
            processedValue = processData(value);
          }
          
          formattedItem[camelKey] = processedValue;
        }
        return formattedItem;
      }
      return data;
    };
    
    // 处理数据
    if (result) {
      // 灵活处理不同的返回格式，统一返回格式为 {data: ...}
      if (result.data) {
        // 只处理数据，不强制包装成数组
        const processedData = processData(result.data);
        // 返回新对象，避免修改原始result
        return {
          ...result,
          data: processedData
        };
      } else {
        // 如果没有data字段，将处理后的数据包装到data字段中
        const processedData = processData(result);
        return { 
          success: true, // 默认成功状态
          data: processedData,
          message: 'success' // 默认成功消息
        };
      }
    }
    
    return { 
      success: true, 
      data: [], // 空数据时返回空数组
      message: 'success' 
    }; // 空数据时返回统一格式
  } catch (error) {
    console.log('请求异常：', error);
    // 如果是业务错误，直接抛出
    if (error.message && (error.message.includes('登录已过期') || 
        error.message.includes('网络异常') || 
        error.message.includes('服务器错误'))) {
      throw error;
    }
    // 其他未知错误
    throw error;
  }
};

// 导出请求方法
export default request;
