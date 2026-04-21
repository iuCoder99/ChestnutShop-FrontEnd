"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const utils_api = require("../../../utils/api.js");
const _sfc_main = {
  __name: "list",
  setup(__props) {
    const pageCategoryId = common_vendor.ref("");
    const isFirstCategoryId = common_vendor.ref(false);
    const sortType = common_vendor.ref("default");
    const productList = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const hasMore = common_vendor.ref(true);
    const sortValue = common_vendor.ref(null);
    const sortId = common_vendor.ref(null);
    const querySize = common_vendor.ref(20);
    common_vendor.onLoad((options) => {
      if (options.categoryId) {
        pageCategoryId.value = options.categoryId;
        isFirstCategoryId.value = options.isFirstCategoryId === "true" || options.isFirstCategoryId === true;
        if (options.sortType) {
          sortType.value = options.sortType;
        }
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
      sortValue.value = null;
      sortId.value = null;
      productList.value = [];
      hasMore.value = true;
      loadProducts();
    };
    const loadProducts = async () => {
      if (loading.value || !hasMore.value)
        return;
      loading.value = true;
      try {
        const params = {
          sortType: sortType.value,
          // 查询排序方式：default, priceAsc, priceDesc, newest
          categoryId: pageCategoryId.value,
          // 分类id
          isFirstCategoryId: isFirstCategoryId.value,
          // 是否为一级分类id
          sortValue: sortValue.value,
          sortId: sortId.value,
          querySize: querySize.value
        };
        common_vendor.index.__f__("log", "at pages/product/list/list.vue:152", "Using Category List API with params:", params);
        const result = await utils_api.productApi.getCategoryProducts(params);
        if (result && result.success && result.data) {
          const { list = [], isEnd, cursorCommonEntity } = result.data;
          if (list.length > 0) {
            productList.value = [...productList.value, ...list];
            if (cursorCommonEntity) {
              sortValue.value = cursorCommonEntity.sortValue;
              sortId.value = cursorCommonEntity.sortId;
            }
            hasMore.value = !isEnd;
          } else {
            hasMore.value = false;
          }
        } else {
          common_vendor.index.showToast({ title: "获取商品失败", icon: "none" });
          hasMore.value = false;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/product/list/list.vue:175", e);
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
        i: loading.value && productList.value.length === 0
      }, loading.value && productList.value.length === 0 ? {
        j: common_vendor.f(6, (i, k0, i0) => {
          return {
            a: i
          };
        })
      } : productList.value.length > 0 ? {
        l: common_vendor.f(productList.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.image || item.imageUrl || "/static/images/default-product.png",
            b: common_vendor.t(item.name),
            c: common_vendor.t(item.description || item.sellPoint || ""),
            d: common_vendor.t((item.price || 0).toFixed(2)),
            e: item.isEnterprisePrice
          }, item.isEnterprisePrice ? {} : {}, {
            f: item.id || index,
            g: common_vendor.o(($event) => goToDetail(item.id), item.id || index)
          });
        })
      } : !loading.value ? {
        n: common_assets._imports_1
      } : {}, {
        k: productList.value.length > 0,
        m: !loading.value,
        o: loading.value && productList.value.length > 0
      }, loading.value && productList.value.length > 0 ? {} : {}, {
        p: !hasMore.value && productList.value.length > 0
      }, !hasMore.value && productList.value.length > 0 ? {} : {}, {
        q: common_vendor.o(loadMore, "8b")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f1cef4ac"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/product/list/list.js.map
