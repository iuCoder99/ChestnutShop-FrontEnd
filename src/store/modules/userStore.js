import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  // 核心状态：持久化存储，初始化时从本地缓存取值
  state: () => ({
    token: uni.getStorageSync('token') || '', // 用户令牌
    userInfo: uni.getStorageSync('userInfo') || {}, // 用户信息（昵称、头像、角色等）
    isLogin: !!uni.getStorageSync('token') // 是否登录（计算派生）
  }),

  // 计算属性
  getters: {
    // 获取用户角色（管理端/普通用户）
    userRole: (state) => state.userInfo.role || 'USER',
    // 企业用户标识
    isEnterprise: (state) => state.userInfo.isEnterprise || false
  },

  // 关键方法
  actions: {
    // 设置用户信息（登录成功后调用）
    setUserInfo(userData) {
      this.userInfo = userData;
      this.token = userData.token || this.token;
      this.isLogin = true;
      // 持久化到本地缓存
      uni.setStorageSync('token', this.token);
      uni.setStorageSync('userInfo', this.userInfo);
    },

    // 更新用户信息（如昵称、头像修改）
    updateUserInfo(updatedData) {
      this.userInfo = { ...this.userInfo, ...updatedData };
      uni.setStorageSync('userInfo', this.userInfo);
    },

    // 退出登录
    logout() {
      this.token = '';
      this.userInfo = {};
      this.isLogin = false;
      // 清除本地缓存
      uni.removeStorageSync('token');
      uni.removeStorageSync('userInfo');
      // 清除临时购物车（未登录状态）
      uni.removeStorageSync('cartTemp');
    },

    // 验证登录状态（路由守卫用）
    checkLogin() {
      return this.isLogin;
    }
  }
});