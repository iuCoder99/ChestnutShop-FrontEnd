"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const store_modules_chatStore = require("../../../store/modules/chatStore.js");
const utils_request = require("../../../utils/request.js");
if (!Math) {
  TopNavbar();
}
const TopNavbar = () => "../../../components/business/TopNavbar.js";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const chatStore = store_modules_chatStore.useChatStore();
    const userInfo = common_vendor.ref({
      nickname: "",
      avatar: "",
      userType: "PERSONAL",
      isEnterpriseAuth: false,
      openid: ""
      // 存储openid
    });
    common_vendor.onShow(() => {
      if (!userStore.token) {
        userInfo.value = {
          nickname: "",
          avatar: "",
          userType: "PERSONAL",
          isEnterpriseAuth: false,
          openid: ""
        };
        return;
      }
      const storeUserInfo = userStore.userInfo;
      if (storeUserInfo && Object.keys(storeUserInfo).length > 0) {
        userInfo.value = { ...storeUserInfo };
      } else {
        getUserDetail();
      }
      chatStore.fetchSessions();
    });
    const getUserDetail = async () => {
      common_vendor.index.showLoading({ title: "加载中" });
      try {
        const res = await utils_request.request({
          url: "/api/user/detail/get",
          method: "GET"
        });
        if (res.success) {
          userInfo.value = res.data;
          userStore.setUserInfo(res.data);
          common_vendor.index.setStorageSync("userInfo", res.data);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/index/index.vue:189", "获取用户信息失败:", error);
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const handleUserClick = () => {
      if (!userStore.token) {
        common_vendor.index.navigateTo({ url: "/pages/main/login/login" });
      } else {
        common_vendor.index.navigateTo({ url: "/pages/user/profile/profile" });
      }
    };
    const goToEnterpriseAuth = () => {
      common_vendor.index.navigateTo({ url: "/pages/order/enterprise-auth" });
    };
    const goToOrderList = (pageName = "allPage") => {
      common_vendor.index.navigateTo({ url: `/pages/order/list/list?pageName=${pageName}` });
    };
    const goToCollection = () => {
      common_vendor.index.navigateTo({ url: "/pages/collection/index/index" });
    };
    const goToConsult = () => {
      common_vendor.index.navigateTo({ url: "/pages/user/consult/consult" });
    };
    const goToFeedback = () => {
      common_vendor.index.navigateTo({ url: "/pages/user/feedback/feedback" });
    };
    const goToAbout = () => {
      common_vendor.index.navigateTo({ url: "/pages/user/about/about" });
    };
    const goToAddressList = () => {
      common_vendor.index.navigateTo({ url: "/pages/address/list/list" });
    };
    const logout = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            userStore.logout();
            userInfo.value = {
              nickname: "",
              avatar: "",
              userType: "PERSONAL",
              isEnterpriseAuth: false,
              openid: ""
            };
            common_vendor.index.showToast({ title: "已退出登录", icon: "none" });
            setTimeout(() => {
              common_vendor.index.navigateTo({ url: "/pages/main/login/login" });
            }, 1e3);
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          activePage: "user"
        }),
        b: userInfo.value.avatar || "/static/images/icon-user.png",
        c: common_vendor.t(common_vendor.unref(userStore).token ? userInfo.value.nickname || "匿名用户" : "未登录"),
        d: common_vendor.unref(userStore).token
      }, common_vendor.unref(userStore).token ? common_vendor.e({
        e: common_vendor.t(userInfo.value.userType === "ENTERPRISE" ? "企业用户" : "个人用户"),
        f: common_vendor.n(userInfo.value.userType === "ENTERPRISE" ? "role-enterprise" : "role-personal"),
        g: userInfo.value.userType === "ENTERPRISE"
      }, userInfo.value.userType === "ENTERPRISE" ? common_vendor.e({
        h: common_vendor.t(userInfo.value.isEnterpriseAuth ? "已认证" : "未认证"),
        i: !userInfo.value.isEnterpriseAuth
      }, !userInfo.value.isEnterpriseAuth ? {
        j: common_vendor.o(goToEnterpriseAuth, "16")
      } : {}) : {}) : {}, {
        k: common_vendor.unref(userStore).token && userInfo.value.openid
      }, common_vendor.unref(userStore).token && userInfo.value.openid ? {
        l: common_vendor.t(userInfo.value.openid.slice(0, 8)),
        m: common_vendor.t(userInfo.value.openid.slice(-4))
      } : {}, {
        n: common_vendor.unref(userStore).token
      }, common_vendor.unref(userStore).token ? {
        o: common_assets._imports_1$4,
        p: common_vendor.o(goToAddressList, "37")
      } : {}, {
        q: common_vendor.o(handleUserClick, "72"),
        r: common_assets._imports_1$4,
        s: common_vendor.o(($event) => goToOrderList("allPage"), "18"),
        t: common_assets._imports_1$5,
        v: common_vendor.o(($event) => goToOrderList("pendingPayPage"), "71"),
        w: common_assets._imports_2$1,
        x: common_vendor.o(($event) => goToOrderList("packagingPage"), "8d"),
        y: common_assets._imports_3,
        z: common_vendor.o(($event) => goToOrderList("pendingReceiptPage"), "92"),
        A: common_assets._imports_0$2,
        B: common_vendor.o(($event) => goToOrderList("pendingEvalPage"), "b3"),
        C: common_assets._imports_5,
        D: common_assets._imports_1$4,
        E: common_vendor.o(goToCollection, "4a"),
        F: common_assets._imports_0$2,
        G: common_vendor.unref(chatStore).unreadTotal > 0
      }, common_vendor.unref(chatStore).unreadTotal > 0 ? {
        H: common_vendor.t(common_vendor.unref(chatStore).unreadTotal > 99 ? "99+" : common_vendor.unref(chatStore).unreadTotal)
      } : {}, {
        I: common_assets._imports_1$4,
        J: common_vendor.o(goToConsult, "71"),
        K: common_assets._imports_6,
        L: common_assets._imports_1$4,
        M: common_vendor.o(goToFeedback, "70"),
        N: common_assets._imports_7,
        O: common_assets._imports_1$4,
        P: common_vendor.o(goToAbout, "e7"),
        Q: common_assets._imports_8,
        R: common_assets._imports_1$4,
        S: common_vendor.o(logout, "7d")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-dd0dcdf8"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/user/index/index.js.map
