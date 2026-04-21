"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
const _sfc_main = {
  __name: "confirm",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const cartItems = common_vendor.ref([]);
    const orderData = common_vendor.ref(null);
    const addressList = common_vendor.ref([]);
    const selectedAddress = common_vendor.ref({});
    const remark = common_vendor.ref("");
    const freight = common_vendor.ref(0);
    const isSubmitting = common_vendor.ref(false);
    const totalGoodsPrice = common_vendor.computed(() => {
      if (orderData.value) {
        return orderData.value.price * orderData.value.quantity;
      }
      return cartItems.value.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);
    });
    const totalPayPrice = common_vendor.computed(() => {
      return totalGoodsPrice.value + freight.value;
    });
    common_vendor.onLoad((options) => {
      if (!userStore.token) {
        common_vendor.index.navigateTo({ url: "/pages/main/login" });
        return;
      }
      try {
        if (options.cartItems) {
          const items = JSON.parse(decodeURIComponent(options.cartItems)) || [];
          cartItems.value = items.map((item) => ({
            ...item,
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 1)
          }));
        }
        if (options.orderData) {
          orderData.value = JSON.parse(decodeURIComponent(options.orderData));
          cartItems.value = [{
            productId: orderData.value.productId,
            productName: orderData.value.productName,
            productImage: orderData.value.productImage,
            specText: orderData.value.specText,
            price: Number(orderData.value.price || 0),
            quantity: Number(orderData.value.quantity || 1),
            specIds: orderData.value.specIds
          }];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/order/confirm/confirm.vue:175", "参数解析失败:", error);
        common_vendor.index.showToast({ title: "参数错误", icon: "none" });
        setTimeout(() => common_vendor.index.navigateBack(), 1500);
        return;
      }
      common_vendor.index.$on("addressSelected", (address) => {
        selectedAddress.value = address;
        calculateFreight();
      });
      getAddressList();
    });
    common_vendor.onUnload(() => {
      common_vendor.index.$off("addressSelected");
    });
    const getAddressList = async () => {
      try {
        const res = await utils_request.request({
          url: "/api/address/list",
          method: "GET"
        });
        if (res.success && res.data && res.data.length > 0) {
          addressList.value = res.data;
          const defaultAddr = res.data.find((item) => item.isDefault);
          selectedAddress.value = defaultAddr || res.data[0];
          calculateFreight();
        } else {
          selectedAddress.value = {};
          freight.value = 0;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/order/confirm/confirm.vue:213", "获取地址失败", error);
      }
    };
    const calculateFreight = async () => {
      if (!selectedAddress.value.id) {
        freight.value = 0;
        return;
      }
      try {
        const productIds = cartItems.value.map((item) => item.productId).join(",");
        const res = await utils_request.request({
          url: "/api/order/freight",
          method: "GET",
          params: {
            productIds,
            addressId: selectedAddress.value.id
          }
        });
        if (res.success) {
          freight.value = res.data.freight || 0;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/order/confirm/confirm.vue:240", "运费计算失败", error);
        freight.value = 0;
      }
    };
    const goToAddAddress = () => {
      common_vendor.index.navigateTo({ url: "/pages/address/edit/edit?type=add" });
    };
    const goToSelectAddress = () => {
      common_vendor.index.navigateTo({
        url: `/pages/address/list/list?selectedAddressId=${selectedAddress.value.id || ""}`
      });
    };
    const submitOrder = async () => {
      if (!selectedAddress.value.id) {
        common_vendor.index.showToast({ title: "请选择收货地址", icon: "none" });
        return;
      }
      if (isSubmitting.value)
        return;
      isSubmitting.value = true;
      try {
        const orderParams = {
          addressId: selectedAddress.value.id,
          remark: remark.value,
          freight: freight.value,
          totalAmount: totalPayPrice.value,
          orderItems: cartItems.value.map((item) => ({
            productId: item.productId,
            specId: item.specId || item.specIds || "",
            quantity: item.quantity,
            price: item.price,
            productName: item.productName,
            productImage: item.productImage,
            specText: item.specText || ""
          }))
        };
        const res = await utils_request.request({
          url: "/api/order/create",
          method: "POST",
          data: orderParams
        });
        if (res.success) {
          common_vendor.index.showToast({
            title: "订单提交成功",
            icon: "success",
            duration: 1500
          });
          setTimeout(() => {
            if (res.data && res.data.orderNo) {
              common_vendor.index.redirectTo({
                url: `/pages/order/detail/detail?orderNo=${res.data.orderNo}`
              });
            } else {
              common_vendor.index.redirectTo({
                url: "/pages/order/list/list"
              });
            }
          }, 1500);
        } else {
          common_vendor.index.showToast({ title: res.message || "下单失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/order/confirm/confirm.vue:314", "提交订单异常:", error);
      } finally {
        isSubmitting.value = false;
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: selectedAddress.value.id
      }, selectedAddress.value.id ? common_vendor.e({
        b: selectedAddress.value.isDefault
      }, selectedAddress.value.isDefault ? {} : {}, {
        c: common_vendor.t(selectedAddress.value.province),
        d: common_vendor.t(selectedAddress.value.city),
        e: common_vendor.t(selectedAddress.value.district),
        f: common_vendor.t(selectedAddress.value.detailAddress),
        g: common_vendor.t(selectedAddress.value.receiver),
        h: common_vendor.t(selectedAddress.value.phone),
        i: common_assets._imports_1$1
      }) : {
        j: common_assets._imports_1$1
      }, {
        k: common_vendor.o(($event) => selectedAddress.value.id ? goToSelectAddress() : goToAddAddress(), "32"),
        l: common_vendor.f(cartItems.value, (item, index, i0) => {
          return {
            a: item.productImage,
            b: common_vendor.t(item.productName),
            c: common_vendor.t(item.price),
            d: common_vendor.t(item.specText || "默认"),
            e: common_vendor.t(item.quantity),
            f: index
          };
        }),
        m: remark.value,
        n: common_vendor.o(($event) => remark.value = $event.detail.value, "1d"),
        o: common_vendor.t(totalGoodsPrice.value.toFixed(2)),
        p: freight.value > 0
      }, freight.value > 0 ? {
        q: common_vendor.t(freight.value.toFixed(2))
      } : {}, {
        r: common_vendor.t(totalPayPrice.value.toFixed(2)),
        s: common_vendor.t(totalPayPrice.value.toFixed(2)),
        t: common_vendor.t(isSubmitting.value ? "提交中" : "提交订单"),
        v: common_vendor.o(submitOrder, "b5"),
        w: isSubmitting.value,
        x: isSubmitting.value
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3ade02a2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/order/confirm/confirm.js.map
