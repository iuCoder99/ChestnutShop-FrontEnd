"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_cartStore = require("../../../store/modules/cartStore.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
const utils_cacheUtil = require("../../../utils/cacheUtil.js");
const utils_api = require("../../../utils/api.js");
if (!Math) {
  SpecPicker();
}
const SpecPicker = () => "../../../components/business/SpecPicker.js";
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const isLoading = common_vendor.ref(true);
    const errorMsg = common_vendor.ref("");
    const productDetail = common_vendor.ref({});
    const relatedProducts = common_vendor.ref([]);
    const previewComments = common_vendor.ref([]);
    const commentCount = common_vendor.ref(0);
    const selectedSpecId = common_vendor.ref("");
    const currentStock = common_vendor.ref(0);
    const isCollected = common_vendor.ref(false);
    const cartStore = store_modules_cartStore.useCartStore();
    const refreshTimer = common_vendor.ref(null);
    const specQuantities = common_vendor.ref({});
    const currentSwiperIndex = common_vendor.ref(0);
    const navOpacity = common_vendor.ref(0);
    const statusBarHeight = common_vendor.ref(20);
    common_vendor.onMounted(() => {
      try {
        const info = common_vendor.index.getSystemInfoSync();
        statusBarHeight.value = info.statusBarHeight || 20;
      } catch (e) {
        statusBarHeight.value = 20;
      }
    });
    const handleScroll = (e) => {
      const scrollTop = e.detail.scrollTop;
      let opacity = scrollTop / 150;
      if (opacity > 1)
        opacity = 1;
      navOpacity.value = opacity;
    };
    const onSwiperChange = (e) => {
      currentSwiperIndex.value = e.detail.current;
    };
    const currentQuantity = common_vendor.computed({
      get: () => {
        if (!selectedSpecId.value)
          return 1;
        return specQuantities.value[selectedSpecId.value] || 1;
      },
      set: (val) => {
        if (!selectedSpecId.value)
          return;
        let quantity = parseInt(val) || 1;
        if (quantity < 1)
          quantity = 1;
        if (quantity > currentStock.value) {
          quantity = currentStock.value > 0 ? currentStock.value : 1;
          if (currentStock.value > 0) {
            common_vendor.index.showToast({ title: `库存不足，最大可选${currentStock.value}件`, icon: "none" });
          }
        }
        specQuantities.value[selectedSpecId.value] = quantity;
      }
    });
    const selectedSpecText = common_vendor.computed(() => {
      if (!selectedSpecId.value || !productDetail.value.specList)
        return "";
      const spec = productDetail.value.specList.find((s) => s.id === selectedSpecId.value);
      return spec ? spec.specText : "";
    });
    const displayImages = common_vendor.computed(() => {
      if (productDetail.value.imageUrls && productDetail.value.imageUrls.length > 0) {
        return productDetail.value.imageUrls;
      }
      if (productDetail.value.image) {
        return [productDetail.value.image];
      }
      return ["https://via.placeholder.com/800x800?text=Product"];
    });
    const formattedSpecList = common_vendor.computed(() => {
      if (!productDetail.value.specList || productDetail.value.specList.length === 0) {
        return [];
      }
      return [{
        specName: "规格选择",
        specItems: productDetail.value.specList.map((spec) => ({
          id: spec.id,
          specValue: spec.specText,
          stock: spec.stock
        }))
      }];
    });
    const loadProductDetail = async (isRefresh = false) => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const productId = currentPage.options.productId;
      if (!productId) {
        errorMsg.value = "参数错误";
        isLoading.value = false;
        return;
      }
      if (!isRefresh)
        isLoading.value = true;
      errorMsg.value = "";
      try {
        const header = {};
        if (userStore.token && userStore.userInfo && userStore.userInfo.id) {
          header["X-User-Id"] = userStore.userInfo.id;
        }
        const result = await utils_api.productApi.getProductDetail(productId, header);
        let data = null;
        if (result.success && result.data) {
          data = Array.isArray(result.data) ? result.data[0] : result.data;
        }
        if (data) {
          if (isRefresh) {
            productDetail.value.specList = data.specList;
            productDetail.value.status = data.status;
            if (typeof data.isCollection !== "undefined") {
              isCollected.value = data.isCollection === 1;
            }
            if (selectedSpecId.value) {
              const currentSpec = data.specList.find((s) => s.id === selectedSpecId.value);
              if (currentSpec) {
                currentStock.value = currentSpec.stock;
                productDetail.value.price = currentSpec.price;
              }
            }
          } else {
            productDetail.value = data;
            isCollected.value = data.isCollection === 1;
            initCheapestSpec();
          }
          if (productDetail.value.status === "inactive") {
            handleProductOffShelf();
            return;
          }
          const cacheKey = `product_detail_${productId}`;
          utils_cacheUtil.cacheUtil.set(cacheKey, productDetail.value, 60);
          if (!isRefresh) {
            loadRelatedProducts(productDetail.value.name);
            loadComments(productId);
            loadCommentCount(productId);
            startRefreshTimer();
          }
        } else {
          if (isRefresh)
            handleProductOffShelf();
          else
            errorMsg.value = "未找到商品信息";
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/product/detail/detail.vue:407", "加载产品详情失败:", error);
        if (!isRefresh)
          errorMsg.value = "产品信息加载异常，请重试";
      } finally {
        if (!isRefresh)
          isLoading.value = false;
      }
    };
    const handleProductOffShelf = () => {
      stopRefreshTimer();
      common_vendor.index.showModal({
        title: "温馨提示",
        content: "该商品已经下架",
        showCancel: false,
        success: () => {
          goBack();
        }
      });
    };
    const startRefreshTimer = () => {
      stopRefreshTimer();
      refreshTimer.value = setInterval(() => {
        loadProductDetail(true);
      }, 6e4);
    };
    const stopRefreshTimer = () => {
      if (refreshTimer.value) {
        clearInterval(refreshTimer.value);
        refreshTimer.value = null;
      }
    };
    const initCheapestSpec = () => {
      if (productDetail.value.specList && productDetail.value.specList.length > 0) {
        const cheapestSpec = productDetail.value.specList.reduce(
          (min, spec) => spec.price < min.price ? spec : min,
          productDetail.value.specList[0]
        );
        selectedSpecId.value = cheapestSpec.id;
        currentStock.value = cheapestSpec.stock;
        productDetail.value.price = cheapestSpec.price;
      } else {
        setupDefaultSpec();
      }
    };
    const setupDefaultSpec = () => {
      productDetail.value.specList = [{
        id: `default-spec-${productDetail.value.id}`,
        specText: "默认规格",
        stock: productDetail.value.stock || 0,
        price: productDetail.value.price
      }];
      selectedSpecId.value = productDetail.value.specList[0].id;
      currentStock.value = productDetail.value.specList[0].stock;
    };
    const loadRelatedProducts = async (productName) => {
      if (!productName)
        return;
      try {
        const result = await utils_api.productApi.getRelatedProducts(productName, 5);
        if (result.success && result.data) {
          relatedProducts.value = Array.isArray(result.data) ? result.data : [result.data];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/product/detail/detail.vue:478", "加载相关商品失败:", error);
      }
    };
    const loadComments = async (productId) => {
      try {
        const res = await utils_request.request({
          url: `/api/user/product/comment/firstComment/show`,
          method: "POST",
          params: { productId },
          data: {
            sortType: "default",
            sortValue: "",
            sortId: "",
            querySize: 2
          }
        });
        if (res.success && res.data) {
          previewComments.value = res.data.list.map((item) => {
            let parsedImgs = [];
            if (item.imageUrls) {
              if (Array.isArray(item.imageUrls)) {
                parsedImgs = item.imageUrls;
              } else if (typeof item.imageUrls === "string") {
                try {
                  const cleanedStr = item.imageUrls.replace(/`/g, "").trim();
                  parsedImgs = JSON.parse(cleanedStr);
                } catch (e) {
                  parsedImgs = item.imageUrls.split(",").filter(Boolean);
                }
              }
            }
            parsedImgs = parsedImgs.map((url) => {
              if (typeof url === "string") {
                const trimmed = url.trim();
                const match = trimmed.match(/(https?:\/\/[^\s`"']+)/);
                return match ? match[0] : trimmed.replace(/[`\s]/g, "");
              }
              return url;
            }).filter(Boolean);
            return {
              ...item,
              imageUrls: parsedImgs,
              isLiked: !!item.like
              // 处理预览评价的点赞状态
            };
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/product/detail/detail.vue:529", "加载预览评价失败:", e);
      }
    };
    const loadCommentCount = async (productId) => {
      try {
        const res = await utils_api.productApi.getCommentCount(productId);
        if (res.success && res.data !== void 0) {
          if (typeof res.data === "object" && res.data !== null && "productCommentCount" in res.data) {
            commentCount.value = Number(res.data.productCommentCount) || 0;
          } else {
            commentCount.value = Number(res.data) || 0;
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/product/detail/detail.vue:545", "加载点赞总数失败:", e);
      }
    };
    const goBack = () => {
      const pages = getCurrentPages();
      if (pages.length > 1)
        common_vendor.index.navigateBack();
      else
        common_vendor.index.reLaunch({ url: "/pages/main/index/index" });
    };
    const goToComments = () => {
      common_vendor.index.navigateTo({ url: `/pages/product/comment/comment?productId=${productDetail.value.id}` });
    };
    const goToRelatedProduct = (id) => {
      common_vendor.index.navigateTo({ url: `/pages/product/detail/detail?productId=${id}` });
    };
    const handleQuantityChange = (delta) => {
      currentQuantity.value += delta;
    };
    const handleQuantityBlur = (e) => {
      currentQuantity.value = e.detail.value;
    };
    const handleSpecChange = (specIds) => {
      selectedSpecId.value = specIds[0];
      if (specIds.length > 0 && productDetail.value.specList) {
        const selectedSpec = productDetail.value.specList.find((spec) => spec.id === specIds[0]);
        if (selectedSpec) {
          currentStock.value = selectedSpec.stock;
          productDetail.value.price = selectedSpec.price;
        }
      }
    };
    const handleAddToCart = async () => {
      var _a;
      if (!userStore.token) {
        common_vendor.index.navigateTo({ url: "/pages/main/login/login" });
        return;
      }
      try {
        let specId = selectedSpecId.value;
        if (((_a = productDetail.value.specList) == null ? void 0 : _a.length) > 0 && !specId) {
          specId = productDetail.value.specList[0].id;
        }
        const result = await utils_request.request({
          url: "/api/cart/add",
          method: "POST",
          data: {
            productId: productDetail.value.id,
            specId,
            quantity: currentQuantity.value
          }
        });
        if (result.success) {
          common_vendor.index.showToast({ title: "已加入购物车", icon: "success" });
          cartStore.syncCart();
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "添加失败，请重试", icon: "none" });
      }
    };
    const handleBuyNow = () => {
      if (!userStore.token) {
        common_vendor.index.navigateTo({ url: "/pages/main/login/login" });
        return;
      }
      const orderData = {
        productId: productDetail.value.id,
        productName: productDetail.value.name,
        productImage: displayImages.value[0] || "",
        price: productDetail.value.price,
        quantity: currentQuantity.value,
        specIds: selectedSpecId.value || "",
        specText: selectedSpecText.value || "默认规格"
      };
      common_vendor.index.navigateTo({
        url: `/pages/order/confirm/confirm?orderData=${encodeURIComponent(JSON.stringify(orderData))}`
      });
    };
    const handleConsult = () => {
      common_vendor.index.navigateTo({ url: `/pages/user/consult/consult?productId=${productDetail.value.id}` });
    };
    const handleShare = () => {
      common_vendor.index.showActionSheet({
        itemList: ["分享给好友", "保存海报"],
        success: (res) => {
          common_vendor.index.showToast({ title: "分享功能开发中", icon: "none" });
        }
      });
    };
    const handleCollect = async () => {
      if (!userStore.token) {
        common_vendor.index.navigateTo({ url: "/pages/main/login/login" });
        return;
      }
      try {
        const result = isCollected.value ? await utils_api.userApi.deleteCollect(productDetail.value.id) : await utils_api.userApi.addCollect(productDetail.value.id);
        if (result.success) {
          isCollected.value = !isCollected.value;
          common_vendor.index.showToast({ title: isCollected.value ? "收藏成功" : "取消收藏", icon: "success" });
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "操作失败", icon: "none" });
      }
    };
    common_vendor.onLoad(() => loadProductDetail());
    common_vendor.onUnload(() => stopRefreshTimer());
    common_vendor.onShow(() => !refreshTimer.value && !isLoading.value && startRefreshTimer());
    common_vendor.onHide(() => stopRefreshTimer());
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: statusBarHeight.value + "px",
        b: common_assets._imports_0$4,
        c: navOpacity.value > 0.5 ? "invert(1)" : "none",
        d: navOpacity.value > 0.5 ? "transparent" : "rgba(0,0,0,0.3)",
        e: common_vendor.o(goBack, "c6"),
        f: navOpacity.value,
        g: `rgba(255, 255, 255, ${navOpacity.value})`,
        h: `1px solid rgba(238, 238, 238, ${navOpacity.value})`,
        i: isLoading.value
      }, isLoading.value ? {} : errorMsg.value ? {
        k: common_vendor.t(errorMsg.value),
        l: common_vendor.o(loadProductDetail, "13")
      } : common_vendor.e({
        m: common_vendor.f(displayImages.value, (image, index, i0) => {
          return {
            a: image,
            b: index
          };
        }),
        n: common_vendor.o(onSwiperChange, "88"),
        o: displayImages.value.length > 1
      }, displayImages.value.length > 1 ? {
        p: common_vendor.t(currentSwiperIndex.value + 1),
        q: common_vendor.t(displayImages.value.length)
      } : {}, {
        r: common_vendor.t(productDetail.value.description || "暂无产品详情描述"),
        s: productDetail.value.detailImages && productDetail.value.detailImages.length > 0
      }, productDetail.value.detailImages && productDetail.value.detailImages.length > 0 ? {
        t: common_vendor.f(productDetail.value.detailImages, (img, idx, i0) => {
          return {
            a: idx,
            b: img
          };
        })
      } : {}, {
        v: common_vendor.t((productDetail.value.price || 0).toFixed(2)),
        w: productDetail.value.isEnterprisePrice
      }, productDetail.value.isEnterprisePrice ? {} : {}, {
        x: common_vendor.o(handleShare, "97"),
        y: common_vendor.t(productDetail.value.name || "产品名称"),
        z: productDetail.value.sellPoint
      }, productDetail.value.sellPoint ? {
        A: common_vendor.t(productDetail.value.sellPoint)
      } : {}, {
        B: formattedSpecList.value.length > 0
      }, formattedSpecList.value.length > 0 ? common_vendor.e({
        C: selectedSpecText.value
      }, selectedSpecText.value ? {
        D: common_vendor.t(selectedSpecText.value)
      } : {}, {
        E: common_vendor.o(handleSpecChange, "b0"),
        F: common_vendor.p({
          specList: formattedSpecList.value,
          selectedIds: selectedSpecId.value ? [selectedSpecId.value] : []
        })
      }) : {}, {
        G: common_vendor.t(currentStock.value),
        H: currentStock.value < 10 ? 1 : "",
        I: currentQuantity.value <= 1 ? 1 : "",
        J: common_vendor.o(($event) => handleQuantityChange(-1), "07"),
        K: currentQuantity.value,
        L: common_vendor.o(handleQuantityBlur, "14"),
        M: currentQuantity.value >= currentStock.value ? 1 : "",
        N: common_vendor.o(($event) => handleQuantityChange(1), "47"),
        O: currentStock.value <= 0
      }, currentStock.value <= 0 ? {} : {}, {
        P: common_vendor.t(isCollected.value ? "❤️" : "🤍"),
        Q: common_vendor.t(isCollected.value ? "已收藏" : "收藏"),
        R: common_vendor.o(handleCollect, "c2"),
        S: common_vendor.o(handleConsult, "e8"),
        T: common_vendor.o(handleAddToCart, "35"),
        U: common_vendor.o(handleBuyNow, "83"),
        V: commentCount.value > 0
      }, commentCount.value > 0 ? {
        W: common_vendor.t(commentCount.value)
      } : {}, {
        X: common_vendor.o(goToComments, "ec"),
        Y: previewComments.value.length > 0
      }, previewComments.value.length > 0 ? {
        Z: common_vendor.f(previewComments.value, (comment, k0, i0) => {
          return common_vendor.e({
            a: comment.userAvatar || "/static/images/default-avatar.png",
            b: common_vendor.t(comment.userNickname || "匿名用户"),
            c: common_vendor.t(comment.createTimeBusinessText || comment.createTime),
            d: common_vendor.f(5, (n, k1, i1) => {
              return {
                a: n,
                b: n <= comment.rating ? 1 : ""
              };
            }),
            e: common_vendor.t(comment.content),
            f: comment.imageUrls && comment.imageUrls.length > 0
          }, comment.imageUrls && comment.imageUrls.length > 0 ? {
            g: common_vendor.f(comment.imageUrls, (img, idx, i1) => {
              return {
                a: idx,
                b: img
              };
            })
          } : {}, {
            h: comment.productSpecText
          }, comment.productSpecText ? {
            i: common_vendor.t(comment.productSpecText)
          } : {}, {
            j: comment.id,
            k: common_vendor.o(goToComments, comment.id)
          });
        })
      } : {}, {
        aa: relatedProducts.value.length > 0
      }, relatedProducts.value.length > 0 ? {
        ab: common_vendor.f(relatedProducts.value, (product, k0, i0) => {
          return common_vendor.e({
            a: product.image || product.imageUrl || "/static/images/empty.png",
            b: common_vendor.t(product.name || ""),
            c: common_vendor.t((product.price || 0).toFixed(2)),
            d: product.isEnterprisePrice
          }, product.isEnterprisePrice ? {} : {}, {
            e: product.id,
            f: common_vendor.o(($event) => goToRelatedProduct(product.id), product.id)
          });
        })
      } : {}, {
        ac: common_vendor.o(handleScroll, "96")
      }), {
        j: errorMsg.value
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f4882731"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/product/detail/detail.js.map
