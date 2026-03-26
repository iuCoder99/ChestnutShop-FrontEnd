"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_cacheUtil = require("../../utils/cacheUtil.js");
const utils_websocket = require("../../utils/websocket.js");
const utils_api = require("../../utils/api.js");
const useUserStore = common_vendor.defineStore("user", {
  // 核心状态：持久化存储，初始化时从本地缓存取值
  state: () => ({
    token: common_vendor.index.getStorageSync("token") || "",
    // 用户令牌 (accessToken)
    refreshToken: common_vendor.index.getStorageSync("refreshToken") || "",
    // 刷新令牌
    userInfo: common_vendor.index.getStorageSync("userInfo") || {},
    // 用户信息（昵称、头像、角色等）
    isLogin: !!common_vendor.index.getStorageSync("token")
    // 是否登录（计算派生）
  }),
  // 计算属性
  getters: {
    // 获取用户角色（管理端/普通用户）
    userRole: (state) => state.userInfo.role || "USER",
    // 企业用户标识
    isEnterprise: (state) => state.userInfo.isEnterprise || false
  },
  // 关键方法
  actions: {
    // 设置用户信息（登录成功后调用）
    setUserInfo(userData) {
      this.userInfo = userData.userInfo || userData;
      this.token = userData.accessToken || userData.token || this.token;
      this.refreshToken = userData.refreshToken || this.refreshToken;
      this.isLogin = true;
      common_vendor.index.setStorageSync("token", this.token);
      if (this.refreshToken) {
        common_vendor.index.setStorageSync("refreshToken", this.refreshToken);
      }
      common_vendor.index.setStorageSync("userInfo", this.userInfo);
      if (typeof common_vendor.index.$emit === "function") {
        common_vendor.index.$emit("userLogin", this.userInfo);
      }
    },
    // 更新用户信息（如昵称、头像修改）
    updateUserInfo(updatedData) {
      this.userInfo = { ...this.userInfo, ...updatedData };
      common_vendor.index.setStorageSync("userInfo", this.userInfo);
    },
    // 退出登录
    async logout() {
      try {
        await utils_api.userApi.logout();
      } catch (e) {
        common_vendor.index.__f__("warn", "at store/modules/userStore.js:59", "退出登录接口调用失败:", e);
      }
      utils_websocket.socketService.close();
      this.token = "";
      this.refreshToken = "";
      this.userInfo = {};
      this.isLogin = false;
      common_vendor.index.removeStorageSync("token");
      common_vendor.index.removeStorageSync("refreshToken");
      common_vendor.index.removeStorageSync("userInfo");
      common_vendor.index.removeStorageSync("cartTemp");
      common_vendor.index.removeStorageSync("cart_data");
      utils_cacheUtil.cacheUtil.clearBusinessCache();
      if (typeof common_vendor.index.$emit === "function") {
        common_vendor.index.$emit("userLogout");
      }
    },
    // 验证登录状态（路由守卫用）
    checkLogin() {
      return this.isLogin;
    }
  }
});
exports.useUserStore = useUserStore;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/store/modules/userStore.js.map
