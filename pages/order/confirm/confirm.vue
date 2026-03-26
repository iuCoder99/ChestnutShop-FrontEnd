<!-- 功能说明
订单确认页，展示收货地址、商品清单、订单备注、费用明细，支持地址选择、运费计算，提交订单，核心对接地址列表、运费计算、订单创建接口。 -->

<template>
  <view class="confirm-container">
    <!-- 地址区域 -->
    <view class="address-section" @click="selectedAddress.id ? goToSelectAddress() : goToAddAddress()">
      <view class="address-content" v-if="selectedAddress.id">
        <view class="address-header">
          <text class="address-tag" v-if="selectedAddress.isDefault">默认</text>
          <text class="address-location">{{selectedAddress.province}} {{selectedAddress.city}} {{selectedAddress.district}}</text>
        </view>
        <view class="address-detail-row">
          <text class="address-detail">{{selectedAddress.detailAddress}}</text>
        </view>
        <view class="address-user">
          <text class="user-name">{{selectedAddress.receiver}}</text>
          <text class="user-phone">{{selectedAddress.phone}}</text>
        </view>
        <image src="/static/images/arrow-right.png" class="arrow-icon"></image>
      </view>
      
      <view class="no-address" v-else>
        <view class="add-address-icon">+</view>
        <text class="add-address-text">请填写收货地址</text>
        <image src="/static/images/arrow-right.png" class="arrow-icon"></image>
      </view>
      
      <!-- 底部彩条装饰 -->
      <view class="address-border"></view>
    </view>

    <!-- 商品清单区域 -->
    <view class="card goods-section">
      <view class="goods-list">
        <view class="goods-item" v-for="(item, index) in cartItems" :key="index">
          <image :src="item.productImage" mode="aspectFill" class="goods-img"></image>
          <view class="goods-info">
            <view class="goods-title-row">
              <text class="goods-name">{{item.productName}}</text>
              <text class="goods-price">¥{{item.price}}</text>
            </view>
            <view class="goods-spec-row">
              <text class="goods-spec">规格：{{item.specText || '默认'}}</text>
              <text class="goods-count">x{{item.quantity}}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 配送方式 -->
      <view class="cell-item">
        <text class="cell-label">配送服务</text>
        <view class="cell-content">
          <text class="cell-value">快递运输</text>
        </view>
      </view>
      
      <!-- 订单备注 -->
      <view class="cell-item remark-item">
        <text class="cell-label">订单备注</text>
        <input 
          class="remark-input" 
          v-model="remark" 
          placeholder="选填，请先和商家协商一致"
          placeholder-class="placeholder-style"
          maxlength="200"
        />
      </view>
    </view>

    <!-- 费用明细区域 -->
    <view class="card fee-section">
      <view class="fee-row">
        <text class="fee-label">商品金额</text>
        <text class="fee-value">¥{{totalGoodsPrice.toFixed(2)}}</text>
      </view>
      <view class="fee-row">
        <text class="fee-label">运费</text>
        <text class="fee-value red-text" v-if="freight > 0">+¥{{freight.toFixed(2)}}</text>
        <text class="fee-value" v-else>免运费</text>
      </view>
      <view class="fee-total-row">
        <text class="total-label">合计：</text>
        <text class="total-price">¥{{totalPayPrice.toFixed(2)}}</text>
      </view>
    </view>

    <!-- 底部提交区域 -->
    <view class="footer-placeholder"></view>
    <view class="submit-bar safe-area-bottom">
      <view class="total-info">
        <text class="total-text">实付款：</text>
        <text class="currency">¥</text>
        <text class="final-price">{{totalPayPrice.toFixed(2)}}</text>
      </view>
      <button 
        class="submit-btn" 
        @click="submitOrder"
        :disabled="isSubmitting"
        :loading="isSubmitting"
      >
        {{ isSubmitting ? '提交中' : '提交订单' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import request from '@/utils/request';

// 状态管理
const userStore = useUserStore();

// 页面数据
const cartItems = ref([]); // 商品列表
const orderData = ref(null); // 立即购买传参
const addressList = ref([]); // 地址列表
const selectedAddress = ref({}); // 选中地址
const remark = ref(''); // 订单备注
const freight = ref(0); // 运费
const isSubmitting = ref(false); // 提交状态

// 计算属性：商品总价
const totalGoodsPrice = computed(() => {
  if (orderData.value) {
    // 立即购买场景
    return orderData.value.price * orderData.value.quantity;
  }
  // 购物车结算场景
  return cartItems.value.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
});

// 计算属性：实付款
const totalPayPrice = computed(() => {
  return totalGoodsPrice.value + freight.value;
});

// 页面加载
onLoad((options) => {
  if (!userStore.token) {
    uni.navigateTo({ url: '/pages/main/login' });
    return;
  }
  
  // 解析参数
  try {
    if (options.cartItems) {
      const items = JSON.parse(decodeURIComponent(options.cartItems)) || [];
      cartItems.value = items.map(item => ({
        ...item,
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1)
      }));
    }
    if (options.orderData) {
      orderData.value = JSON.parse(decodeURIComponent(options.orderData));
      // 构造显示用的 cartItems
      cartItems.value = [{
        productId: orderData.value.productId,
        productName: orderData.value.productName,
        productImage: orderData.value.productImage,
        specText: orderData.value.specText,
        price: Number(orderData.value.price || 0),
        quantity: Number(orderData.value.quantity || 1),
        specIds: orderData.value.specIds
      }];
    }
  } catch (error) {
    console.error('参数解析失败:', error);
    uni.showToast({ title: '参数错误', icon: 'none' });
    setTimeout(() => uni.navigateBack(), 1500);
    return;
  }
  
  // 监听地址选择
  uni.$on('addressSelected', (address) => {
    selectedAddress.value = address;
    calculateFreight();
  });
  
  // 初始化数据
  getAddressList();
});

onUnload(() => {
  uni.$off('addressSelected');
});

// 获取地址列表
const getAddressList = async () => {
  try {
    const res = await request({
      url: '/api/address/list',
      method: 'GET'
    });
    if (res.success && res.data && res.data.length > 0) {
      addressList.value = res.data;
      // 优先使用默认地址
      const defaultAddr = res.data.find(item => item.isDefault);
      selectedAddress.value = defaultAddr || res.data[0];
      calculateFreight();
    } else {
      selectedAddress.value = {};
      freight.value = 0;
    }
  } catch (error) {
    console.error('获取地址失败', error);
  }
};

// 计算运费
const calculateFreight = async () => {
  if (!selectedAddress.value.id) {
    freight.value = 0;
    return;
  }
  
  try {
    const productIds = cartItems.value.map(item => item.productId).join(',');
    
    const res = await request({
      url: '/api/order/freight',
      method: 'GET',
      params: {
        productIds: productIds,
        addressId: selectedAddress.value.id
      }
    });
    
    if (res.success) {
      freight.value = res.data.freight || 0;
    }
  } catch (error) {
    console.error('运费计算失败', error);
    freight.value = 0;
  }
};

// 跳转地址页面
const goToAddAddress = () => {
  uni.navigateTo({ url: '/pages/address/edit/edit?type=add' });
};

const goToSelectAddress = () => {
  uni.navigateTo({ 
    url: `/pages/address/list/list?selectedAddressId=${selectedAddress.value.id || ''}` 
  });
};

// 提交订单
const submitOrder = async () => {
  if (!selectedAddress.value.id) {
    uni.showToast({ title: '请选择收货地址', icon: 'none' });
    return;
  }
  
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  
  try {
    const orderParams = {
      addressId: selectedAddress.value.id,
      remark: remark.value,
      freight: freight.value,
      totalAmount: totalPayPrice.value,
      orderItems: cartItems.value.map(item => ({
        productId: item.productId,
        specId: item.specId || item.specIds || '',
        quantity: item.quantity,
        price: item.price,
        productName: item.productName,
        productImage: item.productImage,
        specText: item.specText || ''
      }))
    };

    const res = await request({
      url: '/api/order/create',
      method: 'POST',
      data: orderParams
    });

    if (res.success) {
      // 成功后提示并跳转详情页
      uni.showToast({
        title: '订单提交成功',
        icon: 'success',
        duration: 1500
      });
      
      setTimeout(() => {
        // 跳转到订单详情页，方便用户支付
        if (res.data && res.data.orderNo) {
            uni.redirectTo({
                url: `/pages/order/detail/detail?orderNo=${res.data.orderNo}`
            });
        } else {
            // 兜底跳转到订单列表
            uni.redirectTo({
                url: '/pages/order/list/list'
            });
        }
      }, 1500);
    } else {
      uni.showToast({ title: res.message || '下单失败', icon: 'none' });
    }
  } catch (error) {
    console.error('提交订单异常:', error);
    // request.js 内部已处理错误 Toast，这里不再重复覆盖更具体的信息
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.confirm-container {
  min-height: 100vh;
  background-color: #F5F6F7;
  padding: 20rpx 24rpx 120rpx;
  box-sizing: border-box;
}

/* 卡片通用样式 */
.card {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

/* 地址区域 */
.address-section {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  position: relative;
}

.address-content {
  padding: 30rpx 24rpx;
  position: relative;
}

.address-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.address-tag {
  background-color: #D4B886;
  color: #FFFFFF;
  font-size: 20rpx;
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
  margin-right: 12rpx;
}

.address-location {
  font-size: 26rpx;
  color: #666;
}

.address-detail-row {
  margin-bottom: 16rpx;
}

.address-detail {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
}

.address-user {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #666;
}

.user-name {
  margin-right: 20rpx;
}

.no-address {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  color: #333;
  font-size: 30rpx;
  font-weight: 500;
}

.add-address-icon {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background-color: #D4B886;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  font-size: 32rpx;
  line-height: 1;
}

.arrow-icon {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 32rpx;
  height: 32rpx;
  opacity: 0.3;
}

.address-border {
  height: 6rpx;
  background-image: repeating-linear-gradient(
    45deg,
    #D4B886 0,
    #D4B886 20rpx,
    #fff 20rpx,
    #fff 30rpx,
    #333 30rpx,
    #333 50rpx,
    #fff 50rpx,
    #fff 60rpx
  );
  width: 100%;
}

/* 商品列表 */
.goods-item {
  display: flex;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.goods-item:last-child {
  border-bottom: none;
}

.goods-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background-color: #f5f5f5;
  margin-right: 24rpx;
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8rpx 0;
}

.goods-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.goods-name {
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
  flex: 1;
  margin-right: 20rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.goods-price {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.goods-spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goods-spec {
  font-size: 24rpx;
  color: #999;
  background-color: #f9f9f9;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.goods-count {
  font-size: 26rpx;
  color: #999;
}

/* 单元格样式 */
.cell-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-top: 1rpx solid #f5f5f5;
}

.cell-label {
  font-size: 28rpx;
  color: #333;
  width: 160rpx;
}

.cell-content {
  flex: 1;
  text-align: right;
}

.cell-value {
  font-size: 28rpx;
  color: #666;
}

.remark-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  text-align: right;
}

.placeholder-style {
  color: #999;
}

/* 费用明细 */
.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.fee-label {
  font-size: 28rpx;
  color: #666;
}

.fee-value {
  font-size: 28rpx;
  color: #333;
}

.red-text {
  color: #FF4D4F;
}

.fee-total-row {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  margin-top: 30rpx;
  padding-top: 30rpx;
  border-top: 1rpx solid #f5f5f5;
}

.total-label {
  font-size: 28rpx;
  color: #333;
}

.total-price {
  font-size: 36rpx;
  font-weight: bold;
  color: #D4B886;
}

/* 底部栏 */
.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  z-index: 99;
}

.total-info {
  display: flex;
  align-items: baseline;
}

.total-text {
  font-size: 28rpx;
  color: #333;
}

.currency {
  font-size: 24rpx;
  color: #D4B886;
  font-weight: bold;
}

.final-price {
  font-size: 40rpx;
  color: #D4B886;
  font-weight: bold;
}

.submit-btn {
  margin: 0;
  width: 240rpx;
  height: 80rpx;
  line-height: 80rpx;
  background: linear-gradient(90deg, #EED5A5 0%, #D4B886 100%);
  color: #FFFFFF;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(212, 184, 134, 0.4);
}

.submit-btn[disabled] {
  background: #ccc;
  box-shadow: none;
  color: #fff;
}
</style>
