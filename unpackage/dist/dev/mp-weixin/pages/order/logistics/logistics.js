"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
const _sfc_main = {
  __name: "logistics",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const orderNo = common_vendor.ref("");
    const logisticsInfo = common_vendor.ref({
      expressCompany: "",
      // 快递公司
      expressNo: "",
      // 物流单号
      logisticsTraces: []
      // 物流轨迹
    });
    const logisticsTraces = common_vendor.ref([]);
    common_vendor.onLoad((options) => {
      orderNo.value = options.orderNo;
      if (!userStore.token || !orderNo.value) {
        common_vendor.index.navigateBack();
        return;
      }
      getLogisticsInfo();
    });
    const getLogisticsInfo = async () => {
      common_vendor.index.showLoading({ title: "加载中" });
      try {
        const res = await utils_request.request({
          url: "/api/order/logistics",
          method: "GET",
          data: { orderNo: orderNo.value }
        });
        if (res.success) {
          logisticsInfo.value = res.data;
          logisticsTraces.value = res.data.logisticsTraces.sort((a, b) => new Date(b.time) - new Date(a.time));
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "物流信息加载失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const formatTime = (time) => {
      if (!time)
        return "";
      const date = new Date(time);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
    };
    const getLogisticsStatus = () => {
      if (logisticsTraces.length === 0)
        return "";
      const latestTrace = logisticsTraces[0].desc;
      if (latestTrace.includes("签收")) {
        return "已签收";
      } else if (latestTrace.includes("派送")) {
        return "派送中";
      } else if (latestTrace.includes("运输")) {
        return "运输中";
      } else if (latestTrace.includes("揽收")) {
        return "已揽收";
      } else {
        return "物流更新中";
      }
    };
    const copyLogisticsNo = () => {
      common_vendor.index.setClipboardData({
        data: logisticsInfo.value.expressNo,
        success: () => {
          common_vendor.index.showToast({ title: "复制成功" });
        },
        fail: () => {
          common_vendor.index.showToast({ title: "复制失败", icon: "none" });
        }
      });
    };
    const contactService = () => {
      common_vendor.index.openCustomerServiceChat({
        extInfo: { url: "https://work.weixin.qq.com/kfid/kfc8**********" },
        success: () => {
        },
        fail: () => {
          common_vendor.index.showToast({ title: "客服功能暂不可用", icon: "none" });
        }
      });
    };
    const navigateBack = () => {
      common_vendor.index.navigateBack();
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_assets._imports_0$4,
        b: common_vendor.o(navigateBack, "3f"),
        c: common_vendor.t(logisticsInfo.value.expressCompany || "暂无"),
        d: common_vendor.t(logisticsInfo.value.expressNo || "暂无"),
        e: logisticsInfo.value.expressNo
      }, logisticsInfo.value.expressNo ? {
        f: common_vendor.o(copyLogisticsNo, "63")
      } : {}, {
        g: logisticsTraces.value.length > 0
      }, logisticsTraces.value.length > 0 ? {
        h: common_vendor.t(getLogisticsStatus())
      } : {}, {
        i: logisticsTraces.value.length > 0
      }, logisticsTraces.value.length > 0 ? {
        j: common_vendor.f(logisticsTraces.value, (trace, index, i0) => {
          return common_vendor.e({
            a: index < logisticsTraces.value.length - 1
          }, index < logisticsTraces.value.length - 1 ? {} : {}, {
            b: common_vendor.t(trace.desc),
            c: common_vendor.t(formatTime(trace.time)),
            d: index,
            e: index === 0 ? 1 : ""
          });
        })
      } : {
        k: common_assets._imports_1$9,
        l: common_vendor.o(contactService, "80")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-afa15dc2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/order/logistics/logistics.js.map
