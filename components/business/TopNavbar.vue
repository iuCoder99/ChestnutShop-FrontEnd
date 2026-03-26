<template>
  <view class="top-nav-wrapper">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>
    
    <!-- 顶部导航栏 -->
    <view class="top-nav-bar">
      <view class="nav-content">
        <!-- Logo -->
        <image 
          src="/static/images/login-logo.png" 
          class="brand-logo" 
          :class="{ 'logo-animate': logoAnimate }"
          mode="aspectFit" 
          @click="handleLogoClick"
        ></image>
        
        <!-- 导航链接 -->
        <view class="nav-links">
          <text 
            :class="['nav-link-item', activePage === 'home' ? 'active' : '', (activePage === 'home' && homeAnimate) ? 'home-click-animate' : '']" 
            @click="goToTab('/pages/main/index/index', 'home')"
          >首页</text>
          <text :class="['nav-link-item', activePage === 'category' ? 'active' : '']" @click="goToTab('/pages/product/category/category', 'category')">分类</text>
          <text :class="['nav-link-item', activePage === 'cart' ? 'active' : '']" @click="goToTab('/pages/cart/index/index', 'cart')">购物车</text>
          <text :class="['nav-link-item', activePage === 'user' ? 'active' : '']" @click="goToTab('/pages/user/index/index', 'user')">我的</text>
          <text :class="['nav-link-item', activePage === 'feedback' ? 'active' : '']" @click="goToPage('/pages/user/feedback/feedback', 'feedback')">意见反馈</text>
          <text :class="['nav-link-item', activePage === 'about' ? 'active' : '']" @click="goToPage('/pages/user/about/about', 'about')">关于我们</text>
        </view>
        
        <!-- 右侧下载按钮 (无间距，紧贴最右侧) -->
        <view class="download-btn-container">
          <view class="download-btn">下载栗子好物App</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps, ref } from 'vue';

const props = defineProps({
  activePage: {
    type: String,
    default: 'home'
  }
});

const logoAnimate = ref(false);
const homeAnimate = ref(false);

const handleLogoClick = () => {
  if (logoAnimate.value) return;
  logoAnimate.value = true;
  uni.showToast({
    title: '栗子欢迎您',
    icon: 'none',
    duration: 1000
  });
  setTimeout(() => {
    logoAnimate.value = false;
  }, 1000);
};

const goToTab = (url, pageName) => {
  if (props.activePage === pageName) {
    if (pageName === 'home') {
      triggerHomeAnimate();
    }
    return;
  }
  uni.reLaunch({ url });
};

const goToPage = (url, pageName) => {
  if (props.activePage === pageName) return;
  uni.navigateTo({ url });
};

const triggerHomeAnimate = () => {
  if (homeAnimate.value) return;
  homeAnimate.value = true;
  uni.showToast({
    title: '已在首页',
    icon: 'none',
    duration: 1000
  });
  setTimeout(() => {
    homeAnimate.value = false;
  }, 1000);
};
</script>

<style scoped>
.top-nav-wrapper {
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 1000;
}

/* 状态栏占位 */
.status-bar {
  height: var(--status-bar-height);
  width: 100%;
  background-color: #000000;
}

/* 顶部导航栏 (深黑，去除右侧边距) */
.top-nav-bar {
  width: 100%;
  height: 120rpx;
  background-color: #000000;
  display: flex;
  align-items: center;
  padding: 0 0 0 40rpx; /* 左边距40rpx，右边距设为0 */
  box-sizing: border-box;
}

.nav-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-logo {
  width: 80rpx;
  height: 80rpx;
  margin-right: 40rpx;
  transition: all 0.3s ease;
}

.logo-animate {
  animation: logo-bounce 0.8s cubic-bezier(0.45, 0.05, 0.55, 0.95);
}

@keyframes logo-bounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.2) rotate(5deg); }
  50% { transform: scale(0.9) rotate(-5deg); }
  70% { transform: scale(1.1) rotate(2deg); }
  100% { transform: scale(1) rotate(0); }
}

.nav-links {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 0;
}

.nav-link-item {
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 50rpx;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.home-click-animate {
  animation: text-pulse 0.5s ease;
}

@keyframes text-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.nav-link-item:hover {
  opacity: 0.8;
  transform: translateY(-2rpx);
}

.nav-link-item:active {
  opacity: 0.7;
  transform: scale(0.95);
}

.nav-link-item.active {
  border-bottom: 6rpx solid #FFFFFF;
  padding-bottom: 4rpx;
  transform: translateY(0);
}

/* 下载按钮容器：紧贴最右侧 */
.download-btn-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  padding-right: 0rpx; /* 彻底去除最右侧空白 */
}

.download-btn {
  background-color: #53BAB3;
  color: #FFFFFF;
  font-size: 26rpx;
  font-weight: bold;
  padding: 14rpx 28rpx;
  border-radius: 4rpx;
  cursor: pointer;
  margin-right: 0rpx; /* 确保无额外边距 */
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.download-btn:hover {
  background-color: #64C9C2;
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 12rpx rgba(83, 186, 179, 0.4);
}

.download-btn:active {
  transform: scale(0.95);
  box-shadow: none;
}
</style>
