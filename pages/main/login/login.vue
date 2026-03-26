<!-- 功能说明
     网页端核心登录入口，仅支持账号密码登录与注册，移除微信授权相关逻辑。 -->
<template>
  <view class="login-container">
    <image src="/static/images/login-logo.png" class="login-logo"></image>
    <text class="login-title">栗子商城</text>
    
    <!-- 账号密码登录 / 注册 -->
    <view class="account-login">
      <block v-if="!isRegisterMode">
        <view class="form-item">
          <image src="/static/images/icon-account.png" class="form-icon"></image>
          <input 
            class="form-input" 
            v-model="accountForm.username" 
            placeholder="请输入用户名"
            maxlength="20"
          ></input>
        </view>
        <view class="form-item">
          <image src="/static/images/icon-password.png" class="form-icon"></image>
          <input 
            class="form-input" 
            v-model="accountForm.password" 
            placeholder="请输入密码"
            :password="!showPassword"
            maxlength="20"
          ></input>
          <image 
            :src="showPassword ? '/static/images/icon-hide.png' : '/static/images/icon-show.png'" 
            class="eye-icon"
            @click="togglePassword"
          ></image>
        </view>
        <button class="account-login-btn" @click="accountLogin" :disabled="isLoginIng">
          <text v-if="isLoginIng">登录中...</text>
          <text v-else>登录</text>
        </button>
        
        <!-- 返回浏览按钮 -->
        <button class="cancel-login-btn" @click="goBack" style="margin-top: 20rpx;">
          <text class="cancel-btn-text">返回浏览</text>
        </button>

        <view class="account-footer">
          <text class="register-link" @click="toggleRegisterMode(true)">创建账户</text>
          <text class="forget-password" @click="handleForgetPassword">忘记密码？</text>
        </view>
      </block>

      <!-- 创建账户表单 -->
      <block v-else>
        <view class="form-item">
          <image src="/static/images/icon-account.png" class="form-icon"></image>
          <input 
            class="form-input" 
            v-model="registerForm.username" 
            placeholder="请设置用户名"
            maxlength="20"
          ></input>
        </view>
        <view class="form-item">
          <image src="/static/images/icon-password.png" class="form-icon"></image>
          <input 
            class="form-input" 
            v-model="registerForm.password" 
            placeholder="请设置密码"
            :password="!showPassword"
            maxlength="20"
          ></input>
        </view>
        <view class="form-item">
          <image src="/static/images/icon-phone.png" class="form-icon"></image>
          <input 
            class="form-input" 
            v-model="registerForm.phone" 
            placeholder="请输入手机号"
            type="number"
            maxlength="11"
          ></input>
        </view>
        <button class="account-login-btn" @click="handleRegister" :disabled="isLoginIng">
          <text v-if="isLoginIng">注册中...</text>
          <text v-else>立即注册</text>
        </button>
        <view class="account-footer">
          <text class="register-link" @click="toggleRegisterMode(false)">返回登录</text>
        </view>
      </block>
    </view>

    <!-- 忘记密码提示 (网页端暂不支持微信手机号验证，提示联系客服或暂不支持) -->
    <view class="forget-modal" v-if="forgetModalVisible">
      <view class="forget-content">
        <text class="forget-title">找回密码</text>
        <text class="forget-tip">网页端暂不支持在线找回密码，请联系客服处理。</text>
        <button class="confirm-btn" @click="forgetModalVisible = false">确定</button>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import { useChatStore } from '@/store/modules/chatStore';
import socketService from '@/utils/websocket';
import request from '@/utils/request';

// 状态管理
const userStore = useUserStore();
const chatStore = useChatStore();

// 页面数据
const isRegisterMode = ref(false); // 是否处于注册模式
const accountForm = ref({ username: '', password: '' }); // 账号密码表单
const registerForm = ref({ username: '', password: '', phone: '' }); // 注册表单
const showPassword = ref(false); // 密码显示状态
const isLoginIng = ref(false); // 登录中状态
const forgetModalVisible = ref(false); // 忘记密码弹窗

// 切换注册模式
const toggleRegisterMode = (mode) => {
  isRegisterMode.value = mode;
  showPassword.value = false;
};

// 切换密码显示/隐藏
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

// 返回上一页或首页
const goBack = () => {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.reLaunch({
      url: '/pages/main/index/index'
    });
  }
};

// 手机号正则校验
const validatePhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone);
};

// 忘记密码处理
const handleForgetPassword = () => {
  forgetModalVisible.value = true;
};

// 处理注册
const handleRegister = async () => {
  if (isLoginIng.value) return;

  const { username, password, phone } = registerForm.value;

  if (!username.trim()) return uni.showToast({ title: '请输入用户名', icon: 'none' });
  if (!password.trim()) return uni.showToast({ title: '请输入密码', icon: 'none' });
  if (!phone.trim()) return uni.showToast({ title: '请输入手机号', icon: 'none' });
  if (!validatePhone(phone)) return uni.showToast({ title: '手机号格式错误', icon: 'none' });

  isLoginIng.value = true;
  uni.showLoading({ title: '正在注册...', mask: true });

  try {
    const res = await request({
      url: '/api/user/create/account',
      method: 'POST',
      params: { username, password, phone },
      data: {}
    });

    if (res && res.success) {
      uni.showToast({ title: '注册成功，请登录', icon: 'success' });
      toggleRegisterMode(false);
      accountForm.value.username = username;
    } else {
      uni.showToast({ title: res.message || '注册失败', icon: 'none' });
    }
  } catch (error) {
    console.error('注册异常:', error);
    uni.showToast({ title: '网络请求失败', icon: 'none' });
  } finally {
    isLoginIng.value = false;
    uni.hideLoading();
  }
};

/**
 * 统一登录成功处理逻辑
 */
const handleLoginSuccess = async (resData) => {
  const token = resData.accessToken || resData.token;
  const userInfo = resData.userInfo;
  
  if (!token || !userInfo) {
    uni.showToast({ title: '登录数据异常', icon: 'none' });
    return;
  }

  try {
    userStore.setUserInfo(resData);
    socketService.connect(token);
    socketService.on('PUSH_MSG', (data) => chatStore.handlePushMsg(data));
    socketService.on('MSG_ACK', (data) => chatStore.handleMsgAck(data));

    uni.showToast({ 
      title: '登录成功', 
      icon: 'success',
      duration: 1500
    });

    // 异步合并购物车
    mergeLocalCart().catch(err => console.error('合并购物车失败:', err));

    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/main/index/index'
      });
    }, 1500);
  } catch (error) {
    console.error('处理登录成功逻辑异常:', error);
    uni.showToast({ title: '登录处理失败', icon: 'none' });
  }
};

// 账号密码登录
const accountLogin = async () => {
  if (isLoginIng.value) return;

  const username = accountForm.value.username.trim();
  const password = accountForm.value.password.trim();

  if (!username) return uni.showToast({ title: '请输入用户名', icon: 'none' });
  if (!password) return uni.showToast({ title: '请输入密码', icon: 'none' });

  isLoginIng.value = true;
  uni.showLoading({ title: '正在登录...', mask: true });

  try {
    const res = await request({
      url: '/api/user/login/account',
      method: 'POST',
      data: { username, password },
      timeout: 20000
    });

    if (res && res.success) {
      uni.hideLoading();
      await handleLoginSuccess(res.data);
    } else {
      uni.hideLoading();
      uni.showToast({ title: res ? res.message : '用户名或密码错误', icon: 'none' });
    }
  } catch (error) {
    uni.hideLoading();
    uni.showToast({ title: '网络连接异常，请稍后重试', icon: 'none' });
  } finally {
    isLoginIng.value = false;
  }
};

// 合并本地购物车
const mergeLocalCart = async () => {
  try {
    const tempCart = uni.getStorageSync('cartTemp') || [];
    if (tempCart.length === 0) return;
    await request({
      url: '/api/cart/merge',
      method: 'POST',
      data: { cartItems: tempCart }
    });
    uni.removeStorageSync('cartTemp');
  } catch (error) {
    console.warn('购物车合并失败:', error);
  }
};

onLoad(() => {
  const token = uni.getStorageSync('token');
  if (token) {
    uni.reLaunch({ url: '/pages/main/index/index' });
  }
});
</script>

<style scoped>
.login-container {
  background-color: #FFFFFF;
  min-height: 100vh;
  padding: 80rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.login-logo {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  margin-bottom: 24rpx;
  margin-top: 60rpx;
}
.login-title {
  font-size: 36rpx;
  color: #333333;
  font-weight: bold;
  margin-bottom: 100rpx;
}
.account-login {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}
.form-item {
  display: flex;
  align-items: center;
  height: 100rpx;
  border-bottom: 1rpx solid #EEEEEE;
  padding: 0 10rpx;
}
.form-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 24rpx;
  opacity: 0.6;
}
.form-input {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  color: #333333;
}
.eye-icon {
  width: 40rpx;
  height: 40rpx;
  margin-left: 24rpx;
  opacity: 0.6;
}
.account-login-btn {
  width: 100%;
  height: 90rpx;
  background-color: #D4B886;
  color: #FFFFFF;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-top: 60rpx;
  box-shadow: 0 6rpx 16rpx rgba(212, 184, 134, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.account-login-btn:disabled {
  background-color: #E8D7BF;
}
.cancel-login-btn {
  width: 100%;
  height: 90rpx;
  background-color: #F8F8F8;
  color: #666666;
  border-radius: 45rpx;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #E0E0E0;
}
.account-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 40rpx;
  padding: 0 10rpx;
}
.register-link {
  font-size: 28rpx;
  color: #D4B886;
}
.forget-password {
  font-size: 28rpx;
  color: #999999;
}
.forget-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.forget-content {
  width: 80%;
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.forget-title {
  font-size: 34rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
}
.forget-tip {
  font-size: 28rpx;
  color: #666666;
  text-align: center;
  margin-bottom: 50rpx;
  line-height: 1.5;
}
.confirm-btn {
  width: 200rpx;
  height: 70rpx;
  background-color: #D4B886;
  color: #FFFFFF;
  border-radius: 35rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
