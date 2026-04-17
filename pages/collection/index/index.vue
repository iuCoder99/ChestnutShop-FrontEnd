<!-- 功能说明
展示用户收藏的所有产品，支持取消收藏、跳转产品详情页、直接购买，核心对接收藏列表、取消收藏接口。 -->
<template>
  <view class="collection-container">
    <!-- 管理操作栏 -->
    <view class="header-bar" v-if="collectionList.length > 0">
      <text class="total-count">共 {{ collectionList.length }} 件宝贝</text>
      <text class="manage-btn" @click="toggleManageMode">{{ isManageMode ? '完成' : '管理' }}</text>
    </view>

    <!-- 收藏列表 -->
    <view class="collection-list" v-if="collectionList.length > 0">
      <view 
        class="collection-item" 
        v-for="(item, index) in collectionList" 
        :key="item.id || index" 
        @click="handleItemClick(item, index)"
        @longpress="handleLongPress(item, index)"
      >
        <!-- 勾选框 -->
        <view class="checkbox-wrapper" v-if="isManageMode">
          <view class="checkbox" :class="{ 'checked': item.checked }">
            <text class="check-icon" v-if="item.checked">✓</text>
          </view>
        </view>
        
        <image :src="item.image || '/static/images/default-category.png'" mode="aspectFill" class="item-img"></image>
        <view class="item-info">
          <text class="item-name">{{item.name}}</text>
          <text class="item-spec" v-if="item.specText">规格：{{item.specText}}</text>
          <view class="price-row">
            <text class="item-price">¥{{(item.price || 0).toFixed(2)}}</text>
            <text class="enterprise-tag" v-if="item.isEnterprisePrice">批量咨询价</text>
          </view>
        </view>
        
        <!-- 非管理模式下显示操作按钮 -->
        <view class="item-operation" @click.stop v-if="!isManageMode">
          <button class="buy-btn" @click="buyNow(item)">购买</button>
          <view class="collect-btn" @click="cancelCollection(item.id, index)">
            <text class="collect-icon">❤️</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="isManageMode">
      <view class="select-all" @click="toggleSelectAll">
        <view class="checkbox" :class="{ 'checked': isAllSelected }">
          <text class="check-icon" v-if="isAllSelected">✓</text>
        </view>
        <text class="select-text">全选</text>
      </view>
      <view class="action-buttons">
        <button class="cancel-btn" @click="exitManageMode">取消</button>
        <button class="delete-btn" :class="{ 'disabled': selectedCount === 0 }" @click="batchDelete">
          删除({{selectedCount}})
        </button>
      </view>
    </view>

    <!-- 空收藏状态 -->
    <view class="empty-collection" v-else-if="!isLoading && collectionList.length === 0">
      <view class="empty-icon">📂</view>
      <text class="empty-text">暂无收藏的产品</text>
      <button class="go-shop-btn" @click="goToHome">去逛逛</button>
    </view>
    
    <!-- 加载中 -->
    <view class="loading-state" v-if="isLoading">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow, onNavigationBarButtonTap, onReachBottom } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import { userApi, productApi } from '@/utils/api';

// 状态管理
const userStore = useUserStore();
const isLoading = ref(false);
const isManageMode = ref(false); // 是否处于管理模式

// 页面数据
const collectionList = ref([]); // 收藏列表
const isEnd = ref(false); // 是否已加载全部
const sortValue = ref(null); // 滚动查询：排序值
const sortId = ref(null); // 滚动查询：ID
const querySize = ref(20); // 每次查询数量

// 计算选中的数量
const selectedCount = computed(() => {
  return collectionList.value.filter(item => item.checked).length;
});

// 计算是否全选
const isAllSelected = computed(() => {
  return collectionList.value.length > 0 && collectionList.value.every(item => item.checked);
});

// 切换管理模式
const toggleManageMode = () => {
  if (isManageMode.value) {
    // 退出管理模式
    exitManageMode();
  } else {
    // 进入管理模式
    isManageMode.value = true;
  }
};

// 监听导航栏按钮点击（保留 App 端兼容性，如果未来启用）
onNavigationBarButtonTap((e) => {
  if (e.text === '管理') {
    toggleManageMode();
  }
});

// 更新标题栏按钮显隐
const updateTitleButton = (show) => {
  // 页面内已有管理按钮，不再操作原生导航栏按钮
};

// 页面加载和显示时获取收藏列表
onLoad(() => {
  if (!userStore.token) {
    uni.navigateTo({ url: '/pages/main/login/login' });
    return;
  }
  // 首次加载
  refreshList();
});

onShow(() => {
  if (userStore.token) {
    // 每次显示页面时刷新列表，防止脏数据
    // refreshList(); // 已经在 onLoad 调用，onShow 如果需要实时更新可以保留，但要注意分页状态
    // 恢复管理按钮状态
    if (!isManageMode.value) {
      // updateTitleButton(true);
    }
  }
});

// 触底加载更多
onReachBottom(() => {
  if (!isEnd.value && !isLoading.value) {
    getCollectionList();
  }
});

// 刷新列表
const refreshList = async () => {
  collectionList.value = [];
  isEnd.value = false;
  sortValue.value = null;
  sortId.value = null;
  await getCollectionList();
};

// 退出管理模式
const exitManageMode = () => {
  isManageMode.value = false;
  // 清空选中状态
  collectionList.value.forEach(item => item.checked = false);
};

// 点击列表项
const handleItemClick = (item, index) => {
  if (isManageMode.value) {
    // 管理模式下，切换选中状态
    item.checked = !item.checked;
  } else {
    // 普通模式下，跳转详情
    goToProductDetail(item.id);
  }
};

// 全选/反选
const toggleSelectAll = () => {
  const newState = !isAllSelected.value;
  collectionList.value.forEach(item => item.checked = newState);
};

// 批量删除
const batchDelete = async () => {
  if (selectedCount.value === 0) return;
  
  const selectedItems = collectionList.value.filter(item => item.checked);
  const ids = selectedItems.map(item => item.id);
  
  uni.showModal({
    title: '提示',
    content: `确定要删除选中的 ${selectedCount.value} 个商品吗？`,
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' });
        try {
          const res = await userApi.deleteCollect(ids);
          if (res.success) {
            uni.showToast({ title: '删除成功' });
            // 从列表中移除已删除项
            collectionList.value = collectionList.value.filter(item => !item.checked);
            
            // 如果列表空了，自动退出管理模式
            if (collectionList.value.length === 0) {
              exitManageMode();
            }
          }
        } catch (error) {
          console.error('批量删除失败:', error);
        } finally {
          uni.hideLoading();
        }
      }
    }
  });
};

// 接口请求：获取收藏列表
const getCollectionList = async () => {
  if (isLoading.value || isEnd.value) return;
  isLoading.value = true;
  try {
    const params = {
      sortValue: sortValue.value,
      sortId: sortId.value,
      querySize: querySize.value
    };
    const res = await userApi.getCollectList(params);
    if (res.success && res.data) {
      const { list = [], isEnd: endStatus, simpleCursorCommonEntity } = res.data;
      
      // 处理并追加数据
      const newList = list.map(item => ({
        ...item,
        checked: false
      }));
      
      collectionList.value = [...collectionList.value, ...newList];
      isEnd.value = endStatus;
      
      // 更新滚动查询参数
      if (simpleCursorCommonEntity) {
        sortValue.value = simpleCursorCommonEntity.sortValue;
        sortId.value = simpleCursorCommonEntity.sortId;
      }
    }
  } catch (error) {
    console.error('获取收藏列表失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 长按删除
const handleLongPress = (item, index) => {
  uni.showActionSheet({
    itemList: ['删除收藏'],
    itemColor: '#FF0000',
    success: (res) => {
      if (res.tapIndex === 0) {
        cancelCollection(item.id, index);
      }
    }
  });
};

// 取消收藏
const cancelCollection = async (productId, index) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消收藏该产品吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中...' });
        try {
          const res = await userApi.deleteCollect(productId);
          if (res.success) {
            uni.showToast({ title: '取消收藏成功' });
            collectionList.value.splice(index, 1);
          }
        } catch (error) {
          console.error('取消收藏失败:', error);
        } finally {
          uni.hideLoading();
        }
      }
    }
  });
};

// 立即购买
const buyNow = (item) => {
  uni.navigateTo({
    url: `/pages/order/confirm/confirm?productId=${item.id}&quantity=1`
  });
};

// 跳转至产品详情页
const goToProductDetail = (productId) => {
  if (!productId) return;
  uni.navigateTo({ url: `/pages/product/detail/detail?productId=${productId}` });
};

// 返回上一页
const navigateBack = () => {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.reLaunch({ url: '/pages/main/index/index' });
  }
};

// 跳转至首页
const goHome = () => {
  uni.reLaunch({ url: '/pages/main/index/index' });
};
</script>

<style scoped>
.collection-container {
  background-color: #F8F8F8;
  min-height: 100vh;
  padding: 20rpx;
  padding-bottom: 120rpx; /* 为底部操作栏留出空间 */
}

/* 顶部管理栏 */
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10rpx 20rpx 10rpx;
  background-color: #F8F8F8;
  position: sticky;
  top: 0;
  z-index: 10;
}

.total-count {
  font-size: 26rpx;
  color: #666666;
}

.manage-btn {
  font-size: 28rpx;
  color: #333333;
  padding: 10rpx 20rpx;
  background-color: #FFFFFF;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

/* 收藏列表 */
.collection-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.collection-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
  transition: all 0.3s;
}

.collection-item:active {
  background-color: #FAFAFA;
}

/* 勾选框样式 */
.checkbox-wrapper {
  margin-right: 20rpx;
  display: flex;
  align-items: center;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #CCCCCC;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #FFFFFF;
  transition: all 0.2s;
}

.checkbox.checked {
  background-color: #FF5000;
  border-color: #FF5000;
}

.check-icon {
  color: #FFFFFF;
  font-size: 24rpx;
  font-weight: bold;
}

.item-img {
  width: 180rpx;
  height: 180rpx;
  border-radius: 12rpx;
  margin-right: 24rpx;
  background-color: #F5F5F5;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 180rpx;
  overflow: hidden;
  padding-top: 4rpx;
  padding-bottom: 4rpx;
}

.item-name {
  font-size: 30rpx;
  color: #333333;
  font-weight: bold;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  margin-bottom: 8rpx;
}

.item-spec {
  font-size: 24rpx;
  color: #999999;
  background-color: #F8F8F8;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  align-self: flex-start;
  margin-bottom: auto;
}

.price-row {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
}

.item-price {
  font-size: 36rpx;
  color: #FF5000;
  font-weight: bold;
  margin-right: 12rpx;
}

.enterprise-tag {
  font-size: 20rpx;
  color: #FF5000;
  background-color: #FFF0E9;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  border: 1rpx solid #FF5000;
}

.item-operation {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  height: 180rpx;
  margin-left: 20rpx;
  padding-top: 4rpx;
  padding-bottom: 4rpx;
}

.buy-btn {
  width: 140rpx;
  height: 60rpx;
  background: linear-gradient(90deg, #FF9000, #FF5000);
  color: #FFFFFF;
  border-radius: 30rpx;
  font-size: 26rpx;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  border: none;
  box-shadow: 0 4rpx 10rpx rgba(255, 80, 0, 0.2);
}

.collect-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F8F8F8;
  border-radius: 50%;
}

.collect-icon {
  font-size: 32rpx;
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.select-all {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #333333;
}

.select-text {
  margin-left: 16rpx;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.cancel-btn {
  width: 140rpx;
  height: 72rpx;
  background-color: #F5F5F5;
  color: #666666;
  border-radius: 36rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  border: none;
}

.delete-btn {
  width: 180rpx;
  height: 72rpx;
  background: linear-gradient(90deg, #FF9000, #FF5000);
  color: #FFFFFF;
  border-radius: 36rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  border: none;
  transition: all 0.3s;
}

.delete-btn.disabled {
  background: #CCCCCC;
  color: #FFFFFF;
  opacity: 0.8;
}

/* 空收藏状态 */
.empty-collection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 40rpx;
  opacity: 0.8;
}

.empty-text {
  font-size: 30rpx;
  color: #666666;
  margin-bottom: 60rpx;
}

.go-shop-btn {
  width: 280rpx;
  height: 88rpx;
  background: linear-gradient(90deg, #D4B886, #C0A060);
  color: #FFFFFF;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 6rpx 16rpx rgba(212, 184, 134, 0.3);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40rpx;
}

.loading-text {
  font-size: 26rpx;
  color: #999999;
}
</style>
