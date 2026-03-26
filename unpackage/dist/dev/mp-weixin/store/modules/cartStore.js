"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const store_modules_userStore = require("./userStore.js");
const useCartStore = common_vendor.defineStore("cart", {
  state: () => ({
    cartList: [],
    // 购物车商品列表
    selectedSpec: {}
    // 选中的商品规格（产品详情页用）
  }),
  getters: {
    // 选中商品总数
    selectedCount: (state) => {
      return state.cartList.reduce((total, item) => item.checked ? total + item.quantity : total, 0);
    },
    // 选中商品总价
    selectedTotalPrice: (state) => {
      return state.cartList.reduce((total, item) => item.checked ? total + item.price * item.quantity : total, 0);
    }
  },
  actions: {
    // 初始化购物车（页面加载时调用）
    async initCart() {
      const userStore = store_modules_userStore.useUserStore();
      if (userStore.isLogin) {
        const cachedCart = common_vendor.index.getStorageSync("cart_data");
        if (cachedCart) {
          this.cartList = cachedCart;
        }
        await this.getCartFromCloud();
        await this.mergeLocalCart();
      } else {
        this.cartList = common_vendor.index.getStorageSync("cartTemp") || [];
      }
    },
    // 从云端获取购物车
    async getCartFromCloud() {
      try {
        const res = await utils_request.request({ url: "/api/cart/list", method: "GET" });
        if (res.success) {
          const newList = res.data.map((item) => ({
            ...item,
            checked: false,
            // 确保规格文本存在，如果为空则显示"默认规格"
            specText: item.specText || "默认规格"
          }));
          this.cartList = newList;
          common_vendor.index.setStorageSync("cart_data", newList);
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "购物车加载失败", icon: "none" });
      }
    },
    // 合并本地临时购物车到云端
    async mergeLocalCart() {
      const localCart = common_vendor.index.getStorageSync("cartTemp") || [];
      if (localCart.length === 0)
        return;
      try {
        await utils_request.request({
          url: "/api/cart/merge",
          method: "POST",
          data: { cartItems: localCart }
        });
        common_vendor.index.removeStorageSync("cartTemp");
        await this.getCartFromCloud();
      } catch (error) {
        common_vendor.index.__f__("log", "at store/modules/cartStore.js:80", "购物车合并失败", error);
      }
    },
    // 新增商品到购物车
    async addCart(cartData) {
      const userStore = store_modules_userStore.useUserStore();
      const processedCartData = {
        ...cartData,
        specText: cartData.specText || "默认规格"
      };
      if (userStore.isLogin) {
        try {
          const { specText, ...sendData } = processedCartData;
          await utils_request.request({
            url: "/api/cart/add",
            method: "POST",
            data: sendData
          });
          await this.getCartFromCloud();
        } catch (error) {
          throw new Error("添加购物车失败");
        }
      } else {
        this.cartList.push({ ...processedCartData, checked: false });
        common_vendor.index.setStorageSync("cartTemp", this.cartList);
      }
    },
    // 删除购物车商品
    async deleteCart(cartIds, productId, specId) {
      const userStore = store_modules_userStore.useUserStore();
      if (userStore.isLogin) {
        try {
          let pIds = productId;
          let sIds = specId;
          if (!productId || !specId) {
            const itemsToDelete = this.cartList.filter((item) => cartIds.includes(item.id));
            pIds = itemsToDelete.map((item) => item.productId).join(",");
            sIds = itemsToDelete.map((item) => item.specId).join(",");
          }
          await utils_request.request({
            url: "/api/cart/products",
            method: "DELETE",
            params: {
              productIds: pIds,
              specIds: sIds
            }
          });
          await this.getCartFromCloud();
        } catch (error) {
          common_vendor.index.showToast({ title: "删除失败", icon: "none" });
        }
      } else {
        this.cartList = this.cartList.filter((item) => !cartIds.includes(item.id));
        common_vendor.index.setStorageSync("cartTemp", this.cartList);
      }
    },
    // 更新商品数量
    async updateQuantity(cartId, quantity, productId, specId) {
      const userStore = store_modules_userStore.useUserStore();
      const index = this.cartList.findIndex((item) => item.id === cartId);
      if (index !== -1) {
        this.cartList[index].quantity = quantity;
      }
      if (userStore.isLogin) {
        try {
          let pId = productId;
          let sId = specId;
          if (!productId || !specId) {
            const item = this.cartList.find((item2) => item2.id === cartId);
            if (item) {
              pId = item.productId;
              sId = item.specId;
            }
          }
          if (pId && sId) {
            await utils_request.request({
              url: "/api/cart/update",
              method: "PUT",
              data: {
                cartItems: [
                  { productId: pId, specId: sId, quantity }
                ]
              }
            });
          }
          await this.getCartFromCloud();
        } catch (error) {
          common_vendor.index.showToast({ title: "数量修改失败", icon: "none" });
        }
      } else {
        common_vendor.index.setStorageSync("cartTemp", this.cartList);
      }
    },
    // 全选/取消全选
    toggleAllSelect(isChecked) {
      this.cartList = this.cartList.map((item) => ({ ...item, checked: isChecked }));
      const userStore = store_modules_userStore.useUserStore();
      if (!userStore.isLogin) {
        common_vendor.index.setStorageSync("cartTemp", this.cartList);
      }
    },
    // 同步购物车数据（页面切换时调用）
    syncCart() {
      this.initCart();
    }
  }
});
exports.useCartStore = useCartStore;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/store/modules/cartStore.js.map
