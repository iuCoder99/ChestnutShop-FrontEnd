"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const utils_api = require("../../../utils/api.js");
const _sfc_main = {
  __name: "search",
  setup(__props) {
    const keyword = common_vendor.ref("");
    const isFocused = common_vendor.ref(false);
    const hasSearched = common_vendor.ref(false);
    const hotKeywordList = common_vendor.ref([]);
    const historyList = common_vendor.ref([]);
    const showHistory = common_vendor.ref(true);
    const guessLikeProductList = common_vendor.ref([]);
    const isLoadingGuessLike = common_vendor.ref(false);
    const productList = common_vendor.ref([]);
    const sortType = common_vendor.ref("default");
    const sortValue = common_vendor.ref(null);
    const sortId = common_vendor.ref(null);
    const querySize = common_vendor.ref(20);
    const isLoading = common_vendor.ref(false);
    const hasMore = common_vendor.ref(true);
    common_vendor.onLoad((options) => {
      loadHistory();
      getHotKeywords();
      if (options.keyword) {
        keyword.value = options.keyword;
        onSearch();
      } else {
        getGuessLikeProductList();
      }
    });
    const getHotKeywords = async () => {
      try {
        const res = await utils_api.productApi.getHotKeywords();
        if (res && res.success) {
          let keywords = [];
          if (res.data && res.data.keywordList) {
            if (typeof res.data.keywordList === "string") {
              keywords = res.data.keywordList.split(",");
            } else if (Array.isArray(res.data.keywordList)) {
              keywords = res.data.keywordList;
            }
          } else if (Array.isArray(res.data)) {
            keywords = res.data;
          }
          if (keywords.length > 5) {
            keywords = keywords.sort(() => 0.5 - Math.random()).slice(0, 5);
          }
          hotKeywordList.value = keywords;
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/product/search/search.vue:244", "获取热门搜索失败", e);
        hotKeywordList.value = ["办公桌", "人体工学椅", "会议桌", "文件柜", "沙发"];
      }
    };
    const loadHistory = () => {
      const history = common_vendor.index.getStorageSync("search_history");
      if (history) {
        historyList.value = JSON.parse(history);
      }
    };
    const saveHistory = () => {
      if (!keyword.value.trim())
        return;
      const index = historyList.value.indexOf(keyword.value.trim());
      if (index > -1) {
        historyList.value.splice(index, 1);
      }
      historyList.value.unshift(keyword.value.trim());
      if (historyList.value.length > 10) {
        historyList.value.pop();
      }
      common_vendor.index.setStorageSync("search_history", JSON.stringify(historyList.value));
    };
    const clearHistory = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定清空搜索历史吗？",
        success: (res) => {
          if (res.confirm) {
            historyList.value = [];
            common_vendor.index.removeStorageSync("search_history");
          }
        }
      });
    };
    const deleteHistoryItem = (index) => {
      historyList.value.splice(index, 1);
      common_vendor.index.setStorageSync("search_history", JSON.stringify(historyList.value));
    };
    const toggleHistory = () => {
      showHistory.value = !showHistory.value;
    };
    const quickSearch = (kw) => {
      keyword.value = kw;
      onSearch();
    };
    const clearKeyword = () => {
      keyword.value = "";
      hasSearched.value = false;
      if (guessLikeProductList.value.length === 0) {
        getGuessLikeProductList();
      }
    };
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const resetSearch = () => {
      keyword.value = "";
      hasSearched.value = false;
    };
    const getGuessLikeProductList = async (append = false) => {
      if (isLoadingGuessLike.value)
        return;
      isLoadingGuessLike.value = true;
      try {
        const result = await utils_api.productApi.getScrollProductList();
        let productData = [];
        if (result) {
          if (result.data && Array.isArray(result.data.productList)) {
            productData = result.data.productList;
          } else if (result.data && Array.isArray(result.data)) {
            productData = result.data;
          } else if (Array.isArray(result)) {
            productData = result;
          }
        }
        if (productData.length > 0) {
          const processedData = productData.map((item, index) => {
            let imgUrl = item.image || item.imageUrl || item.imgUrl || item.image_url || "";
            if (typeof imgUrl === "string") {
              imgUrl = imgUrl.replace(/`/g, "").trim();
              if (!imgUrl)
                imgUrl = "/static/images/default.png";
            } else {
              imgUrl = "/static/images/default.png";
            }
            let price = item.price;
            if (typeof price === "string") {
              price = parseFloat(price.replace(/[^\d.]/g, ""));
            }
            return {
              id: item.id || index,
              name: item.name || item.title || `产品${index}`,
              imageUrl: imgUrl,
              price: price || 0,
              sellPoint: item.description || item.sellPoint || "",
              isEnterprisePrice: item.isEnterprisePrice || false
            };
          });
          if (append) {
            guessLikeProductList.value = [...guessLikeProductList.value, ...processedData];
          } else {
            guessLikeProductList.value = processedData;
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/product/search/search.vue:368", "获取猜你喜欢失败", error);
      } finally {
        isLoadingGuessLike.value = false;
      }
    };
    const onSearch = () => {
      if (!keyword.value.trim()) {
        common_vendor.index.showToast({ title: "请输入搜索关键词", icon: "none" });
        return;
      }
      hasSearched.value = true;
      saveHistory();
      sortValue.value = null;
      sortId.value = null;
      productList.value = [];
      hasMore.value = true;
      getProductList();
    };
    const getProductList = async () => {
      if (!hasMore.value || isLoading.value)
        return;
      isLoading.value = true;
      const params = {
        sortType: sortType.value,
        sortValue: sortValue.value,
        sortId: sortId.value,
        querySize: querySize.value,
        keyword: keyword.value.trim()
      };
      try {
        const res = await utils_api.productApi.searchProducts(params);
        if (res.success && res.data) {
          const { list = [], isEnd, cursorCommonEntity } = res.data;
          const processedData = list.map((item) => ({
            id: item.id,
            name: item.name,
            imageUrl: item.image || item.imageUrl || item.image_url || "/static/images/default.png",
            price: item.price || 0,
            sellPoint: item.description || item.sellPoint || "",
            isEnterprisePrice: item.isEnterprisePrice || false
          }));
          if (!sortValue.value && !sortId.value) {
            productList.value = processedData;
          } else {
            productList.value = [...productList.value, ...processedData];
          }
          if (cursorCommonEntity) {
            sortValue.value = cursorCommonEntity.sortValue;
            sortId.value = cursorCommonEntity.sortId;
          }
          hasMore.value = !isEnd;
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "搜索失败，请重试", icon: "none" });
      } finally {
        isLoading.value = false;
        common_vendor.index.stopPullDownRefresh();
      }
    };
    const setSortType = (type) => {
      if (sortType.value === type)
        return;
      sortType.value = type;
      sortValue.value = null;
      sortId.value = null;
      productList.value = [];
      hasMore.value = true;
      getProductList();
    };
    const goToProductDetail = (productId) => {
      common_vendor.index.navigateTo({ url: `/pages/product/detail/detail?productId=${productId}` });
    };
    common_vendor.onPullDownRefresh(() => {
      if (hasSearched.value) {
        sortValue.value = null;
        sortId.value = null;
        productList.value = [];
        hasMore.value = true;
        getProductList();
      } else {
        getGuessLikeProductList();
        common_vendor.index.stopPullDownRefresh();
      }
    });
    common_vendor.onReachBottom(() => {
      if (hasSearched.value) {
        getProductList();
      } else {
        getGuessLikeProductList(true);
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_assets._imports_0,
        b: common_vendor.o(onSearch, "fb"),
        c: common_vendor.o(($event) => isFocused.value = true, "d1"),
        d: common_vendor.o(($event) => isFocused.value = false, "9c"),
        e: keyword.value,
        f: common_vendor.o(($event) => keyword.value = $event.detail.value, "e2"),
        g: keyword.value
      }, keyword.value ? {
        h: common_vendor.o(clearKeyword, "e8")
      } : {}, {
        i: isFocused.value ? 1 : "",
        j: common_vendor.o(goBack, "0e"),
        k: !hasSearched.value
      }, !hasSearched.value ? common_vendor.e({
        l: hotKeywordList.value.length > 0
      }, hotKeywordList.value.length > 0 ? {
        m: common_vendor.f(hotKeywordList.value, (item, index, i0) => {
          return {
            a: common_vendor.t(item),
            b: index,
            c: common_vendor.o(($event) => quickSearch(item), index)
          };
        })
      } : {}, {
        n: historyList.value.length > 0
      }, historyList.value.length > 0 ? common_vendor.e({
        o: showHistory.value ? "/static/images/icon-eye-open.png" : "/static/images/icon-eye-close.png",
        p: common_vendor.o(toggleHistory, "d4"),
        q: common_assets._imports_1$7,
        r: common_vendor.o(clearHistory, "2f"),
        s: showHistory.value
      }, showHistory.value ? {
        t: common_vendor.f(historyList.value, (item, index, i0) => {
          return {
            a: common_vendor.t(item),
            b: common_vendor.o(($event) => quickSearch(item), index),
            c: common_vendor.o(($event) => deleteHistoryItem(index), index),
            d: index
          };
        })
      } : {}) : {}, {
        v: common_vendor.f(guessLikeProductList.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.imageUrl,
            b: common_vendor.t(item.name),
            c: common_vendor.t(item.sellPoint),
            d: common_vendor.t((item.price || 0).toFixed(2)),
            e: item.isEnterprisePrice
          }, item.isEnterprisePrice ? {} : {}, {
            f: index,
            g: common_vendor.o(($event) => goToProductDetail(item.id), index)
          });
        }),
        w: isLoadingGuessLike.value
      }, isLoadingGuessLike.value ? {} : {}) : common_vendor.e({
        x: sortType.value === "default" ? 1 : "",
        y: common_vendor.o(($event) => setSortType("default"), "9b"),
        z: sortType.value === "priceAsc" ? 1 : "",
        A: common_vendor.o(($event) => setSortType("priceAsc"), "53"),
        B: sortType.value === "priceDesc" ? 1 : "",
        C: common_vendor.o(($event) => setSortType("priceDesc"), "82"),
        D: sortType.value === "newest" ? 1 : "",
        E: common_vendor.o(($event) => setSortType("newest"), "58"),
        F: productList.value.length > 0
      }, productList.value.length > 0 ? {
        G: common_vendor.f(productList.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.imageUrl,
            b: common_vendor.t(item.name),
            c: common_vendor.t(item.sellPoint),
            d: common_vendor.t(item.price.toFixed(2)),
            e: item.isEnterprisePrice
          }, item.isEnterprisePrice ? {} : {}, {
            f: index,
            g: common_vendor.o(($event) => goToProductDetail(item.id), index)
          });
        })
      } : !isLoading.value ? {
        I: common_assets._imports_2,
        J: common_vendor.t(keyword.value),
        K: common_vendor.o(resetSearch, "bd")
      } : {}, {
        H: !isLoading.value,
        L: isLoading.value
      }, isLoading.value ? {} : {}, {
        M: hasMore.value && !isLoading.value && productList.value.length > 0
      }, hasMore.value && !isLoading.value && productList.value.length > 0 ? {} : {}, {
        N: !hasMore.value && productList.value.length > 0
      }, !hasMore.value && productList.value.length > 0 ? {} : {}));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f1fe5789"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/product/search/search.js.map
