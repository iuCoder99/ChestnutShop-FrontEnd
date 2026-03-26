import { defineStore } from 'pinia';

export const useOrderStore = defineStore('order', {
  state: () => ({
    selectedAddress: {}, // 选中的收货地址
    orderRemark: '', // 订单备注
    pendingGoods: [] // 待结算的商品列表（购物车跳转时传递）
  }),

  actions: {
    // 设置待结算商品
    setPendingGoods(goodsList) {
      this.pendingGoods = goodsList;
    },

    // 设置选中的收货地址
    setSelectedAddress(address) {
      this.selectedAddress = address;
    },

    // 设置订单备注
    setOrderRemark(remark) {
      this.orderRemark = remark;
    },

    // 清空订单临时数据（提交订单后调用）
    clearOrderData() {
      this.selectedAddress = {};
      this.orderRemark = '';
      this.pendingGoods = [];
    }
  }
});