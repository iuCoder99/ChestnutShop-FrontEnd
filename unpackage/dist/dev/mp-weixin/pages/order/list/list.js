"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const utils_timeUtil = require("../../../utils/timeUtil.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
const _sfc_main = {
  __name: "list",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const statusList = common_vendor.ref([
      { label: "全部", value: "allPage" },
      { label: "待付款", value: "pendingPayPage" },
      { label: "打包中", value: "packagingPage" },
      { label: "待收货", value: "pendingReceiptPage" },
      { label: "评价", value: "pendingEvalPage" }
    ]);
    const currentStatus = common_vendor.ref("allPage");
    const orderList = common_vendor.ref([]);
    common_vendor.ref(1);
    const isLoadingMore = common_vendor.ref(false);
    const hasMore = common_vendor.ref(false);
    const activeMoreIndex = common_vendor.ref(-1);
    const countdownTexts = common_vendor.reactive({});
    let listTimer = null;
    const showEvalPopup = common_vendor.ref(false);
    const evalType = common_vendor.ref("first");
    const currentEvalOrder = common_vendor.ref(null);
    const evalForm = common_vendor.reactive({
      rating: 1,
      // 默认 1 星，确保用户至少给出一星评价
      content: "",
      imageUrls: [],
      isAnonymous: 0
    });
    const openEvalPopup = (order, type = "first") => {
      currentEvalOrder.value = order;
      evalType.value = type;
      evalForm.rating = 1;
      evalForm.content = "";
      evalForm.imageUrls = [];
      evalForm.isAnonymous = 0;
      showEvalPopup.value = true;
    };
    const closeEvalPopup = () => {
      showEvalPopup.value = false;
    };
    const uploadImg = () => {
      common_vendor.index.chooseImage({
        count: 3 - evalForm.imageUrls.length,
        success: (res) => {
          evalForm.imageUrls.push(...res.tempFilePaths);
        }
      });
    };
    const removeImg = (index) => {
      evalForm.imageUrls.splice(index, 1);
    };
    const submitEvaluation = async () => {
      if (evalType.value === "first" && evalForm.rating === 0) {
        common_vendor.index.showToast({ title: "请点击星星选择星级", icon: "none" });
        return;
      }
      if (!evalForm.content.trim()) {
        common_vendor.index.showToast({ title: "请输入评价内容", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "提交中...", mask: true });
      try {
        const isAppend = evalType.value === "append";
        const firstItem = currentEvalOrder.value.orderItems[0];
        let res;
        if (isAppend) {
          res = await utils_request.request({
            url: "/api/user/product/comment/firstComment/append",
            method: "POST",
            data: {
              productId: String(firstItem.productId || ""),
              orderNo: String(currentEvalOrder.value.orderNo || ""),
              // 仅传 orderNo
              content: evalForm.content,
              imageUrls: evalForm.imageUrls.map((url) => url.replace(/[`\s]/g, "")).join(",")
            }
          });
        } else {
          res = await utils_request.request({
            url: "/api/user/product/comment/firstComment/save",
            method: "POST",
            data: {
              productId: String(firstItem.productId || ""),
              productSpecId: String(firstItem.specId || firstItem.productSpecId || ""),
              productSpecText: firstItem.specText || "",
              orderNo: String(currentEvalOrder.value.orderNo || ""),
              // 明确使用 orderNo
              userNickname: userStore.userInfo.nickname || "用户",
              userAvatar: (userStore.userInfo.avatar || "/static/images/default-avatar.png").replace(/[`\s]/g, ""),
              content: evalForm.content,
              imageUrls: evalForm.imageUrls.map((url) => url.replace(/[`\s]/g, "")).join(","),
              rating: evalForm.rating,
              isAnonymous: evalForm.isAnonymous
            }
          });
        }
        if (res.success) {
          common_vendor.index.showToast({ title: "评价成功", icon: "success" });
          closeEvalPopup();
          setTimeout(() => {
            getOrderList();
          }, 500);
        } else {
          common_vendor.index.showToast({ title: res.message || "评价失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/order/list/list.vue:322", "评价失败:", error);
        common_vendor.index.showToast({ title: "网络异常", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const startListTimer = () => {
      if (listTimer)
        clearInterval(listTimer);
      const updateAllCountdowns = () => {
        let hasPending = false;
        orderList.value.forEach((order) => {
          if (order.status === "pendingPayment") {
            hasPending = true;
            const expireTimeMillis = new Date(order.createTime).getTime() + 30 * 60 * 1e3;
            if (utils_timeUtil.isExpired(expireTimeMillis)) {
              countdownTexts[order.orderNo] = "00:00";
              order.status = "cancelled";
            } else {
              countdownTexts[order.orderNo] = utils_timeUtil.formatCountdown(expireTimeMillis);
            }
          }
        });
        if (!hasPending) {
          clearInterval(listTimer);
          listTimer = null;
        }
      };
      updateAllCountdowns();
      listTimer = setInterval(updateAllCountdowns, 1e3);
    };
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
        case "evaluated":
        case "8":
          buttons.push({ text: "追加评价", type: "danger", action: "appendEvaluate" });
          buttons.push({ text: "再次购买", type: "secondary", action: "buyAgain" });
          buttons.push({ text: "查看物流", type: "secondary", action: "logistics" });
          buttons.push({ text: "删除订单", type: "secondary", action: "deleteOrder" });
          break;
        case "reviewed":
        case "9":
          buttons.push({ text: "已追评价", type: "disabled-btn", action: "alreadyReviewed" });
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
          common_vendor.index.navigateTo({
            url: `/pages/pay/index/index?orderNo=${order.orderNo}&amount=${order.totalAmount}`
          });
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
                    await getOrderList();
                    common_vendor.index.showToast({ title: "确认收货成功", icon: "success" });
                  } else {
                    common_vendor.index.hideLoading();
                    common_vendor.index.showToast({ title: apiRes.message || "操作失败", icon: "none" });
                  }
                } catch (error) {
                  common_vendor.index.hideLoading();
                  common_vendor.index.__f__("error", "at pages/order/list/list.vue:467", "确认收货失败:", error);
                }
              }
            }
          });
          break;
        case "evaluate":
          openEvalPopup(order, "first");
          break;
        case "appendEvaluate":
          openEvalPopup(order, "append");
          break;
        case "alreadyReviewed":
          common_vendor.index.showToast({ title: "小主,只能追评一次哦", icon: "none" });
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
    common_vendor.onLoad((options) => {
      if (!userStore.token) {
        common_vendor.index.navigateTo({ url: "/pages/main/login/login" });
        return;
      }
      if (options.pageName) {
        currentStatus.value = options.pageName;
      }
      getOrderList();
    });
    common_vendor.onNavigationBarButtonTap((e) => {
      common_vendor.index.navigateTo({ url: "/pages/order/search/search" });
    });
    common_vendor.onShow(() => {
      if (orderList.value.length > 0) {
        startListTimer();
      }
    });
    common_vendor.onUnload(() => {
      if (listTimer)
        clearInterval(listTimer);
    });
    const switchStatus = (status) => {
      currentStatus.value = status;
      orderList.value = [];
      getOrderList();
    };
    const getOrderList = async () => {
      isLoadingMore.value = true;
      try {
        const res = await utils_request.request({
          url: "/api/order/page/list",
          method: "GET",
          params: {
            pageName: currentStatus.value
          }
        });
        common_vendor.index.__f__("log", "at pages/order/list/list.vue:567", "Order List Response:", res);
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
          hasMore.value = false;
          startListTimer();
        } else {
          common_vendor.index.__f__("warn", "at pages/order/list/list.vue:589", "Order list request failed:", res.message || res.msg);
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "订单列表加载失败", icon: "none" });
      } finally {
        isLoadingMore.value = false;
      }
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
        case "evaluated":
        case "8":
          return "已评价";
        case "reviewed":
        case "9":
          return "已追评";
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
        case "evaluated":
        case "8":
          return "evaluated";
        case "reviewed":
        case "9":
          return "reviewed";
        case "cancelled":
          return "cancelled";
        default:
          return "";
      }
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
                await getOrderList();
                common_vendor.index.showToast({ title: "订单取消成功", icon: "success" });
              } else {
                common_vendor.index.hideLoading();
                common_vendor.index.showToast({ title: apiRes.message || "订单取消失败", icon: "none" });
              }
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/order/list/list.vue:681", "取消订单失败:", error);
            }
          }
        }
      });
    };
    const goToOrderDetail = (orderNo) => {
      common_vendor.index.navigateTo({ url: `/pages/order/detail/detail?orderNo=${orderNo}` });
    };
    const getEmptyText = () => {
      const item = statusList.value.find((item2) => item2.value === currentStatus.value);
      return item ? item.label + "订单" : "相关订单";
    };
    const formatPrice = (price) => {
      const num = parseFloat(price);
      return isNaN(num) ? "0.00" : num.toFixed(2);
    };
    return (_ctx, _cache) => {
      var _a, _b, _c, _d;
      return common_vendor.e({
        a: common_vendor.f(statusList.value, (item, index, i0) => {
          return {
            a: common_vendor.t(item.label),
            b: index,
            c: currentStatus.value === item.value ? 1 : "",
            d: common_vendor.o(($event) => switchStatus(item.value), index)
          };
        }),
        b: orderList.value.length > 0
      }, orderList.value.length > 0 ? {
        c: common_vendor.f(orderList.value, (order, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(order.orderNo),
            b: common_vendor.t(formatTime(order.createTime)),
            c: order.status === "pendingPayment" && countdownTexts[order.orderNo]
          }, order.status === "pendingPayment" && countdownTexts[order.orderNo] ? {
            d: common_vendor.t(countdownTexts[order.orderNo])
          } : {}, {
            e: common_vendor.t(getStatusText(order.status)),
            f: common_vendor.n(getStatusClass(order.status)),
            g: common_vendor.f(order.orderItems, (goods, gIndex, i1) => {
              return {
                a: goods.productImage,
                b: common_vendor.t(goods.productName),
                c: common_vendor.t(goods.specText || "默认规格"),
                d: common_vendor.t(goods.quantity),
                e: common_vendor.t(formatPrice(goods.price * goods.quantity)),
                f: gIndex
              };
            }),
            h: common_vendor.o(($event) => goToOrderDetail(order.orderNo), index),
            i: order.status === "completed" || order.status === "8" || order.status === "evaluated"
          }, order.status === "completed" || order.status === "8" || order.status === "evaluated" ? {
            j: common_vendor.t(order.status === "8" || order.status === "evaluated" ? "评价已完成，还可以追加评价哦" : "商品好不好，评价一下吧"),
            k: common_vendor.f(5, (s, k1, i1) => {
              return {
                a: s
              };
            }),
            l: order.status === "8" || order.status === "evaluated" ? "#FFB800" : "#E5E5E5"
          } : {}, {
            m: common_vendor.t(formatPrice(order.totalAmount)),
            n: common_vendor.t(formatPrice(order.freight)),
            o: getButtons(order).length > 3
          }, getButtons(order).length > 3 ? common_vendor.e({
            p: common_vendor.o(($event) => toggleMore(index), index),
            q: activeMoreIndex.value === index
          }, activeMoreIndex.value === index ? {
            r: common_vendor.f(getButtons(order).slice(3), (btn, bIndex, i1) => {
              return {
                a: common_vendor.t(btn.text),
                b: bIndex,
                c: common_vendor.o(($event) => handleBtnClick(btn.action, order, index), bIndex)
              };
            })
          } : {}) : {}, {
            s: common_vendor.f(getButtons(order).slice(0, 3), (btn, bIndex, i1) => {
              return {
                a: common_vendor.t(btn.text),
                b: bIndex,
                c: common_vendor.n(btn.type),
                d: common_vendor.o(($event) => handleBtnClick(btn.action, order, index), bIndex)
              };
            }),
            t: index
          });
        })
      } : !isLoadingMore.value ? {
        e: common_assets._imports_3$1,
        f: common_vendor.t(getEmptyText()),
        g: common_vendor.o((...args) => _ctx.goToHome && _ctx.goToHome(...args), "51")
      } : {}, {
        d: !isLoadingMore.value,
        h: isLoadingMore.value
      }, isLoadingMore.value ? {} : {}, {
        i: showEvalPopup.value
      }, showEvalPopup.value ? common_vendor.e({
        j: common_vendor.t(evalType.value === "append" ? "追加评价" : "商品评价"),
        k: common_vendor.o(closeEvalPopup, "cf"),
        l: ((_b = (_a = currentEvalOrder.value) == null ? void 0 : _a.orderItems) == null ? void 0 : _b.length) > 0
      }, ((_d = (_c = currentEvalOrder.value) == null ? void 0 : _c.orderItems) == null ? void 0 : _d.length) > 0 ? {
        m: currentEvalOrder.value.orderItems[0].productImage,
        n: common_vendor.t(currentEvalOrder.value.orderItems[0].productName),
        o: common_vendor.t(currentEvalOrder.value.orderItems[0].specText || "默认规格")
      } : {}, {
        p: evalType.value === "first"
      }, evalType.value === "first" ? {
        q: common_vendor.f(5, (s, k0, i0) => {
          return {
            a: s,
            b: evalForm.rating >= s ? 1 : "",
            c: common_vendor.o(($event) => evalForm.rating = s, s)
          };
        })
      } : {}, {
        r: evalForm.content,
        s: common_vendor.o(($event) => evalForm.content = $event.detail.value, "d8"),
        t: common_vendor.f(evalForm.imageUrls, (img, idx, i0) => {
          return {
            a: img,
            b: common_vendor.o(($event) => removeImg(idx), idx),
            c: idx
          };
        }),
        v: evalForm.imageUrls.length < 3
      }, evalForm.imageUrls.length < 3 ? {
        w: common_vendor.o(uploadImg, "b2")
      } : {}, {
        x: evalType.value === "first"
      }, evalType.value === "first" ? {
        y: evalForm.isAnonymous === 1 ? 1 : "",
        z: common_vendor.o(($event) => evalForm.isAnonymous = evalForm.isAnonymous === 1 ? 0 : 1, "bc")
      } : {}, {
        A: common_vendor.o(submitEvaluation, "eb"),
        B: common_vendor.o(() => {
        }, "47"),
        C: common_vendor.o(closeEvalPopup, "9f")
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-0e562ae0"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/order/list/list.js.map
