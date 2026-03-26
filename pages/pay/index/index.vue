<!-- 功能说明
承接订单确认页，展示订单支付金额、订单号，调用微信支付接口完成支付，
处理支付成功、失败、取消等回调，核心对接微信支付参数接口，完善支付闭环。 -->


<template>
  <view class="pay-container">
    <!-- 支付金额卡片 -->
    <view class="pay-card">
      <text class="pay-label">请支付</text>
      <text class="pay-amount">¥{{amount ? amount.toFixed(2) : '0.00'}}</text>
      <text class="order-no">订单号：{{orderNo || '-'}}</text>
    </view>

    <!-- 支付方式 -->
    <view class="pay-method-section">
      <text class="section-title">选择支付方式</text>
      <view class="pay-method-item" @click="selectPayMethod('WECHAT_PAY')">
        <image src="/static/images/wechat-pay.png" class="pay-method-icon"></image>
        <text class="pay-method-name">微信支付</text>
        <image src="/static/images/select.png" class="select-icon" v-if="selectedPayMethod === 'WECHAT_PAY'"></image>
      </view>
    </view>

    <!-- 支付说明 -->
    <view class="pay-desc">
      <text class="desc-text">支付须知：</text>
      <view class="desc-content">
        <text>1. 支付成功后将跳转至支付成功页面；</text>
        <view class="countdown-tip" v-if="countdownText">
          <text>2. 订单支付剩余时间：</text>
          <text class="countdown-highlight">{{countdownText}}</text>
          <text>，超时未支付将自动取消；</text>
        </view>
        <text v-else>2. 订单支付有效期为30分钟，超时未支付将自动取消；</text>
        <text>3. 如有疑问请联系客服400-123-4567</text>
      </view>
    </view>

    <!-- 支付按钮 -->
    <button class="pay-btn" @click="submitPay" :disabled="isPaying">
      <text v-if="isPaying">支付中...</text>
      <text v-else>立即支付</text>
    </button>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onUnload, onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import request from '@/utils/request';
import { formatCountdown, isExpired } from '@/utils/timeUtil';

// 状态管理
const userStore = useUserStore();

// 路由参数
const orderNo = ref('');
const amount = ref(0);

// 页面数据
const selectedPayMethod = ref('WECHAT_PAY'); // 选中的支付方式（默认微信支付）
const isPaying = ref(false); // 支付中状态
const countdownText = ref(''); // 倒计时显示
let payTimer = null; // 支付状态查询定时器
let timer = null; // 倒计时定时器

// 页面加载校验
onLoad(async (options) => {
  orderNo.value = options.orderNo || '';
  amount.value = parseFloat(options.amount) || 0;
  
  if (!userStore.token || !orderNo.value || amount.value <= 0) {
    uni.showToast({ title: '支付参数异常', icon: 'none' });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
    return;
  }
});

// 页面显示时检查状态，防止已支付订单重复进入
onShow(() => {
  if (orderNo.value) {
    getOrderDetail();
  }
});

// 获取订单详情
const getOrderDetail = async () => {
  try {
    const res = await request({
      url: '/api/order/detail',
      method: 'GET',
      params: { orderNo: orderNo.value }
    });
    if (res.success || res.code === 200) {
      const orderInfo = res.data || res.result;
      if (orderInfo.status === 'pendingPayment') {
        startCountdown(orderInfo.createTime);
      } else if (orderInfo.status === 'cancelled') {
        uni.showModal({
          title: '提示',
          content: '该订单已超时取消',
          showCancel: false,
          success: () => {
            uni.navigateBack();
          }
        });
      } else {
        // 已支付或其他状态，不再允许停留在此页
        uni.redirectTo({
          url: `/pages/pay/success/success?orderNo=${orderNo.value}&amount=${orderInfo.totalAmount}`
        });
      }
    }
  } catch (error) {
    console.error('获取订单详情失败', error);
  }
};

// 开启倒计时
const startCountdown = (createTime) => {
  if (timer) clearInterval(timer);
  
  const createTimeMillis = new Date(createTime).getTime();
  const expireTimeMillis = createTimeMillis + 30 * 60 * 1000;
  
  const updateCountdown = () => {
    if (isExpired(expireTimeMillis)) {
      countdownText.value = '00:00';
      clearInterval(timer);
      uni.showModal({
        title: '提示',
        content: '订单已超时取消',
        showCancel: false,
        success: () => {
          uni.navigateBack();
        }
      });
      return;
    }
    countdownText.value = formatCountdown(expireTimeMillis);
  };
  
  updateCountdown();
  timer = setInterval(updateCountdown, 1000);
};

// 页面卸载清除定时器
onUnload(() => {
  if (payTimer) clearInterval(payTimer);
  if (timer) clearInterval(timer);
});

// 选择支付方式（仅微信支付，预留扩展）
const selectPayMethod = (method) => {
  selectedPayMethod.value = method;
};

// 提交支付
const submitPay = async () => {
  if (isPaying.value) return;
  isPaying.value = true;

  try {
    // 1. 调用支付接口（模拟支付）
    const payRes = await request({
      url: '/api/pay/wxpay',
      method: 'POST',
      data: { orderNo: orderNo.value }
    });

    // 简化逻辑：只要接口响应成功，直接响应支付成功
    if (payRes.success) {
      // 2. 调用修改订单状态接口
      await request({
        url: '/api/order/pay/success',
        method: 'PUT',
        params: { orderNo: orderNo.value }
      });

      uni.showToast({ title: '支付成功', icon: 'success' });
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        uni.redirectTo({
          url: `/pages/pay/success/success?orderNo=${orderNo.value}&amount=${amount.value}`
        });
      }, 1500);
    } else {
      uni.showToast({ title: payRes.message || '支付请求失败', icon: 'none' });
      isPaying.value = false;
    }
  } catch (error) {
    uni.showToast({ title: '网络异常，支付失败', icon: 'none' });
    isPaying.value = false;
  }
};

// 返回上一页
const navigateBack = () => {
  uni.navigateBack();
};
</script>

<style scoped>
.pay-container {
  background-color: #FFFFFF;
  min-height: 100vh;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
  padding-top: 10rpx;
}

.back-btn {
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

.header-title {
  font-size: 20rpx;
  font-weight: bold;
  color: #333333;
  margin-left: -24rpx;
}

/* 支付金额卡片 */
.pay-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #F9F9F9;
  border-radius: 16rpx;
  padding: 60rpx 20rpx;
  margin: 40rpx 0;
}

.pay-label {
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 24rpx;
}

.pay-amount {
  font-size: 64rpx;
  color: #D4B886;
  font-weight: bold;
  margin-bottom: 24rpx;
}

.order-no {
  font-size: 24rpx;
  color: #999999;
}

/* 支付方式 */
.pay-method-section {
  margin-bottom: 60rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 24rpx;
  display: block;
}

.pay-method-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border: 1rpx solid #EEEEEE;
  border-radius: 12rpx;
  justify-content: space-between;
}

.pay-method-icon {
  width: 56rpx;
  height: 56rpx;
  margin-right: 20rpx;
}

.pay-method-name {
  font-size: 28rpx;
  color: #333333;
  flex: 1;
}

.select-icon {
  width: 32rpx;
  height: 32rpx;
  color: #D4B886;
}

/* 支付说明 */
.pay-desc {
  margin-bottom: 60rpx;
  padding: 24rpx;
  background-color: #FFF8E1;
  border-radius: 12rpx;
}

.desc-text {
  font-size: 28rpx;
  color: #D4B886;
  font-weight: bold;
  display: block;
  margin-bottom: 12rpx;
}

.desc-content {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.6;
}

.countdown-tip {
  display: inline;
}

.countdown-highlight {
  color: #F53F3F;
  font-weight: bold;
  margin: 0 4rpx;
}

/* 支付按钮 */
.pay-btn {
  width: 100%;
  height: 88rpx;
  background-color: #D4B886;
  color: #FFFFFF;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pay-btn:disabled {
  background-color: #E8D7BF;
}
</style>