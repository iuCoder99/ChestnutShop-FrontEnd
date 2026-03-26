<template>
  <view class="cart-container">
    <!-- 得物风顶部导航栏 -->
    <TopNavbar activePage="cart" />
    
    <view class="cart-content-body">
      <!-- 优惠券模块入口 (新增) -->
      <view class="coupon-section" v-if="cartList.length > 0">
        <view class="coupon-left">
          <text class="coupon-label">优惠券</text>
          <text class="coupon-tip">领取优惠券最高可减 ¥100</text>
        </view>
        <view class="coupon-right">
          <text class="coupon-action">领券</text>
          <text class="iconfont icon-arrow-right"></text>
        </view>
      </view>

      <!-- 购物车为空 -->
      <view class="empty-cart" v-if="cartList.length === 0">
        <view class="empty-content">
          <image src="/static/images/empty.png" mode="aspectFit" class="empty-img"></image>
          <text class="empty-text">购物车空空如也</text>
          <text class="empty-subtext">快去挑选心仪商品吧~</text>
          <button class="go-shopping-btn" @click="goHome">去逛逛</button>
        </view>
      </view>

      <!-- 购物车列表 -->
      <view class="cart-list" v-else>
        <!-- 顶部操作栏 -->
        <view class="cart-header">
          <view class="header-left">
            <view class="all-select-wrapper" @tap.stop="handleAllSelect">
              <view class="custom-checkbox" :class="{ checked: isAllSelected }">
                <view class="checkbox-inner" v-if="isAllSelected"></view>
              </view>
              <text class="all-select-text">全选</text>
            </view>
          </view>
          <view class="header-right">
            <button 
              class="batch-delete-btn" 
              :class="{ 'btn-active': selectedCount > 0 }"
              @click="showDeleteModal"
            >
              批量删除
              <text v-if="selectedCount > 0" class="btn-badge">({{selectedCount}})</text>
            </button>
          </view>
        </view>

       <!-- 商品列表 -->
        <view class="cart-item-card" v-for="(item, index) in cartList" :key="index" :class="{ 'item-disabled': item.stock <= 0 }">
          <view class="item-checkbox" @tap.stop="item.stock > 0 ? handleItemSelect(index) : null">
            <view class="custom-checkbox" :class="{ checked: item.checked, disabled: item.stock <= 0 }">
              <view class="checkbox-inner" v-if="item.checked"></view>
            </view>
          </view>
          
          <view class="item-main-content" @click="goToProductDetail(item.productId)">
            <view class="image-wrapper">
              <image :src="item.productImage" mode="aspectFill" class="cart-item-img"></image>
              <view class="stock-mask" v-if="item.stock <= 0">缺货</view>
            </view>
            <view class="cart-item-info">
              <text class="cart-item-name">{{item.productName}}</text>
              <view class="cart-item-spec-tag">
                <text class="spec-text">{{item.specText}}</text>
              </view>
              <view class="item-price-row">
                <text class="cart-item-price">¥{{item.price.toFixed(2)}}</text>
              </view>
            </view>
          </view>

          <view class="item-right-actions">
            <view class="quantity-control" v-if="item.stock > 0">
              <view class="quantity-btn minus" :class="{ disabled: item.quantity <= 1 }" @click.stop="handleQuantityChange(index, 'minus')">-</view>
              <input type="number" class="quantity-input" :value="item.quantity" @blur.stop="(e) => handleQuantityInput(index, e)" @click.stop="">
              <view class="quantity-btn plus" :class="{ disabled: item.quantity >= item.stock }" @click.stop="handleQuantityChange(index, 'plus')">+</view>
            </view>
            <view class="single-delete-action" @click.stop="deleteSingleItem(index)">
              删除
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部结算 (保持在最外层，因为它有 fixed 定位) -->
    <view class="cart-footer" v-if="cartList.length > 0">
      <view class="footer-left">
        <view class="total-info">
          <view class="total-price-wrapper">
            <text class="total-label">合计:</text>
            <text class="total-currency">¥</text>
            <text class="total-amount">{{totalPrice.toFixed(2)}}</text>
          </view>
          <text class="total-count-tip">已选 {{selectedCount}} 件商品</text>
        </view>
      </view>
      
      <view class="footer-right">
        <view class="action-btns" v-if="hasChanged">
          <button class="footer-cancel-btn" @click="handleRollback">重置</button>
          <button class="footer-save-btn" @click="handleSave">保存修改</button>
        </view>
        <button 
          v-else
          class="settle-btn" 
          :class="{ 'settle-btn-active': selectedCount > 0 }"
          @click="goToConfirmOrder" 
        >
          结算({{selectedCount}})
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onShow, onHide } from '@dcloudio/uni-app';
import { useCartStore } from '@/store/modules/cartStore';
import TopNavbar from '@/components/business/TopNavbar.vue';
import { useUserStore } from '@/store/modules/userStore';
import request from '@/utils/request';

// 状态管理
const cartStore = useCartStore();
const userStore = useUserStore();
// 页面数据
const cartList = ref([]); // 购物车列表
const originalCartList = ref([]); // 用于回滚的原始数据

// 计算属性：是否有未保存的修改（支持删除和数量变化检测）
const hasChanged = computed(() => {
  // 1. 检查长度是否变化（是否有删除）
  if (cartList.value.length !== originalCartList.value.length) return true;
  
  // 2. 检查现有商品数量是否与原始备份一致
  return cartList.value.some(item => {
    const originalItem = originalCartList.value.find(o => o.productId === item.productId && o.specId === item.specId);
    // 如果找不到原始项（理论上长度一致时不会发生）或者数量不一致，则认为已修改
    return !originalItem || Number(item.quantity) !== Number(originalItem.quantity);
  });
});

// 计算属性：全选状态
const isAllSelected = computed({
  get: () => {
    // 过滤出有库存的商品
    const purchasableItems = cartList.value.filter(item => item.stock > 0);
    // 如果没有可购买商品，全选不勾选
    if (purchasableItems.length === 0) return false;
    // 所有可购买商品都选中，则全选勾选
    return purchasableItems.every(item => item.checked);
  },
  set: (val) => {
    // 仅同步有库存的商品
    cartList.value.forEach(item => {
      if (item.stock > 0) {
        item.checked = val;
      }
    });
  }
});

// 计算属性：选中商品总数、选中商品总价
const selectedCount = computed(() => {
  // 仅计算有库存且已勾选商品的数量
  return cartList.value
    .filter(item => item.stock > 0 && item.checked)
    .reduce((total, item) => total + item.quantity, 0);
});

const totalPrice = computed(() => {
  // 仅计算有库存且已勾选商品的价格
  return cartList.value
    .filter(item => item.stock > 0 && item.checked)
    .reduce((total, item) => total + (item.price * item.quantity), 0);
});

// 计算总件数（所有商品数量之和）
const totalCount = computed(() => {
  return cartList.value.reduce((total, item) => total + item.quantity, 0);
});

// 接口请求：获取购物车列表
const getCartList = async () => {
  uni.showLoading({ title: '加载中' });
  try {
    const res = await request({
      url: '/api/cart/list',
      method: 'GET'
    });
    if (res && res.success && Array.isArray(res.data)) {
      console.log('购物车数据请求成功:', res.data);
      cartList.value = res.data.map(item => ({
        ...item, 
        // 有库存的默认选中，没库存的不选中
        checked: item.stock > 0,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        specText: item.specText || '默认规格'
      }));
      // 备份原始数据用于回滚
      originalCartList.value = JSON.parse(JSON.stringify(cartList.value));
    } else {
      console.warn('购物车数据格式异常或请求失败:', res);
      cartList.value = [];
    }
  } catch (error) {
    uni.showToast({ title: '购物车加载失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

// 全选/取消全选
const handleAllSelect = () => {
  const targetValue = !isAllSelected.value;
  isAllSelected.value = targetValue;
};

// 单个商品选择
const handleItemSelect = (index) => {
  const item = cartList.value[index];
  if (item.stock > 0) {
    item.checked = !item.checked;
  }
};

// 数量修改
let debounceTimer = null;
const handleQuantityChange = (index, type) => {
  const item = cartList.value[index];
  let newQuantity = item.quantity;
  if (type === 'plus') {
    newQuantity += 1;
    // 校验库存
    if (newQuantity > item.stock) {
      uni.showToast({ title: '库存不足', icon: 'none' });
      return;
    }
  } else if (type === 'minus') {
    if (newQuantity <= 1) return;
    newQuantity -= 1;
  }
  
  // 更新本地数据
  cartList.value[index].quantity = newQuantity;
  
  // 防抖逻辑（按要求实现，300ms内不重复提示或处理）
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    // 仅作视图更新，不触发接口
  }, 300);
};

// 输入数量修改
const handleQuantityInput = (index, e) => {
  let newQuantity = parseInt(e.detail.value);
  const item = cartList.value[index];
  
  // 校验合法性
  if (isNaN(newQuantity) || newQuantity < 1) {
    newQuantity = 1;
  } else if (newQuantity > item.stock) {
    newQuantity = item.stock;
    uni.showToast({ title: `库存不足，最大可购${item.stock}件`, icon: 'none' });
  }
  
  // 更新本地数据
  cartList.value[index].quantity = newQuantity;
};

// 保存修改到云端
const handleSave = async () => {
  if (!hasChanged.value) return;
  
  uni.showLoading({ title: '保存中' });
  try {
    const cartItems = cartList.value.map(item => ({
      productId: item.productId,
      specId: item.specId,
      quantity: item.quantity
    }));
    
    const res = await request({
      url: '/api/cart/update',
      method: 'PUT',
      data: { cartItems }
    });
    
    if (res.success) {
      uni.showToast({ title: '保存成功' });
      uni.removeStorageSync('cart_cache');
      uni.removeStorageSync('cart_original_cache');
      // 更新原始数据备份
      originalCartList.value = JSON.parse(JSON.stringify(cartList.value));
      // 同步Pinia状态
      cartStore.syncCart();
    } else {
      throw new Error(res.message || '保存失败');
    }
  } catch (error) {
    uni.showToast({ title: '网络异常，操作失败', icon: 'none' });
    // 回滚本地视图
    cartList.value = JSON.parse(JSON.stringify(originalCartList.value));
    uni.removeStorageSync('cart_cache');
    uni.removeStorageSync('cart_original_cache');
  } finally {
    uni.hideLoading();
  }
};

// 取消修改并回滚
const handleRollback = () => {
  if (!hasChanged.value) return;
  uni.showModal({
    title: '提示',
    content: '您确定要取消之前的修改吗?',
    success: (res) => {
      if (res.confirm) {
        cartList.value = JSON.parse(JSON.stringify(originalCartList.value));
        uni.removeStorageSync('cart_cache');
        uni.removeStorageSync('cart_original_cache');
        uni.showToast({ title: '已取消', icon: 'none' });
      }
    }
  });
};

// 单个商品删除（仅前端缓存移除，保存时统一同步）
const deleteSingleItem = (index) => {
  uni.showModal({
    title: '提示',
    content: '确定要从购物车移除该商品吗？',
    success: (res) => {
      if (res.confirm) {
        cartList.value.splice(index, 1);
        uni.showToast({ title: '已移除，请记得保存', icon: 'none' });
      }
    }
  });
};

// 批量删除相关
const showDeleteModal = () => {
  const selectedItems = cartList.value.filter(item => item.checked);
  if (selectedItems.length === 0) {
    uni.showToast({ title: '请选择要删除的商品', icon: 'none' });
    return;
  }
  
  uni.showModal({
    title: '提示',
    content: '确定要移除选中的商品吗？',
    success: (res) => {
      if (res.confirm) {
        confirmDelete();
      }
    }
  });
};

const confirmDelete = () => {
  const selectedItems = cartList.value.filter(item => item.checked);
  if (selectedItems.length === 0) return;
  
  // 仅在本地进行过滤，不调用接口
  cartList.value = cartList.value.filter(item => !item.checked);
  uni.showToast({ title: '已移除，请记得保存', icon: 'none' });
};

const performSettle = (items) => {
  // 跳转并携带选中商品数据
  uni.navigateTo({
    url: `/pages/order/confirm/confirm?cartItems=${encodeURIComponent(JSON.stringify(items))}`
  });
};

// 跳转至订单确认页
const goToConfirmOrder = () => {
  // 仅结算有库存且已勾选的商品
  const selectedItems = cartList.value.filter(item => item.checked && item.stock > 0);
  
  if (selectedItems.length === 0) {
    uni.showToast({ title: '请选择要结算的商品', icon: 'none' });
    return;
  }
  
  // 如果有未保存的修改，提示用户先保存
  if (hasChanged.value) {
    uni.showModal({
      title: '提示',
      content: '您有未保存的修改，是否先保存？',
      confirmText: '去保存',
      cancelText: '直接结算',
      success: (res) => {
        if (res.confirm) {
          handleSave();
        } else {
          performSettle(selectedItems);
        }
      }
    });
  } else {
    performSettle(selectedItems);
  }
};

// 页面跳转
const goHome = () => {
  uni.reLaunch({ url: '/pages/main/index/index' });
};

const goToProductDetail = (productId) => {
  uni.navigateTo({ url: `/pages/product/detail/detail?productId=${productId}` });
};

// 页面显示时获取购物车数据
onShow(() => {
  // 优先从缓存读取未保存的修改
  const cachedCart = uni.getStorageSync('cart_cache');
  const cachedOriginal = uni.getStorageSync('cart_original_cache');
  
  // 检查缓存
  if (Array.isArray(cachedCart) && cachedCart.length > 0 && Array.isArray(cachedOriginal)) {
    cartList.value = cachedCart;
    originalCartList.value = cachedOriginal;
  } else {
    // 无效或空缓存则清理并请求新数据
    uni.removeStorageSync('cart_cache');
    uni.removeStorageSync('cart_original_cache');
    
    if (userStore.token || userStore.isLogin) {
      getCartList();
    } else {
      // 未登录，获取本地临时购物车
      const tempCart = uni.getStorageSync('cartTemp') || [];
      cartList.value = tempCart.map(item => ({ 
        ...item, 
        checked: true,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1
      }));
      originalCartList.value = JSON.parse(JSON.stringify(cartList.value));
    }
  }
});

// 页面隐藏时持久化未保存的修改
onHide(() => {
  if (hasChanged.value) {
    uni.setStorageSync('cart_cache', cartList.value);
    uni.setStorageSync('cart_original_cache', originalCartList.value);
  }
});
</script>

<style scoped>
/* 基础样式 */
.cart-container {
  background-color: #f8f8f8; /* 改为浅灰色背景，增加层次感 */
  min-height: 100vh;
  padding-bottom: 120rpx; /* 为固定底栏预留空间 */
}

.cart-content-body {
  padding: 24rpx;
}

/* 优惠券模块 */
.coupon-section {
  background-color: #ffffff;
  padding: 24rpx 30rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}
.coupon-left {
  display: flex;
  align-items: center;
}
.coupon-label {
  background: linear-gradient(135deg, #ff6b6b, #ff3b30);
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  margin-right: 16rpx;
}
.coupon-tip {
  font-size: 26rpx;
  color: #333;
}
.coupon-right {
  display: flex;
  align-items: center;
}
.coupon-action {
  font-size: 24rpx;
  color: #ff3b30;
  margin-right: 8rpx;
}

/* 空购物车 */
.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 150rpx;
}
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-img {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 30rpx;
}
.empty-text {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 12rpx;
}
.empty-subtext {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 40rpx;
}
.go-shopping-btn {
  width: 280rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #e0c596, #d4b886);
  color: #ffffff;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
  box-shadow: 0 10rpx 20rpx rgba(212, 184, 134, 0.3);
  transition: all 0.3s;
}
.go-shopping-btn:active {
  transform: scale(0.95);
  box-shadow: 0 5rpx 10rpx rgba(212, 184, 134, 0.2);
}

/* 购物车头部 */
.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding: 0 10rpx;
}
.all-select-wrapper {
  display: flex;
  align-items: center;
  padding: 10rpx 0;
}
/* 自定义复选框 */
.custom-checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s;
  background-color: #fff;
}
.custom-checkbox.checked {
  background-color: #d4b886;
  border-color: #d4b886;
}
.custom-checkbox.disabled {
  background-color: #f5f5f5;
  border-color: #eee;
}
.checkbox-inner {
  width: 20rpx;
  height: 10rpx;
  border-left: 4rpx solid #fff;
  border-bottom: 4rpx solid #fff;
  transform: rotate(-45deg);
  margin-top: -4rpx;
}

.all-select-text {
  font-size: 28rpx;
  color: #333;
  margin-left: 12rpx;
  font-weight: 500;
}

/* 批量删除按钮重设计 */
.batch-delete-btn {
  font-size: 24rpx;
  color: #999;
  background: transparent;
  padding: 0;
  height: 60rpx;
  line-height: 60rpx;
  margin: 0;
  display: flex;
  align-items: center;
  transition: all 0.3s;
  border: none;
}
.batch-delete-btn.btn-active {
  color: #ff3b30;
  font-weight: bold;
}
.btn-badge {
  margin-left: 4rpx;
}
.batch-delete-btn:active {
  opacity: 0.7;
}

/* 商品卡片 */
.cart-item-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.03);
  transition: all 0.2s;
  position: relative;
}
.item-disabled {
  opacity: 0.6;
}

.item-checkbox {
  padding: 20rpx;
  margin: -20rpx;
  margin-right: 10rpx;
}

.item-main-content {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.image-wrapper {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  flex-shrink: 0;
}
.cart-item-img {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
  background-color: #f5f5f5;
}
.stock-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  color: #fff;
  font-size: 24rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12rpx;
}

.cart-item-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 160rpx;
  min-width: 0;
}

.cart-item-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cart-item-spec-tag {
  background-color: #f5f5f5;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  align-self: flex-start;
  margin: 8rpx 0;
}
.spec-text {
  font-size: 22rpx;
  color: #999;
}

.item-price-row {
  display: flex;
  align-items: baseline;
}
.cart-item-price {
  font-size: 34rpx;
  color: #d4b886;
  font-weight: bold;
}

.item-right-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  height: 160rpx;
  padding-left: 20rpx;
}

.quantity-control {
  display: flex;
  align-items: center;
  background-color: #f8f8f8;
  border-radius: 24rpx;
  padding: 2rpx;
}
.quantity-btn {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28rpx;
  color: #333;
}
.quantity-btn.disabled {
  color: #ccc;
}
.quantity-input {
  width: 50rpx;
  height: 40rpx;
  text-align: center;
  font-size: 24rpx;
  font-weight: 500;
}

.single-delete-action {
  font-size: 24rpx;
  color: #ff3b30;
  padding: 10rpx 20rpx;
  background-color: #fff0f0;
  border-radius: 20rpx;
  transition: all 0.2s;
}
.single-delete-action:active {
  background-color: #ffcccc;
  transform: scale(0.9);
}

/* 底部结算栏 */
.cart-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 120rpx;
  background-color: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  border-top: 1rpx solid #f0f0f0;
  box-sizing: border-box;
  z-index: 100;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.05);
}

.footer-left {
  display: flex;
  align-items: center;
}

.total-info {
  display: flex;
  flex-direction: column;
}
.total-price-wrapper {
  display: flex;
  align-items: baseline;
}
.total-label {
  font-size: 24rpx;
  color: #333;
  margin-right: 4rpx;
}
.total-currency {
  font-size: 24rpx;
  color: #d4b886;
  font-weight: bold;
}
.total-amount {
  font-size: 40rpx;
  color: #d4b886;
  font-weight: bold;
}
.total-count-tip {
  font-size: 20rpx;
  color: #999;
}

.footer-right {
  display: flex;
  align-items: center;
}

.action-btns {
  display: flex;
  gap: 16rpx;
}
.footer-cancel-btn {
  width: 140rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
  font-size: 26rpx;
  background: #f5f5f5;
  color: #666;
  margin: 0;
  padding: 0;
}
.footer-save-btn {
  width: 200rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 36rpx;
  font-size: 26rpx;
  background: #d4b886;
  color: #fff;
  margin: 0;
  padding: 0;
  box-shadow: 0 4rpx 10rpx rgba(212, 184, 134, 0.2);
}

.settle-btn {
  width: 220rpx;
  height: 80rpx;
  line-height: 80rpx;
  background: #ccc;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  margin: 0;
  padding: 0;
  transition: all 0.3s;
}
.settle-btn-active {
  background: linear-gradient(135deg, #e0c596, #d4b886);
  box-shadow: 0 8rpx 16rpx rgba(212, 184, 134, 0.3);
}
.settle-btn-active:active {
  transform: scale(0.95);
}
</style>