"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const store_modules_cartStore = require("../../../store/modules/cartStore.js");
const utils_request = require("../../../utils/request.js");
if (!Math) {
  SpecPicker();
}
const SpecPicker = () => "../../../components/business/SpecPicker.js";
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const cartStore = store_modules_cartStore.useCartStore();
    const productId = common_vendor.ref("");
    const productInfo = common_vendor.ref({
      id: "",
      name: "",
      price: 0,
      imageUrls: [],
      description: "",
      specList: [],
      isEnterprisePrice: false,
      stock: 0
    });
    const relatedProductList = common_vendor.ref([]);
    const selectedSpec = common_vendor.ref([]);
    const currentPrice = common_vendor.ref(0);
    const currentStock = common_vendor.ref(0);
    const isLogin = common_vendor.computed(() => !!userStore.token);
    common_vendor.onLoad((options) => {
      productId.value = options.productId;
      if (!productId.value) {
        common_vendor.index.navigateBack();
        return;
      }
      getProductDetail();
      getRelatedProduct();
      common_vendor.index.showShareMenu({ withShareTicket: true });
    });
    const getProductDetail = async () => {
      common_vendor.index.showLoading({ title: "加载中" });
      try {
        const res = await utils_request.request({
          url: "/api/product/detail",
          method: "GET",
          data: { productId }
        });
        if (res.success) {
          productInfo.value = res.data;
          currentPrice.value = res.data.price;
          currentStock.value = res.data.stock;
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "产品信息加载失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const getRelatedProduct = async () => {
      try {
        const res = await utils_request.request({
          url: "/api/product/related",
          method: "GET",
          data: { productId }
        });
        if (res.success) {
          relatedProductList.value = res.data;
        }
      } catch (error) {
        common_vendor.index.__f__("log", "at pages/project/detail/detail.vue:136", "相关推荐加载失败", error);
      }
    };
    const handleSpecChange = async (specIds) => {
      selectedSpec.value = specIds;
      try {
        const res = await utils_request.request({
          url: "/api/product/spec/price",
          method: "GET",
          data: { productId, specIds: specIds.join(",") }
        });
        if (res.success) {
          currentPrice.value = res.data.price;
          currentStock.value = res.data.stock;
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "规格信息获取失败", icon: "none" });
      }
    };
    const previewImage = (currentImg) => {
      common_vendor.index.previewImage({
        current: currentImg,
        urls: productInfo.value.imageUrls
      });
    };
    const addCart = () => {
      if (!isLogin.value) {
        common_vendor.index.navigateTo({ url: "/pages/main/login" });
        return;
      }
      if (currentStock.value <= 0) {
        common_vendor.index.showToast({ title: "该规格库存不足", icon: "none" });
        return;
      }
      const cartData = {
        productId: productInfo.value.id,
        specIds: selectedSpec.value.join(","),
        quantity: 1
      };
      cartStore.addCart(cartData).then(() => {
        common_vendor.index.showToast({ title: "加入购物车成功" });
      }).catch((err) => {
        common_vendor.index.showToast({ title: err.message || "加入购物车失败", icon: "none" });
      });
    };
    const buyNow = () => {
      if (!isLogin.value) {
        common_vendor.index.navigateTo({ url: "/pages/main/login" });
        return;
      }
      if (currentStock.value <= 0) {
        common_vendor.index.showToast({ title: "该规格库存不足", icon: "none" });
        return;
      }
      const orderData = {
        productId: productInfo.value.id,
        specIds: selectedSpec.value.join(","),
        quantity: 1,
        price: currentPrice.value
      };
      common_vendor.index.navigateTo({
        url: `/pages/order/confirm?orderData=${encodeURIComponent(JSON.stringify(orderData))}`
      });
    };
    const goToCart = () => {
      if (!isLogin.value) {
        common_vendor.index.navigateTo({ url: "/pages/main/login" });
        return;
      }
      common_vendor.index.navigateTo({ url: "/pages/cart/index" });
    };
    const goToProductDetail = (id) => {
      if (id === productId)
        return;
      common_vendor.index.navigateTo({ url: `/pages/product/detail/detail?productId=${id}` });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(productInfo.value.imageUrls, (img, index, i0) => {
          return {
            a: img,
            b: common_vendor.o(($event) => previewImage(img), index),
            c: index
          };
        }),
        b: common_vendor.t(productInfo.value.name),
        c: common_vendor.t(currentPrice.value.toFixed(2)),
        d: productInfo.value.isEnterprisePrice
      }, productInfo.value.isEnterprisePrice ? {} : {}, {
        e: common_vendor.t(currentStock.value),
        f: currentStock.value < 10
      }, currentStock.value < 10 ? {} : {}, {
        g: productInfo.value.description,
        h: common_vendor.o(handleSpecChange, "f5"),
        i: common_vendor.p({
          specList: productInfo.value.specList
        }),
        j: relatedProductList.value.length > 0
      }, relatedProductList.value.length > 0 ? {
        k: common_vendor.f(relatedProductList.value, (item, index, i0) => {
          return {
            a: item.imageUrl,
            b: common_vendor.t(item.name),
            c: common_vendor.t(item.price.toFixed(2)),
            d: index,
            e: common_vendor.o(($event) => goToProductDetail(item.id), index)
          };
        })
      } : {}, {
        l: common_assets._imports_0$1,
        m: common_vendor.o(goToCart, "87"),
        n: common_vendor.o(addCart, "12"),
        o: common_vendor.o(buyNow, "35")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c7dbfb7e"]]);
_sfc_main.__runtimeHooks = 2;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/project/detail/detail.js.map
