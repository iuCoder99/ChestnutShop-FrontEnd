<!-- 功能说明
展示用户所有收货地址，支持地址选择、编辑、删除操作，默认地址标记，核心对接地址列表、删除接口。 -->

<template>
  <view class="address-list-container">
    <view class="header">
      <view class="header-left">
        <text class="header-title">我的收货地址</text>
        <text class="header-subtitle">管理您的配送信息</text>
      </view>
      <button class="add-btn" @click="goToAddAddress" hover-class="btn-hover">
        <text class="add-icon">+</text>
        <text>新增地址</text>
      </button>
    </view>

    <view class="address-grid" v-if="addressList.length > 0">
      <view class="address-card" v-for="(item, index) in addressList" :key="index" @click="handleItemClick(item)">
        <view class="card-header">
          <view class="user-info">
            <text class="address-name">{{item.receiver}}</text>
            <text class="address-phone">{{item.phone}}</text>
          </view>
          <view class="address-default" v-if="item.isDefault">默认</view>
        </view>
        
        <view class="card-body">
          <text class="address-detail">{{item.province}}{{item.city}}{{item.district}} {{item.detailAddress}}</text>
        </view>

        <view class="card-footer" @click.stop>
          <view class="footer-left" v-if="isSelectMode && item.id === selectedAddressId">
            <image src="/static/images/select.png" class="select-icon"></image>
            <text class="select-text">当前选中</text>
          </view>
          <view class="footer-right">
            <view class="op-btn edit" @click.stop="goToEditAddress(item)">
              <text class="op-text">编辑</text>
            </view>
            <view class="op-btn delete" @click.stop="deleteAddress(item.id, index)">
              <text class="op-text">删除</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="empty-address" v-else>
      <image src="/static/images/empty-address.png" class="empty-img"></image>
      <text class="empty-text">暂无收货地址</text>
      <button class="add-first-btn" @click="goToAddAddress">添加我的第一个地址</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import request from '@/utils/request';

// 状态管理
const userStore = useUserStore();

// 页面数据
const addressList = ref([]); // 地址列表
const selectedAddressId = ref(''); // 选中地址ID（从订单页跳转时传递）
const isSelectMode = ref(false); // 是否处于选择模式

// 页面加载和显示时获取地址列表
onLoad((options) => {
  if (!userStore.token) {
    uni.navigateTo({ url: '/pages/main/login/login' });
    return;
  }
  selectedAddressId.value = options.selectedAddressId || '';
  isSelectMode.value = !!options.selectedAddressId;
  
  // 监听地址编辑/新增事件
  uni.$on('addressEdited', () => {
    getAddressList();
  });
  uni.$on('addressAdded', () => {
    getAddressList();
  });
});

onShow(() => {
  getAddressList();
});

// 页面卸载时移除事件监听
onUnload(() => {
  uni.$off('addressEdited');
  uni.$off('addressAdded');
});

// 接口请求：获取地址列表
const getAddressList = async () => {
  uni.showLoading({ title: '加载中' });
  try {
    const res = await request({
      url: '/api/address/list',
      method: 'GET'
    });
    if (res.success) {
      addressList.value = res.data;
    }
  } catch (error) {
    uni.showToast({ title: '地址加载失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

// 页面跳转：新增地址
const goToAddAddress = () => {
  uni.navigateTo({
    url: '/pages/address/edit/edit?type=add'
  });
};

// 页面跳转：编辑地址
const goToEditAddress = (address) => {
  uni.navigateTo({
    url: `/pages/address/edit/edit?type=edit&address=${encodeURIComponent(JSON.stringify(address))}`
  });
};

// 处理点击项
const handleItemClick = (address) => {
  if (isSelectMode.value) {
    selectAddress(address);
  } else {
    goToEditAddress(address);
  }
};

// 选择地址（回调给订单页）
const selectAddress = (address) => {
  // 使用uni.$emit发送事件
  uni.$emit('addressSelected', address);
  uni.navigateBack();
};

// 删除地址
const deleteAddress = (addressId, index) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除该地址吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const res = await request({
            url: '/api/address/delete',
            method: 'DELETE',
            params: { id: addressId }
          });
          if (res.success) {
            uni.showToast({ title: '删除成功' });
            addressList.value.splice(index, 1);
          } else {
            uni.showToast({ title: res.message || '删除失败', icon: 'none' });
          }
        } catch (error) {
          uni.showToast({ title: '网络异常，删除失败', icon: 'none' });
        }
      }
    }
  });
};
</script>

<style scoped>
.address-list-container {
  background-color: #F8F9FA;
  min-height: 100vh;
  padding: 40rpx 30rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
  padding: 0 10rpx;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: 40rpx;
  font-weight: 800;
  color: #1A1A1A;
  margin-bottom: 8rpx;
}

.header-subtitle {
  font-size: 24rpx;
  color: #999999;
}

.add-btn {
  width: 220rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #EAD6B3 0%, #D4B886 100%);
  color: #FFFFFF;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  box-shadow: 0 10rpx 20rpx rgba(212, 184, 134, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.add-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  opacity: 0;
  transition: opacity 0.3s;
}

.btn-hover {
  transform: translateY(-2rpx);
  box-shadow: 0 15rpx 30rpx rgba(212, 184, 134, 0.4);
}

.btn-hover::after {
  opacity: 1;
}

.add-icon {
  font-size: 36rpx;
  margin-right: 8rpx;
  margin-top: -4rpx;
}

/* 地址列表网格布局 */
.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(600rpx, 1fr));
  gap: 30rpx;
}

@media (max-width: 650px) {
  .address-grid {
    grid-template-columns: 1fr;
  }
}

.address-card {
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  border: 1rpx solid rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
}

.address-card:active {
  transform: scale(0.99);
  background-color: #FAFAFA;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24rpx;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.address-name {
  font-size: 34rpx;
  color: #1A1A1A;
  font-weight: 700;
}

.address-phone {
  font-size: 28rpx;
  color: #666666;
}

.address-default {
  background: #FDF6EC;
  color: #D4B886;
  font-size: 20rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-weight: 600;
  border: 1rpx solid #F5E8D0;
}

.card-body {
  margin-bottom: 30rpx;
  flex: 1;
}

.address-detail {
  font-size: 28rpx;
  color: #4D4D4D;
  line-height: 1.6;
  display: block;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24rpx;
  border-top: 1rpx solid #F2F2F2;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.select-icon {
  width: 32rpx;
  height: 32rpx;
}

.select-text {
  font-size: 24rpx;
  color: #D4B886;
  font-weight: 600;
}

.footer-right {
  display: flex;
  gap: 30rpx;
  margin-left: auto;
}

.op-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 0;
}

.op-icon {
  width: 28rpx;
  height: 28rpx;
  opacity: 0.6;
}

.op-text {
  font-size: 26rpx;
  color: #666666;
}

.op-btn.delete .op-text {
  color: #F53F3F;
}

.op-btn.delete .op-icon {
  filter: invert(34%) sepia(87%) saturate(5451%) hue-rotate(346deg) brightness(101%) contrast(94%);
  opacity: 0.8;
}

.empty-address {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.empty-img {
  width: 320rpx;
  height: 320rpx;
  margin-bottom: 40rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #999999;
  margin-bottom: 60rpx;
}

.add-first-btn {
  width: 400rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #EAD6B3 0%, #D4B886 100%);
  color: #FFFFFF;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 20rpx rgba(212, 184, 134, 0.3);
}
</style>
