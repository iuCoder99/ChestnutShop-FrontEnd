"use strict";
const common_vendor = require("../common/vendor.js");
let isRefreshing = false;
let requests = [];
const request = async (options = {}) => {
  let baseUrl = "http://127.0.0.1:8080";
  const isDev = true;
  const token = common_vendor.index.getStorageSync("token") || "";
  const cookie = common_vendor.index.getStorageSync("cookie") || "";
  const method = (options.method || "GET").toUpperCase();
  const params = options.params || {};
  const data = options.data || {};
  let requestUrl = baseUrl + (options.url || "");
  const sendData = method === "GET" ? void 0 : data;
  const finalHeader = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    // 采用双重保险：同时携带 Authorization (Bearer) 和 token (直接值)
    "Authorization": token ? `Bearer ${token}` : "",
    "Cookie": cookie,
    // 添加 Cookie
    ...options.header || {}
  };
  if (method === "GET" && finalHeader["Content-Type"]) {
    delete finalHeader["Content-Type"];
  }
  const robustClean = (val) => {
    if (typeof val !== "string")
      return val;
    if (val.startsWith("[") && val.endsWith("]") || val.startsWith("{") && val.endsWith("}")) {
      return val.trim();
    }
    return val.replace(/[`'"‘’“”´＂]/g, "").trim();
  };
  const deepClean = (data2) => {
    if (Array.isArray(data2))
      return data2.map(deepClean);
    if (data2 && typeof data2 === "object") {
      const obj = {};
      for (const key in data2)
        obj[key] = deepClean(data2[key]);
      return obj;
    }
    return robustClean(data2);
  };
  const processedSendData = deepClean(sendData);
  const processedParams = deepClean(params);
  if (processedParams && Object.keys(processedParams).length > 0) {
    const filtered = Object.keys(processedParams).filter((k) => processedParams[k] !== null && typeof processedParams[k] !== "undefined").map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(processedParams[k])}`).join("&");
    if (filtered) {
      requestUrl += (requestUrl.includes("?") ? "&" : "?") + filtered;
    }
  }
  {
    common_vendor.index.__f__("log", "at utils/request.js:81", "--- [DEBUG] REQUEST START ---");
    common_vendor.index.__f__("log", "at utils/request.js:82", "--- [DEBUG] URL:", requestUrl);
    common_vendor.index.__f__("log", "at utils/request.js:83", "--- [DEBUG] Headers:", JSON.stringify(finalHeader, null, 2));
    common_vendor.index.__f__("log", "at utils/request.js:84", "--- [DEBUG] Cleaned Data:", JSON.stringify(processedSendData, null, 2));
    common_vendor.index.__f__("log", "at utils/request.js:85", "--- [DEBUG] Cleaned Params:", JSON.stringify(processedParams, null, 2));
  }
  try {
    common_vendor.index.__f__("log", "at utils/request.js:90", "--- [DEBUG] 准备执行 uni.request ---");
    const requestPromise = common_vendor.index.request({
      url: requestUrl,
      method,
      data: processedSendData,
      header: finalHeader,
      timeout: 3e4,
      sslVerify: false
    });
    const localTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("请求超时，请检查网络环境或服务器状态")), 35e3);
    });
    const response = await Promise.race([requestPromise, localTimeoutPromise]);
    common_vendor.index.__f__("log", "at utils/request.js:110", "--- [DEBUG] uni.request 响应原始结果:", JSON.stringify(response));
    let actualRes = response;
    if (Array.isArray(response)) {
      if (response[0])
        throw response[0];
      actualRes = response[1];
    }
    if (!actualRes || typeof actualRes.statusCode === "undefined") {
      common_vendor.index.__f__("error", "at utils/request.js:120", "--- [DEBUG] 无效的响应对象:", actualRes);
      throw new Error("未获取到有效的 HTTP 响应");
    }
    if (isDev) {
      common_vendor.index.__f__("log", "at utils/request.js:125", "--- [DEBUG] HTTP Status:", actualRes.statusCode);
      common_vendor.index.__f__("log", "at utils/request.js:126", "--- [DEBUG] Data:", JSON.stringify(actualRes.data, null, 2));
    }
    if (actualRes.header && (actualRes.header["Set-Cookie"] || actualRes.header["set-cookie"])) {
      const setCookie = actualRes.header["Set-Cookie"] || actualRes.header["set-cookie"];
      let cookieStr = "";
      if (Array.isArray(setCookie)) {
        cookieStr = setCookie.join("; ");
      } else {
        cookieStr = setCookie;
      }
      if (cookieStr) {
        common_vendor.index.setStorageSync("cookie", cookieStr);
      }
    }
    const responseData = actualRes.data;
    if (responseData && responseData.code === 10002) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          common_vendor.index.__f__("log", "at utils/request.js:149", "--- [DEBUG] AccessToken过期(10002)，尝试无感刷新 ---");
          const refreshToken = common_vendor.index.getStorageSync("refreshToken") || "";
          const refreshResponse = await common_vendor.index.request({
            url: baseUrl + "/api/user/refresh/token",
            method: "POST",
            header: {
              "content-type": "application/x-www-form-urlencoded"
            },
            data: {
              refreshToken
            }
          });
          let refreshRes = refreshResponse;
          if (Array.isArray(refreshResponse)) {
            if (refreshResponse[0])
              throw refreshResponse[0];
            refreshRes = refreshResponse[1];
          }
          if (refreshRes && refreshRes.statusCode === 200 && refreshRes.data && refreshRes.data.success) {
            const newToken = refreshRes.data.data.accessToken || refreshRes.data.data.token;
            const newRefreshToken = refreshRes.data.data.refreshToken;
            common_vendor.index.setStorageSync("token", newToken);
            if (newRefreshToken) {
              common_vendor.index.setStorageSync("refreshToken", newRefreshToken);
            }
            if (refreshRes.header && (refreshRes.header["Set-Cookie"] || refreshRes.header["set-cookie"])) {
              const setCookie = refreshRes.header["Set-Cookie"] || refreshRes.header["set-cookie"];
              const cookieStr = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie;
              if (cookieStr)
                common_vendor.index.setStorageSync("cookie", cookieStr);
            }
            requests.forEach((cb) => cb(newToken));
            requests = [];
            return request({
              ...options,
              header: {
                ...options.header || {},
                "Authorization": `Bearer ${newToken}`
              }
            });
          } else {
            throw new Error("刷新Token失败");
          }
        } catch (e) {
          common_vendor.index.removeStorageSync("token");
          common_vendor.index.removeStorageSync("refreshToken");
          common_vendor.index.removeStorageSync("userInfo");
          isRefreshing = false;
          requests = [];
          common_vendor.index.showToast({ title: "登录已过期，请重新登录", icon: "none" });
          setTimeout(() => common_vendor.index.reLaunch({ url: "/pages/main/login/login" }), 1500);
          throw new Error("会话已过期");
        } finally {
          isRefreshing = false;
        }
      } else {
        return new Promise((resolve) => {
          requests.push((newToken) => {
            resolve(request({
              ...options,
              header: {
                ...options.header || {},
                "Authorization": `Bearer ${newToken}`
              }
            }));
          });
        });
      }
    } else if (responseData && (responseData.code === 10001 || responseData.code === 10003 || responseData.code === 10004)) {
      common_vendor.index.removeStorageSync("token");
      common_vendor.index.removeStorageSync("userInfo");
      common_vendor.index.showToast({ title: responseData.message || "登录已过期", icon: "none" });
      setTimeout(() => common_vendor.index.reLaunch({ url: "/pages/main/login/login" }), 1500);
      throw new Error(responseData.message || "登录已过期");
    } else if (actualRes.statusCode !== 200) {
      if (actualRes.statusCode === 403) {
        common_vendor.index.removeStorageSync("token");
        common_vendor.index.removeStorageSync("userInfo");
        common_vendor.index.showToast({ title: "无权访问", icon: "none" });
        setTimeout(() => common_vendor.index.reLaunch({ url: "/pages/main/login/login" }), 1500);
        throw new Error("无权访问");
      }
      if (actualRes.statusCode === 502) {
        throw new Error("服务器响应异常(502)，请检查后端服务是否正常运行");
      }
      throw new Error(`HTTP错误: ${actualRes.statusCode}`);
    }
    return deepClean(actualRes.data);
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/request.js:247", "--- [DEBUG] REQUEST CATCH ERROR ---", error);
    common_vendor.index.hideLoading({ fail: () => {
    } });
    let msg = error.errMsg || error.message || "网络异常";
    if (msg.includes("timeout")) {
      msg = "请求超时，请稍后重试";
    }
    common_vendor.index.showToast({ title: msg, icon: "none" });
    throw error;
  }
};
const upload = async (options = {}) => {
  let baseUrl = "http://127.0.0.1:8080";
  const token = common_vendor.index.getStorageSync("token") || "";
  const requestUrl = baseUrl + (options.url || "");
  return new Promise((resolve, reject) => {
    common_vendor.index.uploadFile({
      url: requestUrl,
      filePath: options.filePath,
      name: options.name || "file",
      header: {
        "ngrok-skip-browser-warning": "true",
        "Authorization": token ? `Bearer ${token}` : "",
        ...options.header || {}
      },
      formData: options.formData || {},
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (e) {
            reject(new Error("解析响应数据失败"));
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          common_vendor.index.removeStorageSync("token");
          common_vendor.index.removeStorageSync("userInfo");
          common_vendor.index.showToast({ title: "登录已过期", icon: "none" });
          setTimeout(() => common_vendor.index.reLaunch({ url: "/pages/main/login/login" }), 2e3);
          reject(new Error("登录已过期"));
        } else {
          reject(new Error(`HTTP错误: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        common_vendor.index.showToast({ title: err.errMsg || "网络异常", icon: "none" });
        reject(err);
      }
    });
  });
};
exports.request = request;
exports.upload = upload;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/request.js.map
