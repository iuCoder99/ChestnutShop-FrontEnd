<template>
  <view class="search-container">
    <!-- 搜索栏（固定顶部） -->
    <view class="search-header">
      <view class="search-bar" :class="{ 'focused': isFocused }">
        <image src="/static/images/icon-search.png" class="search-icon"></image>
        <input 
          class="search-input" 
          v-model="keyword" 
          placeholder="请输入产品名称搜索"
          @confirm="onSearch"
          @focus="isFocused = true"
          @blur="isFocused = false"
        ></input>
        <view class="clear-btn" @click="clearKeyword" v-if="keyword">×</view>
      </view>
      <text class="cancel-text" @click="goBack">取消</text>
    </view>

    <!-- 搜索前展示的内容 -->
    <view v-if="!hasSearched" class="search-pre-content">
      <!-- 热门搜索 -->
      <view class="section" v-if="hotKeywordList.length > 0">
        <view class="section-header">
          <text class="section-title">热门搜索</text>
        </view>
        <view class="keyword-list">
          <view 
            class="keyword-tag hot" 
            v-for="(item, index) in hotKeywordList" 
            :key="index"
            @click="quickSearch(item)"
          >
            {{item}}
          </view>
        </view>
      </view>

      <!-- 搜索记录 -->
      <view class="section" v-if="historyList.length > 0">
        <view class="section-header">
          <text class="section-title">搜索记录</text>
          <view class="header-actions">
            <image 
              :src="showHistory ? '/static/images/icon-eye-open.png' : '/static/images/icon-eye-close.png'" 
              class="action-icon"
              @click="toggleHistory"
            ></image>
            <image 
              src="/static/images/icon-delete.png" 
              class="action-icon delete" 
              @click="clearHistory"
            ></image>
          </view>
        </view>
        <view class="keyword-list" v-if="showHistory">
          <view 
            class="keyword-tag history" 
            v-for="(item, index) in historyList" 
            :key="index"
          >
            <text @click="quickSearch(item)">{{item}}</text>
            <text class="delete-tag-btn" @click.stop="deleteHistoryItem(index)">×</text>
          </view>
        </view>
        <view class="hidden-history-tip" v-else>
          <text>当前搜索记录已隐藏</text>
        </view>
      </view>

      <!-- 猜你喜欢 (复用首页逻辑) -->
      <view class="guess-like-container">
        <view class="section-title-center">
          <text>—— 猜你喜欢 ——</text>
        </view>
        <view class="product-list">
          <view 
            class="product-item" 
            v-for="(item, index) in guessLikeProductList" 
            :key="index" 
            @click="goToProductDetail(item.id)"
            hover-class="product-item-hover"
            :hover-stay-time="150"
          >
            <image :src="item.imageUrl" mode="aspectFill" class="product-img"></image>
            <view class="product-info">
              <text class="product-name">{{item.name}}</text>
              <text class="product-sellPoint">{{item.sellPoint}}</text>
              <text class="product-price">¥{{(item.price || 0).toFixed(2)}}</text>
              <text class="enterprise-tag" v-if="item.isEnterprisePrice">批量咨询价</text>
            </view>
          </view>
        </view>
        <view class="loading-state" v-if="isLoadingGuessLike">
          <text class="loading-text">加载中...</text>
        </view>
      </view>
    </view>

    <!-- 搜索结果展示 -->
    <view v-else class="search-result-content">
      <!-- 排序栏 -->
      <view class="sort-bar">
        <view 
          class="sort-item" 
          :class="{ active: sortType === 'default' }"
          @click="setSortType('default')"
        >
          <text class="sort-text">默认</text>
        </view>
        <view 
          class="sort-item" 
          :class="{ active: sortType === 'priceAsc' }"
          @click="setSortType('priceAsc')"
        >
          <text class="sort-text">价格↑</text>
        </view>
        <view 
          class="sort-item" 
          :class="{ active: sortType === 'priceDesc' }"
          @click="setSortType('priceDesc')"
        >
          <text class="sort-text">价格↓</text>
        </view>
        <view 
          class="sort-item" 
          :class="{ active: sortType === 'newest' }"
          @click="setSortType('newest')"
        >
          <text class="sort-text">最新</text>
        </view>
      </view>

      <!-- 产品列表 -->
      <view class="product-list" v-if="productList.length > 0">
        <view 
          class="product-item" 
          v-for="(item, index) in productList" 
          :key="index" 
          @click="goToProductDetail(item.id)"
          hover-class="product-item-hover"
          :hover-stay-time="150"
        >
          <image :src="item.imageUrl" mode="aspectFill" class="product-img"></image>
          <view class="product-info">
            <text class="product-name">{{item.name}}</text>
            <text class="product-sellPoint">{{item.sellPoint}}</text>
            <text class="product-price">¥{{item.price.toFixed(2)}}</text>
            <text class="enterprise-tag" v-if="item.isEnterprisePrice">批量咨询价</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-else-if="!isLoading">
        <image src="/static/images/empty-product.png" class="empty-img"></image>
        <text class="empty-text">未找到“{{keyword}}”相关产品</text>
        <button class="reset-btn" @click="resetSearch">重新搜索</button>
      </view>

      <!-- 加载状态 -->
      <view class="loading-state" v-if="isLoading">
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 加载更多提示 -->
      <view class="load-more" v-if="hasMore && !isLoading && productList.length > 0">
        <text class="load-more-text">下拉加载更多</text>
      </view>
      <view class="load-more" v-if="!hasMore && productList.length > 0">
        <text class="load-more-text">没有更多了</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { productApi } from '@/utils/api';
import cacheUtil from '@/utils/cacheUtil';

// 状态变量
const keyword = ref('');
const isFocused = ref(false); // 搜索框是否获得焦点
const hasSearched = ref(false); // 是否已执行搜索
const hotKeywordList = ref([]);
const historyList = ref([]);
const showHistory = ref(true);

// 猜你喜欢数据
const guessLikeProductList = ref([]);
const isLoadingGuessLike = ref(false);
const guessLikeBeginId = ref(null);
const guessLikeIsEnd = ref(false);

// 搜索结果数据
const productList = ref([]);
const sortType = ref('default');
const sortValue = ref(null);
const sortId = ref(null);
const querySize = ref(20);
const isLoading = ref(false);
const hasMore = ref(true);

// 初始化
onLoad((options) => {
  loadHistory();
  getHotKeywords();
  
  // 如果是从其他页面带关键词进来，直接搜索
  if (options.keyword) {
    keyword.value = options.keyword;
    onSearch();
  } else {
    // 否则加载猜你喜欢
    getGuessLikeProductList(false, true);
  }
});

// --- 热门搜索 & 历史记录逻辑 ---

const getHotKeywords = async () => {
  try {
    const res = await productApi.getHotKeywords();
    if (res && res.success) {
      // 假设返回格式为 { success: true, data: { keywordList: "k1,k2,k3" } } 或数组
      let keywords = [];
      if (res.data && res.data.keywordList) {
        if (typeof res.data.keywordList === 'string') {
          keywords = res.data.keywordList.split(',');
        } else if (Array.isArray(res.data.keywordList)) {
          keywords = res.data.keywordList;
        }
      } else if (Array.isArray(res.data)) {
        keywords = res.data;
      }
      
      // 随机取5个
      if (keywords.length > 5) {
        keywords = keywords.sort(() => 0.5 - Math.random()).slice(0, 5);
      }
      hotKeywordList.value = keywords;
    }
  } catch (e) {
    console.error('获取热门搜索失败', e);
    // 模拟数据
    hotKeywordList.value = ['办公桌', '人体工学椅', '会议桌', '文件柜', '沙发'];
  }
};

const loadHistory = () => {
  const history = uni.getStorageSync('search_history');
  if (history) {
    historyList.value = JSON.parse(history);
  }
};

const saveHistory = () => {
  if (!keyword.value.trim()) return;
  // 移除旧的相同关键词
  const index = historyList.value.indexOf(keyword.value.trim());
  if (index > -1) {
    historyList.value.splice(index, 1);
  }
  // 添加到头部
  historyList.value.unshift(keyword.value.trim());
  // 限制数量
  if (historyList.value.length > 10) {
    historyList.value.pop();
  }
  uni.setStorageSync('search_history', JSON.stringify(historyList.value));
};

const clearHistory = () => {
  uni.showModal({
    title: '提示',
    content: '确定清空搜索历史吗？',
    success: (res) => {
      if (res.confirm) {
        historyList.value = [];
        uni.removeStorageSync('search_history');
      }
    }
  });
};

const deleteHistoryItem = (index) => {
  historyList.value.splice(index, 1);
  uni.setStorageSync('search_history', JSON.stringify(historyList.value));
};

const toggleHistory = () => {
  showHistory.value = !showHistory.value;
};

const quickSearch = (kw) => {
  keyword.value = kw;
  onSearch();
};

const clearKeyword = () => {
  keyword.value = '';
  hasSearched.value = false;
  // 恢复到初始状态，重新加载猜你喜欢（如果需要）
  if (guessLikeProductList.value.length === 0) {
    getGuessLikeProductList(false, true);
  }
};

const goBack = () => {
  uni.navigateBack();
};

const resetSearch = () => {
  keyword.value = '';
  hasSearched.value = false;
};

// --- 猜你喜欢逻辑 (复用首页) ---
const getGuessLikeProductList = async (append = false, forceRefresh = false) => {
  if (isLoadingGuessLike.value) return;
  
  if (forceRefresh) {
    guessLikeBeginId.value = null;
    guessLikeIsEnd.value = false;
  }
  
  // 如果之前已经加载完毕，且现在是追加模式，则重置 beginId 实现无限循环刷新
  if (guessLikeIsEnd.value && append) {
    console.log('--- [搜索页猜你喜欢] 已触底，重置 beginId 实现无限刷新');
    guessLikeBeginId.value = null;
    guessLikeIsEnd.value = false;
  }

  isLoadingGuessLike.value = true;
  
  try {
    const params = {
      beginId: guessLikeBeginId.value,
      querySize: 20 // 搜索页猜你喜欢数量适中
    };
    
    const result = await productApi.getScrollProductList(params);
    let productData = [];
    let isEnd = true;
    let nextBeginId = null;

    if (result && result.success && result.data) {
      productData = result.data.list || [];
      isEnd = result.data.isEnd;
      if (result.data.simpleCursorCommonEntity) {
        nextBeginId = result.data.simpleCursorCommonEntity.sortId;
      }
    }

    if (productData.length > 0) {
      const processedData = productData.map((item, index) => {
        let imgUrl = item.image || item.imageUrl || '';
        if (typeof imgUrl === 'string') {
          imgUrl = imgUrl.replace(/`/g, '').trim();
          if (!imgUrl) imgUrl = '/static/images/default.png';
        } else {
          imgUrl = '/static/images/default.png';
        }
        
        return {
          id: item.id || index,
          name: item.name || item.title || `产品${index}`,
          imageUrl: imgUrl,
          price: parseFloat(item.price) || 0,
          sellPoint: item.sellPoint || item.description || '',
          isEnterprisePrice: item.isEnterprisePrice || false
        };
      });

      if (append) {
        guessLikeProductList.value = [...guessLikeProductList.value, ...processedData];
      } else {
        guessLikeProductList.value = processedData;
      }
      
      // 更新分页状态
      guessLikeBeginId.value = isEnd ? null : nextBeginId;
      guessLikeIsEnd.value = isEnd;
    } else {
      guessLikeIsEnd.value = true;
      guessLikeBeginId.value = null; // 没数据了也重置，下次从头开始
    }
  } catch (error) {
    console.error('获取猜你喜欢失败', error);
  } finally {
    isLoadingGuessLike.value = false;
  }
};

// --- 搜索结果逻辑 ---
const onSearch = () => {
  if (!keyword.value.trim()) {
    uni.showToast({ title: '请输入搜索关键词', icon: 'none' });
    return;
  }
  hasSearched.value = true;
  saveHistory();
  
  sortValue.value = null;
  sortId.value = null;
  productList.value = [];
  hasMore.value = true;
  getProductList();
};

const getProductList = async () => {
  if (!hasMore.value || isLoading.value) return;
  isLoading.value = true;

  const params = {
    sortType: sortType.value,
    sortValue: sortValue.value,
    sortId: sortId.value,
    querySize: querySize.value,
    keyword: keyword.value.trim()
  };

  try {
    const res = await productApi.searchProducts(params);
    if (res && res.success && res.data) {
      const { list = [], isEnd, cursorCommonEntity } = res.data;
      
      const processedData = list.map(item => {
        let imgUrl = item.image || item.imageUrl || '';
        if (typeof imgUrl === 'string') {
          imgUrl = imgUrl.replace(/`/g, '').trim();
          if (!imgUrl) imgUrl = '/static/images/default.png';
        }
        
        return {
          id: item.id,
          name: item.name,
          imageUrl: imgUrl,
          price: parseFloat(item.price) || 0,
          sellPoint: item.sellPoint || item.description || '',
          isEnterprisePrice: item.isEnterprisePrice || false
        };
      });
      
      if (!sortValue.value && !sortId.value) {
        productList.value = processedData;
      } else {
        productList.value = [...productList.value, ...processedData];
      }
      
      if (cursorCommonEntity) {
        sortValue.value = cursorCommonEntity.sortValue;
        sortId.value = cursorCommonEntity.sortId;
      }
      
      hasMore.value = !isEnd;
    } else {
      hasMore.value = false;
    }
  } catch (error) {
    console.error('搜索产品失败:', error);
    uni.showToast({ title: '搜索失败，请重试', icon: 'none' });
    hasMore.value = false;
  } finally {
    isLoading.value = false;
    uni.stopPullDownRefresh();
  }
};

const setSortType = (type) => {
  if (sortType.value === type) return;
  sortType.value = type;
  sortValue.value = null;
  sortId.value = null;
  productList.value = [];
  hasMore.value = true;
  getProductList();
};

const goToProductDetail = (productId) => {
  uni.navigateTo({ url: `/pages/product/detail/detail?productId=${productId}` });
};

// --- 生命周期 ---
onPullDownRefresh(() => {
  if (hasSearched.value) {
    sortValue.value = null;
    sortId.value = null;
    productList.value = [];
    hasMore.value = true;
    getProductList();
  } else {
    getGuessLikeProductList(); // 刷新猜你喜欢
    uni.stopPullDownRefresh();
  }
});

onReachBottom(() => {
  if (hasSearched.value) {
    getProductList();
  } else {
    getGuessLikeProductList(true); // 加载更多猜你喜欢
  }
});
</script>

<style scoped>
.search-container {
  background-color: #F8F8F8;
  min-height: 100vh;
  padding-top: 100rpx; /* 为固定顶部留出空间 */
}

/* 搜索栏 */
.search-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background-color: #FFFFFF;
  display: flex;
  align-items: center;
  padding: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.search-bar {
  flex: 1;
  height: 64rpx;
  background-color: #F5F5F5;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  margin-right: 20rpx;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  border: 1rpx solid transparent;
}

.search-bar.focused {
  background-color: #FFFFFF;
  border-color: #000000;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.search-icon {
  width: 28rpx;
  height: 28rpx;
  margin-right: 16rpx;
  transition: transform 0.3s ease;
}

.search-bar.focused .search-icon {
  transform: scale(1.1);
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.clear-btn {
  font-size: 32rpx;
  color: #999;
  padding: 0 10rpx;
}

.cancel-text {
  font-size: 28rpx;
  color: #666;
  transition: color 0.3s ease;
}

.cancel-text:active {
  color: #000000;
}

/* 通用板块样式 */
.section {
  background-color: #FFFFFF;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
}

.action-icon {
  width: 32rpx;
  height: 32rpx;
  margin-left: 30rpx;
  transition: transform 0.2s ease;
}

.action-icon:active {
  transform: scale(0.9);
}

.keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.keyword-tag {
  padding: 10rpx 24rpx;
  border-radius: 28rpx;
  font-size: 24rpx;
  color: #666;
  background-color: #F5F5F5;
  position: relative;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.keyword-tag:active {
  background-color: #EEEEEE;
  transform: scale(0.95);
}

.keyword-tag.hot {
  color: #FF6B00;
  background-color: #FFF0E5;
}

.keyword-tag.hot:active {
  background-color: #FFE0CC;
}

.delete-tag-btn {
  margin-left: 10rpx;
  font-size: 28rpx;
  color: #999;
  line-height: 1;
}

.hidden-history-tip {
  text-align: center;
  color: #999;
  font-size: 24rpx;
  padding: 20rpx 0;
}

/* 猜你喜欢 */
.guess-like-container {
  padding: 20rpx;
}

.section-title-center {
  text-align: center;
  margin: 30rpx 0;
  color: #D4B886;
  font-size: 28rpx;
  font-weight: bold;
}

/* 排序栏 */
.sort-bar {
  display: flex;
  justify-content: space-around;
  background-color: #FFFFFF;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #EEE;
  position: sticky;
  top: 100rpx; /* 适配搜索栏高度 */
  z-index: 998;
}

.sort-item {
  padding: 10rpx 20rpx;
  transition: all 0.2s ease;
}

.sort-item:active {
  opacity: 0.7;
}

.sort-text {
  font-size: 28rpx;
  color: #666;
}

.sort-item.active .sort-text {
  color: #D4B886;
  font-weight: bold;
}

/* 产品列表 */
.product-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  padding: 20rpx;
}

.product-item {
  width: 18.8%;
  background-color: #FFFFFF;
  border: 1rpx solid #EEEEEE;
  border-radius: 4rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  margin-right: 1.5%;
  box-sizing: border-box;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  position: relative;
  top: 0;
}

.product-item:nth-child(5n) {
  margin-right: 0;
}

/* PC端悬停效果 */
@media (min-width: 1024px) {
  .product-item:hover {
    transform: translateY(-8rpx) scale(1.02);
    box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);
    border-color: #000000;
    z-index: 2;
  }
  .product-item:hover .product-img {
    transform: scale(1.05);
  }
}

/* 移动端点击效果 */
.product-item-hover {
  background-color: #F9F9F9;
  transform: scale(0.98);
}

.product-img {
  width: 100%;
  height: 350rpx;
  background-color: #F9F9F9;
  transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.product-info {
  padding: 10rpx;
}

.product-name {
  font-size: 22rpx;
  color: #000000;
  font-weight: bold;
  margin-bottom: 4rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.2;
}

.product-sellPoint {
  font-size: 18rpx;
  color: #999999;
  margin-bottom: 8rpx;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-size: 24rpx;
  color: #000000;
  font-weight: 900;
  font-family: 'DIN Alternate', 'PingFang SC', sans-serif;
}

.enterprise-tag {
  display: inline-block;
  font-size: 14rpx;
  color: #FFFFFF;
  background-color: #000000;
  padding: 1rpx 4rpx;
  border-radius: 2rpx;
  margin-left: 4rpx;
  vertical-align: middle;
}

/* 状态展示 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100rpx;
}

.empty-img {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.reset-btn {
  background-color: #D4B886;
  color: #FFF;
  font-size: 28rpx;
  padding: 10rpx 40rpx;
  border-radius: 40rpx;
}

.loading-state, .load-more {
  text-align: center;
  padding: 30rpx;
}

.loading-text, .load-more-text {
  font-size: 24rpx;
  color: #999;
}
</style>