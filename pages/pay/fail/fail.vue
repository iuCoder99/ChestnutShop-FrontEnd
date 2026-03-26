<!-- 功能说明
支付失败后的反馈页面，展示失败原因（余额不足、支付超时等），提供 “重新支付”“返回订单列表”“联系客服” 入口，
核心对接订单状态查询接口，完善支付流程异常处理闭环。 -->

<template>
  <view class="pay-fail-container">
    <!-- 失败图标 -->
    <view class="fail-icon-container">
      <image src="/static/images/pay-fail.png" class="fail-icon"></image>
      <text class="fail-text">支付失败</text>
      <text class="fail-reason">{{failReason || '支付未完成，请重试'}}</text>
    </view>

    <!-- 订单信息卡片 -->
    <view class="order-card">
      <view class="order-info-item">
        <text class="info-label">订单号</text>
        <text class="info-value">{{orderInfo.orderNo || '-'}}</text>
      </view>
      <view class="order-info-item">
        <text class="info-label">待支付金额</text>
        <text class="info-value amount">¥{{orderInfo.totalAmount ? orderInfo.totalAmount.toFixed(2) : '0.00'}}</text>
      </view>
      <view class="order-info-item">
        <text class="info-label">支付有效期</text>
        <text class="info-value tip">剩余{{countdown}}分钟，超时订单将自动取消</text>
      </view>
    </view>

    <!-- 失败原因说明 -->
    <view class="reason-section">
      <text class="section-title">常见原因</text>
      <view class="reason-list">
        <view class="reason-item">
          <image src="/static/images/icon-warning.png" class="reason-icon"></image>
          <text class="reason-text">微信余额不足或银行卡限额</text>
        </view>
        <view class="reason-item">
          <image src="/static/images/icon-warning.png" class="reason-icon"></image>
          <text class="reason-text">网络异常导致支付结果未同步</text>
        </view>
        <view class="reason-item">
          <image src="/static/images/icon-warning.png" class="reason-icon"></image>
          <text class="reason-text">支付过程中手动取消支付</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="btn-group">
      <button class="btn secondary" @click="goToOrderList">返回订单列表</button>
      <button class="btn primary" @click="rePay">重新支付</button>
      <button class="btn tertiary" @click="contactService">联系客服</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import request from '@/utils/request';

// 状态管理
const userStore = useUserStore();

// 路由参数
const orderNo = ref('');
const failReason = ref('');

// 页面数据
const orderInfo = ref({}); // 订单信息
const countdown = ref(30); // 支付倒计时（分钟）
let countdownTimer = null; // 倒计时定时器

// 页面加载获取订单信息
onLoad((options) => {
  orderNo.value = options.orderNo || '';
  failReason.value = options.reason || '';
  if (!userStore.token || !orderNo.value) {
    uni.showToast({ title: '参数异常', icon: 'none' });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
    return;
  }
  getOrderDetail();
  startCountdown();
});

// 页面卸载清除定时器
onUnload(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});

// 获取订单详情
const getOrderDetail = async () => {
  uni.showLoading({ title: '加载中' });
  try {
    const res = await request({
      url: '/api/order/detail',
      method: 'GET',
      data: { orderNo: orderNo.value }
    });
    if (res.success) {
      orderInfo.value = res.data;
      // 计算剩余支付时间（假设订单创建后30分钟有效）
      const createTime = new Date(res.data.createTime).getTime();
      const expireTime = createTime + 30 * 60 * 1000;
      const remainingTime = Math.ceil((expireTime - new Date().getTime()) / (60 * 1000));
      countdown.value = remainingTime > 0 ? remainingTime : 0;
    }
  } catch (error) {
    uni.showToast({ title: '订单信息加载失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

// 启动倒计时
const startCountdown = () => {
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1;
    } else {
      clearInterval(countdownTimer);
      uni.showToast({ title: '订单已超时取消', icon: 'none' });
      setTimeout(() => {
        goToOrderList();
      }, 1500);
    }
  }, 60 * 1000);
};

// 重新支付
const rePay = () => {
  uni.navigateTo({
    url: `/pages/pay/index?orderNo=${orderNo.value}&amount=${orderInfo.value.totalAmount}`
  });
};

// 跳转订单列表
const goToOrderList = () => {
  uni.navigateTo({ url: '/pages/order/list?status=PENDING_PAYMENT' });
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
</script>

<style scoped>
.pay-fail-container {
  background-color: #FFFFFF;
  min-height: 100vh;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 失败图标区域 */
.fail-icon-container {
  margin-top: 100rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.fail-icon {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 20rpx;
}

.fail-text {
  font-size: 24rpx;
  color: #F53F3F;
  font-weight: bold;
  margin-bottom: 12rpx;
}

.fail-reason {
  font-size: 16rpx;
  color: #666666;
}

/* 订单卡片 */
.order-card {
  width: 100%;
  background-color: #F9F9F9;
  border-radius: 16rpx;
  padding: 30rpx 20rpx;
  margin-bottom: 40rpx;
}

.order-info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.order-info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 16rpx;
  color: #666666;
}

.info-value {
  font-size: 16rpx;
  color: #333333;
}

.amount {
  font-size: 20rpx;
  color: #F53F3F;
  font-weight: bold;
}

.tip {
  color: #F53F3F;
}

/* 失败原因说明 */
.reason-section {
  width: 100%;
  margin-bottom: 60rpx;
}

.section-title {
  font-size: 18rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 16rpx;
  display: block;
}

.reason-list {
  background-color: #FFF8F8;
  border-radius: 8rpx;
  padding: 16rpx;
}

.reason-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12rpx;
}

.reason-item:last-child {
  margin-bottom: 0;
}

.reason-icon {
  width: 20rpx;
  height: 20rpx;
  color: #F53F3F;
  margin-right: 12rpx;
  margin-top: 4rpx;
}

.reason-text {
  font-size: 14rpx;
  color: #666666;
  line-height: 1.5;
}

/* 按钮组 */
.btn-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  width: 100%;
  position: fixed;
  bottom: 40rpx;
  left: 0;
  padding: 0 20rpx;
  box-sizing: border-box;
}

.btn {
  width: 100%;
  height: 80rpx;
  border-radius: 8rpx;
  font-size: 18rpx;
}

.btn.secondary {
  background-color: #FFFFFF;
  border: 1rpx solid #EEEEEE;
  color: #333333;
}

.btn.primary {
  background-color: #D4B886;
  color: #FFFFFF;
}

.btn.tertiary {
  background-color: #F9F0FF;
  color: #722ED1;
}
</style>