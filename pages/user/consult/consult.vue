<template>
  <view class="consult-container">
    <!-- 1. 会话列表模式 -->
    <view v-if="viewMode === 'LIST'" class="session-list-view">
      <scroll-view class="session-list" scroll-y @refresherrefresh="onRefresh" :refresher-enabled="true" :refresher-triggered="isRefreshing">
        <view v-if="chatStore.sessions.length === 0" class="empty-state">
          <image src="/static/images/icon-comment.png" class="empty-icon"></image>
          <text class="empty-text">暂无咨询记录</text>
          <text class="empty-tip">您可以从商品详情页点击“咨询”开始对话</text>
        </view>
        <view 
          class="session-item" 
          v-for="session in chatStore.sessions" 
          :key="session.contactId"
          @click="enterChat(session)"
        >
          <view class="avatar-wrapper">
            <image :src="session.contactAvatar || '/static/images/icon-user.png'" class="session-avatar" mode="aspectFill"></image>
            <view v-if="session.unreadCount > 0" class="unread-badge">{{ session.unreadCount > 99 ? '99+' : session.unreadCount }}</view>
          </view>
          <view class="session-info">
            <view class="session-top">
              <text class="nickname">{{ session.contactNickname }}</text>
              <text class="time">{{ formatTime(session.lastMsgTime) }}</text>
            </view>
            <text class="last-msg">{{ session.lastMsgContent }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 2. 聊天窗口模式 -->
    <view v-else class="chat-window-view">
      <!-- 消息列表容器 -->
      <view class="message-list-container">
        <scroll-view 
          class="message-list" 
          scroll-y 
          :scroll-top="scrollTop"
          :scroll-into-view="scrollIntoView"
          :scroll-with-animation="true"
        >
          <view 
            v-for="(msg, index) in chatStore.messages" 
            :key="msg.id || index" 
            :id="'msg-' + index" 
            class="message-item" 
            :class="isMyMsg(msg) ? 'msg-right' : 'msg-left'"
          >
            <image 
              :src="isMyMsg(msg) ? (userStore.userInfo.avatar || '/static/images/icon-user.png') : (currentContact?.contactAvatar || '/static/images/icon-user.png')" 
              class="msg-avatar" 
              mode="aspectFill"
            ></image>
            <view class="msg-content-wrapper">
              <!-- 商品卡片 -->
              <view v-if="msg.productId" class="product-card" @click="goToProduct(msg.productId)">
                <image :src="productInfos[msg.productId]?.image || '/static/images/default-category.png'" class="p-image" mode="aspectFill"></image>
                <view class="p-info">
                  <text class="p-name">{{ productInfos[msg.productId]?.name || '商品加载中...' }}</text>
                  <text class="p-price">¥{{ productInfos[msg.productId]?.price || '0.00' }}</text>
                </view>
              </view>
              <!-- 文本消息气泡 -->
              <view class="msg-bubble">
                <text class="msg-text">{{ msg.content }}</text>
              </view>
              <text class="msg-time">{{ formatTime(msg.createTime) }}</text>
            </view>
          </view>
          <!-- 占位底部 -->
          <view class="bottom-placeholder"></view>
        </scroll-view>
      </view>

      <!-- 底部固定区域 -->
      <view class="bottom-fixed-area">
        <!-- 发送商品卡片预览条 -->
        <view v-if="currentProductId && showProductBar" class="product-send-bar">
          <view class="ps-left" @click="goToProduct(currentProductId)">
            <image :src="productInfos[currentProductId]?.image || '/static/images/default-category.png'" class="ps-image" mode="aspectFill"></image>
            <view class="ps-info">
              <text class="ps-name">{{ productInfos[currentProductId]?.name || '商品加载中...' }}</text>
              <text class="ps-price">¥{{ productInfos[currentProductId]?.price || '0.00' }}</text>
            </view>
          </view>
          <view class="ps-right">
            <button class="ps-btn" @click="sendProductMessage">发送商品</button>
            <view class="ps-close" @click="showProductBar = false">
              <image src="/static/images/icon-close.png" class="close-icon"></image>
            </view>
          </view>
        </view>

        <!-- 输入区域 -->
        <view class="input-section">
          <view class="input-wrapper">
            <textarea 
              class="chat-input" 
              v-model="inputContent" 
              placeholder="请输入咨询内容..."
              maxlength="500"
              :auto-height="true"
              :cursor-spacing="20"
              @confirm="sendMessage"
              confirm-type="send"
            />
          </view>
          <button class="send-btn" @click="sendMessage" :disabled="!inputContent.trim()">发送</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';
import { onLoad, onUnload, onBackPress } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import { useChatStore } from '@/store/modules/chatStore';
import socketService from '@/utils/websocket';
import { productApi } from '@/utils/api';

const userStore = useUserStore();
const chatStore = useChatStore();

const viewMode = ref('LIST'); // LIST 或 CHAT
const currentContact = ref(null);
const currentProductId = ref(null);
const showProductBar = ref(false);
const inputContent = ref('');
const isRefreshing = ref(false);
const scrollTop = ref(0);
const scrollIntoView = ref('');
const productInfos = ref({}); // 缓存商品信息

onLoad((options) => {
  if (!userStore.token) {
    uni.reLaunch({ url: '/pages/main/login/login' });
    return;
  }

  // 确保 WebSocket 已连接
  if (!socketService.isConnected) {
    socketService.connect(userStore.token);
  }

  // 逻辑处理
  if (options.productId) {
    // 1. 从商品详情页进入
    const contactId = 1002; // 默认客服ID
    currentProductId.value = parseInt(options.productId);
    showProductBar.value = true;
    startChatWithContact(contactId, currentProductId.value);
  } else if (options.contactId) {
    // 2. 从会话列表或通知进入
    startChatWithContact(parseInt(options.contactId));
  } else {
    // 3. 直接进入列表
    viewMode.value = 'LIST';
    uni.setNavigationBarTitle({ title: '我的咨询' });
    chatStore.fetchSessions();
  }
});

onUnload(() => {
  chatStore.setCurrentContact(null);
});

// 处理物理返回键
onBackPress((e) => {
  if (viewMode.value === 'CHAT') {
    handleBack();
    return true; // 拦截原生返回，执行自定义返回逻辑
  }
  return false;
});

// 监听消息变化，自动滚动到底部并加载商品信息
watch(() => chatStore.messages.length, (newLen) => {
  if (newLen > 0) {
    scrollToBottom();
    const lastMsg = chatStore.messages[newLen - 1];
    if (lastMsg.productId) {
      fetchProductInfo(lastMsg.productId);
    }
  }
}, { immediate: true });

// 开始与某人聊天
const startChatWithContact = async (contactId, productId = null) => {
  viewMode.value = 'CHAT';
  // 临时设置，fetchHistory 之后可能会有更准确的昵称
  currentContact.value = { contactId, contactNickname: '在线客服' };
  uni.setNavigationBarTitle({ title: '在线客服' });
  
  chatStore.setCurrentContact(contactId);
  
  // 1. 加载历史记录
  await chatStore.fetchHistory(contactId);
  
  // 2. 尝试从会话列表中获取该联系人的真实昵称/头像
  const session = chatStore.sessions.find(s => s.contactId === contactId);
  if (session) {
    currentContact.value = session;
    uni.setNavigationBarTitle({ title: session.contactNickname });
  }

  // 3. 如果带了商品ID，预加载商品信息
  if (productId) {
    fetchProductInfo(productId);
  }

  // 4. 预加载历史记录中所有的商品信息
  const allProductIds = chatStore.messages.filter(m => m.productId).map(m => m.productId);
  if (allProductIds.length > 0) {
    fetchProductInfo([...new Set(allProductIds)]);
  }

  scrollToBottom();
};

// 从列表点击进入聊天
const enterChat = (session) => {
  currentContact.value = session;
  viewMode.value = 'CHAT';
  uni.setNavigationBarTitle({ title: session.contactNickname });
  chatStore.setCurrentContact(session.contactId);
  chatStore.fetchHistory(session.contactId);
  
  // 预加载商品信息
  const productIds = chatStore.messages.filter(m => m.productId).map(m => m.productId);
  if (productIds.length > 0) {
    fetchProductInfo([...new Set(productIds)]);
  }
};

// 返回逻辑
const handleBack = () => {
  if (viewMode.value === 'CHAT') {
    viewMode.value = 'LIST';
    currentContact.value = null;
    uni.setNavigationBarTitle({ title: '我的咨询' });
    chatStore.setCurrentContact(null);
    chatStore.fetchSessions();
  } else {
    uni.navigateBack();
  }
};

// 下拉刷新列表
const onRefresh = async () => {
  isRefreshing.value = true;
  await chatStore.fetchSessions();
  isRefreshing.value = false;
};

// 辅助函数：判断是否是我发送的消息
const isMyMsg = (msg) => {
  if (!msg || !userStore.userInfo) return false;
  // 兼容不同类型的 ID 比较
  return String(msg.fromUserId) === String(userStore.userInfo.id);
};

// 发送消息
const sendMessage = () => {
  const content = inputContent.value.trim();
  if (!content || !currentContact.value) return;

  if (!socketService.isConnected) {
    uni.showToast({ title: '连接已断开，正在重连...', icon: 'none' });
    socketService.connect(userStore.token);
    return;
  }

  // 修改逻辑：不再自动绑定 productId，除非是发送商品卡片
  const success = socketService.sendMessage({
    toUserId: currentContact.value.contactId,
    content: content,
    productId: null // 普通文本不带商品ID
  });

  if (success) {
    // 乐观更新：立即添加到界面
    const newMsg = {
      id: Date.now(),
      fromUserId: userStore.userInfo.id,
      toUserId: currentContact.value.contactId,
      content: content,
      productId: null,
      createTime: new Date().toISOString()
    };
    chatStore.messages.push(newMsg);
    inputContent.value = '';
    scrollToBottom();
  } else {
    uni.showToast({ title: '发送失败，请重试', icon: 'none' });
  }
};

// 专门发送商品信息卡片
const sendProductMessage = () => {
  if (!currentProductId.value || !currentContact.value) return;

  if (!socketService.isConnected) {
    uni.showToast({ title: '连接已断开，正在重连...', icon: 'none' });
    socketService.connect(userStore.token);
    return;
  }

  const success = socketService.sendMessage({
    toUserId: currentContact.value.contactId,
    content: '我对这个商品感兴趣，想咨询一下',
    productId: currentProductId.value
  });

  if (success) {
    const newMsg = {
      id: Date.now(),
      fromUserId: userStore.userInfo.id,
      toUserId: currentContact.value.contactId,
      content: '我对这个商品感兴趣，想咨询一下',
      productId: currentProductId.value,
      createTime: new Date().toISOString()
    };
    chatStore.messages.push(newMsg);
    showProductBar.value = false; // 发送后隐藏预览条
    scrollToBottom();
  } else {
    uni.showToast({ title: '发送失败，请重试', icon: 'none' });
  }
};

// 加载商品简要信息
const fetchProductInfo = async (ids) => {
  const idArray = Array.isArray(ids) ? ids : [ids];
  const missingIds = idArray.filter(id => id && !productInfos.value[id]);
  if (missingIds.length === 0) return;

  try {
    const res = await productApi.getProductBriefList(missingIds);
    if (res.success && res.data) {
      res.data.forEach(p => {
        productInfos.value[p.id] = p;
      });
    }
  } catch (e) {
    console.error('Failed to fetch product brief info:', e);
  }
};

// 跳转商品详情
const goToProduct = (id) => {
  uni.navigateTo({ url: `/pages/product/detail/detail?productId=${id}` });
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    setTimeout(() => {
      scrollIntoView.value = 'msg-' + (chatStore.messages.length - 1);
    }, 200);
  });
};

// 时间格式化
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};
</script>

<style scoped>
.consult-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F8F8F8;
  overflow: hidden;
}

/* 会话列表模式 */
.session-list-view {
  flex: 1;
  height: 0;
}

.session-list {
  height: 100%;
}

.session-item {
  display: flex;
  padding: 30rpx;
  background-color: #FFFFFF;
  border-bottom: 1rpx solid #F2F2F2;
}

.avatar-wrapper {
  position: relative;
  margin-right: 24rpx;
}

.session-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 12rpx;
  background-color: #F0F0F0;
}

.unread-badge {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  background-color: #FF4D4F;
  color: #FFF;
  font-size: 20rpx;
  min-width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  border: 3rpx solid #FFF;
  box-sizing: border-box;
}

.session-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.session-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nickname {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
}

.time {
  font-size: 24rpx;
  color: #BBB;
}

.last-msg {
  font-size: 26rpx;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 60vh;
  padding: 0 60rpx;
}

.empty-icon {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 30rpx;
  opacity: 0.3;
}

.empty-text {
  color: #333;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.empty-tip {
  color: #999;
  font-size: 26rpx;
  text-align: center;
  line-height: 1.6;
}

/* 聊天窗口模式 */
.chat-window-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.message-list-container {
  flex: 1;
  height: 0;
  min-height: 0;
  background-color: #F2F2F2;
}

.message-list {
  height: 100%;
}

.bottom-fixed-area {
  flex-shrink: 0;
  background-color: #F7F7F7;
}

.bottom-placeholder {
  height: 40rpx;
  width: 100%;
}

.message-item {
  display: flex;
  margin-bottom: 40rpx;
  width: 100%;
  padding: 0 20rpx;
}
.message-item:first-child {
  padding-top: 30rpx;
}

.msg-left {
  flex-direction: row;
}

.msg-right {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 84rpx;
  height: 84rpx;
  border-radius: 10rpx;
  margin: 0 20rpx;
  background-color: #DDD;
  flex-shrink: 0;
}

.msg-content-wrapper {
  max-width: 65%;
  display: flex;
  flex-direction: column;
}

.msg-right .msg-content-wrapper {
  align-items: flex-end;
}

.msg-bubble {
  padding: 20rpx 28rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  line-height: 1.5;
  word-break: break-all;
  position: relative;
  min-height: 40rpx;
}

.msg-left .msg-bubble {
  background-color: #FFFFFF;
  color: #333;
}

.msg-left .msg-bubble::before {
  content: '';
  position: absolute;
  left: -12rpx;
  top: 30rpx;
  border-top: 10rpx solid transparent;
  border-bottom: 10rpx solid transparent;
  border-right: 14rpx solid #FFFFFF;
}

.msg-right .msg-bubble {
  background-color: #95EC69;
  color: #000;
}

.msg-right .msg-bubble::before {
  content: '';
  position: absolute;
  right: -12rpx;
  top: 30rpx;
  border-top: 10rpx solid transparent;
  border-bottom: 10rpx solid transparent;
  border-left: 14rpx solid #95EC69;
}

.msg-text {
  display: block;
}

.msg-time {
  font-size: 22rpx;
  color: #BBB;
  margin-top: 10rpx;
}

/* 商品卡片发送预览条 */
.product-send-bar {
  background-color: #FFFFFF;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1rpx solid #EEEEEE;
  box-shadow: 0 -4rpx 10rpx rgba(0,0,0,0.02);
  z-index: 10;
}

.ps-left {
  display: flex;
  align-items: center;
  flex: 1;
  margin-right: 20rpx;
  overflow: hidden;
}

.ps-image {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.ps-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.ps-name {
  font-size: 24rpx;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4rpx;
}

.ps-price {
  font-size: 24rpx;
  color: #FA5151;
  font-weight: bold;
}

.ps-right {
  display: flex;
  align-items: center;
}

.ps-btn {
  height: 56rpx;
  line-height: 56rpx;
  background-color: #5E81F4;
  color: #FFFFFF;
  font-size: 22rpx;
  border-radius: 28rpx;
  padding: 0 24rpx;
  margin-right: 16rpx;
}

.ps-btn::after {
  border: none;
}

.ps-close {
  padding: 10rpx;
}

.close-icon {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.4;
}

/* 商品卡片消息样式 */
.product-card {
  width: 420rpx;
  background-color: #FFFFFF;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
  display: flex;
  padding: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  box-sizing: border-box;
}

.p-image {
  width: 110rpx;
  height: 110rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
  background-color: #F8F8F8;
  flex-shrink: 0;
}

.p-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.p-name {
  font-size: 26rpx;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.p-price {
  font-size: 28rpx;
  color: #FA5151;
  font-weight: bold;
}

/* 输入区域样式 */
.input-section {
  display: flex;
  align-items: flex-end;
  padding: 20rpx 30rpx;
  background-color: #F7F7F7;
  border-top: 1rpx solid #E5E5E5;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

.input-wrapper {
  flex: 1;
  background-color: #FFFFFF;
  border-radius: 8rpx;
  padding: 16rpx 24rpx;
  min-height: 40rpx;
  max-height: 200rpx;
  overflow-y: auto;
}

.chat-input {
  width: 100%;
  font-size: 30rpx;
  color: #333;
  line-height: 1.4;
}

.send-btn {
  width: 120rpx;
  height: 72rpx;
  background-color: #07C160;
  color: #FFFFFF;
  border-radius: 8rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 20rpx;
  padding: 0;
  flex-shrink: 0;
}

.send-btn::after {
  border: none;
}

.send-btn:disabled {
  background-color: #E1E1E1;
  color: #B2B2B2;
}
</style>
