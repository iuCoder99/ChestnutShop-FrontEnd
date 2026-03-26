"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
const _sfc_main = {
  __name: "fail",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const orderNo = common_vendor.ref("");
    const failReason = common_vendor.ref("");
    const orderInfo = common_vendor.ref({});
    const countdown = common_vendor.ref(30);
    let countdownTimer = null;
    common_vendor.onLoad((options) => {
      orderNo.value = options.orderNo || "";
      failReason.value = options.reason || "";
      if (!userStore.token || !orderNo.value) {
        common_vendor.index.showToast({ title: "参数异常", icon: "none" });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
        return;
      }
      getOrderDetail();
      startCountdown();
    });
    common_vendor.onUnload(() => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    });
    const getOrderDetail = async () => {
      common_vendor.index.showLoading({ title: "加载中" });
      try {
        const res = await utils_request.request({
          url: "/api/order/detail",
          method: "GET",
          data: { orderNo: orderNo.value }
        });
        if (res.success) {
          orderInfo.value = res.data;
          const createTime = new Date(res.data.createTime).getTime();
          const expireTime = createTime + 30 * 60 * 1e3;
          const remainingTime = Math.ceil((expireTime - (/* @__PURE__ */ new Date()).getTime()) / (60 * 1e3));
          countdown.value = remainingTime > 0 ? remainingTime : 0;
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "订单信息加载失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const startCountdown = () => {
      countdownTimer = setInterval(() => {
        if (countdown.value > 0) {
          countdown.value -= 1;
        } else {
          clearInterval(countdownTimer);
          common_vendor.index.showToast({ title: "订单已超时取消", icon: "none" });
          setTimeout(() => {
            goToOrderList();
          }, 1500);
        }
      }, 60 * 1e3);
    };
    const rePay = () => {
      common_vendor.index.navigateTo({
        url: `/pages/pay/index?orderNo=${orderNo.value}&amount=${orderInfo.value.totalAmount}`
      });
    };
    const goToOrderList = () => {
      common_vendor.index.navigateTo({ url: "/pages/order/list?status=PENDING_PAYMENT" });
    };
    const contactService = () => {
      common_vendor.index.openCustomerServiceChat({
        extInfo: { url: "https://work.weixin.qq.com/kfid/kfc8**********" },
        success: () => {
        },
        fail: () => {
          common_vendor.index.showToast({ title: "客服功能暂不可用", icon: "none" });
        }
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_assets._imports_0$9,
        b: common_vendor.t(failReason.value || "支付未完成，请重试"),
        c: common_vendor.t(orderInfo.value.orderNo || "-"),
        d: common_vendor.t(orderInfo.value.totalAmount ? orderInfo.value.totalAmount.toFixed(2) : "0.00"),
        e: common_vendor.t(countdown.value),
        f: common_assets._imports_1$10,
        g: common_assets._imports_1$10,
        h: common_assets._imports_1$10,
        i: common_vendor.o(goToOrderList, "61"),
        j: common_vendor.o(rePay, "8d"),
        k: common_vendor.o(contactService, "19")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f374cbc0"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/pay/fail/fail.js.map
