"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  __name: "TopNavbar",
  props: {
    activePage: {
      type: String,
      default: "home"
    }
  },
  setup(__props) {
    const props = __props;
    const logoAnimate = common_vendor.ref(false);
    const homeAnimate = common_vendor.ref(false);
    const handleLogoClick = () => {
      if (logoAnimate.value)
        return;
      logoAnimate.value = true;
      common_vendor.index.showToast({
        title: "栗子欢迎您",
        icon: "none",
        duration: 1e3
      });
      setTimeout(() => {
        logoAnimate.value = false;
      }, 1e3);
    };
    const goToTab = (url, pageName) => {
      if (props.activePage === pageName) {
        if (pageName === "home") {
          triggerHomeAnimate();
        }
        return;
      }
      common_vendor.index.reLaunch({ url });
    };
    const goToPage = (url, pageName) => {
      if (props.activePage === pageName)
        return;
      common_vendor.index.navigateTo({ url });
    };
    const triggerHomeAnimate = () => {
      if (homeAnimate.value)
        return;
      homeAnimate.value = true;
      common_vendor.index.showToast({
        title: "已在首页",
        icon: "none",
        duration: 1e3
      });
      setTimeout(() => {
        homeAnimate.value = false;
      }, 1e3);
    };
    return (_ctx, _cache) => {
      return {
        a: common_assets._imports_0$8,
        b: logoAnimate.value ? 1 : "",
        c: common_vendor.o(handleLogoClick, "5b"),
        d: common_vendor.n(__props.activePage === "home" ? "active" : ""),
        e: common_vendor.n(__props.activePage === "home" && homeAnimate.value ? "home-click-animate" : ""),
        f: common_vendor.o(($event) => goToTab("/pages/main/index/index", "home"), "f4"),
        g: common_vendor.n(__props.activePage === "category" ? "active" : ""),
        h: common_vendor.o(($event) => goToTab("/pages/product/category/category", "category"), "fb"),
        i: common_vendor.n(__props.activePage === "cart" ? "active" : ""),
        j: common_vendor.o(($event) => goToTab("/pages/cart/index/index", "cart"), "37"),
        k: common_vendor.n(__props.activePage === "user" ? "active" : ""),
        l: common_vendor.o(($event) => goToTab("/pages/user/index/index", "user"), "af"),
        m: common_vendor.n(__props.activePage === "feedback" ? "active" : ""),
        n: common_vendor.o(($event) => goToPage("/pages/user/feedback/feedback", "feedback"), "10"),
        o: common_vendor.n(__props.activePage === "about" ? "active" : ""),
        p: common_vendor.o(($event) => goToPage("/pages/user/about/about", "about"), "5b")
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a85143be"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/business/TopNavbar.js.map
