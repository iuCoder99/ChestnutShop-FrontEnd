<template>
  <view class="feedback-container">
    <!-- 得物风顶部导航栏 -->
    <TopNavbar activePage="feedback" />
    
    <view class="feedback-content-body">
      <!-- 反馈表单 -->
      <view class="feedback-card">
        <!-- 反馈内容 -->
        <view class="form-item">
          <view class="label-row">
            <text class="form-label required">反馈内容</text>
            <text class="content-count">{{feedbackForm.content.length}}/500</text>
          </view>
          <textarea 
            class="feedback-content" 
            v-model="feedbackForm.content" 
            placeholder="请详细描述您遇到的问题或建议"
            maxlength="500"
            :auto-height="false"
          ></textarea>
        </view>

        <!-- 图片上传 -->
        <view class="form-item">
          <text class="form-label">上传图片（最多3张）</text>
          <view class="upload-container">
            <view class="upload-item" v-for="(img, index) in feedbackForm.images" :key="index">
              <image :src="img" mode="aspectFill" class="upload-img" @tap="previewImage(index)"></image>
              <view class="close-btn" @tap.stop="deleteImage(index)">
                <text class="close-icon">×</text>
              </view>
            </view>
            <view class="upload-add" @tap="chooseImage" v-if="feedbackForm.images.length < 3">
              <image src="/static/images/upload.png" class="add-icon"></image>
              <text class="add-text">点击上传</text>
            </view>
          </view>
          <text class="upload-hint">支持jpg、png格式，单张不超过5MB</text>
        </view>

        <!-- 联系方式 -->
        <view class="form-item">
          <text class="form-label">联系方式</text>
          <input 
            class="feedback-input" 
            v-model="feedbackForm.contact" 
            placeholder="手机号或邮箱（选填）"
            maxlength="50"
          />
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="footer-btn-box">
      <button class="submit-btn" :disabled="isSubmitting" @tap="submitFeedback">
        <text v-if="isSubmitting">提交中...</text>
        <text v-else>提交反馈</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import TopNavbar from '@/components/business/TopNavbar.vue';
import request, { upload } from '@/utils/request';

// 状态管理
const userStore = useUserStore();

// 页面数据
const feedbackForm = ref({
  content: '', // 反馈内容
  images: [], // 上传图片URL列表
  contact: '' // 联系方式
});
const isSubmitting = ref(false); // 提交状态

// 监听反馈内容长度
watch(() => feedbackForm.value.content, (val) => {
  if (val && val.length > 500) {
    feedbackForm.value.content = val.slice(0, 500);
  }
});

// 页面加载时校验登录状态
onLoad(() => {
  if (!userStore.token) {
    uni.navigateTo({ url: '/pages/main/login/login' });
  }
});

// 预览图片
const previewImage = (index) => {
  uni.previewImage({
    current: index,
    urls: feedbackForm.value.images
  });
};

// 选择图片
const chooseImage = () => {
  console.log('--- chooseImage triggered ---');
  
  const count = 3 - feedbackForm.value.images.length;
  
  // 优先使用 uni.chooseMedia (微信小程序推荐)
  if (uni.chooseMedia) {
    uni.chooseMedia({
      count: count,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log('--- chooseMedia success ---', res.tempFiles);
        res.tempFiles.forEach(file => {
          uploadImage(file.tempFilePath);
        });
      },
      fail: (err) => {
        console.error('--- chooseMedia fail ---', err);
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          uni.showToast({ title: '选择图片失败', icon: 'none' });
        }
      }
    });
  } else {
    // 兼容老版本或其他平台
    uni.chooseImage({
      count: count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log('--- chooseImage success ---', res.tempFilePaths);
        res.tempFilePaths.forEach(tempPath => {
          uploadImage(tempPath);
        });
      },
      fail: (err) => {
        console.error('--- chooseImage fail ---', err);
        if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
          uni.showToast({ title: '选择图片失败', icon: 'none' });
        }
      }
    });
  }
};

// 上传图片到后端
const uploadImage = async (filePath) => {
  uni.showLoading({ title: '图片上传中' });
  try {
    const res = await upload({
      url: '/api/upload/image',
      filePath: filePath,
      name: 'file'
    });
    if (res.success) {
      feedbackForm.value.images.push(res.data);
    } else {
      uni.showToast({ title: res.message || '图片上传失败', icon: 'none' });
    }
  } catch (error) {
    console.error('上传图片失败:', error);
    uni.showToast({ title: '图片上传失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

// 删除图片
const deleteImage = (index) => {
  feedbackForm.value.images.splice(index, 1);
};

// 提交反馈
const submitFeedback = async () => {
  if (isSubmitting.value) return;
  
  // 表单校验
  if (!feedbackForm.value.content.trim()) {
    uni.showToast({ title: '请输入反馈内容', icon: 'none' });
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await request({
      url: '/api/feedback/add',
      method: 'POST',
      data: {
        content: feedbackForm.value.content.trim(),
        images: feedbackForm.value.images.join(','),
        contact: feedbackForm.value.contact.trim()
      }
    });

    if (res.success) {
      uni.showToast({ title: '感谢您的支持', icon: 'success' });
      // 重置表单并返回上一页
      feedbackForm.value = { content: '', images: [], contact: '' };
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      uni.showToast({ title: res.message || '反馈提交失败', icon: 'none' });
    }
  } catch (error) {
    console.error('提交反馈失败:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.feedback-container {
  background-color: #F8F8F8;
  min-height: 100vh;
}

.feedback-content-body {
  padding: 30rpx;
  padding-bottom: 120rpx;
  box-sizing: border-box;
}

.feedback-card {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.form-item {
  margin-bottom: 40rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.form-label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
}

.form-label.required::after {
  content: '*';
  color: #F53F3F;
  margin-left: 4rpx;
}

.content-count {
  font-size: 24rpx;
  color: #999999;
}

.feedback-content {
  width: 100%;
  height: 300rpx;
  padding: 20rpx;
  background-color: #F9F9F9;
  border: 1rpx solid #EEEEEE;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

.feedback-input {
  width: 100%;
  height: 88rpx;
  padding: 0 20rpx;
  background-color: #F9F9F9;
  border: 1rpx solid #EEEEEE;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333333;
  box-sizing: border-box;
}

/* 图片上传 */
.upload-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 16rpx;
}

.upload-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  overflow: visible;
}

.upload-img {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.close-btn {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  width: 36rpx;
  height: 36rpx;
  background-color: #FF4D4F;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.close-icon {
  color: #FFFFFF;
  font-size: 24rpx;
  font-weight: bold;
}

.upload-add {
  width: 160rpx;
  height: 160rpx;
  background-color: #F9F9F9;
  border: 2rpx dashed #DDDDDD;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.add-icon {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 12rpx;
}

.add-text {
  font-size: 24rpx;
  color: #999999;
}

.upload-hint {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #999999;
}

/* 提交按钮 */
.footer-btn-box {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx 40rpx;
  background-color: #FFFFFF;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background-color: #D4B886;
  color: #FFFFFF;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.submit-btn:active {
  opacity: 0.8;
}

.submit-btn:disabled {
  background-color: #E8D7BF;
}
</style>