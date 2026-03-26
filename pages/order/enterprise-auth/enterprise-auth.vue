<!-- 功能说明
企业用户认证入口，
需填写企业名称、统一社会信用代码，上传营业执照照片，表单校验（必填项、统一社会信用代码格式），
提交认证申请，核心对接企业认证接口。 -->

<template>
  <view class="enterprise-auth-container">
    <!-- 认证说明 -->
    <view class="auth-desc">
      <text class="desc-text">完成企业认证后，可享受批量采购优惠价及专属服务</text>
    </view>

    <!-- 认证表单 -->
    <view class="auth-card">
      <!-- 企业名称 -->
      <view class="form-item">
        <text class="form-label required">企业名称</text>
        <input 
          class="form-input" 
          v-model="enterpriseForm.name" 
          placeholder="请输入企业全称"
          maxlength="100"
        />
      </view>

      <!-- 统一社会信用代码 -->
      <view class="form-item">
        <text class="form-label required">统一社会信用代码</text>
        <input 
          class="form-input" 
          v-model="enterpriseForm.creditCode" 
          placeholder="请输入18位统一社会信用代码"
          maxlength="18"
          @input="formatCreditCode"
        />
        <text class="form-hint-error" v-if="creditCodeError">请输入有效的统一社会信用代码</text>
      </view>

      <!-- 营业执照上传 -->
      <view class="form-item">
        <text class="form-label required">营业执照</text>
        <view class="upload-container" @tap="chooseImage">
          <image :src="enterpriseForm.licenseUrl" v-if="enterpriseForm.licenseUrl" mode="aspectFit" class="upload-img"></image>
          <template v-else>
            <image src="/static/images/upload.png" class="upload-icon"></image>
            <text class="upload-text">点击上传营业执照照片</text>
          </template>
        </view>
        <text class="upload-hint">支持jpg、png格式，单张不超过5MB</text>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="footer-btn-box">
      <button class="submit-btn" :disabled="isSubmitting" @tap="submitAuth">
        <text v-if="isSubmitting">提交中...</text>
        <text v-else>提交认证申请</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import request, { upload } from '@/utils/request';

// 状态管理
const userStore = useUserStore();

// 页面数据
const enterpriseForm = ref({
  name: '', // 企业名称
  creditCode: '', // 统一社会信用代码
  licenseUrl: '' // 营业执照图片URL
});
const isSubmitting = ref(false); // 提交状态
const creditCodeError = ref(false); // 统一社会信用代码校验错误

// 格式化统一社会信用代码（去除空格）
const formatCreditCode = (e) => {
  enterpriseForm.value.creditCode = e.detail.value.replace(/\s/g, '').toUpperCase();
  // 简单校验18位长度
  if (enterpriseForm.value.creditCode.length > 0 && enterpriseForm.value.creditCode.length !== 18) {
    creditCodeError.value = true;
  } else {
    creditCodeError.value = false;
  }
};

// 选择并上传营业执照图片
const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0];
      uploadImage(tempFilePath);
    }
  });
};

// 上传图片接口
const uploadImage = async (filePath) => {
  uni.showLoading({ title: '上传中' });
  try {
    const res = await upload({
      url: '/api/upload/image',
      filePath: filePath,
      name: 'file'
    });
    if (res.success) {
      enterpriseForm.value.licenseUrl = res.data;
      uni.showToast({ title: '上传成功' });
    } else {
      uni.showToast({ title: res.message || '图片上传失败', icon: 'none' });
    }
  } catch (error) {
    console.error('上传图片失败:', error);
  } finally {
    uni.hideLoading();
  }
};

// 提交认证申请
const submitAuth = async () => {
  if (isSubmitting.value) return;

  // 表单校验
  if (!enterpriseForm.value.name.trim()) {
    uni.showToast({ title: '请输入企业名称', icon: 'none' });
    return;
  }
  if (enterpriseForm.value.creditCode.length !== 18) {
    uni.showToast({ title: '请输入有效的统一社会信用代码', icon: 'none' });
    return;
  }
  if (!enterpriseForm.value.licenseUrl) {
    uni.showToast({ title: '请上传营业执照照片', icon: 'none' });
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await request({
      url: '/api/user/enterprise/auth',
      method: 'POST',
      data: {
        enterpriseName: enterpriseForm.value.name.trim(),
        creditCode: enterpriseForm.value.creditCode,
        licenseUrl: enterpriseForm.value.licenseUrl
      }
    });
    if (res.success) {
      uni.showToast({ title: '申请已提交', icon: 'success' });
      uni.$emit('enterpriseAuthSuccess');
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      uni.showToast({ title: res.message || '提交失败', icon: 'none' });
    }
  } catch (error) {
    console.error('企业认证提交失败:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// 页面加载时校验登录状态
onLoad(() => {
  if (!userStore.token) {
    uni.navigateTo({ url: '/pages/main/login/login' });
  }
});
</script>

<style scoped>
.enterprise-auth-container {
  background-color: #F8F8F8;
  min-height: 100vh;
  padding: 30rpx;
  padding-bottom: 140rpx;
  box-sizing: border-box;
}

/* 认证说明 */
.auth-desc {
  margin-bottom: 30rpx;
  padding: 24rpx;
  background-color: #FFF8E1;
  border-radius: 12rpx;
}

.desc-text {
  font-size: 26rpx;
  color: #D4B886;
  line-height: 1.6;
}

/* 认证表单 */
.auth-card {
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

.form-label {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 16rpx;
  display: block;
}

.form-label.required::after {
  content: '*';
  color: #F53F3F;
  margin-left: 4rpx;
}

.form-input {
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

.form-hint-error {
  font-size: 24rpx;
  color: #F53F3F;
  margin-top: 12rpx;
}

/* 上传区域 */
.upload-container {
  width: 100%;
  height: 360rpx;
  background-color: #F9F9F9;
  border: 2rpx dashed #DDDDDD;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.upload-img {
  width: 100%;
  height: 100%;
}

.upload-icon {
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 20rpx;
  opacity: 0.5;
}

.upload-text {
  font-size: 26rpx;
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
