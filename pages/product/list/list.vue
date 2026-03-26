<template>
  <view class="container">
    <!-- 排序筛选栏 -->
    <view class="filter-bar">
      <view 
        class="filter-item" 
        :class="{ active: sortType === 'default' }"
        @click="handleSort('default')"
      >
        <text>销量</text>
      </view>
      <view 
        class="filter-item" 
        :class="{ active: sortType === 'priceAsc' }"
        @click="handleSort('priceAsc')"
      >
        <text>价格升序</text>
      </view>
      <view 
        class="filter-item" 
        :class="{ active: sortType === 'priceDesc' }"
        @click="handleSort('priceDesc')"
      >
        <text>价格降序</text>
      </view>
      <view 
        class="filter-item" 
        :class="{ active: sortType === 'newest' }"
        @click="handleSort('newest')"
      >
        <text>最新</text>
      </view>
    </view>

    <!-- 商品列表 -->
    <scroll-view 
      scroll-y 
      class="product-scroll"
      @scrolltolower="loadMore"
    >
      <view class="product-list" v-if="productList.length > 0">
        <view 
          class="product-item" 
          v-for="(item, index) in productList" 
          :key="index"
          @click="goToDetail(item.id)"
        >
          <image :src="item.image || item.imageUrl || '/static/images/default-product.png'" mode="aspectFill" class="product-img"></image>
          <view class="product-info">
            <text class="product-name">{{ item.name }}</text>
            <text class="product-sellPoint">{{ item.description || item.sellPoint || '' }}</text>
            <text class="product-price">¥{{ (item.price || 0).toFixed(2) }}</text>
            <text class="enterprise-tag" v-if="item.isEnterprisePrice">批量咨询价</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-else-if="!loading">
        <image src="/static/images/empty.png" mode="widthFix" class="empty-img"></image>
        <text>暂无相关商品</text>
      </view>

      <!-- 加载更多 -->
      <view class="loading-more" v-if="loading">
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="!hasMore && productList.length > 0">
        <text>小主,该分类的宝贝已经到底了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import request from '@/utils/request';

const categoryId = ref('');
const sortType = ref('default'); // 初始状态为default，对应二级分类商品列表接口
// sortType values: 'default' (initial), 'sales', 'price_asc', 'price_desc', 'new'
const page = ref(1);
const pageSize = ref(10);
const productList = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const beginProductId = ref('0'); // For category product list cursor pagination

onLoad((options) => {
  if (options.categoryId) {
    categoryId.value = options.categoryId;
    // 设置页面标题
    if (options.categoryName) {
      uni.setNavigationBarTitle({
        title: options.categoryName
      });
    }
    loadProducts();
  }
});

const handleSort = (type) => {
  // 如果点击的是已经选中的排序方式，不进行操作
  if (sortType.value === type) return;
  
  sortType.value = type;
  
  // 重置列表
  page.value = 1;
  beginProductId.value = '0'; // 重置游标
  productList.value = [];
  hasMore.value = true;
  loadProducts();
};

const loadProducts = async () => {
  if (loading.value || !hasMore.value) return;
  
  loading.value = true;
  try {
    let response;
    
    // 统一调用分类商品列表接口，根据 sortType 进行排序
    console.log('Using Category List API with sortType:', sortType.value);
    response = await request({
      url: `/api/category/product/list/${categoryId.value}/${beginProductId.value}`,
      method: 'GET',
      params: {
        sortType: sortType.value
      },
      timeout: 20000
    });
    
    if (response && response.success) {
      const data = response.data;
      // 如果 data 为 null，说明没有更多数据
      if (!data) {
        hasMore.value = false;
        return;
      }

      const newProducts = data.productList || [];
      
      if (newProducts.length > 0) {
        productList.value = [...productList.value, ...newProducts];
        beginProductId.value = String(data.endProductId);
        // 如果返回数量少于预期，或者没有返回 endProductId，可能没有更多了
        if (!data.endProductId || newProducts.length === 0) {
          hasMore.value = false;
        }
      } else {
        hasMore.value = false;
      }
    } else {
      uni.showToast({ title: '获取商品失败', icon: 'none' });
    }

  } catch (e) {
    console.error(e);
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  loadProducts();
};

const goToDetail = (id) => {
  uni.navigateTo({
    url: `/pages/product/detail/detail?productId=${id}`
  });
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
  max-width: 1200px;
  margin: 0 auto;
}

.filter-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100rpx;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.filter-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin-right: 0;
  font-size: 28rpx;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.filter-item:hover {
  color: #333;
}

.filter-item.active {
  color: #000;
  font-weight: bold;
}

.filter-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background-color: #000;
}

.sort-icons {
  display: flex;
  flex-direction: column;
  margin-left: 8rpx;
  font-size: 16rpx;
}

.icon-up, .icon-down {
  line-height: 1;
  color: #ccc;
}

.icon-up.active, .icon-down.active {
  color: #000;
}

.product-scroll {
  flex: 1;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 30px;
  padding: 40rpx;
}

.product-item {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
  border: 1px solid transparent;
}

.product-item:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0,0,0,0.1);
  border-color: #eee;
}

.product-img {
  width: 100%;
  height: 280px;
  background-color: #f0f0f0;
  object-fit: cover;
}

.product-info {
  padding: 20rpx;
}

.product-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 10rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  height: 2.8em;
}

.product-sellPoint {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 15rpx;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-size: 32rpx;
  color: #000;
  font-weight: bold;
}

.enterprise-tag {
  display: inline-block;
  font-size: 20rpx;
  color: #fff;
  background-color: #000;
  padding: 2rpx 8rpx;
  margin-left: 10rpx;
  border-radius: 4rpx;
  vertical-align: middle;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
  color: #999;
}

.empty-img {
  width: 240rpx;
  margin-bottom: 30rpx;
}

.loading-more, .no-more {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 24rpx;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .product-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
    padding: 20rpx;
  }
  
  .product-img {
    height: 350rpx;
  }
  
  .filter-bar {
    padding: 0 20rpx;
  }
  
  .filter-item {
    margin-right: 30rpx;
    font-size: 26rpx;
  }
}
</style>