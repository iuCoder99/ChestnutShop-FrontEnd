"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const utils_request = require("../../../utils/request.js");
const _sfc_main = {
  __name: "search",
  setup(__props) {
    const keyword = common_vendor.ref("");
    const historyList = common_vendor.ref([]);
    const orderList = common_vendor.ref([]);
    const showResult = common_vendor.ref(false);
    const activeMoreIndex = common_vendor.ref(-1);
    const toggleMore = (index) => {
      activeMoreIndex.value = activeMoreIndex.value === index ? -1 : index;
    };
    const getButtons = (order) => {
      const status = order.status;
      const buttons = [];
      switch (status) {
        case "pendingPayment":
          buttons.push({ text: "去支付", type: "primary", action: "pay" });
          buttons.push({ text: "取消订单", type: "secondary", action: "cancel" });
          break;
        case "pendingConfirm":
        case "pendingShipment":
          buttons.push({ text: "修改地址", type: "secondary", action: "editAddress" });
          buttons.push({ text: "申请退款", type: "secondary", action: "refund" });
          buttons.push({ text: "联系客服", type: "secondary", action: "contact" });
          break;
        case "pendingReceipt":
          buttons.push({ text: "确定收货", type: "primary", action: "confirmReceipt" });
          buttons.push({ text: "查看物流", type: "secondary", action: "logistics" });
          buttons.push({ text: "联系客服", type: "secondary", action: "contact" });
          break;
        case "completed":
          buttons.push({ text: "立即评价", type: "danger", action: "evaluate" });
          buttons.push({ text: "再次购买", type: "secondary", action: "buyAgain" });
          buttons.push({ text: "查看物流", type: "secondary", action: "logistics" });
          buttons.push({ text: "删除订单", type: "secondary", action: "deleteOrder" });
          break;
        case "cancelled":
          buttons.push({ text: "再次购买", type: "secondary", action: "buyAgain" });
          buttons.push({ text: "删除订单", type: "secondary", action: "deleteOrder" });
          break;
        default:
          buttons.push({ text: "查看详情", type: "secondary", action: "detail" });
      }
      return buttons;
    };
    const handleBtnClick = (action, order, index) => {
      activeMoreIndex.value = -1;
      switch (action) {
        case "pay":
          common_vendor.index.showToast({ title: "去支付: " + order.orderNo, icon: "none" });
          break;
        case "cancel":
          cancelOrder(order.orderNo, index);
          break;
        case "contact":
          common_vendor.index.showToast({ title: "联系客服...", icon: "none" });
          break;
        case "editAddress":
          common_vendor.index.showToast({ title: "修改地址: " + order.orderNo, icon: "none" });
          break;
        case "refund":
          common_vendor.index.showToast({ title: "申请退款: " + order.orderNo, icon: "none" });
          break;
        case "logistics":
          common_vendor.index.showToast({ title: "查看物流: " + order.orderNo, icon: "none" });
          break;
        case "confirmReceipt":
          common_vendor.index.showModal({
            title: "确认收货",
            content: "确认已收到商品？",
            success: async (res) => {
              if (res.confirm) {
                common_vendor.index.showLoading({ title: "处理中...", mask: true });
                try {
                  const apiRes = await utils_request.request({
                    url: "/api/order/confirmReceipt",
                    method: "PUT",
                    params: { orderNo: order.orderNo }
                  });
                  if (apiRes.success) {
                    if (apiRes.data && apiRes.data.status) {
                      orderList.value[index].status = apiRes.data.status;
                    }
                    await handleSearch();
                    common_vendor.index.showToast({ title: "确认收货成功", icon: "success" });
                  } else {
                    common_vendor.index.hideLoading();
                    common_vendor.index.showToast({ title: apiRes.message || "操作失败", icon: "none" });
                  }
                } catch (error) {
                  common_vendor.index.hideLoading();
                  common_vendor.index.__f__("error", "at pages/order/search/search.vue:226", "确认收货失败:", error);
                }
              }
            }
          });
          break;
        case "evaluate":
          common_vendor.index.showToast({ title: "去评价: " + order.orderNo, icon: "none" });
          break;
        case "buyAgain":
          common_vendor.index.showToast({ title: "再次购买: " + order.orderNo, icon: "none" });
          break;
        case "deleteOrder":
          common_vendor.index.showModal({
            title: "提示",
            content: "确定删除该订单吗？",
            success: async (res) => {
              if (res.confirm) {
                try {
                  const apiRes = await utils_request.request({
                    url: "/api/order/delete",
                    method: "DELETE",
                    params: { orderNo: order.orderNo }
                  });
                  if (apiRes.success) {
                    common_vendor.index.showToast({ title: "删除成功" });
                    orderList.value.splice(index, 1);
                  } else {
                    common_vendor.index.showToast({ title: apiRes.message || "删除失败", icon: "none" });
                  }
                } catch (error) {
                  common_vendor.index.showToast({ title: "网络异常", icon: "none" });
                }
              }
            }
          });
          break;
        case "detail":
          goToOrderDetail(order.orderNo);
          break;
      }
    };
    common_vendor.onLoad(() => {
      const history = common_vendor.index.getStorageSync("orderSearchHistory");
      if (history) {
        historyList.value = JSON.parse(history);
      }
    });
    const handleSearch = async () => {
      if (!keyword.value.trim()) {
        common_vendor.index.showToast({ title: "请输入搜索内容", icon: "none" });
        return;
      }
      saveHistory(keyword.value);
      common_vendor.index.showLoading({ title: "搜索中..." });
      try {
        const res = await utils_request.request({
          url: "/api/order/search",
          method: "GET",
          params: {
            searchCondition: keyword.value
          }
        });
        if (res.success || res.code === 200) {
          let list = [];
          const data = res.data || res.result;
          if (Array.isArray(data)) {
            list = data;
          } else if (data && Array.isArray(data.list)) {
            list = data.list;
          } else if (data && Array.isArray(data.records)) {
            list = data.records;
          }
          orderList.value = list;
          showResult.value = true;
        } else {
          common_vendor.index.showToast({ title: res.message || "搜索失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "网络异常", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const clickHistory = (item) => {
      keyword.value = item;
      handleSearch();
    };
    const saveHistory = (val) => {
      let history = [...historyList.value];
      const index = history.indexOf(val);
      if (index > -1) {
        history.splice(index, 1);
      }
      history.unshift(val);
      if (history.length > 10) {
        history.pop();
      }
      historyList.value = history;
      common_vendor.index.setStorageSync("orderSearchHistory", JSON.stringify(history));
    };
    const clearHistory = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定清空搜索历史吗？",
        success: (res) => {
          if (res.confirm) {
            historyList.value = [];
            common_vendor.index.removeStorageSync("orderSearchHistory");
          }
        }
      });
    };
    const clearKeyword = () => {
      keyword.value = "";
      showResult.value = false;
    };
    const formatTime = (time) => {
      if (!time)
        return "";
      const date = new Date(time);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
    };
    const getStatusText = (status) => {
      switch (status) {
        case "pendingPayment":
          return "待付款";
        case "pendingConfirm":
          return "待确认";
        case "pendingShipment":
          return "待发货";
        case "pendingReceipt":
          return "待收货";
        case "completed":
          return "已完成";
        case "cancelled":
          return "已取消";
        case "afterSale":
          return "售后";
        default:
          return status;
      }
    };
    const getStatusClass = (status) => {
      switch (status) {
        case "pendingPayment":
          return "pending-pay";
        case "pendingConfirm":
          return "pending-confirm";
        case "pendingShipment":
          return "pending-ship";
        case "pendingReceipt":
          return "pending-receipt";
        case "completed":
          return "completed";
        case "cancelled":
          return "cancelled";
        default:
          return "";
      }
    };
    const goToOrderDetail = (orderNo) => {
      common_vendor.index.navigateTo({ url: `/pages/order/detail/detail?orderNo=${orderNo}` });
    };
    const cancelOrder = (orderNo, index) => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要取消该订单吗？",
        success: async (res) => {
          if (res.confirm) {
            common_vendor.index.showLoading({ title: "处理中...", mask: true });
            try {
              const apiRes = await utils_request.request({
                url: "/api/order/cancel",
                method: "PUT",
                params: { orderNo }
              });
              if (apiRes.success) {
                if (apiRes.data && apiRes.data.status) {
                  orderList.value[index].status = apiRes.data.status;
                }
                await handleSearch();
                common_vendor.index.showToast({ title: "订单取消成功", icon: "success" });
              } else {
                common_vendor.index.hideLoading();
                common_vendor.index.showToast({ title: apiRes.message || "订单取消失败", icon: "none" });
              }
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/order/search/search.vue:443", "取消订单失败:", error);
            }
          }
        }
      });
    };
    const formatPrice = (price) => {
      const num = parseFloat(price);
      return isNaN(num) ? "0.00" : num.toFixed(2);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_assets._imports_0,
        b: common_vendor.o(handleSearch, "9c"),
        c: keyword.value,
        d: common_vendor.o(($event) => keyword.value = $event.detail.value, "14"),
        e: keyword.value
      }, keyword.value ? {
        f: common_assets._imports_1$8,
        g: common_vendor.o(clearKeyword, "74")
      } : {}, {
        h: common_vendor.o(handleSearch, "91"),
        i: historyList.value.length > 0 && !showResult.value
      }, historyList.value.length > 0 && !showResult.value ? {
        j: common_assets._imports_1$7,
        k: common_vendor.o(clearHistory, "0f"),
        l: common_vendor.f(historyList.value, (item, index, i0) => {
          return {
            a: common_vendor.t(item),
            b: index,
            c: common_vendor.o(($event) => clickHistory(item), index)
          };
        })
      } : {}, {
        m: showResult.value
      }, showResult.value ? common_vendor.e({
        n: orderList.value.length > 0
      }, orderList.value.length > 0 ? {
        o: common_vendor.f(orderList.value, (order, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(order.orderNo),
            b: common_vendor.t(formatTime(order.createTime)),
            c: common_vendor.t(getStatusText(order.status)),
            d: common_vendor.n(getStatusClass(order.status)),
            e: common_vendor.f(order.orderItems, (goods, gIndex, i1) => {
              return {
                a: goods.productImage,
                b: common_vendor.t(goods.productName),
                c: common_vendor.t(goods.specText || "默认规格"),
                d: common_vendor.t(goods.quantity),
                e: common_vendor.t(formatPrice(goods.price * goods.quantity)),
                f: gIndex
              };
            }),
            f: common_vendor.o(($event) => goToOrderDetail(order.orderNo), index),
            g: order.status === "completed"
          }, order.status === "completed" ? {
            h: common_vendor.f(5, (s, k1, i1) => {
              return {
                a: s
              };
            })
          } : {}, {
            i: common_vendor.t(formatPrice(order.totalAmount)),
            j: common_vendor.t(formatPrice(order.freight)),
            k: getButtons(order).length > 3
          }, getButtons(order).length > 3 ? common_vendor.e({
            l: common_vendor.o(($event) => toggleMore(index), index),
            m: activeMoreIndex.value === index
          }, activeMoreIndex.value === index ? {
            n: common_vendor.f(getButtons(order).slice(3), (btn, bIndex, i1) => {
              return {
                a: common_vendor.t(btn.text),
                b: bIndex,
                c: common_vendor.o(($event) => handleBtnClick(btn.action, order, index), bIndex)
              };
            })
          } : {}) : {}, {
            o: common_vendor.f(getButtons(order).slice(0, 3), (btn, bIndex, i1) => {
              return {
                a: common_vendor.t(btn.text),
                b: bIndex,
                c: common_vendor.n(btn.type),
                d: common_vendor.o(($event) => handleBtnClick(btn.action, order, index), bIndex)
              };
            }),
            p: index
          });
        })
      } : {
        p: common_assets._imports_3$2
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-502f1d08"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/order/search/search.js.map
