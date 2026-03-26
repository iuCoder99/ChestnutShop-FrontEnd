import { defineStore } from 'pinia';
import cacheUtil from '@/utils/cacheUtil';
import socketService from '@/utils/websocket';
import { userApi } from '@/utils/api';

export const useUserStore = defineStore('user', {
  // 核心状态：持久化存储，初始化时从本地缓存取值
  state: () => ({
    token: uni.getStorageSync('token') || '', // 用户令牌 (accessToken)
    refreshToken: uni.getStorageSync('refreshToken') || '', // 刷新令牌
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
      // 根据后端返回的数据结构，userData包含accessToken、refreshToken和userInfo
      this.userInfo = userData.userInfo || userData;
      // 优先使用 accessToken，兼容旧代码
      this.token = userData.accessToken || userData.token || this.token;
      this.refreshToken = userData.refreshToken || this.refreshToken;
      
      this.isLogin = true;
      // 持久化到本地缓存
      uni.setStorageSync('token', this.token);
      if (this.refreshToken) {
        uni.setStorageSync('refreshToken', this.refreshToken);
      }
      uni.setStorageSync('userInfo', this.userInfo);
      
      // 触发全局事件通知状态变化
      if (typeof uni.$emit === 'function') {
        uni.$emit('userLogin', this.userInfo);
      }
    },

    // 更新用户信息（如昵称、头像修改）
    updateUserInfo(updatedData) {
      this.userInfo = { ...this.userInfo, ...updatedData };
      uni.setStorageSync('userInfo', this.userInfo);
    },

    // 退出登录
    async logout() {
      // 0. 调用后端退出接口
      try {
        await userApi.logout();
      } catch (e) {
        console.warn('退出登录接口调用失败:', e);
      }

      // 1. 关闭 WebSocket
      socketService.close();
      
      this.token = '';
      this.refreshToken = '';
      this.userInfo = {};
      this.isLogin = false;
      // 清除本地缓存
      uni.removeStorageSync('token');
      uni.removeStorageSync('refreshToken');
      uni.removeStorageSync('userInfo');
      // 清除临时购物车（未登录状态）
      uni.removeStorageSync('cartTemp');
      // 清除持久化购物车缓存
      uni.removeStorageSync('cart_data');
      // 清理业务缓存
      cacheUtil.clearBusinessCache();
      
      // 触发全局事件通知登出状态变化
      if (typeof uni.$emit === 'function') {
        uni.$emit('userLogout');
      }
    },

    // 验证登录状态（路由守卫用）
    checkLogin() {
      return this.isLogin;
    }
  }
});