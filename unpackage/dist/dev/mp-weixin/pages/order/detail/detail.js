"use strict";
const common_vendor = require("../../../common/vendor.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
const utils_timeUtil = require("../../../utils/timeUtil.js");
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const orderNo = common_vendor.ref("");
    const orderInfo = common_vendor.ref({});
    const logisticsData = common_vendor.ref({});
    const countdownText = common_vendor.ref("");
    let timer = null;
    common_vendor.onLoad((options) => {
      orderNo.value = options.orderNo;
    });
    common_vendor.onShow(() => {
      if (!userStore.token || !orderNo.value) {
        common_vendor.index.navigateBack();
        return;
      }
      getOrderDetail();
    });
    common_vendor.onUnload(() => {
      if (timer) {
        clearInterval(timer);
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
          if (orderInfo.value.status === "pendingPayment") {
            startCountdown();
          } else {
            if (timer)
              clearInterval(timer);
          }
          if (["pendingReceipt", "completed"].includes(orderInfo.value.status)) {
            getLogisticsInfo();
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/order/detail/detail.vue:224", "获取订单详情失败:", error);
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const startCountdown = () => {
      if (timer)
        clearInterval(timer);
      const createTimeMillis = new Date(orderInfo.value.createTime).getTime();
      const expireTimeMillis = createTimeMillis + 30 * 60 * 1e3;
      const updateCountdown = () => {
        if (utils_timeUtil.isExpired(expireTimeMillis)) {
          countdownText.value = "00:00";
          clearInterval(timer);
          orderInfo.value.status = "cancelled";
          return;
        }
        countdownText.value = utils_timeUtil.formatCountdown(expireTimeMillis);
      };
      updateCountdown();
      timer = setInterval(updateCountdown, 1e3);
    };
    const getLogisticsInfo = async () => {
      try {
        const res = await utils_request.request({
          url: "/api/order/logistics",
          method: "GET",
          params: { orderNo: orderNo.value }
        });
        if (res.success || res.code === 200) {
          logisticsData.value = res.data || res.result;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/order/detail/detail.vue:265", "获取物流信息失败", error);
      }
    };
    const getPayTypeText = (payType) => {
      if (payType === "unpaid")
        return "未支付";
      if (payType === "wechatPay" || payType === "WECHAT_PAY")
        return "微信支付";
      return payType || "未支付";
    };
    const getStatusText = (status) => {
      const statusMap = {
        "pendingPayment": "待支付",
        "pendingConfirm": "待确认",
        "pendingShipment": "待发货",
        "pendingReceipt": "待收货",
        "completed": "已完成",
        "evaluated": "已评价",
        "8": "已评价",
        "reviewed": "已追评",
        "9": "已追评",
        "cancelled": "已取消",
        "afterSale": "售后处理中"
      };
      return statusMap[status] || status || "未知状态";
    };
    const getStatusClass = (status) => {
      const classMap = {
        "pendingPayment": "status-pending-pay",
        "pendingConfirm": "status-pending-confirm",
        "pendingShipment": "status-pending-ship",
        "pendingReceipt": "status-pending-receipt",
        "completed": "status-completed",
        "evaluated": "status-completed",
        "8": "status-completed",
        "reviewed": "status-completed",
        "9": "status-completed",
        "cancelled": "status-cancelled",
        "afterSale": "status-after-sale"
      };
      return classMap[status] || "";
    };
    const formatPrice = (price) => {
      const num = parseFloat(price);
      return isNaN(num) ? "0.00" : num.toFixed(2);
    };
    const copyLogisticsNo = (expressNo) => {
      if (!expressNo)
        return;
      common_vendor.index.setClipboardData({
        data: expressNo,
        success: () => {
          common_vendor.index.showToast({ title: "复制成功" });
        },
        fail: () => {
          common_vendor.index.showToast({ title: "复制失败", icon: "none" });
        }
      });
    };
    const cancelOrder = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要取消该订单吗？",
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({ title: "提交中...", mask: true });
            try {
              const apiRes = await utils_request.request({
                url: "/api/order/cancel",
                method: "PUT",
                params: { orderNo: orderNo.value }
              });
              if (apiRes.success) {
                if (apiRes.data && apiRes.data.status) {
                  orderInfo.value.status = apiRes.data.status;
                }
                await getOrderDetail();
                common_vendor.index.showToast({ title: "订单取消成功", icon: "success" });
              } else {
                common_vendor.index.hideLoading();
                common_vendor.index.showToast({ title: apiRes.message || "订单取消失败", icon: "none" });
              }
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/order/detail/detail.vue:369", "取消订单失败:", error);
            }
          }
        }
      });
    };
    const confirmReceipt = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确认已收到货物吗？确认后订单将完成交易",
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({ title: "处理中...", mask: true });
            try {
              const apiRes = await utils_request.request({
                url: "/api/order/confirmReceipt",
                method: "PUT",
                params: { orderNo: orderNo.value }
              });
              if (apiRes.success) {
                if (apiRes.data && apiRes.data.status) {
                  orderInfo.value.status = apiRes.data.status;
                }
                await getOrderDetail();
                common_vendor.index.showToast({ title: "确认收货成功", icon: "success" });
              } else {
                common_vendor.index.hideLoading();
                common_vendor.index.showToast({ title: apiRes.message || "确认收货失败", icon: "none" });
              }
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/order/detail/detail.vue:403", "确认收货失败:", error);
            }
          }
        }
      });
    };
    const goToPay = () => {
      common_vendor.index.navigateTo({
        url: `/pages/pay/index/index?orderNo=${orderNo.value}&amount=${orderInfo.value.totalAmount}`
      });
    };
    const goToLogistics = () => {
      common_vendor.index.navigateTo({ url: `/pages/order/logistics?orderNo=${orderNo.value}` });
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
    const applyAfterSale = () => {
      common_vendor.index.showToast({ title: "售后功能暂未开放", icon: "none" });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(getStatusText(orderInfo.value.status)),
        b: common_vendor.n(getStatusClass(orderInfo.value.status)),
        c: orderInfo.value.status === "pendingPayment" && countdownText.value
      }, orderInfo.value.status === "pendingPayment" && countdownText.value ? {
        d: common_vendor.t(countdownText.value)
      } : {}, {
        e: common_vendor.t(orderInfo.value.orderNo || "-"),
        f: common_vendor.t(orderInfo.value.createTime || "-"),
        g: orderInfo.value.deliverTime
      }, orderInfo.value.deliverTime ? {
        h: common_vendor.t(orderInfo.value.deliverTime)
      } : {}, {
        i: orderInfo.value.receiveTime
      }, orderInfo.value.receiveTime ? {
        j: common_vendor.t(orderInfo.value.receiveTime)
      } : {}, {
        k: common_vendor.f(orderInfo.value.orderItems, (item, index, i0) => {
          return {
            a: item.productImage,
            b: common_vendor.t(item.productName),
            c: common_vendor.t(item.specText || "默认规格"),
            d: common_vendor.t(item.quantity),
            e: common_vendor.t(formatPrice(item.price * item.quantity)),
            f: index
          };
        }),
        l: common_vendor.t(orderInfo.value.address && orderInfo.value.address.receiver || orderInfo.value.receiver || "-"),
        m: common_vendor.t(orderInfo.value.address && orderInfo.value.address.phone || orderInfo.value.receiverPhone || "-"),
        n: orderInfo.value.address
      }, orderInfo.value.address ? {
        o: common_vendor.t(orderInfo.value.address.province || ""),
        p: common_vendor.t(orderInfo.value.address.city || ""),
        q: common_vendor.t(orderInfo.value.address.district || ""),
        r: common_vendor.t(orderInfo.value.address.detailAddress || "-")
      } : {
        s: common_vendor.t(orderInfo.value.province || ""),
        t: common_vendor.t(orderInfo.value.city || ""),
        v: common_vendor.t(orderInfo.value.district || ""),
        w: common_vendor.t(orderInfo.value.detailAddress || "-")
      }, {
        x: ["pendingReceipt", "completed"].includes(orderInfo.value.status)
      }, ["pendingReceipt", "completed"].includes(orderInfo.value.status) ? common_vendor.e({
        y: logisticsData.value.logisticsNo || logisticsData.value.expressNo
      }, logisticsData.value.logisticsNo || logisticsData.value.expressNo ? common_vendor.e({
        z: common_vendor.t(logisticsData.value.logisticsCompany || logisticsData.value.expressCompany || "-"),
        A: common_vendor.t(logisticsData.value.logisticsNo || logisticsData.value.expressNo),
        B: common_vendor.o(($event) => copyLogisticsNo(logisticsData.value.logisticsNo || logisticsData.value.expressNo), "03"),
        C: logisticsData.value.orderTrackings && logisticsData.value.orderTrackings.length > 0 || logisticsData.value.tracks && logisticsData.value.tracks.length > 0
      }, logisticsData.value.orderTrackings && logisticsData.value.orderTrackings.length > 0 || logisticsData.value.tracks && logisticsData.value.tracks.length > 0 ? {
        D: common_vendor.f(logisticsData.value.orderTrackings || logisticsData.value.tracks, (track, tIndex, i0) => {
          return {
            a: common_vendor.t(track.createTime || track.time),
            b: common_vendor.t(track.description || track.content),
            c: tIndex
          };
        })
      } : {}, {
        E: common_vendor.o(goToLogistics, "4b")
      }) : {}) : {}, {
        F: common_vendor.t(getPayTypeText(orderInfo.value.payType)),
        G: orderInfo.value.payType !== "unpaid" && orderInfo.value.payTime
      }, orderInfo.value.payType !== "unpaid" && orderInfo.value.payTime ? {
        H: common_vendor.t(orderInfo.value.payTime)
      } : {}, {
        I: common_vendor.t(formatPrice(orderInfo.value.totalGoodsAmount)),
        J: parseFloat(orderInfo.value.freight) === 0
      }, parseFloat(orderInfo.value.freight) === 0 ? {} : {
        K: common_vendor.t(formatPrice(orderInfo.value.freight))
      }, {
        L: common_vendor.t(formatPrice(orderInfo.value.totalAmount)),
        M: orderInfo.value.remark
      }, orderInfo.value.remark ? {
        N: common_vendor.t(orderInfo.value.remark)
      } : {}, {
        O: orderInfo.value.status === "pendingPayment"
      }, orderInfo.value.status === "pendingPayment" ? {
        P: common_vendor.o(cancelOrder, "e1"),
        Q: common_vendor.o(goToPay, "77")
      } : {}, {
        R: orderInfo.value.status === "pendingConfirm" || orderInfo.value.status === "pendingShipment"
      }, orderInfo.value.status === "pendingConfirm" || orderInfo.value.status === "pendingShipment" ? {
        S: common_vendor.o(contactService, "fe")
      } : {}, {
        T: orderInfo.value.status === "pendingReceipt"
      }, orderInfo.value.status === "pendingReceipt" ? {
        U: common_vendor.o(confirmReceipt, "cc"),
        V: common_vendor.o(goToLogistics, "c5")
      } : {}, {
        W: ["completed", "cancelled", "afterSale"].includes(orderInfo.value.status)
      }, ["completed", "cancelled", "afterSale"].includes(orderInfo.value.status) ? common_vendor.e({
        X: orderInfo.value.status === "completed"
      }, orderInfo.value.status === "completed" ? {
        Y: common_vendor.o(applyAfterSale, "49")
      } : {}, {
        Z: common_vendor.o(contactService, "1b")
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-78cad3ff"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/order/detail/detail.js.map
