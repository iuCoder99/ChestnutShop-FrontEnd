"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
if (!Math) {
  TopNavbar();
}
const TopNavbar = () => "../../../components/business/TopNavbar.js";
const _sfc_main = {
  __name: "feedback",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const feedbackForm = common_vendor.ref({
      content: "",
      // 反馈内容
      images: [],
      // 上传图片URL列表
      contact: ""
      // 联系方式
    });
    const isSubmitting = common_vendor.ref(false);
    common_vendor.watch(() => feedbackForm.value.content, (val) => {
      if (val && val.length > 500) {
        feedbackForm.value.content = val.slice(0, 500);
      }
    });
    common_vendor.onLoad(() => {
      if (!userStore.token) {
        common_vendor.index.navigateTo({ url: "/pages/main/login/login" });
      }
    });
    const previewImage = (index) => {
      common_vendor.index.previewImage({
        current: index,
        urls: feedbackForm.value.images
      });
    };
    const chooseImage = () => {
      common_vendor.index.__f__("log", "at pages/user/feedback/feedback.vue:107", "--- chooseImage triggered ---");
      const count = 3 - feedbackForm.value.images.length;
      if (common_vendor.index.chooseMedia) {
        common_vendor.index.chooseMedia({
          count,
          mediaType: ["image"],
          sourceType: ["album", "camera"],
          success: (res) => {
            common_vendor.index.__f__("log", "at pages/user/feedback/feedback.vue:118", "--- chooseMedia success ---", res.tempFiles);
            res.tempFiles.forEach((file) => {
              uploadImage(file.tempFilePath);
            });
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/user/feedback/feedback.vue:124", "--- chooseMedia fail ---", err);
            if (err.errMsg && err.errMsg.indexOf("cancel") === -1) {
              common_vendor.index.showToast({ title: "选择图片失败", icon: "none" });
            }
          }
        });
      } else {
        common_vendor.index.chooseImage({
          count,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"],
          success: (res) => {
            common_vendor.index.__f__("log", "at pages/user/feedback/feedback.vue:137", "--- chooseImage success ---", res.tempFilePaths);
            res.tempFilePaths.forEach((tempPath) => {
              uploadImage(tempPath);
            });
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/user/feedback/feedback.vue:143", "--- chooseImage fail ---", err);
            if (err.errMsg && err.errMsg.indexOf("cancel") === -1) {
              common_vendor.index.showToast({ title: "选择图片失败", icon: "none" });
            }
          }
        });
      }
    };
    const uploadImage = async (filePath) => {
      common_vendor.index.showLoading({ title: "图片上传中" });
      try {
        const res = await utils_request.upload({
          url: "/api/upload/image",
          filePath,
          name: "file"
        });
        if (res.success) {
          feedbackForm.value.images.push(res.data);
        } else {
          common_vendor.index.showToast({ title: res.message || "图片上传失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/feedback/feedback.vue:167", "上传图片失败:", error);
        common_vendor.index.showToast({ title: "图片上传失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const deleteImage = (index) => {
      feedbackForm.value.images.splice(index, 1);
    };
    const submitFeedback = async () => {
      if (isSubmitting.value)
        return;
      if (!feedbackForm.value.content.trim()) {
        common_vendor.index.showToast({ title: "请输入反馈内容", icon: "none" });
        return;
      }
      isSubmitting.value = true;
      try {
        const res = await utils_request.request({
          url: "/api/feedback/add",
          method: "POST",
          data: {
            content: feedbackForm.value.content.trim(),
            images: feedbackForm.value.images.join(","),
            contact: feedbackForm.value.contact.trim()
          }
        });
        if (res.success) {
          common_vendor.index.showToast({ title: "感谢您的支持", icon: "success" });
          feedbackForm.value = { content: "", images: [], contact: "" };
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
        } else {
          common_vendor.index.showToast({ title: res.message || "反馈提交失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/feedback/feedback.vue:212", "提交反馈失败:", error);
      } finally {
        isSubmitting.value = false;
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          activePage: "feedback"
        }),
        b: common_vendor.t(feedbackForm.value.content.length),
        c: feedbackForm.value.content,
        d: common_vendor.o(($event) => feedbackForm.value.content = $event.detail.value, "4a"),
        e: common_vendor.f(feedbackForm.value.images, (img, index, i0) => {
          return {
            a: img,
            b: common_vendor.o(($event) => previewImage(index), index),
            c: common_vendor.o(($event) => deleteImage(index), index),
            d: index
          };
        }),
        f: feedbackForm.value.images.length < 3
      }, feedbackForm.value.images.length < 3 ? {
        g: common_assets._imports_0$5,
        h: common_vendor.o(chooseImage, "a2")
      } : {}, {
        i: feedbackForm.value.contact,
        j: common_vendor.o(($event) => feedbackForm.value.contact = $event.detail.value, "ce"),
        k: isSubmitting.value
      }, isSubmitting.value ? {} : {}, {
        l: isSubmitting.value,
        m: common_vendor.o(submitFeedback, "9f")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e9b0a919"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/user/feedback/feedback.js.map
