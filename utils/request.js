// 全局变量，用于刷新 Token 锁和队列
let isRefreshing = false;
let requests = [];

// 创建请求实例
const request = async (options = {}) => {
  // 默认生产环境地址
  //let baseUrl = 'https://alena-subradical-ava.ngrok-free.dev';
  let baseUrl = 'http://127.0.0.1:8080'; 
  
  // #ifdef H5
  // H5开发环境使用 Vite 代理，baseUrl 设为空即可
  if (process.env.NODE_ENV === 'development') {
    baseUrl = ''; 
  }
  // #endif
  // 开发环境标记
  const isDev = process.env.NODE_ENV === 'development';
  const token = uni.getStorageSync('token') || '';
  // 获取存储的 Cookie
  const cookie = uni.getStorageSync('cookie') || '';
  
  const method = (options.method || 'GET').toUpperCase();
  const params = options.params || {};
  const data = options.data || {};
  let requestUrl = baseUrl + (options.url || '');
  
  // 2. 准备 Request Body (data)
  // GET 请求不发送 body，其他请求根据 options.data 发送
  const sendData = method === 'GET' ? undefined : data;
  
  const finalHeader = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    // 采用双重保险：同时携带 Authorization (Bearer) 和 token (直接值)
    'Authorization': token ? `Bearer ${token}` : '',
    'Cookie': cookie, // 添加 Cookie
    ...(options.header || {})
  };
  
  if (method === 'GET' && finalHeader['Content-Type']) {
    delete finalHeader['Content-Type'];
  }
  
  // 强力清理函数：移除可能的异常字符，但保护 JSON 结构
  const robustClean = (val) => {
    if (typeof val !== 'string') return val;
    // 如果看起来像 JSON 数组或对象，不要进行这种侵入式清理，否则会破坏引号导致 JSON.parse 失败
    if ((val.startsWith('[') && val.endsWith(']')) || (val.startsWith('{') && val.endsWith('}'))) {
      return val.trim();
    }
    // 移除反引号、单引号、双引号、以及 Unicode 形式的类似字符
    return val.replace(/[`'"‘’“”´＂]/g, '').trim();
  };

  const deepClean = (data) => {
    if (Array.isArray(data)) return data.map(deepClean);
    if (data && typeof data === 'object') {
      const obj = {};
      for (const key in data) obj[key] = deepClean(data[key]);
      return obj;
    }
    return robustClean(data);
  };

  const processedSendData = deepClean(sendData);
  const processedParams = deepClean(params);

  // 1. 处理 Query Parameters (params) -> 拼接到 URL 后
  if (processedParams && Object.keys(processedParams).length > 0) {
    const filtered = Object.keys(processedParams)
      .filter(k => processedParams[k] !== null && typeof processedParams[k] !== 'undefined')
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(processedParams[k])}`)
      .join('&');
    if (filtered) {
      requestUrl += (requestUrl.includes('?') ? '&' : '?') + filtered;
    }
  }

  if (isDev) {
    console.log('--- [DEBUG] REQUEST START ---');
    console.log('--- [DEBUG] URL:', requestUrl);
    console.log('--- [DEBUG] Headers:', JSON.stringify(finalHeader, null, 2));
    console.log('--- [DEBUG] Cleaned Data:', JSON.stringify(processedSendData, null, 2));
    console.log('--- [DEBUG] Cleaned Params:', JSON.stringify(processedParams, null, 2));
  }

  try {
    // 2. 发起请求：采用双重保险（Promise 模式 + 超时竞争）
    console.log('--- [DEBUG] 准备执行 uni.request ---');
    
    // 创建请求 Promise
    const requestPromise = uni.request({
      url: requestUrl,
      method,
      data: processedSendData,
      header: finalHeader,
      timeout: 30000,
      sslVerify: false
    });

    // 创建一个本地超时 Promise，防止 uni.request 内部挂死
    const localTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时，请检查网络环境或服务器状态')), 35000);
    });

    // 竞速执行
    const response = await Promise.race([requestPromise, localTimeoutPromise]);
    
    console.log('--- [DEBUG] uni.request 响应原始结果:', JSON.stringify(response));

    // 处理 uni-app 某些版本可能返回 [err, res] 数组的情况
    let actualRes = response;
    if (Array.isArray(response)) {
      if (response[0]) throw response[0];
      actualRes = response[1];
    }

    if (!actualRes || typeof actualRes.statusCode === 'undefined') {
      console.error('--- [DEBUG] 无效的响应对象:', actualRes);
      throw new Error('未获取到有效的 HTTP 响应');
    }

    if (isDev) {
      console.log('--- [DEBUG] HTTP Status:', actualRes.statusCode);
      console.log('--- [DEBUG] Data:', JSON.stringify(actualRes.data, null, 2));
    }

    // 保存 Set-Cookie
    if (actualRes.header && (actualRes.header['Set-Cookie'] || actualRes.header['set-cookie'])) {
      const setCookie = actualRes.header['Set-Cookie'] || actualRes.header['set-cookie'];
      let cookieStr = '';
      if (Array.isArray(setCookie)) {
        cookieStr = setCookie.join('; ');
      } else {
        cookieStr = setCookie;
      }
      if (cookieStr) {
        uni.setStorageSync('cookie', cookieStr);
      }
    }

    // 3. 清理响应数据并返回
    const responseData = actualRes.data;
    if (responseData && responseData.code === 10002) {
         if (!isRefreshing) {
            isRefreshing = true;
            try {
              console.log('--- [DEBUG] AccessToken过期(10002)，尝试无感刷新 ---');
              const refreshToken = uni.getStorageSync('refreshToken') || '';
              
              const refreshResponse = await uni.request({
                  url: baseUrl + '/api/user/refresh/token',
                  method: 'POST',
                  header: {
                      'content-type': 'application/x-www-form-urlencoded'
                  },
                  data: {
                      refreshToken: refreshToken
                  }
              });
              
              let refreshRes = refreshResponse;
              if (Array.isArray(refreshResponse)) {
                  if (refreshResponse[0]) throw refreshResponse[0];
                  refreshRes = refreshResponse[1];
              }
              
              if (refreshRes && refreshRes.statusCode === 200 && refreshRes.data && refreshRes.data.success) {
                  const newToken = refreshRes.data.data.accessToken || refreshRes.data.data.token;
                  const newRefreshToken = refreshRes.data.data.refreshToken;
                  
                  uni.setStorageSync('token', newToken);
                  if (newRefreshToken) {
                      uni.setStorageSync('refreshToken', newRefreshToken);
                  }
                  
                  if (refreshRes.header && (refreshRes.header['Set-Cookie'] || refreshRes.header['set-cookie'])) {
                      const setCookie = refreshRes.header['Set-Cookie'] || refreshRes.header['set-cookie'];
                      const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
                      if (cookieStr) uni.setStorageSync('cookie', cookieStr);
                  }
                  
                  requests.forEach(cb => cb(newToken));
                  requests = [];
                  
                  return request({
                      ...options,
                      header: {
                          ...(options.header || {}),
                          'Authorization': `Bearer ${newToken}`
                      }
                  });
              } else {
                  throw new Error('刷新Token失败');
              }
            } catch (e) {
                uni.removeStorageSync('token');
                uni.removeStorageSync('refreshToken');
                uni.removeStorageSync('userInfo');
                isRefreshing = false;
                requests = [];
                uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
                setTimeout(() => uni.reLaunch({ url: '/pages/main/login/login' }), 1500);
                throw new Error('会话已过期');
            } finally {
                isRefreshing = false;
            }
          } else {
            return new Promise((resolve) => {
                requests.push((newToken) => {
                    resolve(request({
                        ...options,
                        header: {
                            ...(options.header || {}),
                            'Authorization': `Bearer ${newToken}`
                        }
                    }));
                });
            });
          }
    } else if (responseData && (responseData.code === 10001 || responseData.code === 10003 || responseData.code === 10004)) {
        uni.removeStorageSync('token');
        uni.removeStorageSync('userInfo');
        uni.showToast({ title: responseData.message || '登录已过期', icon: 'none' });
        setTimeout(() => uni.reLaunch({ url: '/pages/main/login/login' }), 1500);
        throw new Error(responseData.message || '登录已过期');
    } else if (actualRes.statusCode !== 200) {
      if (actualRes.statusCode === 403) {
        uni.removeStorageSync('token');
        uni.removeStorageSync('userInfo');
        uni.showToast({ title: '无权访问', icon: 'none' });
        setTimeout(() => uni.reLaunch({ url: '/pages/main/login/login' }), 1500);
        throw new Error('无权访问');
      }
      
      if (actualRes.statusCode === 502) {
        throw new Error('服务器响应异常(502)，请检查后端服务是否正常运行');
      }

      throw new Error(`HTTP错误: ${actualRes.statusCode}`);
    }

    return deepClean(actualRes.data);

  } catch (error) {
    console.error('--- [DEBUG] REQUEST CATCH ERROR ---', error);
    // 采用 fail 回调忽略 hideLoading 的报错 (toast can't be found)
    uni.hideLoading({ fail: () => {} });
    let msg = error.errMsg || error.message || '网络异常';
    if (msg.includes('timeout')) {
      msg = '请求超时，请稍后重试';
    }
    uni.showToast({ title: msg, icon: 'none' });
    throw error;
  }
};

/**
 * 封装 uni.uploadFile 为 Promise
 * @param {Object} options 
 */
export const upload = async (options = {}) => {
 // let baseUrl = 'https://alena-subradical-ava.ngrok-free.dev';
  let baseUrl = 'http://127.0.0.1:8080'; 
  const token = uni.getStorageSync('token') || '';
  
  const requestUrl = baseUrl + (options.url || '');
  
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: requestUrl,
      filePath: options.filePath,
      name: options.name || 'file',
      header: {
        'ngrok-skip-browser-warning': 'true',
        'Authorization': token ? `Bearer ${token}` : '',
        ...(options.header || {})
      },
      formData: options.formData || {},
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (e) {
            reject(new Error('解析响应数据失败'));
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          uni.removeStorageSync('token');
          uni.removeStorageSync('userInfo');
          uni.showToast({ title: '登录已过期', icon: 'none' });
          setTimeout(() => uni.reLaunch({ url: '/pages/main/login/login' }), 2000);
          reject(new Error('登录已过期'));
        } else {
          reject(new Error(`HTTP错误: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        uni.showToast({ title: err.errMsg || '网络异常', icon: 'none' });
        reject(err);
      }
    });
  });
};

export default request;
