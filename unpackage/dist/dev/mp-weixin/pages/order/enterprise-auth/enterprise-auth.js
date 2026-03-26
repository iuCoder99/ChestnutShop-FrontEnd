"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
const _sfc_main = {
  __name: "enterprise-auth",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const enterpriseForm = common_vendor.ref({
      name: "",
      // 企业名称
      creditCode: "",
      // 统一社会信用代码
      licenseUrl: ""
      // 营业执照图片URL
    });
    const isSubmitting = common_vendor.ref(false);
    const creditCodeError = common_vendor.ref(false);
    const formatCreditCode = (e) => {
      enterpriseForm.value.creditCode = e.detail.value.replace(/\s/g, "").toUpperCase();
      if (enterpriseForm.value.creditCode.length > 0 && enterpriseForm.value.creditCode.length !== 18) {
        creditCodeError.value = true;
      } else {
        creditCodeError.value = false;
      }
    };
    const chooseImage = () => {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          uploadImage(tempFilePath);
        }
      });
    };
    const uploadImage = async (filePath) => {
      common_vendor.index.showLoading({ title: "上传中" });
      try {
        const res = await utils_request.upload({
          url: "/api/upload/image",
          filePath,
          name: "file"
        });
        if (res.success) {
          enterpriseForm.value.licenseUrl = res.data;
          common_vendor.index.showToast({ title: "上传成功" });
        } else {
          common_vendor.index.showToast({ title: res.message || "图片上传失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/order/enterprise-auth/enterprise-auth.vue:121", "上传图片失败:", error);
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const submitAuth = async () => {
      if (isSubmitting.value)
        return;
      if (!enterpriseForm.value.name.trim()) {
        common_vendor.index.showToast({ title: "请输入企业名称", icon: "none" });
        return;
      }
      if (enterpriseForm.value.creditCode.length !== 18) {
        common_vendor.index.showToast({ title: "请输入有效的统一社会信用代码", icon: "none" });
        return;
      }
      if (!enterpriseForm.value.licenseUrl) {
        common_vendor.index.showToast({ title: "请上传营业执照照片", icon: "none" });
        return;
      }
      isSubmitting.value = true;
      try {
        const res = await utils_request.request({
          url: "/api/user/enterprise/auth",
          method: "POST",
          data: {
            enterpriseName: enterpriseForm.value.name.trim(),
            creditCode: enterpriseForm.value.creditCode,
            licenseUrl: enterpriseForm.value.licenseUrl
          }
        });
        if (res.success) {
          common_vendor.index.showToast({ title: "申请已提交", icon: "success" });
          common_vendor.index.$emit("enterpriseAuthSuccess");
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
        } else {
          common_vendor.index.showToast({ title: res.message || "提交失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/order/enterprise-auth/enterprise-auth.vue:166", "企业认证提交失败:", error);
      } finally {
        isSubmitting.value = false;
      }
    };
    common_vendor.onLoad(() => {
      if (!userStore.token) {
        common_vendor.index.navigateTo({ url: "/pages/main/login/login" });
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: enterpriseForm.value.name,
        b: common_vendor.o(($event) => enterpriseForm.value.name = $event.detail.value, "e9"),
        c: common_vendor.o([($event) => enterpriseForm.value.creditCode = $event.detail.value, formatCreditCode], "b0"),
        d: enterpriseForm.value.creditCode,
        e: creditCodeError.value
      }, creditCodeError.value ? {} : {}, {
        f: enterpriseForm.value.licenseUrl
      }, enterpriseForm.value.licenseUrl ? {
        g: enterpriseForm.value.licenseUrl
      } : {
        h: common_assets._imports_0$5
      }, {
        i: common_vendor.o(chooseImage, "00"),
        j: isSubmitting.value
      }, isSubmitting.value ? {} : {}, {
        k: isSubmitting.value,
        l: common_vendor.o(submitAuth, "5d")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d5bc8601"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/order/enterprise-auth/enterprise-auth.js.map
