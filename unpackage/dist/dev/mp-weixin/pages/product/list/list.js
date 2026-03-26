"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const utils_request = require("../../../utils/request.js");
const _sfc_main = {
  __name: "list",
  setup(__props) {
    const categoryId = common_vendor.ref("");
    const sortType = common_vendor.ref("default");
    const page = common_vendor.ref(1);
    common_vendor.ref(10);
    const productList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const hasMore = common_vendor.ref(true);
    const beginProductId = common_vendor.ref("0");
    common_vendor.onLoad((options) => {
      if (options.categoryId) {
        categoryId.value = options.categoryId;
        if (options.categoryName) {
          common_vendor.index.setNavigationBarTitle({
            title: options.categoryName
          });
        }
        loadProducts();
      }
    });
    const handleSort = (type) => {
      if (sortType.value === type)
        return;
      sortType.value = type;
      page.value = 1;
      beginProductId.value = "0";
      productList.value = [];
      hasMore.value = true;
      loadProducts();
    };
    const loadProducts = async () => {
      if (loading.value || !hasMore.value)
        return;
      loading.value = true;
      try {
        let response;
        common_vendor.index.__f__("log", "at pages/product/list/list.vue:125", "Using Category List API with sortType:", sortType.value);
        response = await utils_request.request({
          url: `/api/category/product/list/${categoryId.value}/${beginProductId.value}`,
          method: "GET",
          params: {
            sortType: sortType.value
          },
          timeout: 2e4
        });
        if (response && response.success) {
          const data = response.data;
          if (!data) {
            hasMore.value = false;
            return;
          }
          const newProducts = data.productList || [];
          if (newProducts.length > 0) {
            productList.value = [...productList.value, ...newProducts];
            beginProductId.value = String(data.endProductId);
            if (!data.endProductId || newProducts.length === 0) {
              hasMore.value = false;
            }
          } else {
            hasMore.value = false;
          }
        } else {
          common_vendor.index.showToast({ title: "获取商品失败", icon: "none" });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/product/list/list.vue:160", e);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const loadMore = () => {
      loadProducts();
    };
    const goToDetail = (id) => {
      common_vendor.index.navigateTo({
        url: `/pages/product/detail/detail?productId=${id}`
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: sortType.value === "default" ? 1 : "",
        b: common_vendor.o(($event) => handleSort("default"), "a5"),
        c: sortType.value === "priceAsc" ? 1 : "",
        d: common_vendor.o(($event) => handleSort("priceAsc"), "e7"),
        e: sortType.value === "priceDesc" ? 1 : "",
        f: common_vendor.o(($event) => handleSort("priceDesc"), "b2"),
        g: sortType.value === "newest" ? 1 : "",
        h: common_vendor.o(($event) => handleSort("newest"), "ec"),
        i: productList.value.length > 0
      }, productList.value.length > 0 ? {
        j: common_vendor.f(productList.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.image || item.imageUrl || "/static/images/default-product.png",
            b: common_vendor.t(item.name),
            c: common_vendor.t(item.description || item.sellPoint || ""),
            d: common_vendor.t((item.price || 0).toFixed(2)),
            e: item.isEnterprisePrice
          }, item.isEnterprisePrice ? {} : {}, {
            f: index,
            g: common_vendor.o(($event) => goToDetail(item.id), index)
          });
        })
      } : !loading.value ? {
        l: common_assets._imports_1
      } : {}, {
        k: !loading.value,
        m: loading.value
      }, loading.value ? {} : {}, {
        n: !hasMore.value && productList.value.length > 0
      }, !hasMore.value && productList.value.length > 0 ? {} : {}, {
        o: common_vendor.o(loadMore, "8b")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f1cef4ac"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/product/list/list.js.map
