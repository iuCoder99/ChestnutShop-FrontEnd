<!-- 功能说明
支付完成后跳转页面，展示订单号、支付金额、预计发货时间，
提供 “查看订单”“继续购物” 入口，核心对接订单详情接口，完善支付闭环 -->
<template>
  <view class="pay-success-container">
    <!-- 成功图标 -->
    <view class="success-icon-container">
      <image src="/static/images/pay-success.png" class="success-icon" />
      <text class="success-text">订单支付成功</text>
      <text class="sub-success-text">感谢您的购买，我们将尽快为您安排发货</text>
    </view>

    <!-- 订单信息卡片 -->
    <view class="order-card">
      <view class="order-info-item">
        <text class="info-label">订单号</text>
        <text class="info-value">{{ orderInfo.orderNo || '-' }}</text>
      </view>
      <view class="order-info-item">
        <text class="info-label">支付金额</text>
        <text class="info-value amount">¥{{ formatPrice(orderInfo.totalAmount) }}</text>
      </view>
      <view class="order-info-item">
        <text class="info-label">预计发货</text>
        <text class="info-value">{{ deliveryTime || '3-5个工作日' }}</text>
      </view>
      <view class="order-info-item">
        <text class="info-label">服务提示</text>
        <text class="info-value tip">客服将尽快与您联系确认订单细节</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="btn-group">
      <button class="btn secondary" @click="goToHome">继续购物</button>
      <button class="btn primary" @click="goToOrderDetail">查看订单</button>
    </view> <!-- 补上 btn-group 的闭合标签 -->
  </view> <!-- 补上根 view 的闭合标签 -->
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onBackPress } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import request from '@/utils/request';

// 状态管理
const userStore = useUserStore();

// 页面数据
const orderNo = ref(''); // 订单号
const orderInfo = ref({
  orderNo: '',
  totalAmount: 0,
  orderItems: []
}); // 订单信息
const deliveryTime = ref(''); // 预计发货时间

// 监听返回键，直接返回首页或商品页，避免回到支付流程
onBackPress(() => {
  if (orderInfo.value.orderItems && orderInfo.value.orderItems.length > 0) {
    const productId = orderInfo.value.orderItems[0].productId;
    uni.reLaunch({
      url: `/pages/product/detail/detail?productId=${productId}`
    });
  } else {
    uni.reLaunch({ url: '/pages/main/index/index' });
  }
  return true; // 拦截默认返回
});

// 格式化价格
const formatPrice = (price) => {
  const num = parseFloat(price);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

// 页面加载获取订单信息
onLoad((options) => {
  if (!userStore.token) {
    uni.navigateTo({ url: '/pages/main/login/login' });
    return;
  }
  orderNo.value = options.orderNo || '';
  // 先从参数中获取基本信息进行展示，防止接口延迟导致空白
  orderInfo.value.orderNo = orderNo.value;
  if (options.amount) {
    orderInfo.value.totalAmount = parseFloat(options.amount);
  }
  
  if (orderNo.value) {
    getOrderDetail();
    calculateDeliveryTime();
  }
});

// 获取订单详情
const getOrderDetail = async () => {
  uni.showLoading({ title: '加载中' });
  try {
    const res = await request({
      url: '/api/order/detail',
      method: 'GET',
      params: { orderNo: orderNo.value }
    });
    if (res.success || res.code === 200) {
      orderInfo.value = res.data || res.result;
    }
  } catch (error) {
    uni.showToast({ title: '订单信息加载失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

// 计算预计发货时间（当前日期+3天）
const calculateDeliveryTime = () => {
  const now = new Date();
  const deliveryDate = new Date(now.setDate(now.getDate() + 3));
  const year = deliveryDate.getFullYear();
  const month = (deliveryDate.getMonth() + 1).toString().padStart(2, '0');
  const day = deliveryDate.getDate().toString().padStart(2, '0');
  deliveryTime.value = `${year}-${month}-${day}前`;
};

// 跳转首页
const goToHome = () => {
  uni.reLaunch({ url: '/pages/main/index/index' });
};

// 跳转订单详情页
const goToOrderDetail = () => {
  uni.navigateTo({ url: `/pages/order/detail/detail?orderNo=${orderNo.value}` });
};
</script>

<style scoped>
.pay-success-container {
  background-color: #F8F8F8;
  min-height: 100vh;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 成功图标区域 */
.success-icon-container {
  margin-top: 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.success-icon {
  width: 140rpx;
  height: 140rpx;
  margin-bottom: 30rpx;
}

.success-text {
  font-size: 40rpx;
  color: #333333;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.sub-success-text {
  font-size: 26rpx;
  color: #999999;
}

/* 订单卡片 */
.order-card {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 80rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.order-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.order-info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 28rpx;
  color: #999999;
}

.info-value {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.amount {
  font-size: 32rpx;
  color: #D4B886;
  font-weight: bold;
}

.tip {
  color: #D4B886;
  font-size: 26rpx;
}

/* 按钮组 */
.btn-group {
  display: flex;
  gap: 30rpx;
  width: 100%;
  padding: 0 40rpx;
  box-sizing: border-box;
  margin-top: auto;
  margin-bottom: 60rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.btn.secondary {
  background-color: #FFFFFF;
  border: 2rpx solid #D4B886;
  color: #D4B886;
}

.btn.primary {
  background-color: #D4B886;
  color: #FFFFFF;
}
</style>