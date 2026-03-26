<!-- 功能说明：产品规格选择组件，接收规格列表，支持多规格组选择，选中后通过事件回传选中的规格ID数组，适配库存禁用逻辑 -->
<template>
  <view class="spec-picker-container">
    <!-- 空规格提示 -->
    <view class="empty-spec" v-if="!specList || specList.length === 0">
      <text class="empty-text">暂无规格选择</text>
    </view>

    <!-- 规格组列表 -->
    <view class="spec-group" v-else v-for="(specGroup, groupIndex) in specList" :key="groupIndex">
      <!-- 规格组名称 -->
      <text class="spec-group-name">{{ specGroup.specName }}：</text>
      
      <!-- 规格选项列表 -->
      <view class="spec-item-list">
        <view 
          class="spec-item"
          v-for="(specItem, itemIndex) in specGroup.specItems" 
          :key="itemIndex"
          :class="[
            selectedSpec[groupIndex] === specItem.id ? 'spec-item-active' : '',
            specItem.stock <= 0 ? 'spec-item-disabled' : ''
          ]"
          @click="handleSpecClick(groupIndex, specItem)"
          :disabled="specItem.stock <= 0"
        >
          <!-- 规格值 -->
          <text class="spec-item-value">{{ specItem.specValue }}</text>
          <!-- 库存提示（可选） -->
          <text class="spec-item-stock" v-if="specItem.stock > 0 && specItem.stock < 10">
            仅剩{{ specItem.stock }}件
          </text>
          <text class="spec-item-stock disabled-stock" v-if="specItem.stock <= 0">
            库存不足
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue';

// 接收父组件传递的规格列表：格式为[{specName: '规格组名称', specItems: [{id: '规格项ID', specValue: '规格值', stock: 库存数}]}]
const props = defineProps({
  specList: {
    type: Array,
    required: true,
    default: () => []
  },
  // 选中的规格ID数组
  selectedIds: {
    type: Array,
    default: () => []
  }
});

// 维护选中的规格：key=规格组索引，value=选中的规格项ID
const selectedSpec = ref({});
// 向父组件传递选中的规格ID数组（所有规格组都选中后触发）
const emit = defineEmits(['specChange']);

// 监听选中的规格ID变化
watch(() => props.selectedIds, (newIds) => {
  if (newIds && newIds.length > 0) {
    newIds.forEach(id => {
      props.specList.forEach((group, index) => {
        if (group.specItems.some(item => item.id === id)) {
          selectedSpec.value[index] = id;
        }
      });
    });
  }
}, { immediate: true });

// 点击规格选项
const handleSpecClick = (groupIndex, specItem) => {
  // 跳过库存不足的规格
  if (specItem.stock <= 0) return;
  
  // 更新当前规格组的选中状态
  selectedSpec.value[groupIndex] = specItem.id;
  
  // 检查是否所有规格组都已选中
  checkAllSpecSelected();
};

// 检查所有规格组是否都已选中，若是则回传选中的规格ID数组
const checkAllSpecSelected = () => {
  const specCount = props.specList.length;
  const selectedCount = Object.keys(selectedSpec.value).length;
  
  // 所有规格组都选中时，收集规格ID数组
  if (specCount > 0 && selectedCount === specCount) {
    const selectedSpecIds = Object.values(selectedSpec.value);
    emit('specChange', selectedSpecIds); // 与父组件@specChange对应
  }
};

// 监听规格列表变化，重置选中状态（如父组件切换产品时）
watch(() => props.specList, () => {
  selectedSpec.value = {};
}, { deep: true });
</script>

<style scoped>
/* 容器样式 */
.spec-picker-container {
  width: 100%;
  padding: 16rpx 0;
}

/* 空规格样式 */
.empty-spec {
  padding: 20rpx;
  text-align: center;
}
.empty-text {
  font-size: 14rpx;
  color: #999999;
}

/* 规格组样式 */
.spec-group {
  margin-bottom: 24rpx;
}
.spec-group-name {
  font-size: 16rpx;
  color: #333333;
  display: block;
  margin-bottom: 12rpx;
}

/* 规格选项列表 */
.spec-item-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

/* 规格选项样式 */
.spec-item {
  padding: 12rpx 20rpx;
  border: 1rpx solid #EEEEEE;
  border-radius: 8rpx;
  font-size: 14rpx;
  color: #333333;
  background-color: #FFFFFF;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 选中的规格选项 */
.spec-item-active {
  border-color: #D4B886;
  background-color: #FFF8E1;
  color: #D4B886;
}

/* 库存不足的规格选项 */
.spec-item-disabled {
  border-color: #EEEEEE;
  background-color: #F9F9F9;
  color: #999999;
  cursor: not-allowed;
}

/* 库存提示文本 */
.spec-item-stock {
  font-size: 12rpx;
  margin-left: 8rpx;
}
.disabled-stock {
  color: #F53F3F;
}
</style>