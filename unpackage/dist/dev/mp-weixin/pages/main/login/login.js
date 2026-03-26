"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const store_modules_chatStore = require("../../../store/modules/chatStore.js");
const utils_websocket = require("../../../utils/websocket.js");
const utils_request = require("../../../utils/request.js");
const _sfc_main = {
  __name: "login",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const chatStore = store_modules_chatStore.useChatStore();
    const isRegisterMode = common_vendor.ref(false);
    const accountForm = common_vendor.ref({ username: "", password: "" });
    const registerForm = common_vendor.ref({ username: "", password: "", phone: "" });
    const showPassword = common_vendor.ref(false);
    const isLoginIng = common_vendor.ref(false);
    const forgetModalVisible = common_vendor.ref(false);
    const toggleRegisterMode = (mode) => {
      isRegisterMode.value = mode;
      showPassword.value = false;
    };
    const togglePassword = () => {
      showPassword.value = !showPassword.value;
    };
    const goBack = () => {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        common_vendor.index.navigateBack();
      } else {
        common_vendor.index.reLaunch({
          url: "/pages/main/index/index"
        });
      }
    };
    const validatePhone = (phone) => {
      return /^1[3-9]\d{9}$/.test(phone);
    };
    const handleForgetPassword = () => {
      forgetModalVisible.value = true;
    };
    const handleRegister = async () => {
      if (isLoginIng.value)
        return;
      const { username, password, phone } = registerForm.value;
      if (!username.trim())
        return common_vendor.index.showToast({ title: "请输入用户名", icon: "none" });
      if (!password.trim())
        return common_vendor.index.showToast({ title: "请输入密码", icon: "none" });
      if (!phone.trim())
        return common_vendor.index.showToast({ title: "请输入手机号", icon: "none" });
      if (!validatePhone(phone))
        return common_vendor.index.showToast({ title: "手机号格式错误", icon: "none" });
      isLoginIng.value = true;
      common_vendor.index.showLoading({ title: "正在注册...", mask: true });
      try {
        const res = await utils_request.request({
          url: "/api/user/create/account",
          method: "POST",
          params: { username, password, phone },
          data: {}
        });
        if (res && res.success) {
          common_vendor.index.showToast({ title: "注册成功，请登录", icon: "success" });
          toggleRegisterMode(false);
          accountForm.value.username = username;
        } else {
          common_vendor.index.showToast({ title: res.message || "注册失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/main/login/login.vue:187", "注册异常:", error);
        common_vendor.index.showToast({ title: "网络请求失败", icon: "none" });
      } finally {
        isLoginIng.value = false;
        common_vendor.index.hideLoading();
      }
    };
    const handleLoginSuccess = async (resData) => {
      const token = resData.accessToken || resData.token;
      const userInfo = resData.userInfo;
      if (!token || !userInfo) {
        common_vendor.index.showToast({ title: "登录数据异常", icon: "none" });
        return;
      }
      try {
        userStore.setUserInfo(resData);
        utils_websocket.socketService.connect(token);
        utils_websocket.socketService.on("PUSH_MSG", (data) => chatStore.handlePushMsg(data));
        utils_websocket.socketService.on("MSG_ACK", (data) => chatStore.handleMsgAck(data));
        common_vendor.index.showToast({
          title: "登录成功",
          icon: "success",
          duration: 1500
        });
        mergeLocalCart().catch((err) => common_vendor.index.__f__("error", "at pages/main/login/login.vue:220", "合并购物车失败:", err));
        setTimeout(() => {
          common_vendor.index.reLaunch({
            url: "/pages/main/index/index"
          });
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/main/login/login.vue:228", "处理登录成功逻辑异常:", error);
        common_vendor.index.showToast({ title: "登录处理失败", icon: "none" });
      }
    };
    const accountLogin = async () => {
      if (isLoginIng.value)
        return;
      const username = accountForm.value.username.trim();
      const password = accountForm.value.password.trim();
      if (!username)
        return common_vendor.index.showToast({ title: "请输入用户名", icon: "none" });
      if (!password)
        return common_vendor.index.showToast({ title: "请输入密码", icon: "none" });
      isLoginIng.value = true;
      common_vendor.index.showLoading({ title: "正在登录...", mask: true });
      try {
        const res = await utils_request.request({
          url: "/api/user/login/account",
          method: "POST",
          data: { username, password },
          timeout: 2e4
        });
        if (res && res.success) {
          common_vendor.index.hideLoading();
          await handleLoginSuccess(res.data);
        } else {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({ title: res ? res.message : "用户名或密码错误", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: "网络连接异常，请稍后重试", icon: "none" });
      } finally {
        isLoginIng.value = false;
      }
    };
    const mergeLocalCart = async () => {
      try {
        const tempCart = common_vendor.index.getStorageSync("cartTemp") || [];
        if (tempCart.length === 0)
          return;
        await utils_request.request({
          url: "/api/cart/merge",
          method: "POST",
          data: { cartItems: tempCart }
        });
        common_vendor.index.removeStorageSync("cartTemp");
      } catch (error) {
        common_vendor.index.__f__("warn", "at pages/main/login/login.vue:281", "购物车合并失败:", error);
      }
    };
    common_vendor.onLoad(() => {
      const token = common_vendor.index.getStorageSync("token");
      if (token) {
        common_vendor.index.reLaunch({ url: "/pages/main/index/index" });
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_assets._imports_0$8,
        b: !isRegisterMode.value
      }, !isRegisterMode.value ? common_vendor.e({
        c: common_assets._imports_1$9,
        d: accountForm.value.username,
        e: common_vendor.o(($event) => accountForm.value.username = $event.detail.value, "76"),
        f: common_assets._imports_2$2,
        g: !showPassword.value,
        h: accountForm.value.password,
        i: common_vendor.o(($event) => accountForm.value.password = $event.detail.value, "4c"),
        j: showPassword.value ? "/static/images/icon-hide.png" : "/static/images/icon-show.png",
        k: common_vendor.o(togglePassword, "a4"),
        l: isLoginIng.value
      }, isLoginIng.value ? {} : {}, {
        m: common_vendor.o(accountLogin, "59"),
        n: isLoginIng.value,
        o: common_vendor.o(goBack, "c0"),
        p: common_vendor.o(($event) => toggleRegisterMode(true), "f9"),
        q: common_vendor.o(handleForgetPassword, "bd")
      }) : common_vendor.e({
        r: common_assets._imports_1$9,
        s: registerForm.value.username,
        t: common_vendor.o(($event) => registerForm.value.username = $event.detail.value, "1f"),
        v: common_assets._imports_2$2,
        w: !showPassword.value,
        x: registerForm.value.password,
        y: common_vendor.o(($event) => registerForm.value.password = $event.detail.value, "54"),
        z: common_assets._imports_3$3,
        A: registerForm.value.phone,
        B: common_vendor.o(($event) => registerForm.value.phone = $event.detail.value, "9c"),
        C: isLoginIng.value
      }, isLoginIng.value ? {} : {}, {
        D: common_vendor.o(handleRegister, "ee"),
        E: isLoginIng.value,
        F: common_vendor.o(($event) => toggleRegisterMode(false), "ca")
      }), {
        G: forgetModalVisible.value
      }, forgetModalVisible.value ? {
        H: common_vendor.o(($event) => forgetModalVisible.value = false, "aa")
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-deb4a67a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/main/login/login.js.map
