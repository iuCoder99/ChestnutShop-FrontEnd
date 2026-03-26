<template>
  <!-- 产品详情页面 -->
  <view class="product-detail-container">
    <!-- 自定义导航栏 (仅在小屏/移动端显示) -->
    <view class="custom-navbar" :style="{ backgroundColor: `rgba(255, 255, 255, ${navOpacity})`, borderBottom: `1px solid rgba(238, 238, 238, ${navOpacity})` }">
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <view class="nav-content">
        <view class="nav-left" @click="goBack">
          <view class="back-btn-circle" :style="{ backgroundColor: navOpacity > 0.5 ? 'transparent' : 'rgba(0,0,0,0.3)' }">
            <image src="/static/images/back.png" class="back-icon" :style="{ filter: navOpacity > 0.5 ? 'invert(1)' : 'none' }"></image>
          </view>
        </view>
        <view class="nav-title" :style="{ opacity: navOpacity }">产品详情</view>
        <view class="nav-right"></view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="isLoading">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 错误状态 -->
    <view class="error-state" v-else-if="errorMsg">
      <view class="error-icon">
        <text class="icon">⚠️</text>
      </view>
      <text class="error-text">{{ errorMsg }}</text>
      <button class="retry-btn" @click="loadProductDetail">重新加载</button>
    </view>
    
    <!-- 产品详情内容 (使用响应式布局) -->
    <scroll-view 
      class="detail-content" 
      scroll-y
      :show-scrollbar="false"
      @scroll="handleScroll"
      v-else
    >
      <view class="content-wrapper">
        <!-- 顶部核心信息区 (响应式: 大屏左右布局, 小屏上下布局) -->
        <view class="top-main-section">
          <!-- 左侧内容区：产品图片 + 产品详情 -->
          <view class="left-main-content">
            <!-- 产品图片轮播/展示 -->
            <view class="product-gallery">
              <swiper class="image-swiper" @change="onSwiperChange" circular autoplay>
                <swiper-item v-for="(image, index) in displayImages" :key="index">
                  <image :src="image" mode="aspectFill" class="product-image"></image>
                </swiper-item>
              </swiper>
              <!-- 图片指示器 -->
              <view class="swiper-indicator" v-if="displayImages.length > 1">
                {{ currentSwiperIndex + 1 }}/{{ displayImages.length }}
              </view>
            </view>

            <!-- 产品详情描述 (移动到图片下方) -->
            <view class="info-card product-desc-section">
              <view class="section-header">
                <text class="section-title">产品详情</text>
              </view>
              <view class="desc-content">
                <text class="product-desc">{{ productDetail.description || '暂无产品详情描述' }}</text>
                <view class="detail-images" v-if="productDetail.detailImages && productDetail.detailImages.length > 0">
                  <image 
                    v-for="(img, idx) in productDetail.detailImages" 
                    :key="idx" 
                    :src="img" 
                    mode="widthFix" 
                    class="detail-image"
                  ></image>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 右侧内容区：产品基本信息 -->
          <view class="product-info-column">
            <view class="product-info-section no-margin">
              <view class="price-container">
                <view class="price-row">
                  <text class="price-symbol">¥</text>
                  <text class="product-price">{{ (productDetail.price || 0).toFixed(2) }}</text>
                  <text class="enterprise-tag" v-if="productDetail.isEnterprisePrice">批量咨询价</text>
                </view>
                <view class="share-btn" @click="handleShare">
                  <text class="share-icon">📤</text>
                  <text class="share-text">分享</text>
                </view>
              </view>
              <text class="product-name">{{ productDetail.name || '产品名称' }}</text>
              <text class="product-sell-point" v-if="productDetail.sellPoint">{{ productDetail.sellPoint }}</text>
              
              <view class="service-tags">
                <view class="service-tag-item">
                  <text class="check-icon">✓</text>
                  <text>正品保障</text>
                </view>
                <view class="service-tag-item">
                  <text class="check-icon">✓</text>
                  <text>专业售后</text>
                </view>
                <view class="service-tag-item">
                  <text class="check-icon">✓</text>
                  <text>极速配送</text>
                </view>
              </view>
            </view>
            
            <!-- 规格选择 -->
            <view class="info-card spec-card" v-if="formattedSpecList.length > 0">
              <view class="section-header">
                <text class="section-title">选择规格</text>
                <text class="section-subtitle" v-if="selectedSpecText">已选：{{ selectedSpecText }}</text>
              </view>
              <SpecPicker :specList="formattedSpecList" :selectedIds="selectedSpecId ? [selectedSpecId] : []" @specChange="handleSpecChange" />
            </view>

            <!-- 数量选择 -->
            <view class="info-card quantity-card">
              <view class="section-header">
                <text class="section-title">购买数量</text>
                <view class="stock-info">
                  <text class="stock-label">库存：</text>
                  <text class="stock-value" :class="{ 'low-stock': currentStock < 10 }">{{ currentStock }}件</text>
                </view>
              </view>
              <view class="quantity-selector-container">
                <view class="quantity-selector">
                  <view class="quantity-btn minus" :class="{ 'disabled': currentQuantity <= 1 }" @click="handleQuantityChange(-1)">-</view>
                  <input class="quantity-input" type="number" :value="currentQuantity" @blur="handleQuantityBlur" />
                  <view class="quantity-btn plus" :class="{ 'disabled': currentQuantity >= currentStock }" @click="handleQuantityChange(1)">+</view>
                </view>
                <text class="out-of-stock-tip" v-if="currentStock <= 0">暂时无货</text>
              </view>
            </view>
            <!-- 电脑端操作按钮 (已移除，将统一显示在底部功能区) -->
          </view>
        </view>

        <!-- 底部功能按钮区 (四个按钮一排) -->
        <view class="main-action-buttons-row">
          <view class="action-btn-item collect" @click="handleCollect">
            <text class="action-btn-icon">{{ isCollected ? '❤️' : '🤍' }}</text>
            <text class="action-btn-text">{{ isCollected ? '已收藏' : '收藏' }}</text>
          </view>
          <view class="action-btn-item consult" @click="handleConsult">
            <text class="action-btn-icon">💬</text>
            <text class="action-btn-text">在线咨询</text>
          </view>
          <view class="action-btn-item cart" @click="handleAddToCart">
            <text class="action-btn-icon">🛒</text>
            <text class="action-btn-text">加入购物车</text>
          </view>
          <view class="action-btn-item buy" @click="handleBuyNow">
            <text class="action-btn-icon">⚡</text>
            <text class="action-btn-text">立即购买</text>
          </view>
        </view>

        <!-- 下方详情区 -->
        <view class="bottom-detail-section">
          <!-- 商品评价预览 -->
          <view class="info-card comment-preview-section">
            <view class="section-header" @click="goToComments">
              <view class="header-left">
                <text class="section-title">商品评价</text>
                <text class="comment-count" v-if="commentCount > 0">({{ commentCount }})</text>
              </view>
              <view class="header-right">
                <text class="view-all">查看全部</text>
                <text class="arrow-right">></text>
              </view>
            </view>
            
            <view class="comment-preview-list" v-if="previewComments.length > 0">
              <view class="comment-preview-item" v-for="comment in previewComments" :key="comment.id" @click="goToComments">
                <view class="comment-user">
                <image :src="comment.userAvatar || '/static/images/default-avatar.png'" class="preview-avatar"></image>
                <view class="preview-user-info">
                  <text class="preview-nickname">{{ comment.userNickname || '匿名用户' }}</text>
                  <text class="preview-time">{{ comment.createTimeBusinessText || comment.createTime }}</text>
                </view>
                <view class="preview-rating">
                  <text v-for="n in 5" :key="n" class="star" :class="{ active: n <= comment.rating }">★</text>
                </view>
              </view>
                <text class="preview-content">{{ comment.content }}</text>
                <view class="preview-imgs" v-if="comment.imageUrls && comment.imageUrls.length > 0">
                  <image 
                    v-for="(img, idx) in comment.imageUrls" 
                    :key="idx" 
                    :src="img" 
                    mode="aspectFill" 
                    class="preview-img"
                  ></image>
                </view>
                <view class="preview-spec" v-if="comment.productSpecText">规格：{{ comment.productSpecText }}</view>
              </view>
            </view>
            <view class="no-comment-tip" v-else>暂无评价</view>
          </view>

          <!-- 相关商品 (固定一行5个) -->
          <view class="related-products-section" v-if="relatedProducts.length > 0">
            <view class="related-header">
              <view class="header-line"></view>
              <text class="related-title">为你推荐</text>
              <view class="header-line"></view>
            </view>
            <view class="related-grid-five">
              <view 
                class="related-item-five" 
                v-for="product in relatedProducts" 
                :key="product.id"
                @click="goToRelatedProduct(product.id)"
              >
                <image :src="product.image || product.imageUrl || '/static/images/empty.png'" mode="aspectFill" class="related-img-five"></image>
                <view class="related-info-box-five">
                  <text class="related-name-five">{{ product.name || '' }}</text>
                  <view class="related-price-row-five">
                    <text class="related-price-five">¥{{ (product.price || 0).toFixed(2) }}</text>
                    <text class="enterprise-tag-mini" v-if="product.isEnterprisePrice">咨询价</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad, onUnload, onHide, onShow } from '@dcloudio/uni-app';
import { useCartStore } from '@/store/modules/cartStore';
import { useUserStore } from '@/store/modules/userStore';
import request from '@/utils/request';
import cacheUtil from '@/utils/cacheUtil';
import { userApi, productApi } from '@/utils/api';
import SpecPicker from '@/components/business/SpecPicker.vue';

// 状态管理
const userStore = useUserStore();
const isLoading = ref(true);
const errorMsg = ref('');
const productDetail = ref({});
const relatedProducts = ref([]);
const previewComments = ref([]);
const commentCount = ref(0);
const selectedSpecId = ref('');
const currentStock = ref(0);
const isCollected = ref(false);
const cartStore = useCartStore();
const refreshTimer = ref(null);
const specQuantities = ref({});
const currentSwiperIndex = ref(0);
const navOpacity = ref(0);
const statusBarHeight = ref(20);

// 获取状态栏高度
onMounted(() => {
  try {
    const info = uni.getSystemInfoSync();
    statusBarHeight.value = info.statusBarHeight || 20;
  } catch (e) {
    statusBarHeight.value = 20;
  }
});

// 处理滚动，改变导航栏透明度
const handleScroll = (e) => {
  const scrollTop = e.detail.scrollTop;
  let opacity = scrollTop / 150;
  if (opacity > 1) opacity = 1;
  navOpacity.value = opacity;
};

// 轮播图变化
const onSwiperChange = (e) => {
  currentSwiperIndex.value = e.detail.current;
};

// 当前规格的数量
const currentQuantity = computed({
  get: () => {
    if (!selectedSpecId.value) return 1;
    return specQuantities.value[selectedSpecId.value] || 1;
  },
  set: (val) => {
    if (!selectedSpecId.value) return;
    let quantity = parseInt(val) || 1;
    if (quantity < 1) quantity = 1;
    if (quantity > currentStock.value) {
      quantity = currentStock.value > 0 ? currentStock.value : 1;
      if (currentStock.value > 0) {
        uni.showToast({ title: `库存不足，最大可选${currentStock.value}件`, icon: 'none' });
      }
    }
    specQuantities.value[selectedSpecId.value] = quantity;
  }
});

// 选中的规格文本
const selectedSpecText = computed(() => {
  if (!selectedSpecId.value || !productDetail.value.specList) return '';
  const spec = productDetail.value.specList.find(s => s.id === selectedSpecId.value);
  return spec ? spec.specText : '';
});

// 计算展示图片列表
const displayImages = computed(() => {
  if (productDetail.value.imageUrls && productDetail.value.imageUrls.length > 0) {
    return productDetail.value.imageUrls;
  }
  if (productDetail.value.image) {
    return [productDetail.value.image];
  }
  return ['https://via.placeholder.com/800x800?text=Product'];
});

// 格式化规格列表
const formattedSpecList = computed(() => {
  if (!productDetail.value.specList || productDetail.value.specList.length === 0) {
    return [];
  }
  return [{
    specName: '规格选择',
    specItems: productDetail.value.specList.map(spec => ({
      id: spec.id,
      specValue: spec.specText,
      stock: spec.stock
    }))
  }];
});

// 获取产品详情
const loadProductDetail = async (isRefresh = false) => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const productId = currentPage.options.productId;
  
  if (!productId) {
    errorMsg.value = '参数错误';
    isLoading.value = false;
    return;
  }

  if (!isRefresh) isLoading.value = true;
  errorMsg.value = '';
  
  try {
    const header = {};
    if (userStore.token && userStore.userInfo && userStore.userInfo.id) {
      header['X-User-Id'] = userStore.userInfo.id;
    }

    const result = await productApi.getProductDetail(productId, header);
    let data = null;
    if (result.success && result.data) {
      data = Array.isArray(result.data) ? result.data[0] : result.data;
    }

    if (data) {
      if (isRefresh) {
        productDetail.value.specList = data.specList;
        productDetail.value.status = data.status;
        if (typeof data.isCollection !== 'undefined') {
          isCollected.value = data.isCollection === 1;
        }
        if (selectedSpecId.value) {
          const currentSpec = data.specList.find(s => s.id === selectedSpecId.value);
          if (currentSpec) {
            currentStock.value = currentSpec.stock;
            productDetail.value.price = currentSpec.price;
          }
        }
      } else {
        productDetail.value = data;
        isCollected.value = data.isCollection === 1;
        initCheapestSpec();
      }
      
      if (productDetail.value.status === 'inactive') {
        handleProductOffShelf();
        return;
      }
      
      const cacheKey = `product_detail_${productId}`;
      cacheUtil.set(cacheKey, productDetail.value, 60);

      if (!isRefresh) {
        loadRelatedProducts(productId);
        loadComments(productId);
        loadCommentCount(productId);
        startRefreshTimer();
      }
    } else {
      if (isRefresh) handleProductOffShelf();
      else errorMsg.value = '未找到商品信息';
    }
  } catch (error) {
    console.error('加载产品详情失败:', error);
    // request.js 已经处理了 Toast，这里仅记录并更新页面级错误状态
    if (!isRefresh) errorMsg.value = '产品信息加载异常，请重试';
  } finally {
    if (!isRefresh) isLoading.value = false;
  }
};

// 处理商品下架
const handleProductOffShelf = () => {
  stopRefreshTimer();
  uni.showModal({
    title: '温馨提示',
    content: '该商品已经下架',
    showCancel: false,
    success: () => { goBack(); }
  });
};

// 开启定时刷新
const startRefreshTimer = () => {
  stopRefreshTimer();
  refreshTimer.value = setInterval(() => {
    loadProductDetail(true);
  }, 60000);
};

// 停止定时刷新
const stopRefreshTimer = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
};

// 初始化选中价格最低的规格
const initCheapestSpec = () => {
  if (productDetail.value.specList && productDetail.value.specList.length > 0) {
    const cheapestSpec = productDetail.value.specList.reduce((min, spec) => 
      spec.price < min.price ? spec : min
    , productDetail.value.specList[0]);
    
    selectedSpecId.value = cheapestSpec.id;
    currentStock.value = cheapestSpec.stock;
    productDetail.value.price = cheapestSpec.price;
  } else {
    setupDefaultSpec();
  }
};

// 设置默认规格
const setupDefaultSpec = () => {
  productDetail.value.specList = [{
    id: `default-spec-${productDetail.value.id}`,
    specText: '默认规格',
    stock: productDetail.value.stock || 0,
    price: productDetail.value.price
  }];
  selectedSpecId.value = productDetail.value.specList[0].id;
  currentStock.value = productDetail.value.specList[0].stock;
};

// 获取相关商品
const loadRelatedProducts = async (productId) => {
  if (!productId) return;
  try {
    const result = await request({
      url: '/api/product/related',
      method: 'GET',
      params: { productId }
    });
    if (result.success && result.data) {
      relatedProducts.value = Array.isArray(result.data) ? result.data : [result.data];
    }
  } catch (error) {
    console.error('加载相关商品失败:', error);
  }
};

const loadComments = async (productId) => {
  try {
    const res = await request({
      url: `/api/user/product/comment/firstComment/show`,
      method: 'POST',
      params: { productId },
      data: {
        sortType: 'default',
        sortValue: '',
        sortId: '',
        querySize: 2
      }
    });

    if (res.success && res.data) {
      previewComments.value = res.data.list.map(item => {
        let parsedImgs = [];
        if (item.imageUrls) {
          if (Array.isArray(item.imageUrls)) {
            parsedImgs = item.imageUrls;
          } else if (typeof item.imageUrls === 'string') {
            try {
              const cleanedStr = item.imageUrls.replace(/`/g, '').trim();
              parsedImgs = JSON.parse(cleanedStr);
            } catch (e) {
              parsedImgs = item.imageUrls.split(',').filter(Boolean);
            }
          }
        }
        
        parsedImgs = parsedImgs.map(url => {
          if (typeof url === 'string') {
            const trimmed = url.trim();
            const match = trimmed.match(/(https?:\/\/[^\s`"']+)/);
            return match ? match[0] : trimmed.replace(/[`\s]/g, '');
          }
          return url;
        }).filter(Boolean);
        
        return {
          ...item,
          imageUrls: parsedImgs,
          isLiked: !!item.like // 处理预览评价的点赞状态
        };
      });
    }
  } catch (e) {
    console.error('加载预览评价失败:', e);
  }
};

const loadCommentCount = async (productId) => {
  try {
    const res = await productApi.getCommentCount(productId);
    if (res.success && res.data !== undefined) {
      // 兼容处理：支持 res.data 直接返回数字或返回包含 productCommentCount 的对象
      if (typeof res.data === 'object' && res.data !== null && 'productCommentCount' in res.data) {
        commentCount.value = Number(res.data.productCommentCount) || 0;
      } else {
        commentCount.value = Number(res.data) || 0;
      }
    }
  } catch (e) {
    console.error('加载点赞总数失败:', e);
  }
};

// 页面跳转
const goBack = () => {
  const pages = getCurrentPages();
  if (pages.length > 1) uni.navigateBack();
  else uni.reLaunch({ url: '/pages/main/index/index' });
};

const goToComments = () => {
  uni.navigateTo({ url: `/pages/product/comment/comment?productId=${productDetail.value.id}` });
};

const goToHome = () => uni.reLaunch({ url: '/pages/main/index/index' });

const goToRelatedProduct = (id) => {
  uni.navigateTo({ url: `/pages/product/detail/detail?productId=${id}` });
};

// 数量变更
const handleQuantityChange = (delta) => {
  currentQuantity.value += delta;
};

const handleQuantityBlur = (e) => {
  currentQuantity.value = e.detail.value;
};

// 处理规格选择变化
const handleSpecChange = (specIds) => {
  selectedSpecId.value = specIds[0];
  if (specIds.length > 0 && productDetail.value.specList) {
    const selectedSpec = productDetail.value.specList.find(spec => spec.id === specIds[0]);
    if (selectedSpec) {
      currentStock.value = selectedSpec.stock;
      productDetail.value.price = selectedSpec.price;
    }
  }
};

// 添加到购物车
const handleAddToCart = async () => {
  if (!userStore.token) {
    uni.navigateTo({ url: '/pages/main/login/login' });
    return;
  }
  
  try {
    let specId = selectedSpecId.value;
    if (productDetail.value.specList?.length > 0 && !specId) {
      specId = productDetail.value.specList[0].id;
    }
    
    const result = await request({
      url: '/api/cart/add',
      method: 'POST',
      data: {
        productId: productDetail.value.id,
        specId,
        quantity: currentQuantity.value
      }
    });
    
    if (result.success) {
      uni.showToast({ title: '已加入购物车', icon: 'success' });
      cartStore.syncCart();
    }
  } catch (error) {
    uni.showToast({ title: '添加失败，请重试', icon: 'none' });
  }
};

// 立即购买
const handleBuyNow = () => {
  if (!userStore.token) {
    uni.navigateTo({ url: '/pages/main/login/login' });
    return;
  }
  
  const orderData = {
    productId: productDetail.value.id,
    productName: productDetail.value.name,
    productImage: displayImages.value[0] || '',
    price: productDetail.value.price,
    quantity: currentQuantity.value,
    specIds: selectedSpecId.value || '',
    specText: selectedSpecText.value || '默认规格'
  };
  
  uni.navigateTo({
    url: `/pages/order/confirm/confirm?orderData=${encodeURIComponent(JSON.stringify(orderData))}`
  });
};

const handleConsult = () => {
  uni.navigateTo({ url: `/pages/user/consult/consult?productId=${productDetail.value.id}` });
};

const handleShare = () => {
  uni.showActionSheet({
    itemList: ['分享给好友', '保存海报'],
    success: (res) => {
      uni.showToast({ title: '分享功能开发中', icon: 'none' });
    }
  });
};

const handleCollect = async () => {
  if (!userStore.token) {
    uni.navigateTo({ url: '/pages/main/login/login' });
    return;
  }
  
  try {
    const result = isCollected.value 
      ? await userApi.deleteCollect(productDetail.value.id)
      : await userApi.addCollect(productDetail.value.id);
      
    if (result.success) {
      isCollected.value = !isCollected.value;
      uni.showToast({ title: isCollected.value ? '收藏成功' : '取消收藏', icon: 'success' });
    }
  } catch (error) {
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

onLoad(() => loadProductDetail());
onUnload(() => stopRefreshTimer());
onShow(() => !refreshTimer.value && !isLoading.value && startRefreshTimer());
onHide(() => stopRefreshTimer());
</script>

<style scoped>
.product-detail-container {
  width: 100%;
  min-height: 100vh;
  background-color: #F8FAFC;
  position: relative;
}

/* 响应式基础包装 */
.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* 顶部信息布局 */
.top-main-section {
  display: flex;
  flex-direction: row;
  padding: 30rpx;
  gap: 30rpx;
  background-color: transparent;
  align-items: stretch; /* 确保左右两列等高 */
}

.left-main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  height: 1245rpx; /* 增加高度以适应更大的图片 */
}

.product-gallery {
  width: 100%;
  flex: 5; /* 增加图片区域权重 */
  position: relative;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
  background-color: #f0f0f0;
}

.image-swiper, .product-image {
  width: 100%;
  height: 100%;
  display: block;
}

.product-info-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 右侧卡片比例分配 (总和 5，保持 2.1:1.9:1) */
.product-info-section.no-margin {
  flex: 2.1; 
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
  overflow: hidden;
  justify-content: center;
}

.spec-card {
  flex: 1.9;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  justify-content: center;
}

.quantity-card {
  flex: 1;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  justify-content: center;
}

.product-desc-section {
  flex: 1; /* 占 1/5 */
  margin-bottom: 0;
  overflow: hidden;
}

/* 底部功能按钮区 */
.main-action-buttons-row {
  display: flex;
  flex-direction: row;
  padding: 30rpx;
  gap: 20rpx;
  margin: 0 0 40rpx;
}

.action-btn-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24rpx 10rpx;
  border-radius: 16rpx;
  background: #FFF;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn-item:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.action-btn-icon {
  font-size: 44rpx;
  margin-bottom: 8rpx;
}

.action-btn-text {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

/* 特定按钮颜色样式 */
.action-btn-item.collect {
  background: #FFF0F0;
  border: 1px solid rgba(255, 77, 79, 0.1);
}
.action-btn-item.collect .action-btn-text { color: #FF4D4F; }

.action-btn-item.consult {
  background: #F6FFED;
  border: 1px solid rgba(82, 196, 26, 0.1);
}
.action-btn-item.consult .action-btn-text { color: #52C41A; }

.action-btn-item.cart {
  background: #333;
}
.action-btn-item.cart .action-btn-text { color: #FFF; }

.action-btn-item.buy {
  background: #D4B886;
}
.action-btn-item.buy .action-btn-text { color: #FFF; }

/* 自定义导航栏 (移动端) */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition: all 0.3s;
}

@media screen and (min-width: 768px) {
  .custom-navbar {
    display: none; /* 大屏不显示自定义透明导航 */
  }
  
  .top-main-section {
    padding: 40px 20px;
    gap: 40px;
  }

  .left-main-content {
    flex: 1; /* 保持 50/50 分配 */
  }

  .product-info-column {
    gap: 20px;
  }
}

@media screen and (max-width: 767px) {
    .top-main-section {
      flex-direction: column;
      padding: 20rpx;
      align-items: stretch;
    }
    
    .left-main-content, .product-info-column {
      flex: none;
      width: 100%;
      height: auto; /* 手机端恢复自动高度 */
    }
  
    .product-gallery {
      height: 850rpx; /* 从 750rpx 增加到 850rpx，使其更大 */
      flex: none;
    }

  .main-action-buttons-row {
    padding: 20rpx;
    gap: 12rpx;
  }
  
  .action-btn-text {
    font-size: 20rpx;
  }
}

/* 加载 & 错误状态 */
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #FFF;
}

.loading-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid #F1F1F1;
  border-top-color: #D4B886;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 详情内容 */
.detail-content {
  width: 100%;
  height: 100vh;
}

/* 评价预览样式 */
.comment-preview-section {
  margin: 20rpx 30rpx;
  width: auto;
}
.header-left {
  display: flex;
  align-items: center;
}
.comment-count {
  font-size: 24rpx;
  color: #999;
  margin-left: 10rpx;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.view-all {
  font-size: 24rpx;
  color: #D4B886;
}
.arrow-right {
  font-size: 24rpx;
  color: #D4B886;
}
.comment-preview-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}
.comment-preview-item {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.comment-user {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.preview-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
}
.preview-user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.preview-nickname {
  font-size: 26rpx;
  color: #333;
}
.preview-time {
  font-size: 20rpx;
  color: #999;
  margin-top: 2rpx;
}
.preview-rating {
  display: flex;
  gap: 4rpx;
}
.preview-rating .star {
  font-size: 20rpx;
  color: #EEE;
}
.preview-rating .star.active {
  color: #FFB800;
}
.preview-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 12rpx;
}
.preview-imgs {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 12rpx;
}
.preview-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
}
.preview-spec {
  font-size: 22rpx;
  color: #999;
  background-color: #F8F8F8;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
  display: inline-block;
}
.no-comment-tip {
  font-size: 24rpx;
  color: #999;
  text-align: center;
  padding: 20rpx 0;
}

.image-swiper, .product-image {
  width: 100%;
  height: 100%;
}

.swiper-indicator {
  position: absolute;
  bottom: 30rpx;
  right: 30rpx;
  background: rgba(0,0,0,0.4);
  color: #FFF;
  padding: 4rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-family: 'DIN Alternate', sans-serif;
}

/* 商品信息 */
.product-info-section {
  background: #FFF;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.03);
}

.price-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.price-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
}

.price-symbol {
  font-size: 32rpx;
  color: #D4B886;
  font-weight: bold;
}

.product-price {
  font-size: 56rpx;
  color: #D4B886;
  font-weight: bold;
  margin: 0 8rpx;
  font-family: 'DIN Alternate', sans-serif;
}

.enterprise-tag {
  font-size: 24rpx;
  color: #D4B886;
  background: rgba(212, 184, 134, 0.1);
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.share-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 10rpx;
}

.share-icon { font-size: 40rpx; }
.share-text { font-size: 22rpx; color: #999; margin-top: 4rpx; }

.product-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  line-height: 1.4;
  margin-bottom: 12rpx;
  display: block;
}

.product-sell-point {
  font-size: 28rpx;
  color: #999;
  line-height: 1.5;
  margin-bottom: 24rpx;
  display: block;
}

.service-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  padding-top: 24rpx;
  border-top: 1px solid #F5F5F5;
}

.service-tag-item {
  display: flex;
  align-items: center;
  font-size: 22rpx;
  color: #666;
}

.check-icon {
  color: #D4B886;
  margin-right: 6rpx;
  font-weight: bold;
}

/* 通用卡片样式 */
.info-card, .section-card, .product-info-section {
  background: #FFF;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.03);
  margin-bottom: 0; /* 使用父容器 gap */
  width: 100%;
  box-sizing: border-box;
}

.product-info-section.no-margin {
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.section-subtitle {
  font-size: 24rpx;
  color: #999;
}

/* 数量选择 */
.quantity-selector-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quantity-selector {
  display: flex;
  align-items: center;
  background: #F8F8F8;
  border-radius: 10rpx;
  padding: 4rpx;
}

.quantity-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #333;
  cursor: pointer;
}

.quantity-btn.disabled { color: #CCC; }

.quantity-input {
  width: 80rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: bold;
  background: transparent;
  border: none;
}

.stock-info {
  font-size: 24rpx;
  color: #999;
}

.stock-value.low-stock { color: #FF4D4F; }
.out-of-stock-tip { font-size: 24rpx; color: #FF4D4F; }

/* 详情描述 */
.desc-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.detail-images {
  margin-top: 30rpx;
}

.detail-image {
  width: 100%;
  display: block;
}

/* 相关推荐 (固定一行5个) */
.related-products-section {
  padding: 40rpx 20rpx;
}

.related-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}

.header-line {
  width: 60rpx;
  height: 1px;
  background: #DDD;
}

.related-title {
  font-size: 28rpx;
  color: #999;
  margin: 0 20rpx;
}

.related-grid-five {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.related-item-five {
  width: calc(20% - 12px); /* 5个一排 */
  background: #FFF;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  transition: transform 0.3s;
  cursor: pointer;
}

.related-item-five:hover {
  transform: translateY(-5px);
}

.related-img-five {
  width: 100%;
  aspect-ratio: 1/1; /* 保持正方形 */
}

.related-info-box-five {
  padding: 12px;
}

.related-name-five {
  font-size: 14px;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
  height: 40px;
}

.related-price-five {
  font-size: 16px;
  font-weight: bold;
  color: #D4B886;
}

/* 兼容小屏幕的相关推荐 (2个一排) */
@media screen and (max-width: 767px) {
  .related-item-five {
    width: calc(50% - 8px);
  }
}

.status-bar { width: 100%; }
.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
}
.nav-left, .nav-right { width: 40px; }
.back-btn-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.back-icon { width: 20px; height: 20px; }
.nav-title { font-size: 17px; font-weight: 600; color: #333; }
</style>
