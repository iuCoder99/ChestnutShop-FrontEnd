"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const store_modules_chatStore = require("../../../store/modules/chatStore.js");
const utils_websocket = require("../../../utils/websocket.js");
const utils_api = require("../../../utils/api.js");
const _sfc_main = {
  __name: "consult",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const chatStore = store_modules_chatStore.useChatStore();
    const viewMode = common_vendor.ref("LIST");
    const currentContact = common_vendor.ref(null);
    const currentProductId = common_vendor.ref(null);
    const showProductBar = common_vendor.ref(false);
    const inputContent = common_vendor.ref("");
    const isRefreshing = common_vendor.ref(false);
    const scrollTop = common_vendor.ref(0);
    const scrollIntoView = common_vendor.ref("");
    const productInfos = common_vendor.ref({});
    common_vendor.onLoad((options) => {
      if (!userStore.token) {
        common_vendor.index.reLaunch({ url: "/pages/main/login/login" });
        return;
      }
      if (!utils_websocket.socketService.isConnected) {
        utils_websocket.socketService.connect(userStore.token);
      }
      if (options.productId) {
        const contactId = 1002;
        currentProductId.value = parseInt(options.productId);
        showProductBar.value = true;
        startChatWithContact(contactId, currentProductId.value);
      } else if (options.contactId) {
        startChatWithContact(parseInt(options.contactId));
      } else {
        viewMode.value = "LIST";
        common_vendor.index.setNavigationBarTitle({ title: "我的咨询" });
        chatStore.fetchSessions();
      }
    });
    common_vendor.onUnload(() => {
      chatStore.setCurrentContact(null);
    });
    common_vendor.onBackPress((e) => {
      if (viewMode.value === "CHAT") {
        handleBack();
        return true;
      }
      return false;
    });
    common_vendor.watch(() => chatStore.messages.length, (newLen) => {
      if (newLen > 0) {
        scrollToBottom();
        const lastMsg = chatStore.messages[newLen - 1];
        if (lastMsg.productId) {
          fetchProductInfo(lastMsg.productId);
        }
      }
    }, { immediate: true });
    const startChatWithContact = async (contactId, productId = null) => {
      viewMode.value = "CHAT";
      currentContact.value = { contactId, contactNickname: "在线客服" };
      common_vendor.index.setNavigationBarTitle({ title: "在线客服" });
      chatStore.setCurrentContact(contactId);
      await chatStore.fetchHistory(contactId);
      const session = chatStore.sessions.find((s) => s.contactId === contactId);
      if (session) {
        currentContact.value = session;
        common_vendor.index.setNavigationBarTitle({ title: session.contactNickname });
      }
      if (productId) {
        fetchProductInfo(productId);
      }
      const allProductIds = chatStore.messages.filter((m) => m.productId).map((m) => m.productId);
      if (allProductIds.length > 0) {
        fetchProductInfo([...new Set(allProductIds)]);
      }
      scrollToBottom();
    };
    const enterChat = (session) => {
      currentContact.value = session;
      viewMode.value = "CHAT";
      common_vendor.index.setNavigationBarTitle({ title: session.contactNickname });
      chatStore.setCurrentContact(session.contactId);
      chatStore.fetchHistory(session.contactId);
      const productIds = chatStore.messages.filter((m) => m.productId).map((m) => m.productId);
      if (productIds.length > 0) {
        fetchProductInfo([...new Set(productIds)]);
      }
    };
    const handleBack = () => {
      if (viewMode.value === "CHAT") {
        viewMode.value = "LIST";
        currentContact.value = null;
        common_vendor.index.setNavigationBarTitle({ title: "我的咨询" });
        chatStore.setCurrentContact(null);
        chatStore.fetchSessions();
      } else {
        common_vendor.index.navigateBack();
      }
    };
    const onRefresh = async () => {
      isRefreshing.value = true;
      await chatStore.fetchSessions();
      isRefreshing.value = false;
    };
    const isMyMsg = (msg) => {
      if (!msg || !userStore.userInfo)
        return false;
      return String(msg.fromUserId) === String(userStore.userInfo.id);
    };
    const sendMessage = () => {
      const content = inputContent.value.trim();
      if (!content || !currentContact.value)
        return;
      if (!utils_websocket.socketService.isConnected) {
        common_vendor.index.showToast({ title: "连接已断开，正在重连...", icon: "none" });
        utils_websocket.socketService.connect(userStore.token);
        return;
      }
      const success = utils_websocket.socketService.sendMessage({
        toUserId: currentContact.value.contactId,
        content,
        productId: null
        // 普通文本不带商品ID
      });
      if (success) {
        const newMsg = {
          id: Date.now(),
          fromUserId: userStore.userInfo.id,
          toUserId: currentContact.value.contactId,
          content,
          productId: null,
          createTime: (/* @__PURE__ */ new Date()).toISOString()
        };
        chatStore.messages.push(newMsg);
        inputContent.value = "";
        scrollToBottom();
      } else {
        common_vendor.index.showToast({ title: "发送失败，请重试", icon: "none" });
      }
    };
    const sendProductMessage = () => {
      if (!currentProductId.value || !currentContact.value)
        return;
      if (!utils_websocket.socketService.isConnected) {
        common_vendor.index.showToast({ title: "连接已断开，正在重连...", icon: "none" });
        utils_websocket.socketService.connect(userStore.token);
        return;
      }
      const success = utils_websocket.socketService.sendMessage({
        toUserId: currentContact.value.contactId,
        content: "我对这个商品感兴趣，想咨询一下",
        productId: currentProductId.value
      });
      if (success) {
        const newMsg = {
          id: Date.now(),
          fromUserId: userStore.userInfo.id,
          toUserId: currentContact.value.contactId,
          content: "我对这个商品感兴趣，想咨询一下",
          productId: currentProductId.value,
          createTime: (/* @__PURE__ */ new Date()).toISOString()
        };
        chatStore.messages.push(newMsg);
        showProductBar.value = false;
        scrollToBottom();
      } else {
        common_vendor.index.showToast({ title: "发送失败，请重试", icon: "none" });
      }
    };
    const fetchProductInfo = async (ids) => {
      const idArray = Array.isArray(ids) ? ids : [ids];
      const missingIds = idArray.filter((id) => id && !productInfos.value[id]);
      if (missingIds.length === 0)
        return;
      try {
        const res = await utils_api.productApi.getProductBriefList(missingIds);
        if (res.success && res.data) {
          res.data.forEach((p) => {
            productInfos.value[p.id] = p;
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/user/consult/consult.vue:348", "Failed to fetch product brief info:", e);
      }
    };
    const goToProduct = (id) => {
      common_vendor.index.navigateTo({ url: `/pages/product/detail/detail?productId=${id}` });
    };
    const scrollToBottom = () => {
      common_vendor.nextTick$1(() => {
        setTimeout(() => {
          scrollIntoView.value = "msg-" + (chatStore.messages.length - 1);
        }, 200);
      });
    };
    const formatTime = (time) => {
      if (!time)
        return "";
      const date = new Date(time);
      const now = /* @__PURE__ */ new Date();
      if (date.toDateString() === now.toDateString()) {
        return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      }
      return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    };
    return (_ctx, _cache) => {
      var _a, _b, _c;
      return common_vendor.e({
        a: viewMode.value === "LIST"
      }, viewMode.value === "LIST" ? common_vendor.e({
        b: common_vendor.unref(chatStore).sessions.length === 0
      }, common_vendor.unref(chatStore).sessions.length === 0 ? {
        c: common_assets._imports_0$2
      } : {}, {
        d: common_vendor.f(common_vendor.unref(chatStore).sessions, (session, k0, i0) => {
          return common_vendor.e({
            a: session.contactAvatar || "/static/images/icon-user.png",
            b: session.unreadCount > 0
          }, session.unreadCount > 0 ? {
            c: common_vendor.t(session.unreadCount > 99 ? "99+" : session.unreadCount)
          } : {}, {
            d: common_vendor.t(session.contactNickname),
            e: common_vendor.t(formatTime(session.lastMsgTime)),
            f: common_vendor.t(session.lastMsgContent),
            g: session.contactId,
            h: common_vendor.o(($event) => enterChat(session), session.contactId)
          });
        }),
        e: common_vendor.o(onRefresh, "50"),
        f: isRefreshing.value
      }) : common_vendor.e({
        g: common_vendor.f(common_vendor.unref(chatStore).messages, (msg, index, i0) => {
          var _a2, _b2, _c2, _d;
          return common_vendor.e({
            a: isMyMsg(msg) ? common_vendor.unref(userStore).userInfo.avatar || "/static/images/icon-user.png" : ((_a2 = currentContact.value) == null ? void 0 : _a2.contactAvatar) || "/static/images/icon-user.png",
            b: msg.productId
          }, msg.productId ? {
            c: ((_b2 = productInfos.value[msg.productId]) == null ? void 0 : _b2.image) || "/static/images/default-category.png",
            d: common_vendor.t(((_c2 = productInfos.value[msg.productId]) == null ? void 0 : _c2.name) || "商品加载中..."),
            e: common_vendor.t(((_d = productInfos.value[msg.productId]) == null ? void 0 : _d.price) || "0.00"),
            f: common_vendor.o(($event) => goToProduct(msg.productId), msg.id || index)
          } : {}, {
            g: common_vendor.t(msg.content),
            h: common_vendor.t(formatTime(msg.createTime)),
            i: msg.id || index,
            j: "msg-" + index,
            k: common_vendor.n(isMyMsg(msg) ? "msg-right" : "msg-left")
          });
        }),
        h: scrollTop.value,
        i: scrollIntoView.value,
        j: currentProductId.value && showProductBar.value
      }, currentProductId.value && showProductBar.value ? {
        k: ((_a = productInfos.value[currentProductId.value]) == null ? void 0 : _a.image) || "/static/images/default-category.png",
        l: common_vendor.t(((_b = productInfos.value[currentProductId.value]) == null ? void 0 : _b.name) || "商品加载中..."),
        m: common_vendor.t(((_c = productInfos.value[currentProductId.value]) == null ? void 0 : _c.price) || "0.00"),
        n: common_vendor.o(($event) => goToProduct(currentProductId.value), "9f"),
        o: common_vendor.o(sendProductMessage, "00"),
        p: common_assets._imports_1$8,
        q: common_vendor.o(($event) => showProductBar.value = false, "4f")
      } : {}, {
        r: common_vendor.o(sendMessage, "5c"),
        s: inputContent.value,
        t: common_vendor.o(($event) => inputContent.value = $event.detail.value, "70"),
        v: common_vendor.o(sendMessage, "36"),
        w: !inputContent.value.trim()
      }));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c1b99c8c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/user/consult/consult.js.map
