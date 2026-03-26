<template>
  <view class="comment-page-container">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <view class="nav-content">
        <view class="nav-left" @click="goBack">
          <view class="back-btn-circle">
            <image src="/static/images/back.png" class="back-icon"></image>
          </view>
        </view>
        <view class="nav-title">商品评价</view>
        <view class="nav-right"></view>
      </view>
    </view>

    <!-- 顶部排序栏 -->
    <view class="sort-bar" :style="{ top: (statusBarHeight + 44) + 'px' }">
      <view 
        v-for="item in sortOptions" 
        :key="item.value" 
        class="sort-item" 
        :class="{ active: currentSortType === item.value }"
        @click="handleSortChange(item.value)"
      >
        {{ item.label }}
      </view>
    </view>

    <!-- 评价列表 -->
    <scroll-view 
      class="comment-list" 
      scroll-y 
      @scrolltolower="loadMore"
      :style="{ paddingTop: (statusBarHeight + 44 + 50) + 'px' }"
    >
      <view v-if="commentList.length > 0" class="list-content">
        <view 
          v-for="(comment, index) in commentList" 
          :key="comment.id" 
          class="comment-item"
        >
          <!-- 一级评价信息 -->
          <view class="first-comment">
            <view class="user-info">
              <image :src="comment.userAvatar || '/static/images/default-avatar.png'" class="avatar"></image>
              <view class="name-time">
                <text class="nickname">{{ comment.userNickname || '匿名用户' }}</text>
                <text class="time">{{ comment.createTimeBusinessText || comment.createTime }}</text>
              </view>
              <view class="action-buttons">
                <view class="action-btn like" :class="{ liked: comment.isLiked }" @click.stop="toggleLike(comment, true)">
                  <text class="action-icon">{{ comment.isLiked ? '❤️' : '🤍' }}</text>
                  <text class="action-count">{{ comment.likeCount || 0 }}</text>
                </view>
                <view class="action-btn reply" @click.stop="openReplyPopup(comment)">
                  <text class="action-icon">💬</text>
                  <text class="action-label">回复</text>
                </view>
              </view>
            </view>
            <view class="content-text">{{ comment.content }}</view>
            <view class="comment-imgs" v-if="comment.imageUrls && comment.imageUrls.length > 0">
              <image 
                v-for="(img, idx) in comment.imageUrls" 
                :key="idx" 
                :src="img" 
                mode="aspectFill" 
                class="comment-img"
                @click.stop="previewImage(comment.imageUrls, idx)"
              ></image>
            </view>
            <view class="spec-info">规格：{{ comment.productSpecText || '默认规格' }}</view>
            
            <view class="rating-bar">
              <view class="rating">
                <text v-for="n in 5" :key="n" class="star" :class="{ active: n <= comment.rating }">★</text>
              </view>
              <!-- 追评标记 & 展开按钮 -->
              <view class="comment-footer">
                <view class="append-tag" v-if="comment.isAppendComment === 1">有追评</view>
                <view class="expand-btn" @click="toggleExpand(index)">
                  {{ comment.isExpanded ? '收起' : '查看回复' }}
                  <text class="arrow" :class="{ up: comment.isExpanded }">▼</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 展开内容 (追评 + 二级评价) -->
          <view class="expand-content" v-if="comment.isExpanded">
            <!-- 追评置顶 -->
            <view class="append-comment" v-if="comment.appendComment">
              <view class="append-header">
                <text class="append-title">用户追评</text>
                <text class="append-time">{{ comment.appendComment.createTimeBusinessText || comment.appendComment.createTime }}</text>
              </view>
              <view class="append-text">{{ comment.appendComment.content }}</view>
              <view class="append-imgs" v-if="comment.appendComment.imageUrls && comment.appendComment.imageUrls.length > 0">
                <image 
                  v-for="(img, idx) in comment.appendComment.imageUrls" 
                  :key="idx" 
                  :src="img" 
                  mode="aspectFill" 
                  class="append-img"
                  @click.stop="previewImage(comment.appendComment.imageUrls, idx)"
                ></image>
              </view>
            </view>

            <!-- 二级回复列表 -->
            <view class="second-comments" v-if="comment.secondComments && comment.secondComments.length > 0">
              <view 
                v-for="(reply, rIdx) in comment.secondComments" 
                :key="reply.id" 
                class="reply-item"
              >
                <view class="reply-user">
                  <image :src="reply.userAvatar || '/static/images/default-avatar.png'" class="reply-avatar"></image>
                  <view class="reply-info">
                    <view class="reply-name-row">
                      <text class="reply-nickname">{{ reply.userNickname }}</text>
                      <block v-if="reply.replyUserNickname">
                        <text class="reply-to-label">回复了</text>
                        <text class="reply-nickname">{{ reply.replyUserNickname }}</text>
                      </block>
                    </view>
                    <text class="reply-time">{{ reply.createTimeBusinessText || reply.createTime }}</text>
                  </view>
                  <view class="action-buttons mini">
                    <view class="action-btn like" :class="{ liked: reply.isLiked }" @click.stop="toggleLike(reply, false)">
                      <text class="action-icon">{{ reply.isLiked ? '❤️' : '🤍' }}</text>
                      <text class="action-count">{{ reply.likeCount || 0 }}</text>
                    </view>
                    <view class="action-btn reply" @click.stop="openReplyPopup(reply, comment)">
                      <text class="action-icon">💬</text>
                      <text class="action-label">回复</text>
                    </view>
                  </view>
                </view>
                <view class="reply-text">{{ reply.content }}</view>
              </view>
              <!-- 二级评论加载更多 -->
              <view class="load-more-reply" v-if="!comment.secondEnd" @click="loadMoreSecond(index)">
                查看更多回复...
              </view>
            </view>
            <view class="no-reply" v-else-if="!comment.appendComment && comment.secondEnd">
              暂无回复
            </view>
          </view>
        </view>
        <view class="loading-more" v-if="isLoadingMore">加载中...</view>
        <view class="no-more" v-if="isEnd && commentList.length > 0">没有更多评价了</view>
      </view>

      <view class="empty-state" v-else-if="!isLoading">
        <image src="/static/images/empty.png" class="empty-img"></image>
        <text class="empty-text">暂无评价</text>
      </view>
    </scroll-view>

    <!-- 回复弹窗 -->
    <view class="reply-popup-mask" v-if="showReplyPopup" @click="closeReplyPopup">
      <view class="reply-popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">回复 @{{ currentComment?.userNickname || '用户' }}</text>
          <text class="close-icon" @click="closeReplyPopup">×</text>
        </view>
        <textarea 
          class="reply-textarea" 
          placeholder="请输入回复内容..." 
          v-model="replyContent"
          fixed
          auto-height
          maxlength="200"
        ></textarea>
        <view class="popup-footer">
          <view class="anonymous-toggle" @click="isAnonymous = !isAnonymous">
            <view class="checkbox" :class="{ checked: isAnonymous }"></view>
            <text class="anonymous-label">匿名回复</text>
          </view>
          <button class="submit-btn" :disabled="!replyContent.trim()" @click="submitReply">提交</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import request from '@/utils/request';
import { productApi } from '@/utils/api';
import { useUserStore } from '@/store/modules/userStore';

const userStore = useUserStore();
const statusBarHeight = ref(20);
const productId = ref('');
const isLoading = ref(false);
const isLoadingMore = ref(false);
const isEnd = ref(false);
const commentList = ref([]);
const currentSortType = ref('default');

// 回复弹窗相关
const showReplyPopup = ref(false);
const replyContent = ref('');
const isAnonymous = ref(false);
const currentComment = ref(null);
const parentCommentForReply = ref(null); // 用于记录回复二级评论时所属的一级评论

const sortOptions = [
  { label: '全部', value: 'default' },
  { label: '好评', value: 'isGoodReview' },
  { label: '追评', value: 'isAppendComment' }
];

// 分页相关
const lastSortValue = ref('');
const lastSortId = ref('');

onLoad((options) => {
  productId.value = options.productId;
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 20;
  loadFirstComments(true);
});

const goBack = () => {
  uni.navigateBack();
};

const handleSortChange = (type) => {
  if (currentSortType.value === type) return;
  currentSortType.value = type;
  loadFirstComments(true);
};

const toggleLike = async (comment, isFirst) => {
  console.log('[CommentPage] 点赞交互触发:', { id: comment.id, isFirst, currentLiked: comment.isLiked });
  
  if (!userStore.token) {
    console.warn('[CommentPage] 未登录，拦截点赞');
    uni.showToast({ title: '请先登录', icon: 'none' });
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/main/login/login' });
    }, 1000);
    return;
  }

  const oldLiked = comment.isLiked;
  const newLiked = !oldLiked;
  
  // 乐观更新 UI
  comment.isLiked = newLiked;
  if (newLiked) {
    comment.likeCount = (Number(comment.likeCount) || 0) + 1;
  } else {
    comment.likeCount = Math.max(0, (Number(comment.likeCount) || 0) - 1);
  }

  try {
    console.log('[CommentPage] 发起点赞请求:', { productCommentId: String(comment.id), isLike: newLiked ? 1 : 0 });
    const res = await productApi.likeComment({
      productCommentId: String(comment.id),
      isLike: newLiked ? 1 : 0,
      isFirstComment: isFirst ? 1 : 0 // 1:是 0:不是
    });

    if (!res.success) {
      throw new Error(res.message || '操作失败');
    }
    
    uni.showToast({ title: newLiked ? '点赞成功' : '取消点赞', icon: 'none' });
  } catch (e) {
    console.error('[CommentPage] 点赞请求异常:', e);
    // 失败时回滚 UI
    comment.isLiked = oldLiked;
    if (oldLiked) {
      comment.likeCount = (Number(comment.likeCount) || 0) + 1;
    } else {
      comment.likeCount = Math.max(0, (Number(comment.likeCount) || 0) - 1);
    }
    uni.showToast({ title: e.message || '操作失败', icon: 'none' });
  }
};

const openReplyPopup = (comment, parent = null) => {
  currentComment.value = comment;
  parentCommentForReply.value = parent;
  showReplyPopup.value = true;
};

const closeReplyPopup = () => {
  showReplyPopup.value = false;
  replyContent.value = '';
  isAnonymous.value = false;
  currentComment.value = null;
  parentCommentForReply.value = null;
};

const submitReply = async () => {
  if (!replyContent.value.trim()) return;
  
  if (!userStore.token) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    setTimeout(() => uni.navigateTo({ url: '/pages/main/login/login' }), 1000);
    return;
  }
  
  try {
    uni.showLoading({ title: '提交中...' });
    
    // 如果 parentCommentForReply 存在，说明是在回复二级评论，此时 parentId 应该是一级评论的 ID
    const parentId = parentCommentForReply.value ? parentCommentForReply.value.id : currentComment.value.id;
    const specId = parentCommentForReply.value ? parentCommentForReply.value.productSpecId : currentComment.value.productSpecId;
    
    const res = await request({
      url: '/api/user/product/comment/secondComment/save',
      method: 'POST',
      data: {
        productId: String(productId.value),
        productSpecId: specId ? String(specId) : null,
        parentId: String(parentId),
        userNickname: isAnonymous.value ? '匿名用户' : (userStore.userInfo.nickname || '用户'),
        userAvatar: isAnonymous.value ? '/static/images/default-avatar.png' : (userStore.userInfo.avatar || '/static/images/default-avatar.png'),
        content: replyContent.value,
        replyUserId: currentComment.value.userId ? String(currentComment.value.userId) : null,
        replyUserNickname: currentComment.value.userNickname ? String(currentComment.value.userNickname) : '',
        isAnonymous: isAnonymous.value ? 1 : 0
      }
    });
    
    if (res.success) {
      uni.hideLoading();
      uni.showToast({ title: '回复成功', icon: 'success' });
      
      // 在关闭弹窗前缓存目标一级评论的 ID
      const targetFirstCommentId = parentCommentForReply.value ? parentCommentForReply.value.id : currentComment.value.id;
      
      closeReplyPopup();
      
      // 找到对应的一级评论并刷新其二级列表
      const firstCommentIndex = commentList.value.findIndex(c => c.id === targetFirstCommentId);
      
      if (firstCommentIndex > -1) {
        const comment = commentList.value[firstCommentIndex];
        if (comment.isExpanded) {
          comment.secondComments = [];
          comment.secondEnd = false;
          loadMoreSecond(firstCommentIndex, true);
        } else {
          toggleExpand(firstCommentIndex);
        }
      }
    } else {
      throw new Error(res.message || '提交失败');
    }
  } catch (e) {
    uni.hideLoading();
    uni.showToast({ title: e.message || '提交失败', icon: 'none' });
  }
};

const loadFirstComments = async (isRefresh = false) => {
  if (isRefresh) {
    isLoading.value = true;
    lastSortValue.value = ''; // 第一次查询传空字符串
    lastSortId.value = '';
    isEnd.value = false;
  } else {
    if (isEnd.value || isLoadingMore.value) return;
    isLoadingMore.value = true;
  }

  try {
    const querySize = 20;
    const res = await request({
      url: `/api/user/product/comment/firstComment/show`,
      method: 'POST',
      params: { productId: String(productId.value) },
      data: {
        sortType: currentSortType.value,
        sortValue: lastSortValue.value,
        sortId: String(lastSortId.value),
        querySize: querySize
      }
    });

    if (res.success && res.data) {
      const data = res.data;
      const newList = data.list.map(item => {
        // ... (保持之前的图片解析逻辑)
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
          isLiked: !!item.like, // 处理点赞状态
          isExpanded: false,
          appendComment: null,
          secondComments: [],
          secondEnd: false,
          secondSortValue: '',
          secondSortId: ''
        };
      });

      if (isRefresh) {
        commentList.value = newList;
      } else {
        commentList.value = [...commentList.value, ...newList];
      }

      // 综合判断分页结束状态
      if (data.cursorCommonEntity) {
        isEnd.value = data.cursorCommonEntity.isEnd || (data.list.length < querySize);
        lastSortValue.value = data.cursorCommonEntity.sortValue || '';
        lastSortId.value = data.cursorCommonEntity.sortId || '';
      } else {
        isEnd.value = data.isEnd || (data.list.length < querySize);
        if (data.list.length > 0) {
          const lastItem = data.list[data.list.length - 1];
          lastSortValue.value = lastItem.createTime || '';
          lastSortId.value = lastItem.id || '';
        }
      }
    }
  } catch (e) {
    console.error('加载一级评论失败:', e);
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
};

const loadMore = () => {
  loadFirstComments(false);
};

const toggleExpand = async (index) => {
  const comment = commentList.value[index];
  comment.isExpanded = !comment.isExpanded;

  if (comment.isExpanded) {
    // 如果还没加载过追评且标记有追评，则加载
    if (!comment.appendComment && comment.isAppendComment === 1) {
      loadAppendComment(index);
    }
    // 如果还没加载过二级评论，则加载第一页
    if (comment.secondComments.length === 0 && !comment.secondEnd) {
      loadMoreSecond(index, true);
    }
  }
};

const loadAppendComment = async (index) => {
  const comment = commentList.value[index];
  try {
    const res = await request({
      url: `/api/user/product/comment/appendComment/show`,
      method: 'GET',
      params: {
        firstCommentId: comment.id
      }
    });
    if (res.success && res.data) {
      // 处理追评的图片
      let parsedImgs = [];
      if (res.data.imageUrls) {
        if (Array.isArray(res.data.imageUrls)) {
          parsedImgs = res.data.imageUrls;
        } else if (typeof res.data.imageUrls === 'string') {
          try {
            const cleanedStr = res.data.imageUrls.replace(/`/g, '').trim();
            parsedImgs = JSON.parse(cleanedStr);
          } catch (e) {
            parsedImgs = res.data.imageUrls.split(',').filter(Boolean);
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
      
      comment.appendComment = {
        ...res.data,
        imageUrls: parsedImgs
      };
    }
  } catch (e) {
    console.error('加载追评失败:', e);
  }
};

const loadMoreSecond = async (index, isInitial = false) => {
  const comment = commentList.value[index];
  if (comment.secondEnd) return;

  const sortValue = isInitial ? '' : comment.secondSortValue;
  const sortId = isInitial ? '' : comment.secondSortId;

  try {
    const querySize = 5;
    const res = await request({
      url: `/api/user/product/comment/secondComment/show`,
      method: 'POST',
      params: { firstCommentId: String(comment.id) },
      data: {
        sortValue: sortValue,
        sortId: String(sortId),
        querySize: querySize
      }
    });

    if (res.success && res.data) {
      const data = res.data;
      const newList = data.list.map(item => ({
        ...item,
        isLiked: !!item.like // 处理点赞状态
      }));
      comment.secondComments = [...comment.secondComments, ...newList];
      
      if (data.cursorCommonEntity) {
        comment.secondEnd = data.cursorCommonEntity.isEnd || (data.list.length < querySize);
        comment.secondSortValue = data.cursorCommonEntity.sortValue || '';
        comment.secondSortId = data.cursorCommonEntity.sortId || '';
      } else {
        comment.secondEnd = data.isEnd || (data.list.length < querySize);
        if (data.list.length > 0) {
          const lastItem = data.list[data.list.length - 1];
          comment.secondSortValue = lastItem.createTime || '';
          comment.secondSortId = lastItem.id || '';
        }
      }
    } else {
      comment.secondEnd = true;
    }
  } catch (e) {
    console.error('加载二级评论失败:', e);
  }
};

const previewImage = (urls, current) => {
  uni.previewImage({
    urls,
    current: urls[current]
  });
};

</script>

<style scoped>
.comment-page-container {
  min-height: 100vh;
  background-color: #F8FAFC;
}

/* 导航栏 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: #FFF;
  border-bottom: 1px solid #EEE;
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
  display: flex;
  align-items: center;
  justify-content: center;
}
.back-icon { width: 20px; height: 20px; filter: invert(1); }
.nav-title { font-size: 17px; font-weight: 600; color: #333; }

/* 排序栏 */
.sort-bar {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 999;
  height: 50px;
  background-color: #FFF;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  gap: 40rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}
.sort-item {
  font-size: 28rpx;
  color: #666;
  position: relative;
  padding: 10rpx 0;
}
.sort-item.active {
  color: #D4B886;
  font-weight: bold;
}
.sort-item.active::after {
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

/* 列表内容 */
.comment-list {
  height: 100vh;
  box-sizing: border-box;
}
.list-content {
  padding: 20rpx;
}
.comment-item {
  background-color: #FFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.02);
}

/* 一级评价 */
.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}
.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}
.name-time {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.nickname {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
}
.action-buttons {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 20rpx;
  background: #F8F8F8;
  border-radius: 30rpx;
  transition: all 0.2s;
}
.action-btn:active {
  transform: scale(0.95);
}
.action-btn.like.liked {
  background: #FFF0F0;
}
.action-btn.like.liked .action-count {
  color: #FF4D4F;
}
.action-icon {
  font-size: 24rpx;
}
.action-count, .action-label {
  font-size: 24rpx;
  color: #666;
  font-weight: 500;
}
.action-buttons.mini {
  gap: 8rpx;
}
.action-buttons.mini .action-btn {
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}
.action-buttons.mini .action-icon {
  font-size: 20rpx;
}
.action-buttons.mini .action-count, 
.action-buttons.mini .action-label {
  font-size: 20rpx;
}
.time {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}
.rating-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10rpx;
}
.rating {
  display: flex;
  gap: 4rpx;
}
.star {
  font-size: 24rpx;
  color: #EEE;
}
.star.active {
  color: #FFB800;
}

.content-text {
  font-size: 30rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 20rpx;
  word-break: break-all;
}
.comment-imgs {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 24rpx;
}
.comment-img {
  width: 220rpx;
  height: 220rpx;
  border-radius: 12rpx;
}
.spec-info {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 24rpx;
  padding: 8rpx 16rpx;
  background-color: #F8F8F8;
  border-radius: 4rpx;
  display: inline-block;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.append-tag {
  font-size: 20rpx;
  color: #FF4D4F;
  background: rgba(255, 77, 79, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

/* 回复弹窗样式 */
.reply-popup-mask {
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
.reply-popup-content {
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
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}
.close-icon {
  font-size: 40rpx;
  color: #999;
  padding: 10rpx;
}
.reply-textarea {
  width: 100%;
  min-height: 200rpx;
  background: #F8F8F8;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}
.popup-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30rpx;
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
.submit-btn {
  width: 160rpx;
  height: 64rpx;
  line-height: 64rpx;
  background: #D4B886;
  color: #FFF;
  font-size: 28rpx;
  border-radius: 32rpx;
  margin: 0;
}
.submit-btn[disabled] {
  background: #EEE;
  color: #BBB;
}
.expand-btn {
  font-size: 24rpx;
  color: #D4B886;
  display: flex;
  align-items: center;
}
.arrow {
  font-size: 20rpx;
  margin-left: 8rpx;
  transition: transform 0.3s;
}
.arrow.up {
  transform: rotate(180deg);
}

/* 展开内容 */
.expand-content {
  background-color: #F9F9F9;
  border-radius: 8rpx;
  margin-top: 20rpx;
  padding: 20rpx;
}

/* 追评 */
.append-comment {
  border-bottom: 1px solid #EEE;
  padding-bottom: 20rpx;
  margin-bottom: 20rpx;
}
.append-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15rpx;
}
.append-title {
  font-size: 26rpx;
  color: #FF4D4F;
  font-weight: bold;
}
.append-time {
  font-size: 22rpx;
  color: #999;
}
.append-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.5;
  margin-bottom: 15rpx;
}
.append-imgs {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}
.append-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 4rpx;
}

/* 二级回复 */
.reply-item {
  margin-bottom: 20rpx;
}
.reply-item:last-child {
  margin-bottom: 0;
}
.reply-user {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}
.reply-avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  margin-right: 15rpx;
}
.reply-info {
  flex: 1;
}
.reply-name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.reply-nickname {
  font-size: 26rpx;
  color: #333;
  font-weight: 600;
}
.reply-to-label {
  font-size: 24rpx;
  color: #999;
  margin: 0 8rpx;
}
.reply-time {
  font-size: 20rpx;
  color: #BBB;
  display: block;
}
.reply-text {
  font-size: 24rpx;
  color: #444;
  padding-left: 55rpx;
}

.load-more-reply {
  font-size: 22rpx;
  color: #D4B886;
  text-align: center;
  padding: 10rpx 0;
}
.no-reply {
  font-size: 24rpx;
  color: #999;
  text-align: center;
  padding: 20rpx 0;
}

/* 状态展示 */
.loading-more, .no-more {
  text-align: center;
  padding: 30rpx 0;
  font-size: 24rpx;
  color: #999;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}
.empty-img {
  width: 240rpx;
  height: 240rpx;
}
.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 20rpx;
}
</style>
