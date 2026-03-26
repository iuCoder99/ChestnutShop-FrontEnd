<!-- 功能说明
展示订单物流信息，包括快递公司、物流单号，
以时间轴形式呈现物流节点（揽收、运输、派送、签收），最新节点置顶，支持异常状态提示，核心对接物流信息接口。 -->

<template>
  <view class="logistics-container">
    <!-- 页面头部 -->
    <view class="page-header">
      <text class="header-title">物流跟踪</text>
      <button class="back-btn" @click="navigateBack">
        <image src="/static/images/back.png" class="back-icon"></image>
      </button>
    </view>

    <!-- 物流基本信息 -->
    <view class="logistics-base">
      <view class="logistics-company">
        <text class="base-label">快递公司：</text>
        <text class="base-value">{{logisticsInfo.expressCompany || '暂无'}}</text>
      </view>
      <view class="logistics-no">
        <text class="base-label">物流单号：</text>
        <text class="base-value">{{logisticsInfo.expressNo || '暂无'}}</text>
        <button class="copy-btn" @click="copyLogisticsNo" v-if="logisticsInfo.expressNo">复制</button>
      </view>
    </view>

    <!-- 物流状态提示 -->
    <view class="logistics-status" v-if="logisticsTraces.length > 0">
      <text class="status-text">{{getLogisticsStatus()}}</text>
    </view>

    <!-- 物流时间轴 -->
    <view class="logistics-timeline" v-if="logisticsTraces.length > 0">
      <view 
        class="timeline-item" 
        v-for="(trace, index) in logisticsTraces" 
        :key="index"
        :class="{ active: index === 0 }"
      >
        <!-- 时间轴节点 -->
        <view class="timeline-node">
          <view class="node-dot"></view>
          <view class="node-line" v-if="index < logisticsTraces.length - 1"></view>
        </view>
        <!-- 时间轴内容 -->
        <view class="timeline-content">
          <text class="content-desc">{{trace.desc}}</text>
          <text class="content-time">{{formatTime(trace.time)}}</text>
        </view>
      </view>
    </view>

    <!-- 无物流信息状态 -->
    <view class="empty-logistics" v-else>
      <image src="/static/images/empty-logistics.png" class="empty-img"></image>
      <text class="empty-text">暂无物流更新，请耐心等待</text>
      <text class="empty-desc">若长时间未更新，可联系客服咨询</text>
      <button class="contact-btn" @click="contactService">联系客服</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import request from '@/utils/request';

// 状态管理
const userStore = useUserStore();

// 路由参数
const orderNo = ref('');

// 页面数据
const logisticsInfo = ref({
  expressCompany: '', // 快递公司
  expressNo: '', // 物流单号
  logisticsTraces: [] // 物流轨迹
});
const logisticsTraces = ref([]); // 排序后的物流轨迹（最新在前）

// 页面加载时获取物流信息
onLoad((options) => {
  orderNo.value = options.orderNo;
  if (!userStore.token || !orderNo.value) {
    uni.navigateBack();
    return;
  }
  getLogisticsInfo();
});

// 接口请求：获取物流信息
const getLogisticsInfo = async () => {
  uni.showLoading({ title: '加载中' });
  try {
    const res = await request({
      url: '/api/order/logistics',
      method: 'GET',
      data: { orderNo: orderNo.value }
    });
    if (res.success) {
      logisticsInfo.value = res.data;
      // 排序：最新的物流轨迹在前
      logisticsTraces.value = res.data.logisticsTraces.sort((a, b) => new Date(b.time) - new Date(a.time));
    }
  } catch (error) {
    uni.showToast({ title: '物流信息加载失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

// 格式化时间（YYYY-MM-DD HH:mm:ss）
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

// 获取物流状态文本
const getLogisticsStatus = () => {
  if (logisticsTraces.length === 0) return '';
  const latestTrace = logisticsTraces[0].desc;
  if (latestTrace.includes('签收')) {
    return '已签收';
  } else if (latestTrace.includes('派送')) {
    return '派送中';
  } else if (latestTrace.includes('运输')) {
    return '运输中';
  } else if (latestTrace.includes('揽收')) {
    return '已揽收';
  } else {
    return '物流更新中';
  }
};

// 复制物流单号
const copyLogisticsNo = () => {
  uni.setClipboardData({
    data: logisticsInfo.value.expressNo,
    success: () => {
      uni.showToast({ title: '复制成功' });
    },
    fail: () => {
      uni.showToast({ title: '复制失败', icon: 'none' });
    }
  });
};

// 联系客服
const contactService = () => {
  uni.openCustomerServiceChat({
    extInfo: { url: 'https://work.weixin.qq.com/kfid/kfc8**********' },
    success: () => {},
    fail: () => {
      uni.showToast({ title: '客服功能暂不可用', icon: 'none' });
    }
  });
};

// 返回上一页
const navigateBack = () => {
  uni.navigateBack();
};
</script>

<style scoped>
.logistics-container {
  background-color: #FFFFFF;
  min-height: 100vh;
  padding: 20rpx;
  position: relative;
}

/* 页面头部 */
.page-header {
  position: relative;
  text-align: center;
  margin-bottom: 30rpx;
  padding-top: 10rpx;
}

.header-title {
  font-size: 20rpx;
  font-weight: bold;
  color: #333333;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 10rpx;
  background-color: transparent;
  padding: 0;
  display: flex;
  align-items: center;
}

.back-icon {
  width: 24rpx;
  height: 24rpx;
  color: #333333;
}

/* 物流基本信息 */
.logistics-base {
  background-color: #F9F9F9;
  border-radius: 8rpx;
  padding: 16rpx;
  margin-bottom: 24rpx;
}

.logistics-company, .logistics-no {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.logistics-company:last-child, .logistics-no:last-child {
  margin-bottom: 0;
}

.base-label {
  font-size: 14rpx;
  color: #666666;
  width: 120rpx;
}

.base-value {
  font-size: 14rpx;
  color: #333333;
  flex: 1;
}

.copy-btn {
  font-size: 12rpx;
  color: #D4B886;
  background-color: transparent;
  padding: 0 8rpx;
}

/* 物流状态提示 */
.logistics-status {
  margin-bottom: 20rpx;
  padding: 12rpx;
  background-color: #FFF8E1;
  border-radius: 8rpx;
}

.status-text {
  font-size: 14rpx;
  color: #D4B886;
  display: block;
  text-align: center;
}

/* 物流时间轴 */
.logistics-timeline {
  padding-left: 16rpx;
}

.timeline-item {
  display: flex;
  margin-bottom: 24rpx;
  position: relative;
}

.timeline-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 16rpx;
}

.node-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background-color: #EEEEEE;
  position: relative;
  z-index: 2;
}

.timeline-item.active .node-dot {
  background-color: #D4B886;
}

.node-line {
  width: 2rpx;
  flex: 1;
  background-color: #EEEEEE;
  margin-top: -2rpx;
}

.timeline-content {
  flex: 1;
  padding-bottom: 24rpx;
  border-bottom: 1rpx dashed #EEEEEE;
}

.timeline-item:last-child .timeline-content {
  border-bottom: none;
  padding-bottom: 0;
}

.content-desc {
  font-size: 16rpx;
  color: #333333;
  margin-bottom: 8rpx;
  display: block;
}

.timeline-item.active .content-desc {
  font-weight: bold;
  color: #D4B886;
}

.content-time {
  font-size: 12rpx;
  color: #999999;
}

/* 无物流信息状态 */
.empty-logistics {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 200rpx;
}

.empty-img {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 16rpx;
  color: #666666;
  margin-bottom: 8rpx;
}

.empty-desc {
  font-size: 14rpx;
  color: #999999;
  margin-bottom: 30rpx;
}

.contact-btn {
  width: 200rpx;
  height: 80rpx;
  background-color: #D4B886;
  color: #FFFFFF;
  border-radius: 8rpx;
  font-size: 16rpx;
}
</style>