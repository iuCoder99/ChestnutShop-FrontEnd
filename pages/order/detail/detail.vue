<!-- 功能说明
展示订单完整信息（商品清单、收货信息、支付信息、订单状态），根据订单状态提供对应操作（支付、取消、查看物流、确认收货），
核心对接订单详情、确认收货接口，完善订单生命周期管理。 -->

<template>
  <view class="order-detail-container">
    <!-- 订单状态标签 -->
    <view class="order-status-tag" :class="getStatusClass(orderInfo.status)">
      {{getStatusText(orderInfo.status)}}
    </view>

    <!-- 支付倒计时（待支付状态下显示） -->
    <view class="pay-countdown-box" v-if="orderInfo.status === 'pendingPayment' && countdownText">
      <text class="countdown-label">剩余支付时间：</text>
      <text class="countdown-value">{{countdownText}}</text>
    </view>

    <!-- 订单基础信息 -->
    <view class="order-base-info">
      <view class="info-item">
        <text class="info-label">订单号：</text>
        <text class="info-value">{{orderInfo.orderNo || '-'}}</text>
      </view>
      <view class="info-item">
        <text class="info-label">下单时间：</text>
        <text class="info-value">{{orderInfo.createTime || '-'}}</text>
      </view>
      <view class="info-item" v-if="orderInfo.deliverTime">
        <text class="info-label">发货时间：</text>
        <text class="info-value">{{orderInfo.deliverTime}}</text>
      </view>
      <view class="info-item" v-if="orderInfo.receiveTime">
        <text class="info-label">确认收货时间：</text>
        <text class="info-value">{{orderInfo.receiveTime}}</text>
      </view>
    </view>

    <!-- 商品清单 -->
    <view class="goods-section">
      <text class="section-title">商品清单</text>
      <view class="goods-list">
        <view class="goods-item" v-for="(item, index) in orderInfo.orderItems" :key="index">
          <image :src="item.productImage" mode="aspectFill" class="goods-img"></image>
          <view class="goods-info">
            <text class="goods-name">{{item.productName}}</text>
            <text class="goods-spec">规格：{{item.specText || '默认规格'}}</text>
            <view class="goods-count-price">
              <text class="goods-count">x{{item.quantity}}</text>
              <text class="goods-price">¥{{formatPrice(item.price * item.quantity)}}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 收货信息 -->
    <view class="receipt-section">
      <text class="section-title">收货信息</text>
      <view class="receipt-info">
        <view class="receipt-item">
          <text class="receipt-label">收件人：</text>
          <text class="receipt-value">{{(orderInfo.address && orderInfo.address.receiver) || orderInfo.receiver || '-'}} {{(orderInfo.address && orderInfo.address.phone) || orderInfo.receiverPhone || '-'}}</text>
        </view>
        <view class="receipt-item">
          <text class="receipt-label">收货地址：</text>
          <text class="receipt-value" v-if="orderInfo.address">
            {{orderInfo.address.province || ''}}{{orderInfo.address.city || ''}}{{orderInfo.address.district || ''}}{{orderInfo.address.detailAddress || '-'}}
          </text>
          <text class="receipt-value" v-else>
            {{orderInfo.province || ''}}{{orderInfo.city || ''}}{{orderInfo.district || ''}}{{orderInfo.detailAddress || '-'}}
          </text>
        </view>
      </view>
    </view>

    <!-- 物流信息（待收货/已完成状态显示） -->
    <view class="logistics-section" v-if="['pendingReceipt', 'completed'].includes(orderInfo.status)">
      <text class="section-title">物流信息</text>
      <view class="logistics-info" v-if="logisticsData.logisticsNo || logisticsData.expressNo">
        <view class="logistics-item">
          <text class="logistics-label">快递公司：</text>
          <text class="logistics-value">{{logisticsData.logisticsCompany || logisticsData.expressCompany || '-'}}</text>
        </view>
        <view class="logistics-item">
          <text class="logistics-label">物流单号：</text>
          <text class="logistics-value">{{logisticsData.logisticsNo || logisticsData.expressNo}}</text>
          <button class="copy-btn" @click="copyLogisticsNo(logisticsData.logisticsNo || logisticsData.expressNo)">复制</button>
        </view>
        <view class="logistics-track" v-if="(logisticsData.orderTrackings && logisticsData.orderTrackings.length > 0) || (logisticsData.tracks && logisticsData.tracks.length > 0)">
          <view class="track-item" v-for="(track, tIndex) in (logisticsData.orderTrackings || logisticsData.tracks)" :key="tIndex">
            <text class="track-time">{{track.createTime || track.time}}</text>
            <text class="track-content">{{track.description || track.content}}</text>
          </view>
        </view>
        <button class="check-logistics-btn" @click="goToLogistics">查看物流跟踪</button>
      </view>
      <view class="no-logistics" v-else>
        <text class="no-logistics-text">暂无物流信息，待商家发货</text>
      </view>
    </view>

    <!-- 支付信息 -->
    <view class="payment-section">
      <text class="section-title">支付信息</text>
      <view class="payment-info">
        <view class="payment-item">
          <text class="payment-label">支付方式：</text>
          <text class="payment-value">{{ getPayTypeText(orderInfo.payType) }}</text>
        </view>
        <view class="payment-item" v-if="orderInfo.payType !== 'unpaid' && orderInfo.payTime">
          <text class="payment-label">支付时间：</text>
          <text class="payment-value">{{ orderInfo.payTime }}</text>
        </view>
        <view class="payment-item">
          <text class="payment-label">商品总价：</text>
          <text class="payment-value">¥{{formatPrice(orderInfo.totalGoodsAmount)}}</text>
        </view>
        <view class="payment-item">
          <text class="payment-label">运费：</text>
          <text class="payment-value" v-if="parseFloat(orderInfo.freight) === 0">包邮</text>
          <text class="payment-value" v-else>¥{{formatPrice(orderInfo.freight)}}</text>
        </view>
        <view class="payment-item total-payment">
          <text class="payment-label">实付款：</text>
          <text class="payment-value">¥{{formatPrice(orderInfo.totalAmount)}}</text>
        </view>
      </view>
    </view>

    <!-- 订单备注 -->
    <view class="remark-section" v-if="orderInfo.remark">
      <text class="section-title">订单备注</text>
      <view class="remark-content">
        <text>{{orderInfo.remark}}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="operation-section">
      <template v-if="orderInfo.status === 'pendingPayment'">
        <button class="oper-btn cancel-btn" @click="cancelOrder">取消订单</button>
        <button class="oper-btn pay-btn" @click="goToPay">去支付</button>
      </template>
      <template v-if="orderInfo.status === 'pendingConfirm' || orderInfo.status === 'pendingShipment'">
        <button class="oper-btn contact-btn" @click="contactService">联系客服</button>
      </template>
      <template v-if="orderInfo.status === 'pendingReceipt'">
        <button class="oper-btn confirm-btn" @click="confirmReceipt">确认收货</button>
        <button class="oper-btn logistics-btn" @click="goToLogistics">查看物流</button>
      </template>
      <template v-if="['completed', 'cancelled', 'afterSale'].includes(orderInfo.status)">
        <button class="oper-btn aftersale-btn" @click="applyAfterSale" v-if="orderInfo.status === 'completed'">申请售后</button>
        <button class="oper-btn contact-btn" @click="contactService">联系客服</button>
      </template>
    </view>
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

// 页面数据
const orderInfo = ref({}); // 订单详情信息
const logisticsData = ref({}); // 物流信息
const countdownText = ref(''); // 倒计时显示文本
let timer = null; // 倒计时定时器

// 页面加载
onLoad((options) => {
  orderNo.value = options.orderNo;
});

// 页面显示时刷新详情，处理回退刷新问题
onShow(() => {
  if (!userStore.token || !orderNo.value) {
    uni.navigateBack();
    return;
  }
  getOrderDetail();
});

// 页面卸载清除定时器
onUnload(() => {
  if (timer) {
    clearInterval(timer);
  }
});

// 接口请求：获取订单详情
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
      
      // 开启倒计时
      if (orderInfo.value.status === 'pendingPayment') {
        startCountdown();
      } else {
        if (timer) clearInterval(timer);
      }

      // 如果状态需要显示物流，则加载物流信息
      if (['pendingReceipt', 'completed'].includes(orderInfo.value.status)) {
        getLogisticsInfo();
      }
    }
  } catch (error) {
    console.error('获取订单详情失败:', error);
    // request.js 已经统一处理了错误 Toast，这里不再重复弹窗
  } finally {
    uni.hideLoading();
  }
};

// 倒计时逻辑
const startCountdown = () => {
  if (timer) clearInterval(timer);
  
  const createTimeMillis = new Date(orderInfo.value.createTime).getTime();
  const expireTimeMillis = createTimeMillis + 30 * 60 * 1000; // 30分钟
  
  const updateCountdown = () => {
    if (isExpired(expireTimeMillis)) {
      countdownText.value = '00:00';
      clearInterval(timer);
      // 倒计时结束，订单自动取消（后端处理），前端刷新状态
      orderInfo.value.status = 'cancelled';
      return;
    }
    countdownText.value = formatCountdown(expireTimeMillis);
  };
  
  updateCountdown();
  timer = setInterval(updateCountdown, 1000);
};

// 接口请求：获取物流信息
const getLogisticsInfo = async () => {
  try {
    const res = await request({
      url: '/api/order/logistics',
      method: 'GET',
      params: { orderNo: orderNo.value }
    });
    if (res.success || res.code === 200) {
      logisticsData.value = res.data || res.result;
    }
  } catch (error) {
    console.error('获取物流信息失败', error);
  }
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 获取支付方式文本
const getPayTypeText = (payType) => {
  if (payType === 'unpaid') return '未支付';
  if (payType === 'wechatPay' || payType === 'WECHAT_PAY') return '微信支付';
  return payType || '未支付';
};

// 根据订单状态获取显示文本
const getStatusText = (status) => {
  const statusMap = {
    'pendingPayment': '待支付',
    'pendingConfirm': '待确认',
    'pendingShipment': '待发货',
    'pendingReceipt': '待收货',
    'completed': '已完成',
    'evaluated': '已评价',
    '8': '已评价',
    'reviewed': '已追评',
    '9': '已追评',
    'cancelled': '已取消',
    'afterSale': '售后处理中'
  };
  return statusMap[status] || status || '未知状态';
};

// 根据订单状态获取样式类
const getStatusClass = (status) => {
  const classMap = {
    'pendingPayment': 'status-pending-pay',
    'pendingConfirm': 'status-pending-confirm',
    'pendingShipment': 'status-pending-ship',
    'pendingReceipt': 'status-pending-receipt',
    'completed': 'status-completed',
    'evaluated': 'status-completed',
    '8': 'status-completed',
    'reviewed': 'status-completed',
    '9': 'status-completed',
    'cancelled': 'status-cancelled',
    'afterSale': 'status-after-sale'
  };
  return classMap[status] || '';
};

// 格式化价格
const formatPrice = (price) => {
  const num = parseFloat(price);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

// 复制物流单号
const copyLogisticsNo = (expressNo) => {
  if (!expressNo) return;
  uni.setClipboardData({
    data: expressNo,
    success: () => {
      uni.showToast({ title: '复制成功' });
    },
    fail: () => {
      uni.showToast({ title: '复制失败', icon: 'none' });
    }
  });
};

// 取消订单
const cancelOrder = () => {
  uni.showModal({
    title: '提示',
    content: '确定要取消该订单吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '提交中...', mask: true });
        try {
          const apiRes = await request({
            url: '/api/order/cancel',
            method: 'PUT',
            params: { orderNo: orderNo.value }
          });
          if (apiRes.success) {
            // 先尝试更新本地状态，提供即时反馈
            if (apiRes.data && apiRes.data.status) {
              orderInfo.value.status = apiRes.data.status;
            }
            // 刷新完整详情（getOrderDetail 会隐藏之前的 loading 并展示自己的）
            await getOrderDetail();
            // 在所有操作完成后显示成功提示，避免被 loading 冲掉
            uni.showToast({ title: '订单取消成功', icon: 'success' });
          } else {
            uni.hideLoading();
            uni.showToast({ title: apiRes.message || '订单取消失败', icon: 'none' });
          }
        } catch (error) {
          uni.hideLoading();
          // request.js 内部已处理 catch 块的 toast，但这里为了确保逻辑闭环
          console.error('取消订单失败:', error);
        }
      }
    }
  });
};

// 确认收货
const confirmReceipt = () => {
  uni.showModal({
    title: '提示',
    content: '确认已收到货物吗？确认后订单将完成交易',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中...', mask: true });
        try {
          const apiRes = await request({
            url: '/api/order/confirmReceipt',
            method: 'PUT',
            params: { orderNo: orderNo.value }
          });
          if (apiRes.success) {
            // 更新本地状态并刷新
            if (apiRes.data && apiRes.data.status) {
              orderInfo.value.status = apiRes.data.status;
            }
            await getOrderDetail();
            uni.showToast({ title: '确认收货成功', icon: 'success' });
          } else {
            uni.hideLoading();
            uni.showToast({ title: apiRes.message || '确认收货失败', icon: 'none' });
          }
        } catch (error) {
          uni.hideLoading();
          console.error('确认收货失败:', error);
        }
      }
    }
  });
};

// 跳转支付页面
const goToPay = () => {
  uni.navigateTo({
    url: `/pages/pay/index/index?orderNo=${orderNo.value}&amount=${orderInfo.value.totalAmount}`
  });
};

// 跳转物流跟踪页
const goToLogistics = () => {
  uni.navigateTo({ url: `/pages/order/logistics?orderNo=${orderNo.value}` });
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

// 申请售后（预留功能）
const applyAfterSale = () => {
  uni.showToast({ title: '售后功能暂未开放', icon: 'none' });
};

// 返回上一页
const navigateBack = () => {
  uni.navigateBack();
};
</script>

<style scoped>
.order-detail-container {
  background-color: #FFFFFF;
  min-height: 100vh;
  padding: 20rpx;
  padding-bottom: 120rpx;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  padding-top: 10rpx;
}

.back-btn {
  background-color: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  border: none;
  margin: 0;
  line-height: 1;
}

.back-btn::after {
  border: none;
}

.back-icon {
  width: 32rpx;
  height: 32rpx;
}

.header-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-left: 20rpx;
}

/* 订单状态标签 */
.order-status-tag {
  width: fit-content;
  padding: 10rpx 24rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  font-weight: 500;
  margin-bottom: 30rpx;
}

.status-pending-pay {
  background-color: #FFF1F0;
  color: #F53F3F;
}

.status-pending-confirm {
  background-color: #FFF7E6;
  color: #FF7D00;
}

.status-pending-ship {
  background-color: #E6F7FF;
  color: #1890FF;
}

.status-pending-receipt {
  background-color: #F6FFED;
  color: #00B42A;
}

.status-completed {
  background-color: #F0F5FF;
  color: #0084FF;
}

.status-cancelled {
  background-color: #F5F5F5;
  color: #999999;
}

.status-after-sale {
  background-color: #F9F0FF;
  color: #722ED1;
}

/* 支付倒计时 */
.pay-countdown-box {
  display: flex;
  align-items: center;
  background-color: #FFF8E1;
  padding: 16rpx 24rpx;
  border-radius: 12rpx;
  margin-bottom: 30rpx;
}

.time-icon {
  width: 28rpx;
  height: 28rpx;
  margin-right: 12rpx;
}

.countdown-label {
  font-size: 26rpx;
  color: #D4B886;
}

.countdown-value {
  font-size: 28rpx;
  color: #D4B886;
  font-weight: bold;
}

/* 订单基础信息 */
.order-base-info {
  background-color: #F9F9F9;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 30rpx;
}

.info-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 26rpx;
  color: #666666;
  width: 160rpx;
  flex-shrink: 0;
}

.info-value {
  font-size: 26rpx;
  color: #333333;
  word-break: break-all;
}

/* 通用 section 样式 */
.goods-section, .receipt-section, .logistics-section, .payment-section, .remark-section {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
  display: block;
}

/* 商品清单 */
.goods-list {
  border: 1rpx solid #EEEEEE;
  border-radius: 12rpx;
  overflow: hidden;
}

.goods-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #EEEEEE;
}

.goods-item:last-child {
  border-bottom: none;
}

.goods-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.goods-name {
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 8rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.goods-spec {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 10rpx;
}

.goods-count-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goods-count {
  font-size: 24rpx;
  color: #999999;
}

.goods-price {
  font-size: 28rpx;
  color: #333333;
  font-weight: bold;
}

/* 收货信息 */
.receipt-info {
  background-color: #F9F9F9;
  border-radius: 12rpx;
  padding: 24rpx;
}

.receipt-item {
  margin-bottom: 16rpx;
}

.receipt-item:last-child {
  margin-bottom: 0;
}

.receipt-label {
  font-size: 26rpx;
  color: #666666;
  display: block;
  margin-bottom: 8rpx;
}

.receipt-value {
  font-size: 26rpx;
  color: #333333;
  line-height: 1.5;
}

/* 物流信息 */
.logistics-info {
  background-color: #F9F9F9;
  border-radius: 12rpx;
  padding: 24rpx;
}

.logistics-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.logistics-item:last-child {
  margin-bottom: 24rpx;
}

.logistics-label {
  font-size: 26rpx;
  color: #666666;
  width: 140rpx;
  flex-shrink: 0;
}

.logistics-value {
  font-size: 26rpx;
  color: #333333;
  flex: 1;
  word-break: break-all;
}

.copy-btn {
  font-size: 24rpx;
  color: #D4B886;
  background-color: transparent;
  padding: 0 10rpx;
  margin: 0;
  line-height: 1.5;
  border: none;
}

.copy-btn::after {
  border: none;
}

.logistics-track {
  padding: 20rpx 0;
  border-top: 1rpx solid #EEEEEE;
  margin-bottom: 20rpx;
}

.track-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 20rpx;
  position: relative;
  padding-left: 30rpx;
}

.track-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12rpx;
  width: 12rpx;
  height: 12rpx;
  background-color: #D4B886;
  border-radius: 50%;
}

.track-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 5rpx;
  top: 24rpx;
  width: 2rpx;
  height: calc(100% + 8rpx);
  background-color: #EEEEEE;
}

.track-time {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 8rpx;
}

.track-content {
  font-size: 26rpx;
  color: #333333;
  line-height: 1.4;
}

.check-logistics-btn {
  width: 100%;
  height: 72rpx;
  line-height: 72rpx;
  background-color: #FFFFFF;
  border: 1rpx solid #D4B886;
  color: #D4B886;
  border-radius: 36rpx;
  font-size: 26rpx;
}

.no-logistics {
  padding: 40rpx;
  text-align: center;
  background-color: #F9F9F9;
  border-radius: 12rpx;
}

.no-logistics-text {
  font-size: 26rpx;
  color: #999999;
}

/* 支付信息 */
.payment-info {
  background-color: #F9F9F9;
  border-radius: 12rpx;
  padding: 24rpx;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.payment-item:last-child {
  margin-bottom: 0;
}

.payment-label {
  font-size: 26rpx;
  color: #666666;
}

.payment-value {
  font-size: 26rpx;
  color: #333333;
}

.total-payment .payment-label {
  font-weight: bold;
  color: #333333;
}

.total-payment .payment-value {
  font-size: 32rpx;
  color: #D4B886;
  font-weight: bold;
}

/* 订单备注 */
.remark-content {
  background-color: #F9F9F9;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 26rpx;
  color: #333333;
  line-height: 1.6;
}

/* 操作按钮区域 */
.operation-section {
  display: flex;
  gap: 20rpx;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background-color: #FFFFFF;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.oper-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
  margin: 0;
}

.oper-btn::after {
  border: none;
}

.cancel-btn {
  background-color: #FFFFFF;
  border: 1rpx solid #DDDDDD;
  color: #666666;
}

.pay-btn {
  background-color: #D4B886;
  color: #FFFFFF;
}

.contact-btn {
  background-color: #E8F4F8;
  color: #1890FF;
}

.confirm-btn {
  background-color: #D4B886;
  color: #FFFFFF;
}

.logistics-btn {
  background-color: #FFFFFF;
  border: 1rpx solid #D4B886;
  color: #D4B886;
}

.aftersale-btn {
  background-color: #F9F0FF;
  color: #722ED1;
}
</style>