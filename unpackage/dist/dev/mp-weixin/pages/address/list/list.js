"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
const _sfc_main = {
  __name: "list",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const addressList = common_vendor.ref([]);
    const selectedAddressId = common_vendor.ref("");
    const isSelectMode = common_vendor.ref(false);
    common_vendor.onLoad((options) => {
      if (!userStore.token) {
        common_vendor.index.navigateTo({ url: "/pages/main/login/login" });
        return;
      }
      selectedAddressId.value = options.selectedAddressId || "";
      isSelectMode.value = !!options.selectedAddressId;
      common_vendor.index.$on("addressEdited", () => {
        getAddressList();
      });
      common_vendor.index.$on("addressAdded", () => {
        getAddressList();
      });
    });
    common_vendor.onShow(() => {
      getAddressList();
    });
    common_vendor.onUnload(() => {
      common_vendor.index.$off("addressEdited");
      common_vendor.index.$off("addressAdded");
    });
    const getAddressList = async () => {
      common_vendor.index.showLoading({ title: "加载中" });
      try {
        const res = await utils_request.request({
          url: "/api/address/list",
          method: "GET"
        });
        if (res.success) {
          addressList.value = res.data;
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "地址加载失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const goToAddAddress = () => {
      common_vendor.index.navigateTo({
        url: "/pages/address/edit/edit?type=add"
      });
    };
    const goToEditAddress = (address) => {
      common_vendor.index.navigateTo({
        url: `/pages/address/edit/edit?type=edit&address=${encodeURIComponent(JSON.stringify(address))}`
      });
    };
    const handleItemClick = (address) => {
      if (isSelectMode.value) {
        selectAddress(address);
      } else {
        goToEditAddress(address);
      }
    };
    const selectAddress = (address) => {
      common_vendor.index.$emit("addressSelected", address);
      common_vendor.index.navigateBack();
    };
    const deleteAddress = (addressId, index) => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要删除该地址吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const res2 = await utils_request.request({
                url: "/api/address/delete",
                method: "DELETE",
                params: { id: addressId }
              });
              if (res2.success) {
                common_vendor.index.showToast({ title: "删除成功" });
                addressList.value.splice(index, 1);
              } else {
                common_vendor.index.showToast({ title: res2.message || "删除失败", icon: "none" });
              }
            } catch (error) {
              common_vendor.index.showToast({ title: "网络异常，删除失败", icon: "none" });
            }
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(goToAddAddress, "6d"),
        b: addressList.value.length > 0
      }, addressList.value.length > 0 ? {
        c: common_vendor.f(addressList.value, (item, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.receiver),
            b: common_vendor.t(item.phone),
            c: item.isDefault
          }, item.isDefault ? {} : {}, {
            d: common_vendor.t(item.province),
            e: common_vendor.t(item.city),
            f: common_vendor.t(item.district),
            g: common_vendor.t(item.detailAddress),
            h: isSelectMode.value && item.id === selectedAddressId.value
          }, isSelectMode.value && item.id === selectedAddressId.value ? {
            i: common_assets._imports_1$2
          } : {}, {
            j: common_vendor.o(($event) => handleItemClick(item), index),
            k: common_vendor.o(($event) => goToEditAddress(item), index),
            l: common_vendor.o(($event) => deleteAddress(item.id, index), index),
            m: index
          });
        })
      } : {
        d: common_assets._imports_1$1,
        e: common_vendor.o(goToAddAddress, "54")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-355d0d83"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/address/list/list.js.map
