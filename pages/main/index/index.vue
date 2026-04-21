<template>
  <view class="index-container">
    <!-- 得物风顶部导航栏组件 -->
    <TopNavbar activePage="home" />

    <!-- Hero Section (得物风：深色背景 + 广告语 + 轮播图) -->
    <view class="hero-section">
      <view class="hero-content">
        <!-- 左侧广告语 -->
        <view class="hero-left">
          <view class="slogan-main">栗子好物</view>
          <view class="slogan-sub">精选全球好物 · 打造理想之家</view>
          <view class="slogan-tags">
            <text class="tag-item">正品保障</text>
            <text class="tag-divider">·</text>
            <text class="tag-item">匠心工艺</text>
            <text class="tag-divider">·</text>
            <text class="tag-item">极简美学</text>
          </view>
        </view>
        <!-- 右侧轮播图 -->
        <view class="hero-right">
          <swiper class="hero-swiper" autoplay interval="4000" circular @change="handleSwiperChange">
            <swiper-item v-for="(item, index) in bannerList" :key="index">
              <!-- 使用 mode="widthFix" 或 "aspectFit" 确保图片展示完整不被截断 -->
              <view class="swiper-item-box" :class="{ 'active': currentSwiperIndex === index }">
                <image :src="item.imageUrl" mode="aspectFit" class="hero-banner-img" @click="goToTarget(item.linkUrl)"></image>
              </view>
            </swiper-item>
          </swiper>
          <!-- 自定义指示点 -->
          <view class="custom-indicator">
            <view 
              v-for="(item, index) in bannerList" 
              :key="index" 
              class="indicator-dot" 
              :class="{ active: currentSwiperIndex === index }"
            ></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 公告栏 (得物风：极简黑白) -->
    <view class="notice-container">
      <view class="notice-label">NEWS</view>
      <marquee class="notice-content" scrollamount="3">{{noticeContent}}</marquee>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar-container" @click="goToSearch">
      <view class="search-bar">
        <image src="/static/images/icon-search.png" class="search-icon"></image>
        <swiper class="search-keyword-swiper" vertical autoplay interval="3000" circular duration="500">
          <swiper-item v-for="(keyword, index) in hotKeywordList" :key="index" class="keyword-item">
            <text class="search-placeholder">大家都在搜：{{keyword}}</text>
          </swiper-item>
          <!-- 如果没有数据时的兜底展示 -->
          <swiper-item v-if="hotKeywordList.length === 0" class="keyword-item">
            <text class="search-placeholder">大家都在搜：北欧简约沙发</text>
          </swiper-item>
        </swiper>
      </view>
    </view>
    
    <!-- 产品分类入口 (得物风：文字横向导航) -->
    <scroll-view class="category-nav" scroll-x show-scrollbar="false">
      <view 
        class="nav-item" 
        :class="{ active: currentCategoryId === '0' }" 
        @click="handleCategoryClick('0')"
      >精选</view>
      <view 
        class="nav-item" 
        :class="{ active: currentCategoryId === item.id }" 
        v-for="(item, index) in categoryList" 
        :key="index" 
        @click="handleCategoryClick(item.id)"
      >
        {{item.name}}
      </view>
    </scroll-view>

    <!-- 热门产品推荐 (动态显示精选或分类商品) -->
    <view class="hot-product-container">
      <view class="list-transition-wrapper">
        <!-- 加载中状态 -->
        <view class="list-loading" v-if="showLoading">
          <view class="loading-item" v-for="i in 4" :key="i">
            <view class="loading-img skeleton"></view>
            <view class="loading-info">
              <view class="loading-name skeleton"></view>
              <view class="loading-price skeleton"></view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view class="list-empty" v-else-if="isDisplayListEmpty">
          <image src="/static/images/empty-product.png" mode="aspectFit" class="empty-img"></image>
          <text class="empty-text">暂无相关商品</text>
        </view>

        <!-- 商品列表 -->
        <view class="product-list fade-in" v-else>
          <view 
            class="product-item" 
            v-for="(item, index) in displayProductList" 
            :key="item.id || index" 
            @click="goToProductDetail(item.id)"
            hover-class="product-item-hover"
            :hover-stay-time="150"
          >
            <image :src="item.imageUrl" mode="aspectFill" class="product-img"></image>
            <view class="product-info">
              <text class="product-name">{{item.name || ''}}</text>
              <text class="product-sellPoint">{{item.sellPoint || ''}}</text>
              <text class="product-price">¥{{(item.price || 0).toFixed(2)}}</text>
              <text class="enterprise-tag" v-if="item.isEnterprisePrice">批量咨询价</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 猜你喜欢 -->
    <view class="guess-like-container">
      <view class="section-title">猜你喜欢</view>
      <view class="product-list fade-in">
        <view 
          class="product-item" 
          v-for="(item, index) in guessLikeProductList" 
          :key="item.id || index" 
          @click="goToProductDetail(item.id)"
          hover-class="product-item-hover"
          :hover-stay-time="150"
        >
          <image :src="item.imageUrl" mode="aspectFill" class="product-img"></image>
          <view class="product-info">
            <text class="product-name">{{item.name || ''}}</text>
            <text class="product-sellPoint">{{item.sellPoint || ''}}</text>
            <text class="product-price">¥{{(item.price || 0).toFixed(2)}}</text>
            <text class="enterprise-tag" v-if="item.isEnterprisePrice">批量咨询价</text>
          </view>
        </view>
      </view>
      <view class="loading-status" v-if="isLoadingGuessLike">
        <text>正在加载更多推荐...</text>
      </view>
    </view>

    <!-- 回到顶部按钮 -->
    <view class="back-top" :class="{ 'show': showBackTop }" @click="backToTop">
      <text class="back-top-icon">↑</text>
      <text class="back-top-text">顶部</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad, onShow, onUnload, onPullDownRefresh, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import cacheUtil from '@/utils/cacheUtil';
import { productApi } from '@/utils/api';
import request from '@/utils/request';
import TopNavbar from '@/components/business/TopNavbar.vue';

// 状态管理
const userStore = useUserStore();
// 页面数据
const bannerList = ref([]); // 轮播图数据
const categoryList = ref([]); // 分类数据
const hotProductList = ref([]); // 热门产品数据
const categoryProductList = ref([]); // 当前分类商品数据
const isCategoryLoading = ref(false); // 分类商品加载状态
const currentCategoryId = ref('0'); // 当前选中的分类ID，'0'表示精选
const hotKeywordList = ref([]); // 热门关键词数据
const guessLikeProductList = ref([]); // 猜你喜欢数据
const guessLikeBeginId = ref(null); // 猜你喜欢滚动查询开始ID
const guessLikeIsEnd = ref(false); // 猜你喜欢是否加载完毕
const noticeContent = ref(''); // 公告内容
const isLoadingGuessLike = ref(false); // 是否正在加载猜你喜欢数据
const showBackTop = ref(false); // 是否显示回到顶部按钮
const currentSwiperIndex = ref(0); // 当前轮播图索引

// 计算属性：当前展示的商品列表
const displayProductList = computed(() => {
  return currentCategoryId.value === '0' ? hotProductList.value : categoryProductList.value;
});

// 计算属性：是否显示加载中
const showLoading = computed(() => {
  return (currentCategoryId.value === '0' && hotProductList.value.length === 0) || 
         (currentCategoryId.value !== '0' && isCategoryLoading.value);
});

// 计算属性：当前展示列表是否为空
const isDisplayListEmpty = computed(() => {
  return !showLoading.value && displayProductList.value.length === 0;
});

// 监听轮播图变化
const handleSwiperChange = (e) => {
  currentSwiperIndex.value = e.detail.current;
};

// 监听登录状态变化
const isLoggedIn = computed(() => userStore.isLogin);

// 页面加载时请求数据
onLoad(() => {
  getBannerList();
  getCategoryList();
  getHotProductList();
  getHotKeywordList();
  getGuessLikeProductList();
  getNoticeContent();
});

// 监听滚动位置
onPageScroll((e) => {
  // 滚动超过 400 像素显示回到顶部按钮
  showBackTop.value = e.scrollTop > 400;
});

// 触底加载更多
onReachBottom(() => {
  console.log('触底加载更多猜你喜欢');
  getGuessLikeProductList(true, false);
});

// 回到顶部方法
const backToTop = () => {
  uni.pageScrollTo({
    scrollTop: 0,
    duration: 300
  });
};

// 每次页面显示时检查登录状态并刷新数据
onShow(() => {
  console.log('首页 onShow 被调用，检查登录状态');
  
  // 检查用户登录状态是否发生变化，按需获取数据
  // 这些方法内部都有缓存机制，如果缓存有效则不会触发真实 API 请求
  getBannerList();
  getCategoryList();
  getHotProductList();
  getHotKeywordList();
  getGuessLikeProductList();
  getNoticeContent();
  
  // 检查登录状态是否变化
  const currentToken = uni.getStorageSync('token');
  const currentUserInfo = uni.getStorageSync('userInfo') || {};
  
  if (currentToken && !userStore.token) {
    // 重新初始化用户状态
    userStore.$patch({
      token: currentToken,
      userInfo: currentUserInfo,
      isLogin: true
    });
  } else if (!currentToken && userStore.token) {
    // 用户已退出登录
    userStore.logout();
  }
  
  // 如果登录状态发生变化，可能需要更新UI
  if (currentToken && userStore.token && 
      JSON.stringify(currentUserInfo) !== JSON.stringify(userStore.userInfo)) {
    // 更新用户信息
    userStore.userInfo = currentUserInfo;
  }
});

// 监听用户登录和登出事件
uni.$on('userLogin', (userInfo) => {
  console.log('接收到用户登录事件', userInfo);
  // 用户登录后可能需要更新UI
  setTimeout(() => {
    // 重新加载数据
    getBannerList();
    getCategoryList();
    getHotProductList();
    getHotKeywordList();
    getGuessLikeProductList();
    getNoticeContent();
  }, 300); // 短暂延迟确保状态已更新
});

// 监听用户登出事件
uni.$on('userLogout', () => {
  console.log('接收到用户登出事件');
  // 用户登出后可能需要更新UI
  setTimeout(() => {
    // 重新加载数据
    getBannerList();
    getCategoryList();
    getHotProductList();
    getHotKeywordList();
    getGuessLikeProductList();
    getNoticeContent();
  }, 300); // 短暂延迟确保状态已更新
});

// 页面卸载时移除事件监听
onUnload(() => {
  uni.$off('userLogin');
  uni.$off('userLogout');
});

// 下拉刷新
onPullDownRefresh(async () => {
  console.log('触发下拉刷新，清理业务缓存并重新加载数据');
  cacheUtil.clearBusinessCache();
  // 额外清理猜你喜欢的缓存
  cacheUtil.delete('home_guess_like');
  
  // 清理当前分类商品的缓存
  if (currentCategoryId.value !== '0') {
    cacheUtil.delete(`category_products_${currentCategoryId.value}`);
  }
  
  // 重新加载所有数据 (forceRefresh = true)
  const refreshTasks = [
    getBannerList(true),
    getCategoryList(true),
    getHotProductList(true),
    getHotKeywordList(true),
    getGuessLikeProductList(false, true), 
    getNoticeContent(true)
  ];

  if (currentCategoryId.value !== '0') {
    refreshTasks.push(getCategoryProductList(currentCategoryId.value, true));
  }

  await Promise.all(refreshTasks);
  
  uni.stopPullDownRefresh();
  uni.showToast({ title: '已刷新', icon: 'none' });
});

// 接口请求方法
// 处理分类点击
const handleCategoryClick = async (categoryId) => {
  if (currentCategoryId.value === categoryId) return;
  
  currentCategoryId.value = categoryId;
  if (categoryId === '0') {
    // 精选，已有的热门商品逻辑
    if (hotProductList.value.length === 0) {
      await getHotProductList();
    }
  } else {
    // 分类商品
    await getCategoryProductList(categoryId);
  }
};

// 获取分类商品列表
const getCategoryProductList = async (categoryId, forceRefresh = false) => {
  try {
    isCategoryLoading.value = true;
    // 1. 尝试从缓存获取
    const cacheKey = `category_products_${categoryId}`;
    if (!forceRefresh) {
      const cachedData = cacheUtil.get(cacheKey);
      if (cachedData) {
        console.log(`从缓存获取分类 ${categoryId} 商品数据成功`);
        categoryProductList.value = cachedData;
        isCategoryLoading.value = false;
        return;
      }
    }

    console.log(`开始获取分类 ${categoryId} 商品数据...`);
    
    // 使用统一 request 工具
    // 接口格式：/api/product/categroy/list
    const result = await productApi.getCategoryProducts({
      sortType: 'default', // 首页默认排序
      categoryId: categoryId, // 分类id
      isFirstCategoryId: true, // 首页分类展示的商品是一级分类
      querySize: 20
    });
    
    if (result && result.success && result.data && Array.isArray(result.data.list)) {
      const productData = result.data.list;
      console.log(`提取到分类 ${categoryId} 商品数量:`, productData.length);
      
      const processedData = productData.map((item, index) => {
        let imgUrl = item.image || item.imageUrl || '';
        if (typeof imgUrl === 'string') {
          imgUrl = imgUrl.replace(/`/g, '').trim();
          if (!imgUrl) {
            imgUrl = 'https://via.placeholder.com/200x200?text=Product';
          }
        }
        
        return {
          id: String(item.id || index),
          name: item.name || `分类商品${index+1}`,
          imageUrl: imgUrl,
          price: parseFloat(item.price) || 0,
          sellPoint: item.description || '',
          isEnterprisePrice: item.isEnterprisePrice || false
        };
      });
      
      categoryProductList.value = processedData;
      // 保存到缓存 (5分钟)
      cacheUtil.set(cacheKey, processedData, 5);
    } else {
      console.warn(`分类 ${categoryId} 商品列表数据为空或格式不正确`);
      categoryProductList.value = [];
    }
  } catch (error) {
    console.error(`获取分类 ${categoryId} 商品列表失败:`, error);
    categoryProductList.value = [];
    uni.showToast({ title: '加载分类商品失败', icon: 'none' });
  } finally {
    isCategoryLoading.value = false;
  }
};

// 获取轮播图
const getBannerList = async (forceRefresh = false) => {
  try {
    // 1. 尝试从缓存获取
    if (!forceRefresh) {
      const cachedData = cacheUtil.get('home_banners');
      if (cachedData) {
        console.log('从缓存获取轮播图数据成功');
        bannerList.value = cachedData;
        return;
      }
    }

    console.log('开始获取轮播图数据...');
    
    // 使用统一 request 工具
    const result = await request({
      url: '/api/banner/list',
      method: 'GET',
      timeout: 30000
    });
    
    // 检查响应是否成功
    if (result && result.data) {
        // 确保数据是数组
        const bannerData = Array.isArray(result.data) ? result.data : [result.data];
        console.log('轮播图数据数量:', bannerData.length);
        
        // 处理每个轮播项
        const processedData = bannerData.map((item, index) => {
          console.log(`第${index+1}个轮播项原始数据:`, JSON.stringify(item, null, 2));
          
          // 处理图片URL - 确保正确清洗反引号和空格
          let imgUrl = item.imageUrl || item.image_url || item.imageurl || '';
          if (typeof imgUrl === 'string') {
            console.log(`原始图片URL: "${imgUrl}"`);
            // 移除反引号和首尾空格
            imgUrl = imgUrl.replace(/`/g, '').trim();
            console.log(`清理后的图片URL: "${imgUrl}"`);
            // 添加默认图片URL，确保图片始终有来源
            if (!imgUrl) {
              imgUrl = 'https://via.placeholder.com/200x200?text=Banner';
              console.log(`使用默认轮播图图片URL: "${imgUrl}"`);
            }
          }
          
          // 处理链接URL
          let linkUrl = item.linkUrl || item.link_url || '';
          if (typeof linkUrl === 'string') {
            linkUrl = linkUrl.replace(/`/g, '').trim();
          }
          
          return {
            id: String(item.id) || String(index),
            title: item.title || `轮播图${index+1}`,
            imageUrl: imgUrl,
            linkUrl: linkUrl,
            linkType: item.linkType || item.link_type || 'url'
          };
        });
        
        console.log('处理后的轮播图数据:', JSON.stringify(processedData, null, 2));
        
        // 设置轮播图数据
        bannerList.value = processedData;
        // 2. 保存到缓存 (1小时)
        cacheUtil.set('home_banners', processedData, 60);
        console.log('轮播图数据设置成功:', bannerList.value);
        
        // 如果处理后的数据为空，显示提示
        if (processedData.length === 0) {
          uni.showToast({ title: '轮播图数据为空', icon: 'none' });
        }
      } else {
        console.error('没有轮播图数据');
        uni.showToast({ title: '轮播图数据不存在', icon: 'none' });
      }
  } catch (err) {
    console.error('轮播图请求异常:', err);
    uni.showToast({ title: '轮播图加载失败', icon: 'none' });
  }
};

// 获取分类列表
const getCategoryList = async (forceRefresh = false) => {
  try {
    // 1. 尝试从缓存获取
    if (!forceRefresh) {
      const cachedData = cacheUtil.get('home_categories');
      if (cachedData) {
        console.log('从缓存获取分类数据成功');
        categoryList.value = cachedData;
        return;
      }
    }

    console.log('开始获取分类数据...');
    
    // 使用统一 request 工具
    const result = await request({
      url: '/api/category/tree',
      method: 'GET',
      timeout: 30000
    });
    
    // 检查响应是否成功
    if (result) {
      // 处理响应数据，根据用户提供的后端代码，后端返回的格式是 {success: boolean, data: Array}
      let categoryData = [];
      if (result && result.data) {
        // 确保数据是数组
        categoryData = Array.isArray(result.data) ? result.data : [result.data];
      } else if (Array.isArray(result)) {
        // 如果直接返回数组
        categoryData = result;
      }
      
      console.log('提取到的分类数据:', JSON.stringify(categoryData, null, 2));
      console.log('分类数据数量:', categoryData.length);
      
      // 处理每个分类项
      const processedData = categoryData.slice(0, 8).map((item, index) => {
        console.log(`第${index+1}个分类项原始数据:`, JSON.stringify(item, null, 2));
        
        // 确保item是对象
        if (typeof item !== 'object' || item === null) {
          return {
            id: String(index),
            name: `分类${index+1}`,
            iconUrl: 'https://via.placeholder.com/40x40?text=Icon'
          };
        }
        
        // 处理图标URL
        let iconUrl = item.iconUrl || item.icon_url || item.icon || item.logoUrl || item.logo_url || item.logo || '';
        if (typeof iconUrl === 'string') {
          console.log(`原始图标URL: "${iconUrl}"`);
          // 移除反引号和首尾空格
          iconUrl = iconUrl.replace(/`/g, '').trim();
          console.log(`清理后的图标URL: "${iconUrl}"`);
          // 添加默认图标URL
          if (!iconUrl) {
            iconUrl = 'https://via.placeholder.com/40x40?text=Icon';
            console.log(`使用默认分类图标URL: "${iconUrl}"`);
          }
        } else {
          iconUrl = 'https://via.placeholder.com/40x40?text=Icon';
        }
        
        return {
          id: String(item.id || item.categoryId || index),
          name: item.name || item.title || `分类${index+1}`,
          iconUrl: iconUrl
        };
      });
      
      console.log('处理后的分类数据:', JSON.stringify(processedData, null, 2));
      
      // 设置分类数据
      categoryList.value = processedData;
      // 2. 保存到缓存 (24小时)
      cacheUtil.set('home_categories', processedData, 1440);
      console.log('分类数据加载成功:', categoryList.value);
      
      // 如果处理后的数据为空，显示提示
      if (processedData.length === 0) {
        console.log('分类数据为空，使用默认数据');
        categoryList.value = Array.from({length: 8}, (_, i) => ({
          id: String(i),
          name: `默认分类${i+1}`,
          iconUrl: 'https://via.placeholder.com/40x40?text=Icon'
        }));
      }
    } else {
      console.error('分类请求失败，状态码:', res ? res.statusCode : '未知');
      // 使用默认分类数据
      categoryList.value = Array.from({length: 8}, (_, i) => ({
        id: String(i),
        name: `默认分类${i+1}`,
        iconUrl: 'https://via.placeholder.com/40x40?text=Icon'
      }));
    }
  } catch (error) {
    console.error('分类请求异常:', error);
    // 显示默认分类数据
    console.log('分类请求失败，使用默认数据');
    categoryList.value = Array.from({length: 8}, (_, i) => ({
      id: String(i),
      name: `默认分类${i+1}`,
      iconUrl: 'https://via.placeholder.com/40x40?text=Icon'
    }));
  }
};

// 获取热门产品
const getHotProductList = async (forceRefresh = false) => {
  try {
    // 1. 尝试从缓存获取
    if (!forceRefresh) {
      const cachedData = cacheUtil.get('home_hot_products');
      if (cachedData) {
        console.log('从缓存获取热门产品数据成功');
        hotProductList.value = cachedData;
        return;
      }
    }

    console.log('开始获取热门产品数据...');
    
    // 使用统一 request 工具
    const result = await productApi.getHotProductList({
      limit: 10
    });
    
    // 检查响应是否成功
    if (result && result.success && result.data) {
      const productData = Array.isArray(result.data) ? result.data : [result.data];
      
      console.log('提取到的热门产品数据:', JSON.stringify(productData, null, 2));
      console.log('热门产品数据数量:', productData.length);
      
      // 处理每个产品项
      const processedData = productData.map((item, index) => {
        // 处理图片URL
        let imgUrl = item.image || item.imageUrl || '';
        if (typeof imgUrl === 'string') {
          imgUrl = imgUrl.replace(/`/g, '').trim();
          if (!imgUrl) {
            imgUrl = 'https://via.placeholder.com/200x200?text=Product';
          }
        } else {
          imgUrl = 'https://via.placeholder.com/200x200?text=Product';
        }
        
        return {
          id: String(item.id || index),
          name: item.name || item.title || `产品${index+1}`,
          imageUrl: imgUrl,
          price: parseFloat(item.price) || 0,
          sellPoint: item.sellPoint || item.description || '',
          isEnterprisePrice: item.isEnterprisePrice || false
        };
      });
      
      console.log('处理后的热门产品数据:', JSON.stringify(processedData, null, 2));
      
      // 如果处理后的数据为空，显示默认数据
      if (processedData.length === 0) {
        console.log('热门产品数据为空，使用默认数据');
        // 生成默认的热门产品数据
        hotProductList.value = Array.from({length: 4}, (_, i) => ({
          id: String(i),
          name: `默认产品${i+1}`,
          imageUrl: 'https://via.placeholder.com/200x200?text=Product',
          price: (Math.random() * 1000 + 100).toFixed(2),
          sellPoint: '这是一个优质产品',
          isEnterprisePrice: false
        }));
      } else {
        // 设置热门产品数据
        hotProductList.value = processedData;
        // 2. 保存到缓存 (1分钟)
        cacheUtil.set('home_hot_products', processedData, 1);
        console.log('热门产品数据加载成功:', hotProductList.value);
        console.log('热门产品数量:', hotProductList.value.length);
      }
    }
  } catch (error) {
    console.error('热门产品请求异常:', error);
    // 显示默认热门产品数据
    console.log('热门产品请求失败，使用默认数据');
    hotProductList.value = Array.from({length: 4}, (_, i) => ({
      id: String(i),
      name: `默认产品${i+1}`,
      imageUrl: 'https://via.placeholder.com/200x200?text=Product',
      price: (Math.random() * 1000 + 100).toFixed(2),
      sellPoint: '这是一个优质产品',
      isEnterprisePrice: false
    }));
  }
};

// 获取猜你喜欢产品列表
const getGuessLikeProductList = async (append = false, forceRefresh = false) => {
  if (isLoadingGuessLike.value) return;
  
  try {
    // 1. 尝试从缓存获取 (仅在非追加且非强制刷新时)
    if (!append && !forceRefresh) {
      const cachedData = cacheUtil.get('home_guess_like');
      if (cachedData && cachedData.length > 0) {
        console.log('--- [猜你喜欢] 从缓存获取数据成功');
        guessLikeProductList.value = cachedData;
        return;
      }
    }

    if (forceRefresh) {
      guessLikeBeginId.value = null;
      guessLikeIsEnd.value = false;
    }

    // 如果之前已经加载完毕，且现在是追加模式，则重置 beginId 实现无限循环刷新
    if (guessLikeIsEnd.value && append) {
      console.log('--- [猜你喜欢] 已触底，重置 beginId 实现无限刷新');
      guessLikeBeginId.value = null;
      guessLikeIsEnd.value = false;
    }

    isLoadingGuessLike.value = true;
    console.log('--- [猜你喜欢] 开始请求数据, append:', append, 'beginId:', guessLikeBeginId.value);
    
    const params = {
      beginId: guessLikeBeginId.value,
      querySize: 20 // 首页加载适量
    };

    const result = await productApi.getScrollProductList(params);
    console.log('--- [猜你喜欢] 接口返回原始数据:', JSON.stringify(result));
    
    // 灵活处理不同的返回格式
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
    
    console.log('--- [猜你喜欢] 提取到的商品数量:', productData.length);
    
    if (productData.length > 0) {
      const processedData = productData.map((item, index) => {
        // 处理图片URL
        let imgUrl = item.image || item.imageUrl || '';
        if (typeof imgUrl === 'string') {
          imgUrl = imgUrl.replace(/`/g, '').trim();
          if (!imgUrl) {
            imgUrl = 'https://via.placeholder.com/200x200?text=Product';
          }
        } else {
          imgUrl = 'https://via.placeholder.com/200x200?text=Product';
        }
        
        return {
          id: String(item.id || index),
          name: item.name || item.title || `产品${index+1}`,
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
        // 2. 保存到缓存 (30分钟)
        cacheUtil.set('home_guess_like', processedData, 30);
      }
      
      // 更新分页状态
      guessLikeBeginId.value = isEnd ? null : nextBeginId;
      guessLikeIsEnd.value = isEnd;
      
      console.log('--- [猜你喜欢] 数据处理完成, nextBeginId:', guessLikeBeginId.value, 'isEnd:', isEnd);
    } else {
      guessLikeIsEnd.value = true;
      guessLikeBeginId.value = null; // 没数据了也重置，下次从头开始
      console.warn('--- [猜你喜欢] 未提取到有效的商品数组');
    }
  } catch (error) {
    console.error('--- [猜你喜欢] 请求或处理异常:', error);
    if (!append && guessLikeProductList.value.length === 0) {
      console.log('--- [猜你喜欢] 使用模拟数据兜底');
      guessLikeProductList.value = Array.from({length: 10}, (_, i) => ({
        id: `mock-${i}`,
        name: `推荐产品${i+1}`,
        imageUrl: 'https://via.placeholder.com/200x200?text=GuessLike',
        price: (Math.random() * 1000 + 100).toFixed(2),
        sellPoint: '为您精选的优质产品',
        isEnterprisePrice: false
      }));
    }
  } finally {
    isLoadingGuessLike.value = false;
  }
};

// 获取热门关键词
const getHotKeywordList = async (forceRefresh = false) => {
  try {
    // 1. 尝试从缓存获取
    if (!forceRefresh) {
      const cachedData = cacheUtil.get('home_hot_keywords');
      if (cachedData) {
        console.log('从缓存获取热门关键词成功');
        hotKeywordList.value = cachedData;
        return;
      }
    }

    console.log('开始获取热门关键词...');
    
    // 使用统一 request 工具
    const result = await request({
      url: '/api/product/user/keyword/list',
      method: 'GET',
      timeout: 30000
    });
    
    if (result && result.success && Array.isArray(result.data)) {
      hotKeywordList.value = result.data;
      // 2. 保存到缓存 (2小时)
      cacheUtil.set('home_hot_keywords', result.data, 120);
      console.log('热门关键词加载成功:', result.data.length);
    } else {
      console.warn('热门关键词数据格式异常:', result);
      // 兜底数据
      hotKeywordList.value = ['北欧简约沙发', '真皮床', '极简餐桌', '智能灯具'];
    }
  } catch (error) {
    console.error('热门关键词请求异常:', error);
    hotKeywordList.value = ['北欧简约沙发', '真皮床', '极简餐桌', '智能灯具'];
  }
};

// 获取公告内容
const getNoticeContent = async (forceRefresh = false) => {
  try {
    // 1. 尝试从缓存获取
    if (!forceRefresh) {
      const cachedData = cacheUtil.get('home_notice');
      if (cachedData) {
        console.log('从缓存获取公告内容成功');
        noticeContent.value = cachedData;
        return;
      }
    }

    console.log('开始获取公告内容...');
    
    // 使用统一 request 工具
    const result = await request({
      url: '/api/notice/latest',
      method: 'GET',
      timeout: 30000
    });
    
    if (result) {
      // 灵活处理响应数据，适配不同的返回格式
      if (result && result.success) {
        // 检查data是否存在
        if (result.data) {
          // 如果data是对象且包含content字段
          if (typeof result.data === 'object' && result.data.content) {
            noticeContent.value = result.data.content;
            console.log('公告内容加载成功');
          } 
          // 如果data是数组（用户提到默认获取5个）
          else if (Array.isArray(result.data) && result.data.length > 0) {
            // 使用第一个公告的内容
            const firstNotice = result.data[0];
            // 检查公告对象是否包含content或其他可能的内容字段
            if (firstNotice.content) {
              noticeContent.value = firstNotice.content;
            } else if (firstNotice.title) {
              noticeContent.value = firstNotice.title;
            } else {
              // 将整个对象转换为字符串作为回退
              noticeContent.value = JSON.stringify(firstNotice);
            }
            console.log('从公告数组中提取内容成功');
          } 
          // 如果data是字符串
          else if (typeof result.data === 'string') {
            noticeContent.value = result.data;
            console.log('公告内容加载成功');
          }
          
          // 2. 保存到缓存 (12小时)
          if (noticeContent.value) {
            cacheUtil.set('home_notice', noticeContent.value, 720);
          }
        }
      }
    }
  } catch (error) {
    console.error('公告请求异常:', error);
    noticeContent.value = '欢迎使用某某家具装修小程序';
  }
};

// 页面跳转方法
// 跳转到 Tab 页
const goToTab = (url) => {
  uni.reLaunch({ url });
};

// 跳转到普通页
const goToPage = (url) => {
  uni.navigateTo({ url });
};

// 跳转到搜索页
const goToSearch = () => {
  uni.navigateTo({ url: '/pages/product/search/search' });
};

// 跳转到目标页面（海报链接）
const goToTarget = (linkUrl) => {
  if (linkUrl.includes('productId')) {
    const productId = linkUrl.split('=')[1];
    uni.navigateTo({ url: `/pages/product/detail/detail?productId=${productId}` });
  } else if (linkUrl) {
    uni.navigateTo({ url: linkUrl });
  }
};

// 跳转到产品详情页
const goToProductDetail = (productId) => {
  uni.navigateTo({ url: `/pages/product/detail/detail?productId=${productId}` });
};
</script>

<style scoped>
/* 页面背景 */
.index-container {
  background-color: #f8f8f8;
  min-height: 100vh;
}

/* 顶部内容区域 padding */
.search-bar-container,
.category-nav,
.hot-product-container,
.guess-like-container {
  padding-left: 30rpx;
  padding-right: 30rpx;
}

/* 顶部 Hero 区域 */
.hero-section {
  background-color: #121212;
  /* 【高度调节】通过调整上下 padding 来控制黑色区域的高度 */
  padding-top: 60rpx; 
  padding-bottom: 60rpx;
  /* 你也可以直接设置固定高度，例如：height: 500rpx; 但建议用 padding 撑开更灵活 */
  margin-bottom: 0;
}
.hero-content {
  display: flex;
  /* 【位置调节】justify-content 控制整体对齐方式：
     - flex-start: 靠左对齐 (当前)
     - center: 居中对齐
     - space-between: 两端对齐
  */
  justify-content: flex-start; 
  align-items: center;
  /* 【位置调节】padding 左右内边距，增加左边距可让内容整体右移 */
  padding: 0 80rpx; 
}
.hero-left {
  flex: 0 0 auto; 
  /* 【位置调节】margin-right 控制文字与轮播图之间的间距，数值越大轮播图越靠右 */
  margin-right: 820rpx; 
  text-align: left;
}
.slogan-main {
  font-size: 96rpx;
  font-weight: 900;
  color: #FFFFFF;
  margin-bottom: 30rpx;
  letter-spacing: 8rpx;
  line-height: 1.1;
}
.slogan-sub {
  font-size: 36rpx;
  color: #999999;
  margin-bottom: 50rpx;
  letter-spacing: 2rpx;
}
.slogan-tags {
  display: flex;
  align-items: center;
}
.tag-item {
  font-size: 26rpx;
  color: #888888;
}
.tag-divider {
  color: #444444;
  margin: 0 15rpx;
}
.hero-right {
  /* 【尺寸调节】控制轮播图的宽度 */
  width: 1200rpx; 
  /* 【尺寸调节】控制轮播图的高度 */
  height: 600rpx; 
  flex-shrink: 0;
  position: relative;
}
.hero-swiper {
  width: 100%;
  height: 100%;
  border-radius: 4rpx;
  overflow: hidden;
  /* 移除阴影或设为透明，防止出现“盒子套盒子”的边界感 */
  box-shadow: none; 
  /* 确保背景色与大背景一致，消除色差 */
  background-color: transparent; 
}
.swiper-item-box {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);
}
.swiper-item-box.active .hero-banner-img {
  transform: scale(1.05);
}
.hero-banner-img {
  width: 100%;
  height: 100%;
  transition: transform 1.2s ease;
  /* 如果 mode="aspectFit" 还是展示不全，可尝试改为 mode="widthFix" 配合以下样式 */
  /* object-fit: contain; */
}

/* 自定义指示点 */
.custom-indicator {
  position: absolute;
  bottom: 30rpx;
  right: 30rpx;
  display: flex;
  gap: 12rpx;
  z-index: 10;
}
.indicator-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}
.indicator-dot.active {
  width: 40rpx;
  border-radius: 6rpx;
  background-color: #FFFFFF;
}

/* 搜索栏样式 */
.search-bar-container {
  padding: 20rpx 30rpx;
  background-color: #FFFFFF;
  position: sticky;
  top: calc(var(--status-bar-height) + 120rpx);
  z-index: 100;
  transition: all 0.3s ease;
}
.search-bar {
  display: flex;
  align-items: center;
  height: 80rpx;
  background-color: #F5F5F5;
  border-radius: 4rpx;
  padding: 0 30rpx;
  transition: all 0.3s ease;
  border: 1rpx solid transparent;
}
.search-bar:active {
  background-color: #EEEEEE;
  border-color: #DDDDDD;
}
.search-keyword-swiper {
  flex: 1;
  height: 80rpx;
}
.keyword-item {
  display: flex;
  align-items: center;
}
.search-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 20rpx;
}
.search-placeholder {
  font-size: 28rpx;
  color: #999999;
  /* 确保文字垂直居中 */
  line-height: 80rpx;
}

/* 文字导航样式 */
.category-nav {
  white-space: nowrap;
  margin-bottom: 20rpx;
  height: 80rpx;
  background-color: #FFFFFF;
  position: relative;
}
.nav-item {
  display: inline-block;
  padding: 0 30rpx;
  font-size: 30rpx;
  color: #666666;
  position: relative;
  line-height: 80rpx;
  transition: all 0.3s ease;
}
.nav-item:active {
  opacity: 0.7;
  transform: scale(0.95);
}
.nav-item.active {
  color: #000000;
  font-weight: bold;
  font-size: 32rpx;
}
.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 30rpx;
  right: 30rpx;
  height: 6rpx;
  background-color: #000000;
  border-radius: 3rpx;
  transition: all 0.3s ease;
}

/* 轮播图样式已移除，统一使用 hero-swiper */

/* 公告样式 (黑白极简) */
.notice-container {
  display: flex;
  align-items: center;
  height: 80rpx;
  background-color: #121212;
  padding: 0 30rpx;
  margin-bottom: 40rpx;
}
.notice-label {
  font-size: 22rpx;
  color: #FFFFFF;
  margin-right: 20rpx;
  font-weight: bold;
  border-right: 1rpx solid rgba(255,255,255,0.3);
  padding-right: 20rpx;
}
.notice-content {
  font-size: 24rpx;
  color: #FFFFFF;
  flex: 1;
}

/* 列表过渡容器 */
.list-transition-wrapper {
  min-height: 600rpx;
  background-color: #f8f8f8;
  border-radius: 16rpx;
  position: relative;
  transition: all 0.3s ease;
}

/* 热门产品样式 */
.hot-product-container {
  padding: 20rpx;
  background-color: #f8f8f8;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  width: 100%;
}

/* PC端展示 5 列 */
@media (min-width: 1024px) {
  .product-list {
    grid-template-columns: repeat(5, 1fr);
    gap: 24rpx;
  }
}

.product-item {
  width: 100%;
  background-color: #FFFFFF;
  border-radius: 12rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

/* 加载中状态样式 - 也要对应网格布局 */
.list-loading {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  width: 100%;
}

@media (min-width: 1024px) {
  .list-loading {
    grid-template-columns: repeat(5, 1fr);
  }
}

.loading-item {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.loading-img {
  width: 100%;
  height: 340rpx;
}

.loading-info {
  padding: 20rpx;
}

.loading-name {
  height: 32rpx;
  width: 80%;
  margin-bottom: 15rpx;
  border-radius: 4rpx;
}
.loading-price {
  height: 40rpx;
  width: 40%;
  border-radius: 4rpx;
}

/* 空状态样式 */
.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-img {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 20rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333333;
  margin-bottom: 24rpx;
  position: relative;
  padding-left: 20rpx;
  display: flex;
  align-items: center;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  width: 8rpx;
  height: 32rpx;
  background-color: #000;
  border-radius: 4rpx;
}

/* 渐入动画 */
.fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

/* 骨架屏动画 */
.skeleton {
  background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 37%, #f2f2f2 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
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
  margin-left: 4rpx;
  border-radius: 2rpx;
  vertical-align: middle;
}

/* 猜你喜欢样式 */
.guess-like-container {
  padding: 20rpx;
  background-color: #f8f8f8;
  margin-bottom: 40rpx;
}
.loading-status {
  text-align: center;
  padding: 40rpx 0;
  font-size: 24rpx;
  color: #CCCCCC;
}

/* 回到顶部按钮样式 (得物风：极简方框) */
.back-top {
  position: fixed;
  right: 40rpx;
  bottom: 140rpx;
  width: 90rpx;
  height: 90rpx;
  background-color: #FFFFFF;
  border-radius: 4rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  z-index: 99;
  opacity: 0;
  transform: translateY(20rpx);
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  pointer-events: none;
  border: 1rpx solid #000000;
}
.back-top.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
.back-top-icon {
  font-size: 36rpx;
  color: #000000;
  line-height: 1;
  font-weight: bold;
}
.back-top-text {
  font-size: 18rpx;
  color: #000000;
  margin-top: 4rpx;
  font-weight: bold;
}
</style>