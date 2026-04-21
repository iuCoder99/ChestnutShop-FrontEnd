"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
const utils_timeUtil = require("../../../utils/timeUtil.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const orderNo = common_vendor.ref("");
    const amount = common_vendor.ref(0);
    const selectedPayMethod = common_vendor.ref("WECHAT_PAY");
    const isPaying = common_vendor.ref(false);
    const countdownText = common_vendor.ref("");
    let timer = null;
    common_vendor.onLoad(async (options) => {
      orderNo.value = options.orderNo || "";
      amount.value = parseFloat(options.amount) || 0;
      if (!userStore.token || !orderNo.value || amount.value <= 0) {
        common_vendor.index.showToast({ title: "支付参数异常", icon: "none" });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
        return;
      }
    });
    common_vendor.onShow(() => {
      if (orderNo.value) {
        getOrderDetail();
      }
    });
    const getOrderDetail = async () => {
      try {
        const res = await utils_request.request({
          url: "/api/order/detail",
          method: "GET",
          params: { orderNo: orderNo.value }
        });
        if (res.success || res.code === 200) {
          const orderInfo = res.data || res.result;
          if (orderInfo.status === "pendingPayment") {
            startCountdown(orderInfo.createTime);
          } else if (orderInfo.status === "cancelled") {
            common_vendor.index.showModal({
              title: "提示",
              content: "该订单已超时取消",
              showCancel: false,
              success: () => {
                common_vendor.index.navigateBack();
              }
            });
          } else {
            common_vendor.index.redirectTo({
              url: `/pages/pay/success/success?orderNo=${orderNo.value}&amount=${orderInfo.totalAmount}`
            });
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/pay/index/index.vue:119", "获取订单详情失败", error);
      }
    };
    const startCountdown = (createTime) => {
      if (timer)
        clearInterval(timer);
      const createTimeMillis = new Date(createTime).getTime();
      const expireTimeMillis = createTimeMillis + 30 * 60 * 1e3;
      const updateCountdown = () => {
        if (utils_timeUtil.isExpired(expireTimeMillis)) {
          countdownText.value = "00:00";
          clearInterval(timer);
          common_vendor.index.showModal({
            title: "提示",
            content: "订单已超时取消",
            showCancel: false,
            success: () => {
              common_vendor.index.navigateBack();
            }
          });
          return;
        }
        countdownText.value = utils_timeUtil.formatCountdown(expireTimeMillis);
      };
      updateCountdown();
      timer = setInterval(updateCountdown, 1e3);
    };
    common_vendor.onUnload(() => {
      if (timer)
        clearInterval(timer);
    });
    const selectPayMethod = (method) => {
      selectedPayMethod.value = method;
    };
    const submitPay = async () => {
      if (isPaying.value)
        return;
      isPaying.value = true;
      try {
        const payRes = await utils_request.request({
          url: "/api/pay/wxpay",
          method: "POST",
          data: { orderNo: orderNo.value }
        });
        if (payRes.success) {
          await utils_request.request({
            url: "/api/order/pay/success",
            method: "PUT",
            params: { orderNo: orderNo.value }
          });
          common_vendor.index.showToast({ title: "支付成功", icon: "success" });
          setTimeout(() => {
            common_vendor.index.redirectTo({
              url: `/pages/pay/success/success?orderNo=${orderNo.value}&amount=${amount.value}`
            });
          }, 1500);
        } else {
          common_vendor.index.showToast({ title: payRes.message || "支付请求失败", icon: "none" });
          isPaying.value = false;
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "网络异常，支付失败", icon: "none" });
        isPaying.value = false;
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(amount.value ? amount.value.toFixed(2) : "0.00"),
        b: common_vendor.t(orderNo.value || "-"),
        c: common_assets._imports_0$7,
        d: selectedPayMethod.value === "WECHAT_PAY"
      }, selectedPayMethod.value === "WECHAT_PAY" ? {
        e: common_assets._imports_1$3
      } : {}, {
        f: common_vendor.o(($event) => selectPayMethod("WECHAT_PAY"), "69"),
        g: countdownText.value
      }, countdownText.value ? {
        h: common_vendor.t(countdownText.value)
      } : {}, {
        i: isPaying.value
      }, isPaying.value ? {} : {}, {
        j: common_vendor.o(submitPay, "91"),
        k: isPaying.value
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5837bfd4"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/pay/index/index.js.map
