<template>
  <view class="detail-container">
    <!-- 产品图片区 -->
    <swiper class="product-img-swiper" circular indicator-dots>
      <swiper-item v-for="(img, index) in productInfo.imageUrls" :key="index">
        <image :src="img" mode="widthFix" class="product-img" @tap="previewImage(img)"></image>
      </swiper-item>
    </swiper>

    <!-- 产品信息区 -->
    <view class="product-info">
      <text class="product-name">{{productInfo.name}}</text>
      <view class="price-container">
        <text class="current-price">¥{{currentPrice.toFixed(2)}}</text>
        <text class="enterprise-price" v-if="productInfo.isEnterprisePrice">企业批量咨询价</text>
      </view>
      <view class="stock-status">
        <text>库存：{{currentStock}}件</text>
        <text v-if="currentStock < 10" class="stock-warning">库存紧张</text>
      </view>
      <rich-text :nodes="productInfo.description" class="product-desc"></rich-text>
    </view>

    <!-- 规格选择区 -->
    <view class="spec-container">
      <text class="spec-label">选择规格</text>
      <SpecPicker 
        :specList="productInfo.specList" 
        @specChange="handleSpecChange"
      ></SpecPicker>
    </view>

    <!-- 相关推荐 -->
    <view class="related-container" v-if="relatedProductList.length > 0">
      <view class="section-title">相关推荐</view>
      <view class="related-list">
        <view class="related-item" v-for="(item, index) in relatedProductList" :key="index" @click="goToProductDetail(item.id)">
          <image :src="item.imageUrl" mode="aspectFill" class="related-img"></image>
          <text class="related-name">{{item.name}}</text>
          <text class="related-price">¥{{item.price.toFixed(2)}}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作区 -->
    <view class="bottom-operation">
      <view class="operation-btn" @click="goToCart">
        <image src="/static/images/cart.png" class="btn-icon"></image>
        <text>购物车</text>
      </view>
      <button class="btn-secondary" @click="addCart">加入购物车</button>
      <button class="btn-primary" @click="buyNow">立即购买</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import { useCartStore } from '@/store/modules/cartStore';
import request from '@/utils/request';
import SpecPicker from '@/components/business/SpecPicker.vue'; // 引入规格选择组件

// 状态管理
const userStore = useUserStore();
const cartStore = useCartStore();
// 路由参数
const productId = ref('');
// 页面数据
const productInfo = ref({
  id: '',
  name: '',
  price: 0,
  imageUrls: [],
  description: '',
  specList: [],
  isEnterprisePrice: false,
  stock: 0
});
const relatedProductList = ref([]);
const selectedSpec = ref([]); // 选中的规格
const currentPrice = ref(0); // 选中规格后的价格
const currentStock = ref(0); // 选中规格后的库存

// 计算属性：是否登录
const isLogin = computed(() => !!userStore.token);

// 页面加载
onLoad((options) => {
  productId.value = options.productId;
  if (!productId.value) {
    uni.navigateBack();
    return;
  }
  getProductDetail();
  // 开启分享
  uni.showShareMenu({ withShareTicket: true });
});

// 接口请求
// 获取产品详情
const getProductDetail = async () => {
  uni.showLoading({ title: '加载中' });
  try {
    const res = await request({
      url: '/api/product/detail',
      method: 'GET',
      data: { productId: productId.value }
    });
    if (res.success) {
      productInfo.value = res.data;
      currentPrice.value = res.data.price;
      currentStock.value = res.data.stock;
      // 获取到详情后加载相关推荐
      getRelatedProduct(res.data.name);
    }
  } catch (error) {
    uni.showToast({ title: '产品信息加载失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

// 获取相关推荐产品
const getRelatedProduct = async (productName) => {
  if (!productName) return;
  try {
    const res = await request({
      url: '/api/product/related',
      method: 'GET',
      data: { productName, limit: 10 }
    });
    if (res.success) {
      relatedProductList.value = res.data;
    }
  } catch (error) {
    console.log('相关推荐加载失败', error);
  }
};

// 规格变更处理
const handleSpecChange = async (specIds) => {
  selectedSpec.value = specIds;
  // 调用规格价格接口
  try {
    const res = await request({
      url: '/api/product/spec/price',
      method: 'GET',
      data: { productId, specIds: specIds.join(',') }
    });
    if (res.success) {
      currentPrice.value = res.data.price;
      currentStock.value = res.data.stock;
    }
  } catch (error) {
    uni.showToast({ title: '规格信息获取失败', icon: 'none' });
  }
};

// 图片预览
const previewImage = (currentImg) => {
  uni.previewImage({
    current: currentImg,
    urls: productInfo.value.imageUrls
  });
};

// 加入购物车
const addCart = () => {
  if (!isLogin.value) {
    uni.navigateTo({ url: '/pages/main/login' });
    return;
  }
  if (currentStock.value <= 0) {
    uni.showToast({ title: '该规格库存不足', icon: 'none' });
    return;
  }
  // 调用购物车新增接口
  const cartData = {
    productId: productInfo.value.id,
    specIds: selectedSpec.value.join(','),
    quantity: 1
  };
  cartStore.addCart(cartData).then(() => {
    uni.showToast({ title: '加入购物车成功' });
  }).catch((err) => {
    uni.showToast({ title: err.message || '加入购物车失败', icon: 'none' });
  });
};

// 立即购买
const buyNow = () => {
  if (!isLogin.value) {
    uni.navigateTo({ url: '/pages/main/login' });
    return;
  }
  if (currentStock.value <= 0) {
    uni.showToast({ title: '该规格库存不足', icon: 'none' });
    return;
  }
  // 跳转至订单确认页
  const orderData = {
    productId: productInfo.value.id,
    specIds: selectedSpec.value.join(','),
    quantity: 1,
    price: currentPrice.value
  };
  uni.navigateTo({
    url: `/pages/order/confirm?orderData=${encodeURIComponent(JSON.stringify(orderData))}`
  });
};

// 跳转到购物车
const goToCart = () => {
  if (!isLogin.value) {
    uni.navigateTo({ url: '/pages/main/login' });
    return;
  }
  uni.navigateTo({ url: '/pages/cart/index' });
};

// 跳转到其他产品详情
const goToProductDetail = (id) => {
  if (id === productId) return;
  uni.navigateTo({ url: `/pages/product/detail/detail?productId=${id}` });
};

// 分享功能
const onShareAppMessage = () => {
  return {
    title: productInfo.value.name,
    path: `/pages/product/detail/detail?productId=${productId}`,
    imageUrl: productInfo.value.imageUrls[0]
  };
};
</script>

<style scoped>
/* 基础样式 */
.detail-container {
  background-color: #FFFFFF;
  min-height: 100vh;
  position: relative;
}

/* 产品图片区 */
.product-img-swiper {
  width: 100%;
  height: 400rpx;
}
.product-img {
  width: 100%;
  height: 100%;
}

/* 产品信息区 */
.product-info {
  padding: 20rpx;
}
.product-name {
  font-size: 20rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.price-container {
  margin-bottom: 16rpx;
}
.current-price {
  font-size: 24rpx;
  color: #D4B886;
  font-weight: bold;
}
.enterprise-price {
  font-size: 14rpx;
  color: #666666;
  margin-left: 16rpx;
}
.stock-status {
  font-size: 14rpx;
  color: #666666;
  margin-bottom: 20rpx;
}
.stock-warning {
  color: #F53F3F;
  margin-left: 8rpx;
}
.product-desc {
  font-size: 16rpx;
  color: #333333;
  line-height: 1.5;
}

/* 规格选择区 */
.spec-container {
  padding: 20rpx;
  border-top: 1rpx solid #EEEEEE;
}
.spec-label {
  font-size: 16rpx;
  color: #333333;
  margin-bottom: 16rpx;
  display: block;
}

/* 相关推荐区 */
.related-container {
  padding: 0 20rpx 100rpx;
}
.section-title {
  font-size: 20rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 16rpx;
}
.related-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.related-item {
  width: 32%;
}
.related-img {
  width: 100%;
  height: 120rpx;
  border-radius: 8rpx;
  margin-bottom: 8rpx;
}
.related-name {
  font-size: 14rpx;
  color: #333333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8rpx;
}
.related-price {
  font-size: 14rpx;
  color: #D4B886;
  font-weight: bold;
}

/* 底部操作区 */
.bottom-operation {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100rpx;
  background-color: #FFFFFF;
  display: flex;
  align-items: center;
  border-top: 1rpx solid #EEEEEE;
  padding: 0 20rpx;
  box-sizing: border-box;
}
.operation-btn {
  width: 15%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.btn-icon {
  width: 40rpx;
  height: 40rpx;
  margin-bottom: 8rpx;
}
.operation-btn text {
  font-size: 14rpx;
  color: #333333;
}
.btn-secondary {
  width: 30%;
  height: 80rpx;
  background-color: #FFFFFF;
  border: 1rpx solid #333333;
  color: #333333;
  border-radius: 8rpx;
  font-size: 16rpx;
  margin: 0 10rpx;
}
.btn-primary {
  width: 35%;
  height: 80rpx;
  background-color: #D4B886;
  color: #FFFFFF;
  border-radius: 8rpx;
  font-size: 16rpx;
}
</style>