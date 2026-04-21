"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_cartStore = require("../../../store/modules/cartStore.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
if (!Math) {
  TopNavbar();
}
const TopNavbar = () => "../../../components/business/TopNavbar.js";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const cartStore = store_modules_cartStore.useCartStore();
    const userStore = store_modules_userStore.useUserStore();
    const cartList = common_vendor.ref([]);
    const originalCartList = common_vendor.ref([]);
    const hasChanged = common_vendor.computed(() => {
      if (cartList.value.length !== originalCartList.value.length)
        return true;
      return cartList.value.some((item) => {
        const originalItem = originalCartList.value.find((o) => o.productId === item.productId && o.specId === item.specId);
        return !originalItem || Number(item.quantity) !== Number(originalItem.quantity);
      });
    });
    const isAllSelected = common_vendor.computed({
      get: () => {
        const purchasableItems = cartList.value.filter((item) => item.stock > 0);
        if (purchasableItems.length === 0)
          return false;
        return purchasableItems.every((item) => item.checked);
      },
      set: (val) => {
        cartList.value.forEach((item) => {
          if (item.stock > 0) {
            item.checked = val;
          }
        });
      }
    });
    const selectedCount = common_vendor.computed(() => {
      return cartList.value.filter((item) => item.stock > 0 && item.checked).reduce((total, item) => total + item.quantity, 0);
    });
    const totalPrice = common_vendor.computed(() => {
      return cartList.value.filter((item) => item.stock > 0 && item.checked).reduce((total, item) => total + item.price * item.quantity, 0);
    });
    common_vendor.computed(() => {
      return cartList.value.reduce((total, item) => total + item.quantity, 0);
    });
    const getCartList = async () => {
      common_vendor.index.showLoading({ title: "加载中" });
      try {
        const res = await utils_request.request({
          url: "/api/cart/list",
          method: "GET"
        });
        if (res && res.success && Array.isArray(res.data)) {
          common_vendor.index.__f__("log", "at pages/cart/index/index.vue:199", "购物车数据请求成功:", res.data);
          cartList.value = res.data.map((item) => ({
            ...item,
            // 有库存的默认选中，没库存的不选中
            checked: item.stock > 0,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            specText: item.specText || "默认规格"
          }));
          originalCartList.value = JSON.parse(JSON.stringify(cartList.value));
        } else {
          common_vendor.index.__f__("warn", "at pages/cart/index/index.vue:211", "购物车数据格式异常或请求失败:", res);
          cartList.value = [];
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "购物车加载失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const handleAllSelect = () => {
      const targetValue = !isAllSelected.value;
      isAllSelected.value = targetValue;
    };
    const handleItemSelect = (index) => {
      const item = cartList.value[index];
      if (item.stock > 0) {
        item.checked = !item.checked;
      }
    };
    let debounceTimer = null;
    const handleQuantityChange = (index, type) => {
      const item = cartList.value[index];
      let newQuantity = item.quantity;
      if (type === "plus") {
        newQuantity += 1;
        if (newQuantity > item.stock) {
          common_vendor.index.showToast({ title: "库存不足", icon: "none" });
          return;
        }
      } else if (type === "minus") {
        if (newQuantity <= 1)
          return;
        newQuantity -= 1;
      }
      cartList.value[index].quantity = newQuantity;
      if (debounceTimer)
        clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
      }, 300);
    };
    const handleQuantityInput = (index, e) => {
      let newQuantity = parseInt(e.detail.value);
      const item = cartList.value[index];
      if (isNaN(newQuantity) || newQuantity < 1) {
        newQuantity = 1;
      } else if (newQuantity > item.stock) {
        newQuantity = item.stock;
        common_vendor.index.showToast({ title: `库存不足，最大可购${item.stock}件`, icon: "none" });
      }
      cartList.value[index].quantity = newQuantity;
    };
    const handleSave = async () => {
      if (!hasChanged.value)
        return;
      common_vendor.index.showLoading({ title: "保存中" });
      try {
        const cartItems = cartList.value.map((item) => ({
          productId: item.productId,
          specId: item.specId,
          quantity: item.quantity
        }));
        const res = await utils_request.request({
          url: "/api/cart/update",
          method: "PUT",
          data: { cartItems }
        });
        if (res.success) {
          common_vendor.index.showToast({ title: "保存成功" });
          common_vendor.index.removeStorageSync("cart_cache");
          common_vendor.index.removeStorageSync("cart_original_cache");
          originalCartList.value = JSON.parse(JSON.stringify(cartList.value));
          cartStore.syncCart();
        } else {
          throw new Error(res.message || "保存失败");
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "网络异常，操作失败", icon: "none" });
        cartList.value = JSON.parse(JSON.stringify(originalCartList.value));
        common_vendor.index.removeStorageSync("cart_cache");
        common_vendor.index.removeStorageSync("cart_original_cache");
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const handleRollback = () => {
      if (!hasChanged.value)
        return;
      common_vendor.index.showModal({
        title: "提示",
        content: "您确定要取消之前的修改吗?",
        success: (res) => {
          if (res.confirm) {
            cartList.value = JSON.parse(JSON.stringify(originalCartList.value));
            common_vendor.index.removeStorageSync("cart_cache");
            common_vendor.index.removeStorageSync("cart_original_cache");
            common_vendor.index.showToast({ title: "已取消", icon: "none" });
          }
        }
      });
    };
    const deleteSingleItem = (index) => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要从购物车移除该商品吗？",
        success: (res) => {
          if (res.confirm) {
            cartList.value.splice(index, 1);
            common_vendor.index.showToast({ title: "已移除，请记得保存", icon: "none" });
          }
        }
      });
    };
    const showDeleteModal = () => {
      const selectedItems = cartList.value.filter((item) => item.checked);
      if (selectedItems.length === 0) {
        common_vendor.index.showToast({ title: "请选择要删除的商品", icon: "none" });
        return;
      }
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要移除选中的商品吗？",
        success: (res) => {
          if (res.confirm) {
            confirmDelete();
          }
        }
      });
    };
    const confirmDelete = () => {
      const selectedItems = cartList.value.filter((item) => item.checked);
      if (selectedItems.length === 0)
        return;
      cartList.value = cartList.value.filter((item) => !item.checked);
      common_vendor.index.showToast({ title: "已移除，请记得保存", icon: "none" });
    };
    const performSettle = (items) => {
      common_vendor.index.navigateTo({
        url: `/pages/order/confirm/confirm?cartItems=${encodeURIComponent(JSON.stringify(items))}`
      });
    };
    const goToConfirmOrder = () => {
      const selectedItems = cartList.value.filter((item) => item.checked && item.stock > 0);
      if (selectedItems.length === 0) {
        common_vendor.index.showToast({ title: "请选择要结算的商品", icon: "none" });
        return;
      }
      if (hasChanged.value) {
        common_vendor.index.showModal({
          title: "提示",
          content: "您有未保存的修改，是否先保存？",
          confirmText: "去保存",
          cancelText: "直接结算",
          success: (res) => {
            if (res.confirm) {
              handleSave();
            } else {
              performSettle(selectedItems);
            }
          }
        });
      } else {
        performSettle(selectedItems);
      }
    };
    const goHome = () => {
      common_vendor.index.reLaunch({ url: "/pages/main/index/index" });
    };
    const goToProductDetail = (productId) => {
      common_vendor.index.navigateTo({ url: `/pages/product/detail/detail?productId=${productId}` });
    };
    common_vendor.onShow(() => {
      const cachedCart = common_vendor.index.getStorageSync("cart_cache");
      const cachedOriginal = common_vendor.index.getStorageSync("cart_original_cache");
      if (Array.isArray(cachedCart) && cachedCart.length > 0 && Array.isArray(cachedOriginal)) {
        cartList.value = cachedCart;
        originalCartList.value = cachedOriginal;
      } else {
        common_vendor.index.removeStorageSync("cart_cache");
        common_vendor.index.removeStorageSync("cart_original_cache");
        if (userStore.token || userStore.isLogin) {
          getCartList();
        } else {
          const tempCart = common_vendor.index.getStorageSync("cartTemp") || [];
          cartList.value = tempCart.map((item) => ({
            ...item,
            checked: true,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1
          }));
          originalCartList.value = JSON.parse(JSON.stringify(cartList.value));
        }
      }
    });
    common_vendor.onHide(() => {
      if (hasChanged.value) {
        common_vendor.index.setStorageSync("cart_cache", cartList.value);
        common_vendor.index.setStorageSync("cart_original_cache", originalCartList.value);
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          activePage: "cart"
        }),
        b: cartList.value.length > 0
      }, cartList.value.length > 0 ? {} : {}, {
        c: cartList.value.length === 0
      }, cartList.value.length === 0 ? {
        d: common_assets._imports_1,
        e: common_vendor.o(goHome, "b1")
      } : common_vendor.e({
        f: isAllSelected.value
      }, isAllSelected.value ? {} : {}, {
        g: isAllSelected.value ? 1 : "",
        h: common_vendor.o(handleAllSelect, "88"),
        i: selectedCount.value > 0
      }, selectedCount.value > 0 ? {
        j: common_vendor.t(selectedCount.value)
      } : {}, {
        k: selectedCount.value > 0 ? 1 : "",
        l: common_vendor.o(showDeleteModal, "aa"),
        m: common_vendor.f(cartList.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.checked
          }, item.checked ? {} : {}, {
            b: item.checked ? 1 : "",
            c: item.stock <= 0 ? 1 : "",
            d: common_vendor.o(($event) => item.stock > 0 ? handleItemSelect(index) : null, index),
            e: item.productImage,
            f: item.stock <= 0
          }, item.stock <= 0 ? {} : {}, {
            g: common_vendor.t(item.productName),
            h: common_vendor.t(item.specText),
            i: common_vendor.t(item.price.toFixed(2)),
            j: common_vendor.o(($event) => goToProductDetail(item.productId), index),
            k: item.stock > 0
          }, item.stock > 0 ? {
            l: item.quantity <= 1 ? 1 : "",
            m: common_vendor.o(($event) => handleQuantityChange(index, "minus"), index),
            n: item.quantity,
            o: common_vendor.o((e) => handleQuantityInput(index, e), index),
            p: common_vendor.o(() => {
            }, index),
            q: item.quantity >= item.stock ? 1 : "",
            r: common_vendor.o(($event) => handleQuantityChange(index, "plus"), index)
          } : {}, {
            s: common_vendor.o(($event) => deleteSingleItem(index), index),
            t: index,
            v: item.stock <= 0 ? 1 : ""
          });
        })
      }), {
        n: cartList.value.length > 0
      }, cartList.value.length > 0 ? common_vendor.e({
        o: common_vendor.t(totalPrice.value.toFixed(2)),
        p: common_vendor.t(selectedCount.value),
        q: hasChanged.value
      }, hasChanged.value ? {
        r: common_vendor.o(handleRollback, "8a"),
        s: common_vendor.o(handleSave, "3c")
      } : {
        t: common_vendor.t(selectedCount.value),
        v: selectedCount.value > 0 ? 1 : "",
        w: common_vendor.o(goToConfirmOrder, "8a")
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4d2c878e"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/cart/index/index.js.map
