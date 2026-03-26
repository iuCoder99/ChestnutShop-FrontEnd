"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const store_modules_userStore = require("./store/modules/userStore.js");
const store_modules_chatStore = require("./store/modules/chatStore.js");
const utils_websocket = require("./utils/websocket.js");
const store_index = require("./store/index.js");
const utils_request = require("./utils/request.js");
if (!Math) {
  "./pages/main/index/index.js";
  "./pages/project/detail/detail.js";
  "./pages/cart/index/index.js";
  "./pages/order/confirm/confirm.js";
  "./pages/address/list/list.js";
  "./pages/user/index/index.js";
  "./pages/user/profile/profile.js";
  "./pages/order/list/list.js";
  "./pages/order/search/search.js";
  "./pages/order/logistics/logistics.js";
  "./pages/order/enterprise-auth/enterprise-auth.js";
  "./pages/address/edit/edit.js";
  "./pages/collection/index/index.js";
  "./pages/user/feedback/feedback.js";
  "./pages/user/about/about.js";
  "./pages/product/category/category.js";
  "./pages/pay/success/success.js";
  "./pages/order/detail/detail.js";
  "./pages/pay/index/index.js";
  "./pages/main/login/login.js";
  "./pages/pay/fail/fail.js";
  "./pages/product/search/search.js";
  "./pages/product/detail/detail.js";
  "./pages/user/consult/consult.js";
  "./pages/product/list/list.js";
  "./pages/product/comment/comment.js";
}
const _sfc_main = {
  __name: "App",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const chatStore = store_modules_chatStore.useChatStore();
    common_vendor.onLaunch(() => {
      common_vendor.index.__f__("log", "at App.vue:11", "App Launch");
      if (userStore.token) {
        initWebSocket();
      }
    });
    common_vendor.onShow(() => {
      common_vendor.index.__f__("log", "at App.vue:20", "App Show");
    });
    common_vendor.onHide(() => {
      common_vendor.index.__f__("log", "at App.vue:24", "App Hide");
    });
    const initWebSocket = () => {
      utils_websocket.socketService.connect(userStore.token);
      utils_websocket.socketService.on("PUSH_MSG", (data) => {
        chatStore.handlePushMsg(data);
      });
      utils_websocket.socketService.on("MSG_ACK", (data) => {
        chatStore.handleMsgAck(data);
      });
    };
    return () => {
    };
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  app.use(store_index.pinia);
  app.config.globalProperties.$http = utils_request.request;
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
