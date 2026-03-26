<template>
  <view class="profile-container">
    <view class="profile-content">
      <!-- 顶部背景修饰 -->
      <view class="profile-header-bg"></view>
      
      <view class="profile-main-card">
        <!-- 头像上传区域 - 更加突出 -->
        <view class="avatar-upload-section" @tap="chooseAvatar">
          <view class="avatar-wrapper">
            <image :src="formData.avatar || '/static/images/icon-user.png'" class="avatar-img" mode="aspectFill"></image>
            <view class="avatar-edit-mask">
              <image src="/static/images/icon-camera.png" class="camera-icon"></image>
              <text class="edit-text">修改头像</text>
            </view>
          </view>
          <text class="avatar-tip">点击更换头像</text>
        </view>

        <!-- 表单区域 -->
        <view class="info-form">
          <view class="form-group">
            <view class="form-label-box">
              <text class="form-label">昵称</text>
              <text class="form-required">*</text>
            </view>
            <view class="input-wrapper">
              <image src="/static/images/icon-user.png" class="input-icon"></image>
              <input class="profile-input" v-model="formData.nickname" placeholder="给起个好听的名字吧" maxlength="20" />
            </view>
          </view>

          <view class="form-group">
            <view class="form-label-box">
              <text class="form-label">手机号</text>
            </view>
            <view class="input-wrapper">
              <image src="/static/images/icon-phone.png" class="input-icon" style="width: 32rpx; height: 32rpx;"></image>
              <input class="profile-input" v-model="formData.phone" placeholder="请输入11位手机号" type="number" maxlength="11" />
            </view>
            <text class="input-tip">手机号将用于订单通知与账号安全</text>
          </view>
        </view>

        <!-- 保存按钮 - 重构样式 -->
        <view class="action-section">
          <view class="save-btn-container">
            <button class="custom-save-btn" :class="{ 'btn-disabled': !formData.nickname }" @tap="handleSave">
              <text class="btn-text">保存并同步</text>
              <view class="btn-arrow">
                <image src="/static/images/icon-arrow-right.png" class="arrow-img"></image>
              </view>
            </button>
            <view class="cancel-link" @tap="goBack">取消修改</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import request, { upload } from '@/utils/request';

const userStore = useUserStore();
const formData = ref({
  nickname: '',
  avatar: '',
  phone: ''
});

onLoad(() => {
  getUserDetail();
});

// 获取用户详情
const getUserDetail = async () => {
  uni.showLoading({ title: '加载中...' });
  try {
    const res = await request({
      url: '/api/user/detail/get',
      method: 'GET'
    });
    if (res.success) {
      formData.value = {
        nickname: res.data.nickname || '',
        avatar: res.data.avatar || '',
        phone: res.data.phone || ''
      };
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  } finally {
    uni.hideLoading();
  }
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 选择并上传头像
const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0];
      uploadAvatar(tempFilePath);
    },
    fail: (err) => {
      if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
        uni.showToast({ title: '选择头像失败', icon: 'none' });
      }
    }
  });
};

const uploadAvatar = async (filePath) => {
  uni.showLoading({ title: '上传中...' });
  try {
    const res = await upload({
      url: '/api/upload/image',
      filePath: filePath,
      name: 'file'
    });
    if (res.success) {
      formData.value.avatar = res.data;
      uni.showToast({ title: '上传成功', icon: 'success' });
    } else {
      uni.showToast({ title: res.message || '上传失败', icon: 'none' });
    }
  } catch (error) {
    console.error('上传头像失败:', error);
  } finally {
    uni.hideLoading();
  }
};

// 校验手机号
const validatePhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone);
};

// 保存修改
const handleSave = async () => {
  if (!formData.value.nickname.trim()) {
    return uni.showToast({ title: '昵称不能为空', icon: 'none' });
  }
  if (formData.value.phone && !validatePhone(formData.value.phone)) {
    return uni.showToast({ title: '手机号格式不正确', icon: 'none' });
  }

  uni.showLoading({ title: '保存中...' });
  try {
    const res = await request({
      url: '/api/user/detail/update',
      method: 'PUT',
      data: formData.value
    });
    if (res.success) {
      uni.showToast({ title: '修改成功', icon: 'success' });
      // 更新 Pinia 中的用户信息
      userStore.setUserInfo({ ...userStore.userInfo, ...formData.value });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      uni.showToast({ title: res.message || '修改失败', icon: 'none' });
    }
  } catch (error) {
    console.error('更新用户信息失败:', error);
  } finally {
    uni.hideLoading();
  }
};
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #F0F4F7;
  display: flex;
  justify-content: center;
  padding: 40rpx 20rpx;
  box-sizing: border-box;
}

.profile-content {
  width: 100%;
  max-width: 800px;
  position: relative;
}

.profile-header-bg {
  position: absolute;
  top: -40rpx;
  left: 0;
  right: 0;
  height: 200rpx;
  background: linear-gradient(135deg, #53BAB3 0%, #3a9c95 100%);
  border-radius: 0 0 40rpx 40rpx;
  z-index: 0;
}

.profile-main-card {
  background-color: #FFFFFF;
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
  margin-top: 40rpx;
}

/* 头像上传区域 */
.avatar-upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.avatar-wrapper {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  padding: 6rpx;
  background: linear-gradient(135deg, #53BAB3 0%, #E8F7F6 100%);
  box-shadow: 0 8rpx 20rpx rgba(83, 186, 179, 0.2);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.avatar-wrapper:hover {
  transform: scale(1.05);
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #F5F5F5;
}

.avatar-edit-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60rpx;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-wrapper:hover .avatar-edit-mask {
  opacity: 1;
}

.camera-icon {
  width: 24rpx;
  height: 24rpx;
  filter: brightness(0) invert(1);
}

.edit-text {
  font-size: 16rpx;
  color: #FFFFFF;
}

.avatar-tip {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #999999;
}

/* 表单区域 */
.info-form {
  margin-bottom: 80rpx;
}

.form-group {
  margin-bottom: 40rpx;
}

.form-label-box {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: bold;
}

.form-required {
  color: #FF4D4F;
  margin-left: 8rpx;
  font-size: 24rpx;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background-color: #F9F9F9;
  border-radius: 16rpx;
  padding: 0 30rpx;
  height: 100rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  background-color: #FFFFFF;
  border-color: #53BAB3;
  box-shadow: 0 4rpx 12rpx rgba(83, 186, 179, 0.1);
}

.input-icon {
  width: 36rpx;
  height: 36rpx;
  margin-right: 20rpx;
  opacity: 0.4;
}

.profile-input {
  flex: 1;
  font-size: 30rpx;
  color: #333333;
}

.input-tip {
  font-size: 22rpx;
  color: #BBBBBB;
  margin-top: 12rpx;
  margin-left: 4rpx;
}

/* 按钮区域 */
.action-section {
  display: flex;
  justify-content: center;
}

.save-btn-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 400rpx;
}

.custom-save-btn {
  width: 100%;
  height: 110rpx;
  background: linear-gradient(135deg, #53BAB3 0%, #3a9c95 100%);
  border-radius: 55rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10rpx 0 40rpx;
  box-sizing: border-box;
  box-shadow: 0 10rpx 20rpx rgba(83, 186, 179, 0.3);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: none;
}

.custom-save-btn:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 14rpx 28rpx rgba(83, 186, 179, 0.4);
}

.custom-save-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.btn-disabled {
  background: #CCCCCC !important;
  box-shadow: none !important;
  pointer-events: none;
}

.btn-text {
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: bold;
  letter-spacing: 2rpx;
}

.btn-arrow {
  width: 90rpx;
  height: 90rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-img {
  width: 32rpx;
  height: 32rpx;
  filter: brightness(0) invert(1);
}

.cancel-link {
  margin-top: 30rpx;
  font-size: 26rpx;
  color: #999999;
  text-decoration: underline;
  cursor: pointer;
}

.cancel-link:hover {
  color: #666666;
}

/* 移动端适配 */
@media screen and (max-width: 750px) {
  .profile-container {
    padding: 20rpx;
  }
  
  .profile-main-card {
    padding: 40rpx 30rpx;
  }
}
</style>
