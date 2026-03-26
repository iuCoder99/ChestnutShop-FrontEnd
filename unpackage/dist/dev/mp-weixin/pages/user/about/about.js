"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const utils_request = require("../../../utils/request.js");
if (!Math) {
  TopNavbar();
}
const TopNavbar = () => "../../../components/business/TopNavbar.js";
const _sfc_main = {
  __name: "about",
  setup(__props) {
    const brandInfo = common_vendor.ref({
      image: "",
      factoryName: "",
      introduction: "",
      serviceHotline: "",
      officialWechat: "",
      address: "",
      copyrightInfo: ""
    });
    common_vendor.onLoad(() => {
      getBrandInfo();
    });
    const getBrandInfo = async () => {
      try {
        const res = await utils_request.request({
          url: "/api/about/us/introduce",
          method: "GET"
        });
        if (res.success) {
          brandInfo.value = res.data;
        }
      } catch (error) {
        common_vendor.index.__f__("log", "at pages/user/about/about.vue:92", "品牌信息加载失败", error);
      }
    };
    const makePhoneCall = () => {
      if (!brandInfo.value.serviceHotline)
        return;
      common_vendor.index.makePhoneCall({
        phoneNumber: brandInfo.value.serviceHotline,
        fail: () => {
          common_vendor.index.showToast({ title: "拨打电话失败", icon: "none" });
        }
      });
    };
    const copyWechat = () => {
      if (!brandInfo.value.officialWechat)
        return;
      common_vendor.index.setClipboardData({
        data: brandInfo.value.officialWechat,
        success: () => {
          common_vendor.index.showToast({ title: "微信已复制", icon: "success" });
        }
      });
    };
    const openMap = () => {
      if (!brandInfo.value.address)
        return;
      common_vendor.index.showModal({
        title: "地址信息",
        content: brandInfo.value.address,
        confirmText: "去这里",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.showToast({ title: "功能开发中", icon: "none" });
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          activePage: "about"
        }),
        b: brandInfo.value.image || "/static/images/brand-logo.png",
        c: common_vendor.t(brandInfo.value.factoryName || "某某家具装修工厂"),
        d: brandInfo.value.introduction
      }, brandInfo.value.introduction ? {
        e: common_vendor.t(brandInfo.value.introduction)
      } : {}, {
        f: brandInfo.value.serviceHotline
      }, brandInfo.value.serviceHotline ? {
        g: common_assets._imports_3$3,
        h: common_vendor.t(brandInfo.value.serviceHotline),
        i: common_assets._imports_1$3,
        j: common_vendor.o(makePhoneCall, "fe")
      } : {}, {
        k: brandInfo.value.officialWechat
      }, brandInfo.value.officialWechat ? {
        l: common_assets._imports_2$1,
        m: common_vendor.t(brandInfo.value.officialWechat),
        n: common_vendor.o(copyWechat, "36")
      } : {}, {
        o: brandInfo.value.address
      }, brandInfo.value.address ? {
        p: common_assets._imports_3$2,
        q: common_vendor.t(brandInfo.value.address),
        r: common_assets._imports_1$3,
        s: common_vendor.o(openMap, "21")
      } : {}, {
        t: brandInfo.value.copyrightInfo
      }, brandInfo.value.copyrightInfo ? {
        v: common_vendor.t(brandInfo.value.copyrightInfo)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d6b522c7"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/user/about/about.js.map
