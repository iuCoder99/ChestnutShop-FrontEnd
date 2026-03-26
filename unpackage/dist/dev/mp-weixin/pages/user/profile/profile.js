"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
const _sfc_main = {
  __name: "profile",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const formData = common_vendor.ref({
      nickname: "",
      avatar: "",
      phone: ""
    });
    common_vendor.onLoad(() => {
      getUserDetail();
    });
    const getUserDetail = async () => {
      common_vendor.index.showLoading({ title: "加载中..." });
      try {
        const res = await utils_request.request({
          url: "/api/user/detail/get",
          method: "GET"
        });
        if (res.success) {
          formData.value = {
            nickname: res.data.nickname || "",
            avatar: res.data.avatar || "",
            phone: res.data.phone || ""
          };
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/profile/profile.vue:65", "获取用户信息失败:", error);
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const chooseAvatar = () => {
      common_vendor.index.__f__("log", "at pages/user/profile/profile.vue:73", "--- chooseAvatar triggered ---");
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          common_vendor.index.__f__("log", "at pages/user/profile/profile.vue:81", "--- chooseImage success ---", res.tempFilePaths);
          const tempFilePath = res.tempFilePaths[0];
          uploadAvatar(tempFilePath);
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/user/profile/profile.vue:86", "--- chooseImage fail ---", err);
          if (err.errMsg && err.errMsg.indexOf("cancel") === -1) {
            common_vendor.index.showToast({ title: "选择头像失败", icon: "none" });
          }
        }
      });
    };
    const uploadAvatar = async (filePath) => {
      common_vendor.index.showLoading({ title: "上传中..." });
      try {
        const res = await utils_request.upload({
          url: "/api/upload/image",
          filePath,
          name: "file"
        });
        if (res.success) {
          formData.value.avatar = res.data;
          common_vendor.index.showToast({ title: "上传成功", icon: "success" });
        } else {
          common_vendor.index.showToast({ title: res.message || "上传失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/profile/profile.vue:109", "上传头像失败:", error);
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const validatePhone = (phone) => {
      return /^1[3-9]\d{9}$/.test(phone);
    };
    const handleSave = async () => {
      if (!formData.value.nickname.trim()) {
        return common_vendor.index.showToast({ title: "昵称不能为空", icon: "none" });
      }
      if (formData.value.phone && !validatePhone(formData.value.phone)) {
        return common_vendor.index.showToast({ title: "手机号格式不正确", icon: "none" });
      }
      common_vendor.index.showLoading({ title: "保存中..." });
      try {
        const res = await utils_request.request({
          url: "/api/user/detail/update",
          method: "PUT",
          data: formData.value
        });
        if (res.success) {
          common_vendor.index.showToast({ title: "修改成功", icon: "success" });
          userStore.updateUserInfo(formData.value);
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
        } else {
          common_vendor.index.showToast({ title: res.message || "修改失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/profile/profile.vue:147", "更新用户信息失败:", error);
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    return (_ctx, _cache) => {
      return {
        a: formData.value.avatar || "/static/images/icon-user.png",
        b: common_assets._imports_1$3,
        c: common_vendor.o(chooseAvatar, "ab"),
        d: formData.value.nickname,
        e: common_vendor.o(($event) => formData.value.nickname = $event.detail.value, "6e"),
        f: formData.value.phone,
        g: common_vendor.o(($event) => formData.value.phone = $event.detail.value, "8e"),
        h: common_vendor.o(handleSave, "5f")
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-952fae71"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/user/profile/profile.js.map
