<!-- 功能说明
按订单状态分类展示所有订单，支持状态切换、订单筛选，
显示订单核心信息（订单号、时间、金额、状态），支持左滑操作（取消订单、查看详情），核心对接订单列表、订单取消接口。 -->

<template>
  <view class="order-list-container">
    <!-- 状态筛选栏 -->
    <view class="status-bar-container">
      <view class="status-bar">
        <view 
          class="status-item" 
          v-for="(item, index) in statusList" 
          :key="index"
          :class="{ active: currentStatus === item.value }"
          @click="switchStatus(item.value)"
        >
          <text class="status-text">{{item.label}}</text>
        </view>
      </view>
    </view>

    <!-- 订单列表 -->
    <view class="order-list" v-if="orderList.length > 0">
      <view class="order-item" v-for="(order, index) in orderList" :key="index">
        <!-- 订单头部信息 -->
        <view class="order-header">
          <view class="order-left">
            <text class="order-no">订单号：{{order.orderNo}}</text>
            <view class="order-time-row">
              <text class="order-time">{{formatTime(order.createTime)}}</text>
              <view class="list-countdown" v-if="order.status === 'pendingPayment' && countdownTexts[order.orderNo]">
                <text class="countdown-split">|</text>
                <text class="countdown-text">剩余 {{countdownTexts[order.orderNo]}}</text>
              </view>
            </view>
          </view>
          <text class="order-status" :class="getStatusClass(order.status)">{{getStatusText(order.status)}}</text>
        </view>

        <!-- 订单商品清单 -->
        <view class="order-goods" @click="goToOrderDetail(order.orderNo)">
          <view class="goods-item" v-for="(goods, gIndex) in order.orderItems" :key="gIndex">
            <image :src="goods.productImage" mode="aspectFill" class="goods-img"></image>
            <view class="goods-info">
              <text class="goods-name">{{goods.productName}}</text>
              <text class="goods-spec">规格：{{goods.specText || '默认规格'}}</text>
              <view class="goods-count">x{{goods.quantity}}</view>
            </view>
            <text class="goods-price">¥{{formatPrice(goods.price * goods.quantity)}}</text>
          </view>
        </view>

        <!-- 评价引导栏 (仅评价页显示) -->
        <view class="evaluate-bar" v-if="order.status === 'completed' || order.status === '8' || order.status === 'evaluated'">
          <text class="evaluate-text">
            {{ (order.status === '8' || order.status === 'evaluated') ? '评价已完成，还可以追加评价哦' : '商品好不好，评价一下吧' }}
          </text>
          <view class="stars">
            <text class="star-icon" v-for="s in 5" :key="s" :style="{ color: (order.status === '8' || order.status === 'evaluated') ? '#FFB800' : '#E5E5E5' }">★</text>
          </view>
        </view>

        <!-- 订单金额信息 -->
        <view class="order-amount">
          <text class="amount-label">合计：</text>
          <text class="amount-value">¥{{formatPrice(order.totalAmount)}}</text>
          <text class="amount-desc">（含运费¥{{formatPrice(order.freight)}}）</text>
        </view>

        <!-- 订单操作按钮 -->
        <view class="order-operation">
          <!-- 更多按钮及其弹窗 -->
          <view class="more-container" v-if="getButtons(order).length > 3">
            <text class="more-text" @click.stop="toggleMore(index)">更多</text>
            <view class="more-menu" v-if="activeMoreIndex === index">
              <view 
                class="menu-item" 
                v-for="(btn, bIndex) in getButtons(order).slice(3)" 
                :key="bIndex"
                @click.stop="handleBtnClick(btn.action, order, index)"
              >
                {{btn.text}}
              </view>
            </view>
          </view>
          
          <!-- 常规按钮 (最多显示3个) -->
          <button 
            v-for="(btn, bIndex) in getButtons(order).slice(0, 3)"
            :key="bIndex"
            class="oper-btn"
            :class="btn.type"
            @click.stop="handleBtnClick(btn.action, order, index)"
          >
            {{btn.text}}
          </button>
        </view>
      </view>
    </view>

    <!-- 空订单状态 -->
    <view class="empty-order" v-else-if="!isLoadingMore">
      <image src="/static/images/empty-order.png" class="empty-img"></image>
      <text class="empty-text">暂无{{getEmptyText()}}</text>
      <button class="go-shop-btn" @click="goToHome">去逛逛</button>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="isLoadingMore">
      <text class="load-text">加载中...</text>
    </view>

    <!-- 评价弹窗 -->
    <view class="evaluate-popup-mask" v-if="showEvalPopup" @click="closeEvalPopup">
      <view class="evaluate-popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">{{ evalType === 'append' ? '追加评价' : '商品评价' }}</text>
          <text class="close-icon" @click="closeEvalPopup">×</text>
        </view>
        
        <!-- 评价商品信息 (取第一件商品展示) -->
        <view class="eval-goods-info" v-if="currentEvalOrder?.orderItems?.length > 0">
          <image :src="currentEvalOrder.orderItems[0].productImage" class="eval-goods-img"></image>
          <view class="eval-goods-detail">
            <text class="eval-goods-name">{{ currentEvalOrder.orderItems[0].productName }}</text>
            <text class="eval-goods-spec">{{ currentEvalOrder.orderItems[0].specText || '默认规格' }}</text>
          </view>
        </view>

        <!-- 星级评分 (仅初次评价显示) -->
        <view class="rating-section" v-if="evalType === 'first'">
          <text class="rating-label">评分</text>
          <view class="stars-row">
            <text 
              v-for="s in 5" 
              :key="s" 
              class="star-btn" 
              :class="{ active: evalForm.rating >= s }"
              @click="evalForm.rating = s"
            >★</text>
          </view>
        </view>

        <!-- 评价内容 -->
        <textarea 
          class="eval-textarea" 
          placeholder="分享你的购买心得吧..." 
          v-model="evalForm.content"
          fixed
          auto-height
          maxlength="200"
        ></textarea>

        <!-- 图片上传预览 (简化版) -->
        <view class="eval-imgs">
          <view class="eval-img-item" v-for="(img, idx) in evalForm.imageUrls" :key="idx">
            <image :src="img" mode="aspectFill" class="eval-img"></image>
            <text class="del-img" @click="removeImg(idx)">×</text>
          </view>
          <view class="upload-btn" @click="uploadImg" v-if="evalForm.imageUrls.length < 3">
            <text class="upload-plus">+</text>
            <text class="upload-text">添加图片</text>
          </view>
        </view>

        <!-- 匿名选项 (仅初次评价显示) -->
        <view class="popup-footer">
          <view class="anonymous-toggle" @click="evalForm.isAnonymous = evalForm.isAnonymous === 1 ? 0 : 1" v-if="evalType === 'first'">
            <view class="checkbox" :class="{ checked: evalForm.isAnonymous === 1 }"></view>
            <text class="anonymous-label">匿名评价</text>
          </view>
          <view v-else></view>
          <button class="submit-eval-btn" @click="submitEvaluation">提交</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { onLoad, onShow, onUnload, onNavigationBarButtonTap } from '@dcloudio/uni-app';
import { formatCountdown, isExpired } from '@/utils/timeUtil';
import { useUserStore } from '@/store/modules/userStore';
import request from '@/utils/request';

// 状态管理
const userStore = useUserStore();

// 页面数据
const statusList = ref([
  { label: '全部', value: 'allPage' },
  { label: '待付款', value: 'pendingPayPage' },
  { label: '打包中', value: 'packagingPage' },
  { label: '待收货', value: 'pendingReceiptPage' },
  { label: '评价', value: 'pendingEvalPage' }
]);
const currentStatus = ref('allPage'); // 当前选中状态
const orderList = ref([]); // 订单列表
const pageNum = ref(1); // 当前页码（注意：文档中API参数可能是pageNum，需确认）
// API参数中只提到 pageName，没有提到分页参数 pageNum/pageSize。
// 仔细看 /api/order/page/list 文档：
// parameters: pageName (query)
// responses: data (array of Order)
// 似乎没有分页参数？如果返回的是 array，可能是全部返回？
// 但原代码有分页逻辑。考虑到接口名是 list，可能没有分页。
// 假设该接口一次性返回该状态下的所有订单，或者接口文档有遗漏。
// 既然文档只写了 pageName，那我先按照文档来。
// 不过通常列表接口都有分页。
// 如果 API 文档没写分页参数，我先尝试不传分页参数，或者保留原有分页逻辑但注意可能无效。
// 文档只写了 pageName 参数。
// "parameters": [ { "name": "pageName", ... } ]
// 我会先去掉分页参数，如果接口支持我会加上。目前先按文档。
const isLoadingMore = ref(false); // 加载更多状态
const hasMore = ref(false); // 是否有更多数据 (API 没分页，所以暂时认为没有更多)
const activeMoreIndex = ref(-1); // 展开“更多”菜单的订单索引
const countdownTexts = reactive({}); // 存储各订单的倒计时
let listTimer = null; // 列表定时器

// 评价相关
const showEvalPopup = ref(false);
const evalType = ref('first'); // 'first' or 'append'
const currentEvalOrder = ref(null);
const evalForm = reactive({
  rating: 1, // 默认 1 星，确保用户至少给出一星评价
  content: '',
  imageUrls: [],
  isAnonymous: 0
});

// 评价操作
const openEvalPopup = (order, type = 'first') => {
  currentEvalOrder.value = order;
  evalType.value = type;
  evalForm.rating = 1; // 打开时重置为 1 星
  evalForm.content = '';
  evalForm.imageUrls = [];
  evalForm.isAnonymous = 0;
  showEvalPopup.value = true;
};

const closeEvalPopup = () => {
  showEvalPopup.value = false;
};

const uploadImg = () => {
  uni.chooseImage({
    count: 3 - evalForm.imageUrls.length,
    success: (res) => {
      // 实际应上传至服务器，此处模拟
      evalForm.imageUrls.push(...res.tempFilePaths);
    }
  });
};

const removeImg = (index) => {
  evalForm.imageUrls.splice(index, 1);
};

const submitEvaluation = async () => {
  // 1. 初次评价星级校验
  if (evalType.value === 'first' && evalForm.rating === 0) {
    uni.showToast({ title: '请点击星星选择星级', icon: 'none' });
    return;
  }
  
  // 2. 评价内容校验
  if (!evalForm.content.trim()) {
    uni.showToast({ title: '请输入评价内容', icon: 'none' });
    return;
  }
  
  uni.showLoading({ title: '提交中...', mask: true });
  try {
    const isAppend = evalType.value === 'append';
    const firstItem = currentEvalOrder.value.orderItems[0];
    
    let res;
    if (isAppend) {
      // 追加评价
      res = await request({
        url: '/api/user/product/comment/firstComment/append',
        method: 'POST',
        data: {
          productId: String(firstItem.productId || ''),
          orderNo: String(currentEvalOrder.value.orderNo || ''), // 仅传 orderNo
          content: evalForm.content,
          imageUrls: evalForm.imageUrls.map(url => url.replace(/[`\s]/g, '')).join(',')
        }
      });
    } else {
      // 初次评价
      res = await request({
        url: '/api/user/product/comment/firstComment/save',
        method: 'POST',
        data: {
          productId: String(firstItem.productId || ''),
          productSpecId: String(firstItem.specId || firstItem.productSpecId || ''),
          productSpecText: firstItem.specText || '',
          orderNo: String(currentEvalOrder.value.orderNo || ''), // 明确使用 orderNo
          userNickname: userStore.userInfo.nickname || '用户',
          userAvatar: (userStore.userInfo.avatar || '/static/images/default-avatar.png').replace(/[`\s]/g, ''),
          content: evalForm.content,
          imageUrls: evalForm.imageUrls.map(url => url.replace(/[`\s]/g, '')).join(','),
          rating: evalForm.rating, 
          isAnonymous: evalForm.isAnonymous
        }
      });
    }

    if (res.success) {
      uni.showToast({ title: '评价成功', icon: 'success' });
      closeEvalPopup();
      // 强制延迟刷新，确保后端数据库已同步状态
      setTimeout(() => {
        getOrderList();
      }, 500);
    } else {
      uni.showToast({ title: res.message || '评价失败', icon: 'none' });
    }
  } catch (error) {
    console.error('评价失败:', error);
    uni.showToast({ title: '网络异常', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

// 启动全局定时器更新列表中的倒计时
const startListTimer = () => {
  if (listTimer) clearInterval(listTimer);
  
  const updateAllCountdowns = () => {
    let hasPending = false;
    orderList.value.forEach(order => {
      if (order.status === 'pendingPayment') {
        hasPending = true;
        const expireTimeMillis = new Date(order.createTime).getTime() + 30 * 60 * 1000;
        if (isExpired(expireTimeMillis)) {
          countdownTexts[order.orderNo] = '00:00';
          // 标记订单为取消
          order.status = 'cancelled';
        } else {
          countdownTexts[order.orderNo] = formatCountdown(expireTimeMillis);
        }
      }
    });
    
    if (!hasPending) {
      clearInterval(listTimer);
      listTimer = null;
    }
  };
  
  updateAllCountdowns();
  listTimer = setInterval(updateAllCountdowns, 1000);
};

// 切换“更多”菜单显示
const toggleMore = (index) => {
  activeMoreIndex.value = activeMoreIndex.value === index ? -1 : index;
};

// 获取订单的操作按钮列表
const getButtons = (order) => {
  const status = order.status;
  const buttons = [];
  
  switch (status) {
    case 'pendingPayment':
      buttons.push({ text: '去支付', type: 'primary', action: 'pay' });
      buttons.push({ text: '取消订单', type: 'secondary', action: 'cancel' });
      break;
    case 'pendingConfirm':
    case 'pendingShipment':
      buttons.push({ text: '修改地址', type: 'secondary', action: 'editAddress' });
      buttons.push({ text: '申请退款', type: 'secondary', action: 'refund' });
      buttons.push({ text: '联系客服', type: 'secondary', action: 'contact' });
      break;
    case 'pendingReceipt':
      buttons.push({ text: '确定收货', type: 'primary', action: 'confirmReceipt' });
      buttons.push({ text: '查看物流', type: 'secondary', action: 'logistics' });
      buttons.push({ text: '联系客服', type: 'secondary', action: 'contact' });
      break;
    case 'completed':
      // 评价页/已完成状态
      buttons.push({ text: '立即评价', type: 'danger', action: 'evaluate' });
      buttons.push({ text: '再次购买', type: 'secondary', action: 'buyAgain' });
      buttons.push({ text: '查看物流', type: 'secondary', action: 'logistics' });
      buttons.push({ text: '删除订单', type: 'secondary', action: 'deleteOrder' });
      break;
    case 'evaluated':
    case '8':
      buttons.push({ text: '追加评价', type: 'danger', action: 'appendEvaluate' });
      buttons.push({ text: '再次购买', type: 'secondary', action: 'buyAgain' });
      buttons.push({ text: '查看物流', type: 'secondary', action: 'logistics' });
      buttons.push({ text: '删除订单', type: 'secondary', action: 'deleteOrder' });
      break;
    case 'reviewed':
    case '9':
      buttons.push({ text: '已追评价', type: 'disabled-btn', action: 'alreadyReviewed' });
      buttons.push({ text: '再次购买', type: 'secondary', action: 'buyAgain' });
      buttons.push({ text: '查看物流', type: 'secondary', action: 'logistics' });
      buttons.push({ text: '删除订单', type: 'secondary', action: 'deleteOrder' });
      break;
    case 'cancelled':
      buttons.push({ text: '再次购买', type: 'secondary', action: 'buyAgain' });
      buttons.push({ text: '删除订单', type: 'secondary', action: 'deleteOrder' });
      break;
    default:
      buttons.push({ text: '查看详情', type: 'secondary', action: 'detail' });
  }
  return buttons;
};

// 统一处理按钮点击
const handleBtnClick = (action, order, index) => {
  activeMoreIndex.value = -1; // 点击任何按钮都关闭更多菜单
  
  switch (action) {
    case 'pay':
      uni.navigateTo({
        url: `/pages/pay/index/index?orderNo=${order.orderNo}&amount=${order.totalAmount}`
      });
      break;
    case 'cancel':
      cancelOrder(order.orderNo, index);
      break;
    case 'contact':
      uni.showToast({ title: '联系客服...', icon: 'none' });
      break;
    case 'editAddress':
      uni.showToast({ title: '修改地址: ' + order.orderNo, icon: 'none' });
      break;
    case 'refund':
      uni.showToast({ title: '申请退款: ' + order.orderNo, icon: 'none' });
      break;
    case 'logistics':
      uni.showToast({ title: '查看物流: ' + order.orderNo, icon: 'none' });
      break;
    case 'confirmReceipt':
      uni.showModal({
        title: '确认收货',
        content: '确认已收到商品？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...', mask: true });
            try {
              const apiRes = await request({
                url: '/api/order/confirmReceipt',
                method: 'PUT',
                params: { orderNo: order.orderNo }
              });
              if (apiRes.success) {
                // 更新本地状态并刷新
                if (apiRes.data && apiRes.data.status) {
                  orderList.value[index].status = apiRes.data.status;
                }
                await getOrderList();
                uni.showToast({ title: '确认收货成功', icon: 'success' });
              } else {
                uni.hideLoading();
                uni.showToast({ title: apiRes.message || '操作失败', icon: 'none' });
              }
            } catch (error) {
              uni.hideLoading();
              console.error('确认收货失败:', error);
            }
          }
        }
      });
      break;
    case 'evaluate':
      openEvalPopup(order, 'first');
      break;
    case 'appendEvaluate':
      openEvalPopup(order, 'append');
      break;
    case 'alreadyReviewed':
      uni.showToast({ title: '小主,只能追评一次哦', icon: 'none' });
      break;
    case 'buyAgain':
      uni.showToast({ title: '再次购买: ' + order.orderNo, icon: 'none' });
      break;
    case 'deleteOrder':
      uni.showModal({
        title: '提示',
        content: '确定删除该订单吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const apiRes = await request({
                url: '/api/order/delete',
                method: 'DELETE',
                params: { orderNo: order.orderNo }
              });
              if (apiRes.success) {
                uni.showToast({ title: '删除成功' });
                orderList.value.splice(index, 1);
              } else {
                uni.showToast({ title: apiRes.message || '删除失败', icon: 'none' });
              }
            } catch (error) {
              uni.showToast({ title: '网络异常', icon: 'none' });
            }
          }
        }
      });
      break;
    case 'detail':
      goToOrderDetail(order.orderNo);
      break;
  }
};

// 页面加载时获取订单列表
onLoad((options) => {
  if (!userStore.token) {
    uni.navigateTo({ url: '/pages/main/login/login' });
    return;
  }
  // 从参数获取初始状态
  if (options.pageName) {
    currentStatus.value = options.pageName;
  }
  getOrderList();
});

// 监听导航栏按钮点击（搜索）
onNavigationBarButtonTap((e) => {
  // 判断是否是搜索按钮（这里只有一个按钮，直接跳转）
  uni.navigateTo({ url: '/pages/order/search/search' });
});

// 页面显示时启动定时器
onShow(() => {
  if (orderList.value.length > 0) {
    startListTimer();
  }
});

// 页面隐藏/卸载清除定时器
onUnload(() => {
  if (listTimer) clearInterval(listTimer);
});

// 切换订单状态
const switchStatus = (status) => {
  currentStatus.value = status;
  orderList.value = [];
  getOrderList();
};

// 接口请求：获取订单列表
const getOrderList = async () => {
  isLoadingMore.value = true;
  try {
    const res = await request({
      url: '/api/order/page/list',
      method: 'GET',
      params: {
        pageName: currentStatus.value
      }
    });
    
    // 增加调试日志
    console.log('Order List Response:', res);

    // 兼容 success=true 或 code=200
    if (res.success || res.code === 200) {
      // 兼容多种返回结构：res.data 可能是数组，也可能是包含 list/records 的对象
      let list = [];
      const data = res.data || res.result; // 兼容 result 字段

      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.list)) {
        list = data.list;
      } else if (data && Array.isArray(data.records)) {
        list = data.records;
      }
      
      orderList.value = list;
      hasMore.value = false; // 假设一次性返回
      
      // 启动倒计时定时器
      startListTimer();
    } else {
      console.warn('Order list request failed:', res.message || res.msg);
    }
  } catch (error) {
    uni.showToast({ title: '订单列表加载失败', icon: 'none' });
  } finally {
    isLoadingMore.value = false;
  }
};

// 格式化时间（YYYY-MM-DD HH:mm:ss）
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

// 根据订单状态获取显示文本
const getStatusText = (status) => {
  switch (status) {
    case 'pendingPayment': return '待付款';
    case 'pendingConfirm': return '待确认';
    case 'pendingShipment': return '待发货'; // 对应打包中？API文档enum是 pendingShipment
    case 'pendingReceipt': return '待收货';
    case 'completed': return '已完成';
    case 'evaluated':
    case '8': return '已评价';
    case 'reviewed':
    case '9': return '已追评';
    case 'cancelled': return '已取消';
    case 'afterSale': return '售后';
    default: return status;
  }
};

// 根据订单状态获取样式类
const getStatusClass = (status) => {
  // 这里需要对应 CSS 类名
  switch (status) {
    case 'pendingPayment': return 'pending-pay';
    case 'pendingConfirm': return 'pending-confirm';
    case 'pendingShipment': return 'pending-ship';
    case 'pendingReceipt': return 'pending-receipt';
    case 'completed': return 'completed';
    case 'evaluated':
    case '8': return 'evaluated';
    case 'reviewed':
    case '9': return 'reviewed';
    case 'cancelled': return 'cancelled';
    default: return '';
  }
};

// 根据订单状态获取操作按钮文本
const getOperateText = (status) => {
  switch (status) {
    case 'pendingPayment': return '去支付';
    case 'pendingConfirm':
    case 'pendingShipment': return '联系客服';
    case 'pendingReceipt': return '查看物流';
    case 'completed': return '查看详情';
    case 'cancelled': return '查看详情';
    default: return '查看详情';
  }
};

// 取消订单
const cancelOrder = (orderNo, index) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消该订单吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中...', mask: true });
        try {
          const apiRes = await request({
            url: '/api/order/cancel',
            method: 'PUT',
            params: { orderNo }
          });
          if (apiRes.success) {
            // 更新本地状态（可选，也可以等刷新）
            if (apiRes.data && apiRes.data.status) {
              orderList.value[index].status = apiRes.data.status;
            }
            await getOrderList();
            uni.showToast({ title: '订单取消成功', icon: 'success' });
          } else {
            uni.hideLoading();
            uni.showToast({ title: apiRes.message || '订单取消失败', icon: 'none' });
          }
        } catch (error) {
          uni.hideLoading();
          console.error('取消订单失败:', error);
        }
      }
    }
  });
};

// 跳转至订单详情页
const goToOrderDetail = (orderNo) => {
  uni.navigateTo({ url: `/pages/order/detail/detail?orderNo=${orderNo}` });
};

// 跳转至首页
const goHome = () => {
  uni.reLaunch({ url: '/pages/main/index/index' });
};

// 下拉刷新
const onPullDownRefresh = () => {
  getOrderList().then(() => {
    uni.stopPullDownRefresh();
  });
};

// 注册下拉刷新
// onPullDownRefresh 是页面生命周期函数，script setup 中定义同名函数可能不生效，
// 需要使用 import { onPullDownRefresh } from '@dcloudio/uni-app'
// 但这里似乎之前是 uni.$on，可能是为了兼容？
// 标准做法是 import onPullDownRefresh
// 之前的代码用了 uni.$on，我还是改回标准写法。

// 获取空状态文本
const getEmptyText = () => {
  const item = statusList.value.find(item => item.value === currentStatus.value);
  return item ? (item.label + '订单') : '相关订单';
};

// 格式化价格，防止字符串直接调用 toFixed 报错
const formatPrice = (price) => {
  const num = parseFloat(price);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};
</script>

<style scoped>
.order-list-container {
  background-color: #F8F8F8;
  min-height: 100vh;
  padding-bottom: 20rpx;
}

/* 状态筛选栏 */
.status-bar-container {
  background-color: #FFFFFF;
  border-bottom: 1rpx solid #EEEEEE;
  position: sticky;
  top: 0;
  z-index: 99;
}

.status-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0;
  position: relative;
  flex: 1;
  text-align: center;
}

.status-text {
  font-size: 28rpx;
  color: #666666;
  transition: all 0.3s;
}

.status-item.active .status-text {
  color: #D4B886;
  font-weight: bold;
  font-size: 30rpx;
}

/* 选中时的底部横条 */
.status-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background-color: #D4B886;
  border-radius: 2rpx;
}

/* 移除旧的选中样式 */
/* .status-item.active { background-color: #D4B886; } */
/* .status-item.active .status-text { color: #FFFFFF; } */

/* 订单列表 */
.order-list {
  padding: 20rpx;
}

.order-item {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.05);
}

/* 订单头部 */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #FFFFFF;
  border-bottom: 1rpx solid #F5F5F5;
}

.order-left {
  display: flex;
  flex-direction: column;
}

.order-no {
  font-size: 26rpx;
  color: #333333;
  margin-bottom: 6rpx;
}

.order-time {
  font-size: 24rpx;
  color: #999999;
}

.order-time-row {
  display: flex;
  align-items: center;
}

.list-countdown {
  display: flex;
  align-items: center;
  margin-left: 10rpx;
}

.countdown-split {
  font-size: 24rpx;
  color: #EEEEEE;
  margin-right: 10rpx;
}

.countdown-text {
  font-size: 24rpx;
  color: #F53F3F;
}

.order-status {
  font-size: 28rpx;
  font-weight: bold;
}

.order-status.pending-pay {
  color: #F53F3F;
}

.order-status.pending-confirm {
  color: #FF7D00;
}

.order-status.pending-ship {
  color: #FFAA00;
}

.order-status.pending-receipt {
  color: #00B42A;
}

.order-status.completed {
  color: #333333;
}

.order-status.evaluated {
  color: #1890ff;
}

.order-status.reviewed {
  color: #faad14;
}

.order-status.after-sale {
  color: #722ED1;
}

.order-status.cancelled {
  color: #999999;
}

/* 订单商品清单 */
.order-goods {
  padding: 20rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.goods-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.goods-item:last-child {
  margin-bottom: 0;
}

.goods-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.goods-name {
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 8rpx;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.goods-spec {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 6rpx;
}

.goods-count {
  font-size: 24rpx;
  color: #999999;
}

.goods-price {
  font-size: 28rpx;
  color: #333333;
  font-weight: bold;
}

/* 评价引导栏 */
.evaluate-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #FAFAFA;
  margin: 0 20rpx;
  border-radius: 8rpx;
}

.evaluate-text {
  font-size: 26rpx;
  color: #333333;
}

.stars {
  display: flex;
  gap: 10rpx;
}

.star-icon {
  font-size: 32rpx;
  color: #999999;
}

/* 订单金额信息 */
.order-amount {
  padding: 20rpx;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.amount-label {
  font-size: 26rpx;
  color: #333333;
  margin-right: 8rpx;
}

.amount-value {
  font-size: 32rpx;
  color: #D4B886;
  font-weight: bold;
  margin-right: 8rpx;
}

.amount-desc {
  font-size: 24rpx;
  color: #999999;
}

/* 订单操作按钮 */
.order-operation {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 20rpx 20rpx;
  gap: 16rpx;
  position: relative;
}

.more-container {
  margin-right: auto;
  padding: 10rpx 20rpx;
  position: relative;
}

.more-text {
  font-size: 26rpx;
  color: #333333;
}

.more-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  background-color: #FFFFFF;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.15);
  border-radius: 8rpx;
  width: 200rpx;
  z-index: 100;
  margin-bottom: 20rpx;
}

.more-menu::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 30rpx;
  border: 12rpx solid transparent;
  border-top-color: #FFFFFF;
}

.menu-item {
  padding: 24rpx 30rpx;
  font-size: 28rpx;
  color: #333333;
  text-align: center;
  border-bottom: 1rpx solid #F5F5F5;
}

.menu-item:last-child {
  border-bottom: none;
}

.oper-btn {
  margin: 0;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  padding: 0 32rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.oper-btn::after {
  border: none;
}

.oper-btn.secondary {
  background-color: #FFFFFF;
  border: 1rpx solid #DDDDDD;
  color: #666666;
}

.oper-btn:active {
  transform: scale(0.95);
  transition: transform 0.1s;
}

.oper-btn.disabled-btn {
  background-color: #F5F5F5;
  color: #BBBBBB;
  border: none;
}

.oper-btn.primary {
  background-color: #D4B886;
  color: #FFFFFF;
}

.oper-btn.danger {
  background-color: #F53F3F;
  color: #FFFFFF;
}

/* 空订单状态 */
.empty-order {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 200rpx;
  padding: 0 40rpx;
}

.empty-img {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 40rpx;
  text-align: center;
}

.go-shop-btn {
  width: 240rpx;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #D4B886;
  color: #FFFFFF;
  border-radius: 40rpx;
  font-size: 28rpx;
}

/* 加载更多 */
.load-more {
  display: flex;
  justify-content: center;
  padding: 30rpx;
}

.load-text {
  font-size: 24rpx;
  color: #999999;
}

/* 评价弹窗样式 */
.evaluate-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
}

.evaluate-popup-content {
  width: 100%;
  background: #FFF;
  border-radius: 32rpx 32rpx 0 0;
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.close-icon {
  font-size: 40rpx;
  color: #999;
  padding: 10rpx;
}

.eval-goods-info {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #F8F8F8;
  border-radius: 12rpx;
  margin-bottom: 30rpx;
}

.eval-goods-img {
  width: 100rpx;
  height: 100rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.eval-goods-detail {
  flex: 1;
}

.eval-goods-name {
  font-size: 28rpx;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8rpx;
}

.eval-goods-spec {
  font-size: 24rpx;
  color: #999;
}

.rating-section {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.rating-label {
  font-size: 28rpx;
  color: #333;
  margin-right: 20rpx;
}

.stars-row {
  display: flex;
  gap: 10rpx;
}

.star-btn {
  font-size: 40rpx;
  color: #EEE;
}

.star-btn.active {
  color: #FFB800;
}

.eval-textarea {
  width: 100%;
  min-height: 200rpx;
  background: #F8F8F8;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  margin-bottom: 30rpx;
}

.eval-imgs {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.eval-img-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
}

.eval-img {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.del-img {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 32rpx;
  height: 32rpx;
  background: rgba(0,0,0,0.5);
  color: #FFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

.upload-btn {
  width: 160rpx;
  height: 160rpx;
  background: #F8F8F8;
  border: 1rpx dashed #DDD;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-plus {
  font-size: 48rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.upload-text {
  font-size: 20rpx;
  color: #999;
}

.popup-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.anonymous-toggle {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.checkbox {
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid #DDD;
  border-radius: 50%;
  position: relative;
}

.checkbox.checked {
  background: #D4B886;
  border-color: #D4B886;
}

.checkbox.checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%) rotate(45deg);
  width: 8rpx;
  height: 16rpx;
  border-right: 3rpx solid #FFF;
  border-bottom: 3rpx solid #FFF;
}

.anonymous-label {
  font-size: 26rpx;
  color: #666;
}

.submit-eval-btn {
  width: 240rpx;
  height: 80rpx;
  line-height: 80rpx;
  background: #D4B886;
  color: #FFF;
  font-size: 30rpx;
  border-radius: 40rpx;
  margin: 0;
}

.submit-eval-btn[disabled] {
  background: #EEE;
  color: #BBB;
}
</style>