<!-- 功能说明
支持新增 / 修改收货地址，包含收件人、手机号、省市区三级联动选择、详细地址填写，表单校验（必填项、手机号格式）
，核心对接地址新增、修改接口   --> 

<template>
  <view class="address-edit-container">
    <!-- 页面头部 -->
    <view class="page-header">
      <view class="header-content">
        <view class="back-area" @click="navigateBack">
          <image src="/static/images/back.png" class="back-icon"></image>
        </view>
        <text class="header-title">{{isEditMode ? '编辑地址' : '新增地址'}}</text>
        <view class="save-area" :class="{'disabled': isSubmitting}" @click="submitAddress">
          <text class="save-text">保存</text>
        </view>
      </view>
    </view>

    <!-- 表单区域 -->
    <view class="form-container">
      <view class="form-card">
        <!-- 收件人 -->
        <view class="form-item">
          <view class="label-row">
            <text class="form-label">收件人</text>
            <text class="required-dot">*</text>
          </view>
          <view class="input-wrapper">
            <input 
              class="form-input" 
              v-model="addressForm.receiver" 
              placeholder="请输入收件人姓名"
              maxlength="20"
              placeholder-class="placeholder-style"
            ></input>
          </view>
        </view>

        <!-- 手机号 -->
        <view class="form-item">
          <view class="label-row">
            <text class="form-label">手机号</text>
            <text class="required-dot">*</text>
          </view>
          <view class="input-wrapper">
            <input 
              class="form-input" 
              v-model="addressForm.phone" 
              placeholder="请输入手机号"
              maxlength="11"
              type="number"
              @input="validatePhone"
              placeholder-class="placeholder-style"
            ></input>
            <text class="error-msg" v-if="phoneError">手机号格式有误</text>
          </view>
        </view>

        <!-- 省市区选择 -->
        <view class="form-item" @click="showAreaPicker">
          <view class="label-row">
            <text class="form-label">所在地区</text>
            <text class="required-dot">*</text>
          </view>
          <view class="input-wrapper picker-wrapper">
            <text class="area-text" v-if="addressForm.province">{{addressForm.province}} {{addressForm.city}} {{addressForm.district}}</text>
            <text class="area-placeholder" v-else>请选择省、市、区</text>
            <image src="/static/images/arrow-right.png" class="arrow-icon"></image>
          </view>
        </view>

        <!-- 详细地址 -->
        <view class="form-item no-border">
          <view class="label-row">
            <text class="form-label">详细地址</text>
            <text class="required-dot">*</text>
          </view>
          <view class="input-wrapper">
            <textarea 
              class="form-textarea" 
              v-model="addressForm.detailAddress" 
              placeholder="请输入详细地址，如街道、门牌号等"
              maxlength="100"
              placeholder-class="placeholder-style"
              auto-height
            ></textarea>
          </view>
        </view>
      </view>

      <!-- 设为默认地址 -->
      <view class="form-card default-card">
        <view class="default-row">
          <view class="default-info">
            <text class="default-label">设为默认地址</text>
            <text class="default-tip">下单时将优先使用该地址</text>
          </view>
          <switch 
            :checked="!!addressForm.isDefault" 
            @change="handleDefaultChange" 
            color="#D4B886"
            class="custom-switch"
          ></switch>
        </view>
      </view>

      <!-- 删除按钮 -->
      <view class="delete-section" v-if="isEditMode">
        <button class="delete-btn" @click="handleDelete">
          <text>删除该地址</text>
        </button>
      </view>
    </view>

    <!-- 省市区选择器弹窗 -->
    <view class="picker-popup" v-if="areaPickerVisible" @click="hideAreaPicker">
      <view class="picker-container" @click.stop>
        <view class="picker-header">
          <button class="picker-cancel" @click="hideAreaPicker">取消</button>
          <button class="picker-confirm" @click="confirmArea">确认</button>
        </view>
        <picker-view 
          class="picker-view"
          :value="pickerValue"
          @change="onPickerChange"
        >
          <picker-view-column>
            <view class="picker-item" v-for="(province, index) in provinceList" :key="index">{{province.name}}</view>
          </picker-view-column>
          <picker-view-column>
            <view class="picker-item" v-for="(city, index) in cityList" :key="index">{{city.name}}</view>
          </picker-view-column>
          <picker-view-column>
            <view class="picker-item" v-for="(district, index) in districtList" :key="index">{{district}}</view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/modules/userStore';
import request from '@/utils/request';
import { provinceList as provinceData } from '@/utils/areaData'; // 省市区数据

// 状态管理
const userStore = useUserStore();

// 页面数据
const isEditMode = ref(false); // 是否编辑模式
const isSubmitting = ref(false); // 提交状态
const phoneError = ref(false); // 手机号校验错误
const areaPickerVisible = ref(false); // 地区选择器弹窗
const pickerValue = ref([0, 0, 0]); // 选择器选中索引
const provinceList = ref(provinceData || []); // 省份列表
const cityList = ref([]); // 城市列表
const districtList = ref([]); // 区县列表

// 地址表单数据
const addressForm = ref({
  id: '', // 地址ID（编辑模式）
  receiver: '', // 收件人
  phone: '', // 手机号
  province: '', // 省份
  city: '', // 城市
  district: '', // 区县
  detailAddress: '', // 详细地址
  isDefault: false // 是否默认地址
});

// 页面加载初始化
onLoad((options) => {
  if (!userStore.token) {
    uni.navigateTo({ url: '/pages/main/login/login' });
    return;
  }
  
  // 从options获取路由参数
  const type = options.type || 'add';
  isEditMode.value = type === 'edit';
  
  // 编辑模式：填充已有地址数据
  if (isEditMode.value && options.address) {
    try {
      addressForm.value = JSON.parse(decodeURIComponent(options.address));
      // 初始化省市区选择器
      initAreaPicker();
    } catch (error) {
      console.error('地址数据解析失败:', error);
      uni.showToast({ title: '地址数据格式错误', icon: 'none' });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  } else {
    // 新增模式：初始化默认数据
    const firstProvince = provinceList.value[0];
    cityList.value = firstProvince?.cityList || [];
    districtList.value = cityList.value[0]?.districtList || [];
    pickerValue.value = [0, 0, 0];
    
    addressForm.value = {
      id: '',
      receiver: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detailAddress: '',
      isDefault: false
    };
  }
});

// 页面卸载时移除事件监听
onUnload(() => {
  uni.$off('addressEdited');
  uni.$off('addressAdded');
});

// 处理删除
const handleDelete = () => {
  uni.showModal({
    title: '提示',
    content: '确定要删除该地址吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中' });
        try {
          const res = await request({
            url: '/api/address/delete',
            method: 'DELETE',
            params: { id: addressForm.value.id }
          });
          if (res.success) {
            uni.showToast({ title: '删除成功' });
            uni.$emit('addressEdited');
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          }
        } catch (error) {
          console.error('删除失败:', error);
        } finally {
          uni.hideLoading();
        }
      }
    }
  });
};

// 初始化省市区选择器（编辑模式）
const initAreaPicker = () => {
  const pName = addressForm.value.province;
  const cName = addressForm.value.city;
  const dName = addressForm.value.district;

  // 查找省份
  const pIdx = provinceList.value.findIndex(item => item.name === pName);
  if (pIdx !== -1) {
    cityList.value = provinceList.value[pIdx].cityList || [];
    // 查找城市
    const cIdx = cityList.value.findIndex(item => item.name === cName);
    if (cIdx !== -1) {
      districtList.value = cityList.value[cIdx].districtList || [];
      // 查找区县 (districtList 是字符串数组)
      const dIdx = districtList.value.findIndex(item => item === dName);
      pickerValue.value = [pIdx, cIdx, dIdx !== -1 ? dIdx : 0];
    } else {
      pickerValue.value = [pIdx, 0, 0];
      districtList.value = cityList.value[0]?.districtList || [];
    }
  } else {
    // 没找到则默认第一个
    const firstProvince = provinceList.value[0];
    cityList.value = firstProvince?.cityList || [];
    districtList.value = cityList.value[0]?.districtList || [];
    pickerValue.value = [0, 0, 0];
  }
};

// 手机号校验
const validatePhone = (e) => {
  const phone = e.detail.value;
  const reg = /^1[3-9]\d{9}$/;
  phoneError.value = phone && !reg.test(phone);
};

// 显示省市区选择器
const showAreaPicker = () => {
  areaPickerVisible.value = true;
};

// 隐藏省市区选择器
const hideAreaPicker = () => {
  areaPickerVisible.value = false;
};

// 选择器值变更
const onPickerChange = (e) => {
  const val = e.detail.value;
  
  // 如果省份变了，重置市和区
  if (val[0] !== pickerValue.value[0]) {
    val[1] = 0;
    val[2] = 0;
    cityList.value = provinceList.value[val[0]].cityList || [];
    districtList.value = cityList.value[0]?.districtList || [];
  } 
  // 如果城市变了，重置区
  else if (val[1] !== pickerValue.value[1]) {
    val[2] = 0;
    districtList.value = cityList.value[val[1]]?.districtList || [];
  }
  
  pickerValue.value = val;
};

// 确认选择省市区
const confirmArea = () => {
  const [pIdx, cIdx, dIdx] = pickerValue.value;
  const province = provinceList.value[pIdx];
  const city = cityList.value[cIdx];
  const district = districtList.value[dIdx];
  
  if (province && city && district) {
    addressForm.value.province = province.name;
    addressForm.value.city = city.name;
    addressForm.value.district = district;
    hideAreaPicker();
  }
};

// 设为默认地址切换
const handleDefaultChange = (e) => {
  addressForm.value.isDefault = e.detail.value ? true : false;
};

// 提交地址（新增/修改）
const submitAddress = async () => {
  // 表单校验
  if (!addressForm.value.receiver) {
    uni.showToast({ title: '请输入收件人姓名', icon: 'none' });
    return;
  }
  if (!addressForm.value.phone || phoneError.value) {
    uni.showToast({ title: '请输入有效的手机号', icon: 'none' });
    return;
  }
  if (!addressForm.value.province || !addressForm.value.city || !addressForm.value.district) {
    uni.showToast({ title: '请选择完整的所在地区', icon: 'none' });
    return;
  }
  if (!addressForm.value.detailAddress) {
    uni.showToast({ title: '请输入详细地址', icon: 'none' });
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = {
      receiver: addressForm.value.receiver,
      phone: addressForm.value.phone,
      province: addressForm.value.province,
      city: addressForm.value.city,
      district: addressForm.value.district,
      detailAddress: addressForm.value.detailAddress,
      isDefault: !!addressForm.value.isDefault
    };

    let res;
    if (isEditMode.value) {
      payload.id = addressForm.value.id;
      // 编辑地址
      res = await request({
        url: '/api/address/update',
        method: 'PUT',
        data: payload
      });
    } else {
      // 新增地址
      res = await request({
        url: '/api/address/add',
        method: 'POST',
        data: payload
      });
    }

    if (res.success) {
      uni.showToast({ title: isEditMode.value ? '地址修改成功' : '地址新增成功' });
      
      // 使用uni.$emit发送事件通知上一页刷新
      if (isEditMode.value) {
        uni.$emit('addressEdited');
      } else {
        uni.$emit('addressAdded');
      }
      
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      uni.showToast({ title: res.message || (isEditMode.value ? '地址修改失败' : '地址新增失败'), icon: 'none' });
    }
  } catch (error) {
    uni.showToast({ title: '网络异常，操作失败', icon: 'none' });
  } finally {
    isSubmitting.value = false;
  }
};

// 返回上一页
const navigateBack = () => {
  uni.navigateBack();
};
</script>

<style scoped>
.address-edit-container {
  background-color: #F8F9FA;
  min-height: 100vh;
  padding-bottom: 80rpx;
}

/* 页面头部 */
.page-header {
  background-color: #FFFFFF;
  position: sticky;
  top: 0;
  z-index: 100;
  padding-top: env(safe-area-inset-top);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 30rpx;
}

.back-area {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-area:active {
  background-color: #F5F5F5;
}

.back-icon {
  width: 40rpx;
  height: 40rpx;
}

.header-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #1A1A1A;
}

.save-area {
  min-width: 100rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  transition: opacity 0.2s;
}

.save-area:active {
  opacity: 0.7;
}

.save-area.disabled {
  opacity: 0.3;
}

.save-text {
  font-size: 30rpx;
  color: #D4B886;
  font-weight: 700;
}

/* 表单区域 */
.form-container {
  padding: 30rpx;
}

.form-card {
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 0 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
}

.form-item {
  padding: 36rpx 0;
  border-bottom: 1rpx solid #F5F6F7;
  display: flex;
  flex-direction: column;
}

.form-item.no-border {
  border-bottom: none;
}

.label-row {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.form-label {
  font-size: 30rpx;
  color: #1A1A1A;
  font-weight: 800;
}

.required-dot {
  color: #F53F3F;
  margin-left: 6rpx;
  font-size: 24rpx;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.form-input {
  width: 100%;
  font-size: 30rpx;
  color: #333333;
}

.form-textarea {
  width: 100%;
  font-size: 30rpx;
  color: #333333;
  min-height: 120rpx;
  padding: 10rpx 0;
  line-height: 1.6;
}

.placeholder-style {
  color: #999999;
  font-size: 28rpx;
}

/* 地区选择器 */
.picker-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.area-text {
  font-size: 30rpx;
  color: #333333;
}

.area-placeholder {
  font-size: 30rpx;
  color: #999999;
}

.arrow-icon {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.3;
}

.error-msg {
  font-size: 22rpx;
  color: #F53F3F;
  margin-top: 10rpx;
  display: block;
}

/* 默认地址选项 */
.default-card {
  padding: 30rpx;
}

.default-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.default-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.default-label {
  font-size: 30rpx;
  color: #1A1A1A;
  font-weight: 800;
}

.default-tip {
  font-size: 24rpx;
  color: #999999;
}

.custom-switch {
  transform: scale(0.9);
}

/* 删除按钮 */
.delete-section {
  margin-top: 60rpx;
  padding: 0 20rpx;
}

.delete-btn {
  width: 100%;
  height: 90rpx;
  background-color: #FFFFFF;
  color: #F53F3F;
  border-radius: 45rpx;
  font-size: 30rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #FFEDED;
  box-shadow: 0 4rpx 12rpx rgba(245, 63, 63, 0.05);
  transition: all 0.2s;
}

.delete-btn:active {
  background-color: #FFF5F5;
  transform: translateY(2rpx);
}

/* 省市区选择器弹窗 */
.picker-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.picker-container {
  background-color: #FFFFFF;
  border-top-left-radius: 40rpx;
  border-top-right-radius: 40rpx;
  padding-bottom: env(safe-area-inset-bottom);
  overflow: hidden;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  padding: 36rpx 40rpx;
  border-bottom: 1rpx solid #F5F6F7;
}

.picker-cancel, .picker-confirm {
  font-size: 32rpx;
  background-color: transparent;
  padding: 0;
  margin: 0;
  line-height: 1;
}

.picker-cancel {
  color: #999999;
}

.picker-confirm {
  color: #D4B886;
  font-weight: 800;
}

.picker-view {
  width: 100%;
  height: 500rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #1A1A1A;
}
</style>
