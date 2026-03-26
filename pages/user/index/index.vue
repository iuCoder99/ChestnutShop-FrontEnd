<!-- 功能说明
用户个人中心核心页面，展示用户基础信息（含openid调试信息）、企业认证状态，提供收藏、咨询、反馈、关于我们等入口，
核心对接用户信息接口，同步展示含openid的用户数据。 -->
<template>
  <view class="user-center-container">
    <!-- 得物风顶部导航栏 -->
    <TopNavbar activePage="user" />
    
    <view class="user-content-body">
      <!-- 用户信息卡片 -->
      <view class="user-info-card" @click="handleUserClick" hover-class="card-hover">
        <view class="user-info-left">
          <image :src="userInfo.avatar || '/static/images/icon-user.png'" class="user-avatar"></image>
          <view class="user-base-info">
            <view class="user-name-wrapper">
              <text class="user-nickname">{{userStore.token ? (userInfo.nickname || '匿名用户') : '未登录'}}</text>
              <view class="edit-hint">
                <text class="hint-text">点击编辑个人资料</text>
              </view>
            </view>
            <block v-if="userStore.token">
              <view class="user-tags">
                <text class="user-role" :class="userInfo.userType === 'ENTERPRISE' ? 'role-enterprise' : 'role-personal'">
                  {{userInfo.userType === 'ENTERPRISE' ? '企业用户' : '个人用户'}}
                </text>
                <!-- 企业认证状态 -->
                <text class="auth-status" v-if="userInfo.userType === 'ENTERPRISE'">
                  认证状态：{{userInfo.isEnterpriseAuth ? '已认证' : '未认证'}}
                  <button class="auth-btn" @click.stop="goToEnterpriseAuth" v-if="!userInfo.isEnterpriseAuth">去认证</button>
                </text>
              </view>
            </block>
            <text class="login-tip" v-else>点击登录/注册</text>
            <!-- 调试用：显示openid（正式环境可隐藏） -->
            <text class="user-openid" v-if="userStore.token && userInfo.openid">
              微信标识：{{userInfo.openid.slice(0, 8)}}****{{userInfo.openid.slice(-4)}}
            </text>
          </view>
        </view>
        
        <view class="address-tag-wrapper" v-if="userStore.token" @click.stop="goToAddressList">
          <view class="address-tag">
            <text class="address-tag-text">收货地址</text>
            <image src="/static/images/icon-arrow-right.png" class="tag-arrow"></image>
          </view>
        </view>
      </view>

      <!-- 我的订单 -->
      <view class="order-card">
        <view class="order-header">
          <text class="order-title">我的订单</text>
          <view class="check-all-btn" @click="goToOrderList('allPage')">
            <text class="check-all-text">查看全部订单</text>
            <image src="/static/images/icon-arrow-right.png" class="arrow-icon"></image>
          </view>
        </view>
        <view class="order-status-row">
          <view class="status-item" @click="goToOrderList('pendingPayPage')" hover-class="status-hover">
            <view class="status-icon-wrapper">
              <image src="/static/images/icon-pay.png" class="status-icon" mode="aspectFit"></image>
            </view>
            <text class="status-text">待付款</text>
          </view>
          <view class="status-item" @click="goToOrderList('packagingPage')" hover-class="status-hover">
            <view class="status-icon-wrapper">
              <image src="/static/images/icon-pack.png" class="status-icon" mode="aspectFit"></image>
            </view>
            <text class="status-text">打包中</text>
          </view>
          <view class="status-item" @click="goToOrderList('pendingReceiptPage')" hover-class="status-hover">
            <view class="status-icon-wrapper">
              <image src="/static/images/icon-receive.png" class="status-icon" mode="aspectFit"></image>
            </view>
            <text class="status-text">待收货</text>
          </view>
          <view class="status-item" @click="goToOrderList('pendingEvalPage')" hover-class="status-hover">
            <view class="status-icon-wrapper">
              <image src="/static/images/icon-comment.png" class="status-icon" mode="aspectFit"></image>
            </view>
            <text class="status-text">评价</text>
          </view>
        </view>
      </view>

      <!-- 功能入口 -->
      <view class="function-list">
        <view class="function-item" @click="goToCollection" hover-class="item-hover">
          <image src="/static/images/icon-collection.png" class="function-icon"></image>
          <text class="function-text">我的收藏</text>
          <view class="item-right">
            <text class="item-hint">已收藏宝贝</text>
            <image src="/static/images/icon-arrow-right.png" class="arrow-icon"></image>
          </view>
        </view>
        <view class="function-item" @click="goToConsult" hover-class="item-hover">
          <image src="/static/images/icon-comment.png" class="function-icon"></image>
          <text class="function-text">我的咨询</text>
          <view class="item-right">
            <view v-if="chatStore.unreadTotal > 0" class="unread-dot">{{ chatStore.unreadTotal > 99 ? '99+' : chatStore.unreadTotal }}</view>
            <text class="item-hint">客服会话</text>
            <image src="/static/images/icon-arrow-right.png" class="arrow-icon"></image>
          </view>
        </view>
        <view class="function-item" @click="goToFeedback" hover-class="item-hover">
          <image src="/static/images/icon-feedback.png" class="function-icon"></image>
          <text class="function-text">意见反馈</text>
          <view class="item-right">
            <text class="item-hint">告诉我们你的想法</text>
            <image src="/static/images/icon-arrow-right.png" class="arrow-icon"></image>
          </view>
        </view>
        <view class="function-item" @click="goToAbout" hover-class="item-hover">
          <image src="/static/images/icon-about.png" class="function-icon"></image>
          <text class="function-text">关于我们</text>
          <view class="item-right">
            <text class="item-hint">栗子商城 v1.0.0</text>
            <image src="/static/images/icon-arrow-right.png" class="arrow-icon"></image>
          </view>
        </view>
        <view class="function-item logout-item" @click="logout" hover-class="item-hover">
          <image src="/static/images/icon-logout.png" class="function-icon"></image>
          <text class="function-text logout-text">退出登录</text>
          <image src="/static/images/icon-arrow-right.png" class="arrow-icon"></image>
        </view>
      </view>
    </view>
  </view>
</template>
<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import { useChatStore } from '@/store/modules/chatStore';
import request from '@/utils/request';
import TopNavbar from '@/components/business/TopNavbar.vue';
// 状态管理
const userStore = useUserStore();
const chatStore = useChatStore();
// 页面数据
const userInfo = ref({
  nickname: '',
  avatar: '',
  userType: 'PERSONAL',
  isEnterpriseAuth: false,
  openid: '' // 存储openid
});
// 页面显示时同步用户信息（含openid）
onShow(() => {
  if (!userStore.token) {
    // 未登录时重置用户信息
    userInfo.value = {
      nickname: '',
      avatar: '',
      userType: 'PERSONAL',
      isEnterpriseAuth: false,
      openid: ''
    };
    return;
  }
  // 从Pinia获取用户信息（含openid）
  const storeUserInfo = userStore.userInfo;
  if (storeUserInfo && Object.keys(storeUserInfo).length > 0) {
    userInfo.value = { ...storeUserInfo };
  } else {
    // 从接口重新拉取用户信息（确保openid最新）
    getUserDetail();
  }

  // 同步聊天会话列表，获取未读数
  chatStore.fetchSessions();
});
// 接口请求：获取用户详情（含openid）
const getUserDetail = async () => {
  uni.showLoading({ title: '加载中' });
  try {
    const res = await request({
      url: '/api/user/detail/get',
      method: 'GET'
    });
    if (res.success) {
      userInfo.value = res.data;
      // 同步到Pinia
      userStore.setUserInfo(res.data);
      // 同步到本地缓存
      uni.setStorageSync('userInfo', res.data);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    // 如果是 401 或其他认证错误，不跳转，保持未登录状态
  } finally {
    uni.hideLoading();
  }
};
// 处理用户信息区域点击
const handleUserClick = () => {
  if (!userStore.token) {
    uni.navigateTo({ url: '/pages/main/login/login' });
  } else {
    uni.navigateTo({ url: '/pages/user/profile/profile' });
  }
};
// 页面跳转：企业认证
const goToEnterpriseAuth = () => {
  uni.navigateTo({ url: '/pages/order/enterprise-auth' });
};
// 页面跳转：我的订单列表
const goToOrderList = (pageName = 'allPage') => {
  uni.navigateTo({ url: `/pages/order/list/list?pageName=${pageName}` });
};
// 页面跳转：我的收藏
const goToCollection = () => {
  uni.navigateTo({ url: '/pages/collection/index/index' });
};
// 页面跳转：我的咨询
const goToConsult = () => {
  uni.navigateTo({ url: '/pages/user/consult/consult' });
};
// 页面跳转：意见反馈
const goToFeedback = () => {
  uni.navigateTo({ url: '/pages/user/feedback/feedback' });
};
// 页面跳转：关于我们
const goToAbout = () => {
  uni.navigateTo({ url: '/pages/user/about/about' });
};
// 页面跳转：收货地址
const goToAddressList = () => {
  uni.navigateTo({ url: '/pages/address/list/list' });
};
// 退出登录
const logout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 清空Pinia和本地缓存
        userStore.logout();
        
        // 重置当前页面状态，解决退出后信息不清除的问题
        userInfo.value = {
          nickname: '',
          avatar: '',
          userType: 'PERSONAL',
          isEnterpriseAuth: false,
          openid: ''
        };
        
        uni.showToast({ title: '已退出登录', icon: 'none' });
        // 跳转登录页
        setTimeout(() => {
          uni.navigateTo({ url: '/pages/main/login/login' });
        }, 1000);
      }
    }
  });
};
</script>
<style scoped>
.user-center-container {
  background-color: #FFFFFF;
  min-height: 100vh;
}

.user-content-body {
  padding: 30rpx;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* 用户信息卡片 */
.user-info-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx;
  background: linear-gradient(135deg, #F9F9F9 0%, #F0F0F0 100%);
  border-radius: 24rpx;
  margin-bottom: 40rpx;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.03);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.user-info-card:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 12rpx 24rpx rgba(0,0,0,0.08);
  background: linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%);
}

.user-info-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.user-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  margin-right: 32rpx;
  border: 4rpx solid #FFFFFF;
  box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.user-info-card:hover .user-avatar {
  transform: scale(1.05) rotate(5deg);
}

.user-base-info {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  flex: 1;
}

.user-name-wrapper {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex-wrap: wrap;
}

.user-nickname {
  font-size: 40rpx;
  color: #333333;
  font-weight: bold;
}

.edit-hint {
  opacity: 0;
  transform: translateX(-10rpx);
  transition: all 0.3s ease;
  background-color: rgba(83, 186, 179, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.user-info-card:hover .edit-hint {
  opacity: 1;
  transform: translateX(0);
}

.hint-text {
  font-size: 20rpx;
  color: #53BAB3;
}

.user-tags {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.address-tag-wrapper {
  margin-left: 20rpx;
  padding-right: 10rpx;
}

.address-tag {
  display: flex;
  align-items: center;
  background-color: #53BAB3;
  padding: 16rpx 32rpx;
  border-radius: 40rpx;
  transition: all 0.3s;
  box-shadow: 0 4rpx 10rpx rgba(83, 186, 179, 0.3);
}

.address-tag:hover {
  background-color: #64C9C2;
  transform: scale(1.05);
}

.address-tag-text {
  font-size: 28rpx;
  color: #FFFFFF;
  font-weight: bold;
  margin-right: 8rpx;
}

.tag-arrow {
  width: 20rpx;
  height: 20rpx;
  filter: brightness(0) invert(1);
}

.login-tip {
  font-size: 28rpx;
  color: #999999;
}

.user-role {
  font-size: 20rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-weight: 500;
}

.role-personal {
  background-color: #FFF8E1;
  color: #FF7D00;
}

.role-enterprise {
  background-color: #E8F4F8;
  color: #1890FF;
}

.auth-status {
  font-size: 20rpx;
  color: #666666;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.auth-btn {
  font-size: 20rpx;
  color: #53BAB3;
  background-color: transparent;
  padding: 0;
  text-decoration: underline;
}

.user-openid {
  font-size: 18rpx;
  color: #BBBBBB;
  margin-top: 4rpx;
}

/* 我的订单 */
.order-card {
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.03);
  border: 1rpx solid #F0F0F0;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #F9F9F9;
}

.order-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  position: relative;
  padding-left: 20rpx;
}

.order-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8rpx;
  height: 32rpx;
  background-color: #53BAB3;
  border-radius: 4rpx;
}

.check-all-btn {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
  transition: all 0.3s;
}

.check-all-btn:hover {
  background-color: #F5F5F5;
}

.check-all-text {
  font-size: 26rpx;
  color: #999999;
  margin-right: 8rpx;
}

.order-status-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20rpx 0;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
}

.status-icon-wrapper {
  width: 100rpx;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F9F9F9;
  border-radius: 30rpx;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.status-item:hover .status-icon-wrapper {
  background-color: #E8F7F6;
  transform: translateY(-10rpx) scale(1.1);
  box-shadow: 0 10rpx 20rpx rgba(83, 186, 179, 0.15);
}

.status-icon {
  width: 56rpx;
  height: 56rpx;
}

.status-text {
  font-size: 26rpx;
  color: #666666;
  font-weight: 500;
  transition: color 0.3s;
}

.status-item:hover .status-text {
  color: #53BAB3;
  font-weight: bold;
}

/* 功能列表 */
.function-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.function-item {
  display: flex;
  align-items: center;
  padding: 32rpx 40rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  transition: all 0.3s;
  border: 1rpx solid #F5F5F5;
  cursor: pointer;
}

.function-item:hover {
  transform: translateX(10rpx);
  background-color: #F9F9F9;
  border-color: #53BAB3;
  box-shadow: 4rpx 4rpx 15rpx rgba(0,0,0,0.02);
}

.function-icon {
  width: 44rpx;
  height: 44rpx;
  margin-right: 24rpx;
}

.function-text {
  flex: 1;
  font-size: 30rpx;
  color: #333333;
  font-weight: 500;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.item-hint {
  font-size: 24rpx;
  color: #BBBBBB;
}

.unread-dot {
  background-color: #FF4D4F;
  color: #FFFFFF;
  font-size: 20rpx;
  min-width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 8rpx rgba(255, 77, 79, 0.3);
}

.logout-item {
  margin-top: 20rpx;
  border: 1rpx solid #FFEBEB;
}

.logout-item:hover {
  background-color: #FFF5F5;
  border-color: #FF4D4F;
}

.logout-text {
  color: #FF4D4F;
}

.arrow-icon {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.3;
}

.function-item:hover .arrow-icon {
  opacity: 0.8;
  transform: translateX(4rpx);
}

/* 移动端适配 */
@media screen and (max-width: 750px) {
  .user-content-body {
    padding: 20rpx;
  }
  
  .user-nickname {
    font-size: 36rpx;
  }
  
  .address-tag {
    padding: 12rpx 24rpx;
  }
  
  .address-tag-text {
    font-size: 24rpx;
  }
}
</style>