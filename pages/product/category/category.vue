<template>
  <!-- 分类页面布局 -->
  <view class="category-page-container">
    <!-- 得物风顶部导航栏 -->
    <TopNavbar activePage="category" />
    
    <!-- 搜索栏 -->
    <view class="search-bar-header" @click="goToSearch">
      <view class="search-bar">
        <image src="/static/images/icon-search.png" class="search-icon"></image>
        <text class="search-placeholder">请输入产品名称搜索</text>
      </view>
    </view>
    
    <view class="category-page">
      <!-- 左侧分类栏 -->
      <scroll-view 
        class="left-sidebar" 
        scroll-y
        :show-scrollbar="false"
      >
        <view 
          class="category-item"
          :class="{ 'selected': activeCategoryId === category.id }"
          v-for="category in categoryList" 
          :key="category.id"
          @click="selectCategory(category)"
        >
          <view class="active-indicator" v-if="activeCategoryId === category.id"></view>
          <text class="category-name">{{ category.name }}</text>
        </view>
      </scroll-view>
      
      <!-- 右侧内容区 -->
      <scroll-view 
        class="right-content" 
        scroll-y
        :show-scrollbar="false"
        @scrolltolower="onScrollToLower"
      >
        <!-- 加载状态 -->
        <view class="loading-state" v-if="isLoading">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 错误提示 -->
        <view class="error-state" v-else-if="errorMsg">
          <view class="error-icon">
            <text class="icon">⚠️</text>
          </view>
          <text class="error-text">{{ errorMsg }}</text>
          <button class="retry-btn" @click="initCategoryData">重新加载</button>
        </view>
        
        <!-- 内容区域 -->
        <view class="content-wrapper" v-else>
          <!-- 二级分类展示 (简单网格) -->
          <view class="sub-category-container">
            <!-- 顶部 Banner -->
            <view class="category-banner">
              <image 
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                class="banner-image"
                mode="aspectFill"
              ></image>
            </view>
            
            <!-- 如果数据是三级结构 (Level 1 -> Level 2 -> Level 3)，我们这里把 Level 2 平铺展示 -->
            <!-- 点击 Level 2 直接跳转商品列表 -->
            <view class="simple-grid" v-if="currentSubCategories.length > 0">
              <view 
                class="simple-grid-item" 
                v-for="subItem in currentSubCategories" 
                :key="subItem.id"
                @click="navigateToCategory(subItem)"
              >
                <view class="item-icon-wrapper">
                  <!-- 优先显示二级分类自己的图标，如果没有，尝试显示其第一个子分类的图标 -->
                  <image 
                    :src="subItem.iconUrl || (subItem.children && subItem.children[0] ? subItem.children[0].iconUrl : '') || 'https://cdn-icons-png.flaticon.com/512/1370/1370445.png'" 
                    class="item-icon"
                    mode="aspectFit"
                  ></image>
                </view>
                <text class="item-name">{{ subItem.name }}</text>
              </view>
            </view>
            
            <!-- 空状态 -->
            <view class="empty-state" v-else>
              <view class="empty-icon">
                <text class="icon">📦</text>
              </view>
              <text class="empty-text">暂无分类</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import cacheUtil from '@/utils/cacheUtil';
import request from '@/utils/request';
import TopNavbar from '@/components/business/TopNavbar.vue';

// 状态管理
const categoryList = ref([]); // 一级分类列表
const activeCategoryId = ref(''); // 当前选中的分类ID
const selectedCategoryName = ref(''); // 当前选中的分类名称
const currentSubCategories = ref([]); // 当前分类的二级分类
const isLoading = ref(false); // 加载状态
const errorMsg = ref(''); // 错误信息

// 页面参数
const queryCategoryId = ref('');

// 页面加载
onLoad((options) => {
  if (options.categoryId) {
    queryCategoryId.value = String(options.categoryId);
  }
});

// 监听页面显示，处理来自首页等页面的跳转参数
onShow(() => {
  const jumpCategoryId = uni.getStorageSync('jumpCategoryId');
  if (jumpCategoryId) {
    console.log('检测到跳转参数 categoryId:', jumpCategoryId);
    const targetId = String(jumpCategoryId);
    queryCategoryId.value = targetId;
    
    // 如果分类列表已经加载完成，直接切换选中项
    if (categoryList.value.length > 0) {
      const target = categoryList.value.find(c => String(c.id) === targetId);
      if (target) {
        selectCategory(target);
      }
    }
    
    // 清除缓存参数，防止重复触发
    uni.removeStorageSync('jumpCategoryId');
  }
});

// 模拟更真实的分类数据
const hardcodedData = [
  { 
    id: '1', 
    name: '手机数码', 
    children: [
      { id: '101', name: '热门手机', iconUrl: 'https://cdn-icons-png.flaticon.com/128/0/191.png' },
      { id: '102', name: '手机配件', iconUrl: 'https://cdn-icons-png.flaticon.com/128/4639/4639145.png' },
      { id: '103', name: '智能设备', iconUrl: 'https://cdn-icons-png.flaticon.com/128/3003/3003883.png' }
    ] 
  },
  { 
    id: '2', 
    name: '家用电器', 
    children: [
      { id: '201', name: '大家电', iconUrl: 'https://cdn-icons-png.flaticon.com/128/911/911409.png' },
      { id: '202', name: '生活电器', iconUrl: 'https://cdn-icons-png.flaticon.com/128/2555/2555938.png' }
    ] 
  },
  { id: '3', name: '运动户外', children: [{ id: '301', name: '运动鞋服', iconUrl: 'https://cdn-icons-png.flaticon.com/128/2589/2589903.png' }] },
  { id: '4', name: '美妆个护', children: [] },
  { id: '5', name: '食品饮料', children: [] },
  { id: '6', name: '服装鞋帽', children: [] },
  { id: '7', name: '家居生活', children: [] },
  { id: '8', name: '母婴用品', children: [] }
];

// 递归处理分类数据
const processCategoryData = (list) => {
  return list.map(item => ({
    ...item,
    id: String(item.id),
    children: item.children ? processCategoryData(item.children) : []
  }));
};

// 初始化分类数据
const initCategoryData = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  
  // 1. 优先尝试从缓存获取
  try {
    const cachedData = uni.getStorageSync('category_tree_data');
    if (cachedData) {
      console.log('Using cached category data');
      processAndSetData(cachedData);
      isLoading.value = false;
      // 可以在后台静默更新缓存，这里暂时不做，根据需求"若缓存失效再调用"
      // 如果需要每次都刷新缓存，可以在这里发起异步请求更新
      return;
    }
  } catch (e) {
    console.error('Failed to read category cache', e);
  }
  
  // 2. 缓存无数据，调用接口
  try {
    const result = await request({
      url: '/api/category/tree',
      method: 'GET',
      timeout: 20000
    });
    
    if (result && result.success && Array.isArray(result.data)) {
        // 存入缓存
        uni.setStorageSync('category_tree_data', result.data);
        // 处理并设置数据
        processAndSetData(result.data);
    } else {
        useFallbackData();
    }
  } catch (error) {
    console.error('Failed to fetch category tree', error);
    useFallbackData();
  } finally {
    isLoading.value = false;
  }
};

// 统一处理数据设置
const processAndSetData = (rawData) => {
  const processedData = processCategoryData(rawData);
  categoryList.value = processedData;
  
  let targetCategory = processedData[0];
  if (queryCategoryId.value) {
    const found = processedData.find(c => c.id === queryCategoryId.value);
    if (found) targetCategory = found;
  }
  
  if (targetCategory) {
    selectCategory(targetCategory);
  }
};

// 使用备用数据
const useFallbackData = () => {
  categoryList.value = hardcodedData;
  if (hardcodedData.length > 0) selectCategory(hardcodedData[0]);
};

// 选择分类
const selectCategory = (category) => {
  activeCategoryId.value = category.id;
  selectedCategoryName.value = category.name;
  currentSubCategories.value = category.children || [];
};

// 跳转到搜索页
const goToSearch = () => {
  uni.navigateTo({ url: '/pages/product/search/search' });
};

// 导航到商品列表页
const navigateToCategory = (subCategory) => {
  uni.navigateTo({
    url: `/pages/product/list/list?categoryId=${subCategory.id}&categoryName=${subCategory.name}`
  });
};

// 滚动到底部 (此处不再需要处理商品加载)
const onScrollToLower = () => {
  // empty
};

onMounted(() => {
  initCategoryData();
});
</script>

<style scoped>
/* 全局样式变量 - 优化为更现代的配色方案 */
:root {
  /* 主色调 - 浅蓝 */
  --primary-color: #5E81F4;
  --primary-hover: #4C6EF5;
  --primary-disabled: #A5B8FA;
  --primary-light: #ECEFFD;
  
  /* 中性色 */
  --text-title: #333333;
  --text-body: #666666;
  --text-assist: #999999;
  --bg-sidebar: #F7F7F7;
  --bg-content: #FFFFFF;
  --border-color: #F0F0F0;
  --divider-color: #F5F5F5;
  
  /* 辅助色 */
  --error-color: #F44336;
  
  /* 阴影 */
  --card-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

/* 分类页面整体布局 */
.category-page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #fff;
}

/* 搜索栏头部样式 */
.search-bar-header {
  padding: 30rpx 40rpx;
  background-color: #ffffff;
  z-index: 100;
}

.search-bar {
  display: flex;
  align-items: center;
  height: 80rpx;
  background-color: #f5f5f5;
  border-radius: 40rpx;
  padding: 0 40rpx;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.search-bar:hover {
  background-color: #eee;
  border-color: #ddd;
}

.search-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 20rpx;
}

.search-placeholder {
  font-size: 28rpx;
  color: #999;
}

/* 页面主体 */
.category-page {
  display: flex;
  flex: 1;
  overflow: hidden;
  border-top: 1px solid #f0f0f0;
}

/* 左侧分类栏 */
.left-sidebar {
  width: 160px;
  background-color: #f9f9f9;
  height: 100%;
}

.category-item {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  font-size: 15px;
  color: #666;
  position: relative;
  transition: all 0.2s;
  cursor: pointer;
}

.category-item:hover {
  background-color: #f0f0f0;
  color: #333;
}

/* 选中状态 */
.category-item.selected {
  background-color: #fff;
  color: #000;
  font-weight: 600;
}

.category-item.selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 18px;
  bottom: 18px;
  width: 4px;
  background-color: #000;
  border-radius: 0 4px 4px 0;
}

/* 右侧内容区 */
.right-content {
  flex: 1;
  background-color: #fff;
  height: 100%;
}

.content-wrapper {
  padding: 30px;
}

/* 顶部 Banner */
.category-banner {
  width: 100%;
  margin-bottom: 40px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
}

.banner-image {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.5s;
}

.category-banner:hover .banner-image {
  transform: scale(1.05);
}

/* 简单网格布局 */
.simple-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 30px 10px;
}

.simple-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
}

.simple-grid-item:hover {
  transform: translateY(-5px);
}

.item-icon-wrapper {
  width: 80px;
  height: 80px;
  background-color: #f8f8f8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  transition: all 0.3s;
}

.simple-grid-item:hover .item-icon-wrapper {
  background-color: #eee;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
}

.item-icon {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.item-name {
  font-size: 14px;
  color: #333;
  text-align: center;
  font-weight: 500;
}

/* 状态展示 */
.empty-state, .loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .left-sidebar {
    width: 100px;
  }
  
  .category-item {
    padding: 0 15px;
    font-size: 13px;
    height: 50px;
  }
  
  .content-wrapper {
    padding: 20px;
  }
  
  .simple-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 15px 5px;
  }
  
  .item-icon-wrapper {
    width: 60px;
    height: 60px;
  }
  
  .item-icon {
    width: 36px;
    height: 36px;
  }
  
  .item-name {
    font-size: 12px;
  }
}
</style>