"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
const _sfc_main = {
  __name: "success",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const orderNo = common_vendor.ref("");
    const orderInfo = common_vendor.ref({
      orderNo: "",
      totalAmount: 0,
      orderItems: []
    });
    const deliveryTime = common_vendor.ref("");
    common_vendor.onBackPress(() => {
      if (orderInfo.value.orderItems && orderInfo.value.orderItems.length > 0) {
        const productId = orderInfo.value.orderItems[0].productId;
        common_vendor.index.reLaunch({
          url: `/pages/product/detail/detail?productId=${productId}`
        });
      } else {
        common_vendor.index.reLaunch({ url: "/pages/main/index/index" });
      }
      return true;
    });
    const formatPrice = (price) => {
      const num = parseFloat(price);
      return isNaN(num) ? "0.00" : num.toFixed(2);
    };
    common_vendor.onLoad((options) => {
      if (!userStore.token) {
        common_vendor.index.navigateTo({ url: "/pages/main/login/login" });
        return;
      }
      orderNo.value = options.orderNo || "";
      orderInfo.value.orderNo = orderNo.value;
      if (options.amount) {
        orderInfo.value.totalAmount = parseFloat(options.amount);
      }
      if (orderNo.value) {
        getOrderDetail();
        calculateDeliveryTime();
      }
    });
    const getOrderDetail = async () => {
      common_vendor.index.showLoading({ title: "加载中" });
      try {
        const res = await utils_request.request({
          url: "/api/order/detail",
          method: "GET",
          params: { orderNo: orderNo.value }
        });
        if (res.success || res.code === 200) {
          orderInfo.value = res.data || res.result;
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "订单信息加载失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const calculateDeliveryTime = () => {
      const now = /* @__PURE__ */ new Date();
      const deliveryDate = new Date(now.setDate(now.getDate() + 3));
      const year = deliveryDate.getFullYear();
      const month = (deliveryDate.getMonth() + 1).toString().padStart(2, "0");
      const day = deliveryDate.getDate().toString().padStart(2, "0");
      deliveryTime.value = `${year}-${month}-${day}前`;
    };
    const goToHome = () => {
      common_vendor.index.reLaunch({ url: "/pages/main/index/index" });
    };
    const goToOrderDetail = () => {
      common_vendor.index.navigateTo({ url: `/pages/order/detail/detail?orderNo=${orderNo.value}` });
    };
    return (_ctx, _cache) => {
      return {
        a: common_assets._imports_0$6,
        b: common_vendor.t(orderInfo.value.orderNo || "-"),
        c: common_vendor.t(formatPrice(orderInfo.value.totalAmount)),
        d: common_vendor.t(deliveryTime.value || "3-5个工作日"),
        e: common_vendor.o(goToHome, "62"),
        f: common_vendor.o(goToOrderDetail, "ea")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6f47f371"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/pay/success/success.js.map
