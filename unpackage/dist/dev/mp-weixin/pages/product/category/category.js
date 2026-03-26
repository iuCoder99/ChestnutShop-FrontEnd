"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
require("../../../store/modules/userStore.js");
const utils_request = require("../../../utils/request.js");
if (!Math) {
  TopNavbar();
}
const TopNavbar = () => "../../../components/business/TopNavbar.js";
const _sfc_main = {
  __name: "category",
  setup(__props) {
    const categoryList = common_vendor.ref([]);
    const activeCategoryId = common_vendor.ref("");
    const selectedCategoryName = common_vendor.ref("");
    const currentSubCategories = common_vendor.ref([]);
    const isLoading = common_vendor.ref(false);
    const errorMsg = common_vendor.ref("");
    const queryCategoryId = common_vendor.ref("");
    common_vendor.onLoad((options) => {
      if (options.categoryId) {
        queryCategoryId.value = String(options.categoryId);
      }
    });
    common_vendor.onShow(() => {
      const jumpCategoryId = common_vendor.index.getStorageSync("jumpCategoryId");
      if (jumpCategoryId) {
        common_vendor.index.__f__("log", "at pages/product/category/category.vue:134", "检测到跳转参数 categoryId:", jumpCategoryId);
        const targetId = String(jumpCategoryId);
        queryCategoryId.value = targetId;
        if (categoryList.value.length > 0) {
          const target = categoryList.value.find((c) => String(c.id) === targetId);
          if (target) {
            selectCategory(target);
          }
        }
        common_vendor.index.removeStorageSync("jumpCategoryId");
      }
    });
    const hardcodedData = [
      {
        id: "1",
        name: "手机数码",
        children: [
          { id: "101", name: "热门手机", iconUrl: "https://cdn-icons-png.flaticon.com/128/0/191.png" },
          { id: "102", name: "手机配件", iconUrl: "https://cdn-icons-png.flaticon.com/128/4639/4639145.png" },
          { id: "103", name: "智能设备", iconUrl: "https://cdn-icons-png.flaticon.com/128/3003/3003883.png" }
        ]
      },
      {
        id: "2",
        name: "家用电器",
        children: [
          { id: "201", name: "大家电", iconUrl: "https://cdn-icons-png.flaticon.com/128/911/911409.png" },
          { id: "202", name: "生活电器", iconUrl: "https://cdn-icons-png.flaticon.com/128/2555/2555938.png" }
        ]
      },
      { id: "3", name: "运动户外", children: [{ id: "301", name: "运动鞋服", iconUrl: "https://cdn-icons-png.flaticon.com/128/2589/2589903.png" }] },
      { id: "4", name: "美妆个护", children: [] },
      { id: "5", name: "食品饮料", children: [] },
      { id: "6", name: "服装鞋帽", children: [] },
      { id: "7", name: "家居生活", children: [] },
      { id: "8", name: "母婴用品", children: [] }
    ];
    const processCategoryData = (list) => {
      return list.map((item) => ({
        ...item,
        id: String(item.id),
        children: item.children ? processCategoryData(item.children) : []
      }));
    };
    const initCategoryData = async () => {
      isLoading.value = true;
      errorMsg.value = "";
      try {
        const cachedData = common_vendor.index.getStorageSync("category_tree_data");
        if (cachedData) {
          common_vendor.index.__f__("log", "at pages/product/category/category.vue:196", "Using cached category data");
          processAndSetData(cachedData);
          isLoading.value = false;
          return;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/product/category/category.vue:204", "Failed to read category cache", e);
      }
      try {
        const result = await utils_request.request({
          url: "/api/category/tree",
          method: "GET",
          timeout: 2e4
        });
        if (result && result.success && Array.isArray(result.data)) {
          common_vendor.index.setStorageSync("category_tree_data", result.data);
          processAndSetData(result.data);
        } else {
          useFallbackData();
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/product/category/category.vue:224", "Failed to fetch category tree", error);
        useFallbackData();
      } finally {
        isLoading.value = false;
      }
    };
    const processAndSetData = (rawData) => {
      const processedData = processCategoryData(rawData);
      categoryList.value = processedData;
      let targetCategory = processedData[0];
      if (queryCategoryId.value) {
        const found = processedData.find((c) => c.id === queryCategoryId.value);
        if (found)
          targetCategory = found;
      }
      if (targetCategory) {
        selectCategory(targetCategory);
      }
    };
    const useFallbackData = () => {
      categoryList.value = hardcodedData;
      if (hardcodedData.length > 0)
        selectCategory(hardcodedData[0]);
    };
    const selectCategory = (category) => {
      activeCategoryId.value = category.id;
      selectedCategoryName.value = category.name;
      currentSubCategories.value = category.children || [];
    };
    const goToSearch = () => {
      common_vendor.index.navigateTo({ url: "/pages/product/search/search" });
    };
    const navigateToCategory = (subCategory) => {
      common_vendor.index.navigateTo({
        url: `/pages/product/list/list?categoryId=${subCategory.id}&categoryName=${subCategory.name}`
      });
    };
    const onScrollToLower = () => {
    };
    common_vendor.onMounted(() => {
      initCategoryData();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          activePage: "category"
        }),
        b: common_assets._imports_0,
        c: common_vendor.o(goToSearch, "88"),
        d: common_vendor.f(categoryList.value, (category, k0, i0) => {
          return common_vendor.e({
            a: activeCategoryId.value === category.id
          }, activeCategoryId.value === category.id ? {} : {}, {
            b: common_vendor.t(category.name),
            c: activeCategoryId.value === category.id ? 1 : "",
            d: category.id,
            e: common_vendor.o(($event) => selectCategory(category), category.id)
          });
        }),
        e: isLoading.value
      }, isLoading.value ? {} : errorMsg.value ? {
        g: common_vendor.t(errorMsg.value),
        h: common_vendor.o(initCategoryData, "6b")
      } : common_vendor.e({
        i: currentSubCategories.value.length > 0
      }, currentSubCategories.value.length > 0 ? {
        j: common_vendor.f(currentSubCategories.value, (subItem, k0, i0) => {
          return {
            a: subItem.iconUrl || (subItem.children && subItem.children[0] ? subItem.children[0].iconUrl : "") || "https://cdn-icons-png.flaticon.com/512/1370/1370445.png",
            b: common_vendor.t(subItem.name),
            c: subItem.id,
            d: common_vendor.o(($event) => navigateToCategory(subItem), subItem.id)
          };
        })
      } : {}), {
        f: errorMsg.value,
        k: common_vendor.o(onScrollToLower, "ae")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-aad4872e"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/product/category/category.js.map
