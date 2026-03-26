<template>
  <view class="search-container">
    <!-- 搜索头部 -->
    <view class="search-header">
      <view class="search-input-box">
        <image src="/static/images/icon-search.png" class="search-icon"></image>
        <input 
          class="search-input" 
          type="text" 
          v-model="keyword" 
          placeholder="商品名/订单号/快递单号/商户单号" 
          confirm-type="search"
          @confirm="handleSearch"
        />
        <image 
          v-if="keyword" 
          src="/static/images/icon-close.png" 
          class="clear-icon" 
          @click="clearKeyword"
        ></image>
      </view>
      <text class="search-btn" @click="handleSearch">搜索</text>
    </view>

    <!-- 搜索历史 -->
    <view class="search-history" v-if="historyList.length > 0 && !showResult">
      <view class="history-header">
        <text class="history-title">搜索历史</text>
        <image src="/static/images/icon-delete.png" class="delete-icon" @click="clearHistory"></image>
      </view>
      <view class="history-list">
        <view 
          class="history-item" 
          v-for="(item, index) in historyList" 
          :key="index"
          @click="clickHistory(item)"
        >
          {{item}}
        </view>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view class="search-result" v-if="showResult">
      <view class="order-list" v-if="orderList.length > 0">
        <view class="order-item" v-for="(order, index) in orderList" :key="index">
          <!-- 订单头部信息 -->
          <view class="order-header">
            <view class="order-left">
              <text class="order-no">订单号：{{order.orderNo}}</text>
              <text class="order-time">{{formatTime(order.createTime)}}</text>
            </view>
            <text class="order-status" :class="getStatusClass(order.status)">{{getStatusText(order.status)}}</text>
          </view>

          <!-- 订单商品清单 -->
          <view class="order-goods" @click="goToOrderDetail(order.orderNo)">
            <view class="goods-item" v-for="(goods, gIndex) in order.orderItems" :key="gIndex">
              <image :src="goods.productImage" mode="aspectFill" class="goods-img"></image>
              <view class="goods-info">
                <text class="goods-name">{{goods.productName}}</text>
                <text class="goods-spec">规格：{{goods.specText || '默认规格'}}</text>
                <view class="goods-count">x{{goods.quantity}}</view>
              </view>
              <text class="goods-price">¥{{formatPrice(goods.price * goods.quantity)}}</text>
            </view>
          </view>

          <!-- 评价引导栏 (仅评价页显示) -->
          <view class="evaluate-bar" v-if="order.status === 'completed'">
            <text class="evaluate-text">商品好不好，评价一下吧</text>
            <view class="stars">
              <text class="star-icon" v-for="s in 5" :key="s">☆</text>
            </view>
          </view>

          <!-- 订单金额信息 -->
          <view class="order-amount">
            <text class="amount-label">合计：</text>
            <text class="amount-value">¥{{formatPrice(order.totalAmount)}}</text>
            <text class="amount-desc">（含运费¥{{formatPrice(order.freight)}}）</text>
          </view>

          <!-- 订单操作按钮 -->
          <view class="order-operation">
            <!-- 更多按钮及其弹窗 -->
            <view class="more-container" v-if="getButtons(order).length > 3">
              <text class="more-text" @click.stop="toggleMore(index)">更多</text>
              <view class="more-menu" v-if="activeMoreIndex === index">
                <view 
                  class="menu-item" 
                  v-for="(btn, bIndex) in getButtons(order).slice(3)" 
                  :key="bIndex"
                  @click.stop="handleBtnClick(btn.action, order, index)"
                >
                  {{btn.text}}
                </view>
              </view>
            </view>
            
            <!-- 常规按钮 (最多显示3个) -->
            <button 
              v-for="(btn, bIndex) in getButtons(order).slice(0, 3)"
              :key="bIndex"
              class="oper-btn"
              :class="btn.type"
              @click.stop="handleBtnClick(btn.action, order, index)"
            >
              {{btn.text}}
            </button>
          </view>
        </view>
      </view>

      <!-- 空结果 -->
      <view class="empty-result" v-else>
        <image src="/static/images/empty-order.png" class="empty-img"></image>
        <text class="empty-text">未找到相关订单</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import request from '@/utils/request';

const keyword = ref('');
const historyList = ref([]);
const orderList = ref([]);
const showResult = ref(false);
const activeMoreIndex = ref(-1); // 展开“更多”菜单的订单索引

// 切换“更多”菜单显示
const toggleMore = (index) => {
  activeMoreIndex.value = activeMoreIndex.value === index ? -1 : index;
};

// 获取订单的操作按钮列表 (复用 list.vue 逻辑)
const getButtons = (order) => {
  const status = order.status;
  const buttons = [];
  
  switch (status) {
    case 'pendingPayment':
      buttons.push({ text: '去支付', type: 'primary', action: 'pay' });
      buttons.push({ text: '取消订单', type: 'secondary', action: 'cancel' });
      break;
    case 'pendingConfirm':
    case 'pendingShipment':
      buttons.push({ text: '修改地址', type: 'secondary', action: 'editAddress' });
      buttons.push({ text: '申请退款', type: 'secondary', action: 'refund' });
      buttons.push({ text: '联系客服', type: 'secondary', action: 'contact' });
      break;
    case 'pendingReceipt':
      buttons.push({ text: '确定收货', type: 'primary', action: 'confirmReceipt' });
      buttons.push({ text: '查看物流', type: 'secondary', action: 'logistics' });
      buttons.push({ text: '联系客服', type: 'secondary', action: 'contact' });
      break;
    case 'completed':
      buttons.push({ text: '立即评价', type: 'danger', action: 'evaluate' });
      buttons.push({ text: '再次购买', type: 'secondary', action: 'buyAgain' });
      buttons.push({ text: '查看物流', type: 'secondary', action: 'logistics' });
      buttons.push({ text: '删除订单', type: 'secondary', action: 'deleteOrder' });
      break;
    case 'cancelled':
      buttons.push({ text: '再次购买', type: 'secondary', action: 'buyAgain' });
      buttons.push({ text: '删除订单', type: 'secondary', action: 'deleteOrder' });
      break;
    default:
      buttons.push({ text: '查看详情', type: 'secondary', action: 'detail' });
  }
  return buttons;
};

// 统一处理按钮点击
const handleBtnClick = (action, order, index) => {
  activeMoreIndex.value = -1;
  
  switch (action) {
    case 'pay':
      uni.showToast({ title: '去支付: ' + order.orderNo, icon: 'none' });
      break;
    case 'cancel':
      cancelOrder(order.orderNo, index);
      break;
    case 'contact':
      uni.showToast({ title: '联系客服...', icon: 'none' });
      break;
    case 'editAddress':
      uni.showToast({ title: '修改地址: ' + order.orderNo, icon: 'none' });
      break;
    case 'refund':
      uni.showToast({ title: '申请退款: ' + order.orderNo, icon: 'none' });
      break;
    case 'logistics':
      uni.showToast({ title: '查看物流: ' + order.orderNo, icon: 'none' });
      break;
    case 'confirmReceipt':
      uni.showModal({
        title: '确认收货',
        content: '确认已收到商品？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...', mask: true });
            try {
              const apiRes = await request({
                url: '/api/order/confirmReceipt',
                method: 'PUT',
                params: { orderNo: order.orderNo }
              });
              if (apiRes.success) {
                // 更新本地状态并刷新
                if (apiRes.data && apiRes.data.status) {
                  orderList.value[index].status = apiRes.data.status;
                }
                await handleSearch();
                uni.showToast({ title: '确认收货成功', icon: 'success' });
              } else {
                uni.hideLoading();
                uni.showToast({ title: apiRes.message || '操作失败', icon: 'none' });
              }
            } catch (error) {
              uni.hideLoading();
              console.error('确认收货失败:', error);
            }
          }
        }
      });
      break;
    case 'evaluate':
      uni.showToast({ title: '去评价: ' + order.orderNo, icon: 'none' });
      break;
    case 'buyAgain':
      uni.showToast({ title: '再次购买: ' + order.orderNo, icon: 'none' });
      break;
    case 'deleteOrder':
      uni.showModal({
        title: '提示',
        content: '确定删除该订单吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const apiRes = await request({
                url: '/api/order/delete',
                method: 'DELETE',
                params: { orderNo: order.orderNo }
              });
              if (apiRes.success) {
                uni.showToast({ title: '删除成功' });
                orderList.value.splice(index, 1);
              } else {
                uni.showToast({ title: apiRes.message || '删除失败', icon: 'none' });
              }
            } catch (error) {
              uni.showToast({ title: '网络异常', icon: 'none' });
            }
          }
        }
      });
      break;
    case 'detail':
      goToOrderDetail(order.orderNo);
      break;
  }
};

onLoad(() => {
  // 加载搜索历史
  const history = uni.getStorageSync('orderSearchHistory');
  if (history) {
    historyList.value = JSON.parse(history);
  }
});

// 搜索操作
const handleSearch = async () => {
  if (!keyword.value.trim()) {
    uni.showToast({ title: '请输入搜索内容', icon: 'none' });
    return;
  }
  
  // 保存历史记录
  saveHistory(keyword.value);
  
  // 调用接口
  uni.showLoading({ title: '搜索中...' });
  try {
    const res = await request({
      url: '/api/order/search',
      method: 'GET',
      params: {
        searchCondition: keyword.value
      }
    });
    
    // 兼容 success=true 或 code=200
    if (res.success || res.code === 200) {
      // 兼容多种返回结构
      let list = [];
      const data = res.data || res.result;

      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.list)) {
        list = data.list;
      } else if (data && Array.isArray(data.records)) {
        list = data.records;
      }
      orderList.value = list;
      showResult.value = true;
    } else {
      uni.showToast({ title: res.message || '搜索失败', icon: 'none' });
    }
  } catch (error) {
    uni.showToast({ title: '网络异常', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

// 点击历史记录
const clickHistory = (item) => {
  keyword.value = item;
  handleSearch();
};

// 保存历史记录
const saveHistory = (val) => {
  let history = [...historyList.value];
  // 移除重复
  const index = history.indexOf(val);
  if (index > -1) {
    history.splice(index, 1);
  }
  // 添加到头部
  history.unshift(val);
  // 限制数量
  if (history.length > 10) {
    history.pop();
  }
  historyList.value = history;
  uni.setStorageSync('orderSearchHistory', JSON.stringify(history));
};

// 清空历史
const clearHistory = () => {
  uni.showModal({
    title: '提示',
    content: '确定清空搜索历史吗？',
    success: (res) => {
      if (res.confirm) {
        historyList.value = [];
        uni.removeStorageSync('orderSearchHistory');
      }
    }
  });
};

// 清空输入框
const clearKeyword = () => {
  keyword.value = '';
  showResult.value = false;
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

// 状态显示逻辑（复用 list.vue）
const getStatusText = (status) => {
  switch (status) {
    case 'pendingPayment': return '待付款';
    case 'pendingConfirm': return '待确认';
    case 'pendingShipment': return '待发货';
    case 'pendingReceipt': return '待收货';
    case 'completed': return '已完成';
    case 'cancelled': return '已取消';
    case 'afterSale': return '售后';
    default: return status;
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'pendingPayment': return 'pending-pay';
    case 'pendingConfirm': return 'pending-confirm';
    case 'pendingShipment': return 'pending-ship';
    case 'pendingReceipt': return 'pending-receipt';
    case 'completed': return 'completed';
    case 'cancelled': return 'cancelled';
    default: return '';
  }
};

const getOperateText = (status) => {
  switch (status) {
    case 'pendingPayment': return '去支付';
    case 'pendingConfirm':
    case 'pendingShipment': return '联系客服';
    case 'pendingReceipt': return '查看物流';
    case 'completed': return '查看详情';
    case 'cancelled': return '查看详情';
    default: return '查看详情';
  }
};

const goToOrderDetail = (orderNo) => {
  uni.navigateTo({ url: `/pages/order/detail/detail?orderNo=${orderNo}` });
};

// 取消订单
const cancelOrder = (orderNo, index) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消该订单吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中...', mask: true });
        try {
          const apiRes = await request({
            url: '/api/order/cancel',
            method: 'PUT',
            params: { orderNo }
          });
          if (apiRes.success) {
            // 更新本地状态
            if (apiRes.data && apiRes.data.status) {
              orderList.value[index].status = apiRes.data.status;
            }
            await handleSearch();
            uni.showToast({ title: '订单取消成功', icon: 'success' });
          } else {
            uni.hideLoading();
            uni.showToast({ title: apiRes.message || '订单取消失败', icon: 'none' });
          }
        } catch (error) {
          uni.hideLoading();
          console.error('取消订单失败:', error);
        }
      }
    }
  });
};

// 格式化价格
const formatPrice = (price) => {
  const num = parseFloat(price);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};
</script>

<style scoped>
.search-container {
  background-color: #FFFFFF;
  min-height: 100vh;
}

/* 搜索头部 */
.search-header {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #FFFFFF;
  border-bottom: 1rpx solid #EEEEEE;
}

.search-input-box {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #F5F5F5;
  border-radius: 30rpx;
  padding: 10rpx 20rpx;
  margin-right: 20rpx;
}

.search-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 10rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
}

.clear-icon {
  width: 32rpx;
  height: 32rpx;
  padding: 10rpx;
}

.search-btn {
  font-size: 30rpx;
  color: #333333;
}

/* 搜索历史 */
.search-history {
  padding: 30rpx 20rpx;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.history-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
}

.delete-icon {
  width: 32rpx;
  height: 32rpx;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.history-item {
  background-color: #F5F5F5;
  padding: 10rpx 24rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
  color: #666666;
}

/* 搜索结果 */
.search-result {
  background-color: #F8F8F8;
  min-height: calc(100vh - 100rpx);
}

.order-list {
  padding: 20rpx;
}

.order-item {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 20rpx;
}

/* 复用 list.vue 的样式 */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.order-left {
  display: flex;
  flex-direction: column;
}

.order-no {
  font-size: 26rpx;
  color: #666666;
  margin-bottom: 6rpx;
}

.order-time {
  font-size: 24rpx;
  color: #999999;
}

.order-status {
  font-size: 28rpx;
  font-weight: bold;
}

.order-status.pending-pay { color: #F53F3F; }
.order-status.pending-confirm { color: #FF7D00; }
.order-status.pending-ship { color: #FFAA00; }
.order-status.pending-receipt { color: #00B42A; }
.order-status.completed { color: #333333; }
.order-status.cancelled { color: #999999; }

.order-goods {
  border-top: 1rpx solid #EEEEEE;
  border-bottom: 1rpx solid #EEEEEE;
  padding: 20rpx 0;
}

.goods-item {
  display: flex;
  margin-bottom: 20rpx;
}
.goods-item:last-child { margin-bottom: 0; }

.goods-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.goods-name {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.goods-spec {
  font-size: 24rpx;
  color: #999999;
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

/* 评价引导栏 */
.evaluate-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #FAFAFA;
  margin: 10rpx 0;
  border-radius: 8rpx;
}

.evaluate-text {
  font-size: 26rpx;
  color: #333333;
}

.stars {
  display: flex;
  gap: 10rpx;
}

.star-icon {
  font-size: 32rpx;
  color: #999999;
}

.order-amount {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 20rpx 0;
}

.amount-label {
  font-size: 26rpx;
  color: #333333;
}

.amount-value {
  font-size: 32rpx;
  color: #D4B886;
  font-weight: bold;
}

.amount-desc {
  font-size: 24rpx;
  color: #999999;
  margin-left: 10rpx;
}

.order-operation {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16rpx;
  padding-top: 10rpx;
  position: relative;
}

.more-container {
  margin-right: auto;
  padding: 10rpx 0;
  position: relative;
}

.more-text {
  font-size: 26rpx;
  color: #333333;
}

.more-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  background-color: #FFFFFF;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.15);
  border-radius: 8rpx;
  width: 200rpx;
  z-index: 100;
  margin-bottom: 20rpx;
}

.more-menu::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 30rpx;
  border: 12rpx solid transparent;
  border-top-color: #FFFFFF;
}

.menu-item {
  padding: 24rpx 30rpx;
  font-size: 28rpx;
  color: #333333;
  text-align: center;
  border-bottom: 1rpx solid #F5F5F5;
}

.menu-item:last-child {
  border-bottom: none;
}

.oper-btn {
  margin: 0;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  padding: 0 32rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.oper-btn::after {
  border: none;
}

.oper-btn.secondary {
  background-color: #FFFFFF;
  border: 1rpx solid #DDDDDD;
  color: #666666;
}

.oper-btn.primary {
  background-color: #D4B886;
  color: #FFFFFF;
}

.oper-btn.danger {
  background-color: #F53F3F;
  color: #FFFFFF;
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
}

.empty-img {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}
</style>