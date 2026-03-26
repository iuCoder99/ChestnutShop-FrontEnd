<!-- 功能说明
展示品牌简介、联系方式、工厂地址，支持电话拨打、地址导航，核心对接品牌信息接口，补充用户端基础功能闭环。 -->
<template>
  <view class="about-container">
    <!-- 得物风顶部导航栏 -->
    <TopNavbar activePage="about" />
    
    <!-- 品牌信息区域 - 移出 body 以实现全屏宽度 -->
    <view class="brand-info">
      <view class="brand-banner-wrap">
        <image :src="brandInfo.image || '/static/images/brand-logo.png'" class="brand-banner" mode="aspectFill"></image>
        <view class="brand-overlay"></view>
      </view>
      <view class="brand-content">
        <text class="brand-name">{{ brandInfo.factoryName || '某某家具装修工厂' }}</text>
        <view class="brand-tag-line">
          <text class="tag-item">品质保证</text>
          <text class="tag-divider">|</text>
          <text class="tag-item">源头工厂</text>
          <text class="tag-divider">|</text>
          <text class="tag-item">极速交付</text>
        </view>
      </view>
    </view>

    <view class="about-content-body">
      <!-- 品牌价值观 -->
      <view class="values-grid">
        <view class="value-item">
          <text class="value-num">01</text>
          <text class="value-label">匠心工艺</text>
        </view>
        <view class="value-item">
          <text class="value-num">02</text>
          <text class="value-label">环保材料</text>
        </view>
        <view class="value-item">
          <text class="value-num">03</text>
          <text class="value-label">售后无忧</text>
        </view>
      </view>

      <!-- 工厂简介 -->
      <view class="intro-section" v-if="brandInfo.introduction">
        <view class="section-header">
          <text class="section-title">工厂简介</text>
        </view>
        <text class="intro-content">{{ brandInfo.introduction }}</text>
      </view>

      <!-- 联系方式 -->
      <view class="contact-section">
        <view class="section-header">
          <text class="section-title">联系方式</text>
        </view>
        <view class="contact-list">
          <view class="contact-item" @click="makePhoneCall" v-if="brandInfo.serviceHotline">
            <view class="item-left">
              <image src="/static/images/icon-phone.png" class="contact-icon"></image>
              <text class="contact-label">服务热线</text>
            </view>
            <view class="item-right">
              <text class="contact-value">{{ brandInfo.serviceHotline }}</text>
              <image src="/static/images/icon-arrow-right.png" class="arrow-icon"></image>
            </view>
          </view>
          <view class="contact-item" @click="copyWechat" v-if="brandInfo.officialWechat">
            <view class="item-left">
              <image src="/static/images/icon-wechat.png" class="contact-icon"></image>
              <text class="contact-label">官方微信</text>
            </view>
            <view class="item-right">
              <text class="contact-value">{{ brandInfo.officialWechat }}</text>
              <text class="copy-tag">复制</text>
            </view>
          </view>
          <view class="contact-item" @click="openMap" v-if="brandInfo.address">
            <view class="item-left">
              <image src="/static/images/icon-address.png" class="contact-icon"></image>
              <text class="contact-label">工厂地址</text>
            </view>
            <view class="item-right">
              <text class="contact-value">{{ brandInfo.address }}</text>
              <image src="/static/images/icon-arrow-right.png" class="arrow-icon"></image>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部版权信息 -->
      <view class="copyright" v-if="brandInfo.copyrightInfo">
        <text>{{ brandInfo.copyrightInfo }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import TopNavbar from '@/components/business/TopNavbar.vue';
import request from '@/utils/request';

// 页面数据
const brandInfo = ref({
  image: '',
  factoryName: '',
  introduction: '',
  serviceHotline: '',
  officialWechat: '',
  address: '',
  copyrightInfo: ''
});

// 页面加载时获取品牌信息
onLoad(() => {
  getBrandInfo();
});

// 接口请求：获取品牌信息
const getBrandInfo = async () => {
  try {
    const res = await request({
      url: '/api/about/us/introduce',
      method: 'GET'
    });
    if (res.success) {
      brandInfo.value = res.data;
    }
  } catch (error) {
    console.log('品牌信息加载失败', error);
  }
};

// 拨打服务热线
const makePhoneCall = () => {
  if (!brandInfo.value.serviceHotline) return;
  uni.makePhoneCall({
    phoneNumber: brandInfo.value.serviceHotline,
    fail: () => {
      uni.showToast({ title: '拨打电话失败', icon: 'none' });
    }
  });
};

// 复制微信
const copyWechat = () => {
  if (!brandInfo.value.officialWechat) return;
  uni.setClipboardData({
    data: brandInfo.value.officialWechat,
    success: () => {
      uni.showToast({ title: '微信已复制', icon: 'success' });
    }
  });
};

// 打开地图导航
const openMap = () => {
  if (!brandInfo.value.address) return;
  // 由于接口没返回经纬度，这里尝试通过地址搜索或提示
  // 如果需要精准导航，建议接口补充经纬度
  uni.showModal({
    title: '地址信息',
    content: brandInfo.value.address,
    confirmText: '去这里',
    success: (res) => {
      if (res.confirm) {
        // 如果有经纬度可以使用 uni.openLocation
        // 这里暂时提示
        uni.showToast({ title: '功能开发中', icon: 'none' });
      }
    }
  });
};
</script>

<style scoped>
.about-container {
  background-color: #F8F8F8;
  min-height: 100vh;
}

/* 品牌信息 */
.brand-info {
  position: relative;
  width: 100%;
  height: 400rpx;
  background-color: #000000;
  overflow: hidden;
}

.brand-banner-wrap {
  width: 100%;
  height: 100%;
}

.brand-banner {
  width: 100%;
  height: 100%;
  opacity: 0.85;
}

.brand-overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(0,0,0,0.8) 100%);
}

.brand-content {
  position: absolute;
  left: 40rpx;
  bottom: 40rpx;
  right: 40rpx;
}

.brand-name {
  font-size: 44rpx;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 2rpx;
  text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.5);
}

.brand-tag-line {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}

.tag-item {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 1rpx;
}

.tag-divider {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 16rpx;
}

.about-content-body {
  padding: 30rpx 40rpx;
}

/* 品牌价值观 */
.values-grid {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.value-item {
  flex: 1;
  background-color: #FFFFFF;
  padding: 30rpx 20rpx;
  border-radius: 20rpx;
  margin-right: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
}

.value-item:last-child {
  margin-right: 0;
}

.value-num {
  font-size: 36rpx;
  font-weight: 800;
  color: #F0F0F0;
  font-style: italic;
  margin-bottom: 10rpx;
}

.value-label {
  font-size: 24rpx;
  font-weight: 600;
  color: #333333;
}

/* 通用 section 样式 */
.intro-section, .contact-section {
  margin-bottom: 30rpx;
  background-color: #FFFFFF;
  padding: 36rpx;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.05);
}

.section-header {
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1A1A1A;
  position: relative;
  padding-left: 24rpx;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8rpx;
  height: 32rpx;
  background-color: #000000;
  border-radius: 4rpx;
}

/* 简介内容 */
.intro-content {
  font-size: 28rpx;
  color: #4A4A4A;
  line-height: 1.8;
  text-align: justify;
}

/* 联系方式列表 */
.contact-list {
  display: flex;
  flex-direction: column;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
  transition: all 0.2s ease;
}

.contact-item:active {
  opacity: 0.6;
  background-color: #FAFAFA;
}

.contact-item:last-child {
  border-bottom: none;
}

.item-left {
  display: flex;
  align-items: center;
}

.contact-icon {
  width: 36rpx;
  height: 36rpx;
  margin-right: 20rpx;
}

.contact-label {
  font-size: 28rpx;
  color: #666666;
}

.item-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-left: 30rpx;
  overflow: hidden;
}

.contact-value {
  font-size: 28rpx;
  color: #1A1A1A;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.copy-tag {
  font-size: 22rpx;
  color: #000000;
  padding: 6rpx 20rpx;
  background-color: #F5F5F5;
  border-radius: 30rpx;
  margin-left: 20rpx;
}

.arrow-icon {
  width: 24rpx;
  height: 24rpx;
  margin-left: 12rpx;
  opacity: 0.3;
}

/* 版权信息 */
.copyright {
  padding: 60rpx 0 100rpx;
  text-align: center;
}

.copyright text {
  font-size: 24rpx;
  color: #BFBFBF;
  letter-spacing: 1rpx;
}
</style>
