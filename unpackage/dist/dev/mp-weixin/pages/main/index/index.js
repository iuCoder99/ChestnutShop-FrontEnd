"use strict";
const common_vendor = require("../../../common/vendor.js");
const common_assets = require("../../../common/assets.js");
const store_modules_userStore = require("../../../store/modules/userStore.js");
const utils_cacheUtil = require("../../../utils/cacheUtil.js");
const utils_api = require("../../../utils/api.js");
const utils_request = require("../../../utils/request.js");
if (!Array) {
  const _component_marquee = common_vendor.resolveComponent("marquee");
  _component_marquee();
}
if (!Math) {
  TopNavbar();
}
const TopNavbar = () => "../../../components/business/TopNavbar.js";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = store_modules_userStore.useUserStore();
    const bannerList = common_vendor.ref([]);
    const categoryList = common_vendor.ref([]);
    const hotProductList = common_vendor.ref([]);
    const categoryProductList = common_vendor.ref([]);
    const currentCategoryId = common_vendor.ref("0");
    const hotKeywordList = common_vendor.ref([]);
    const guessLikeProductList = common_vendor.ref([]);
    const noticeContent = common_vendor.ref("");
    const isLoadingGuessLike = common_vendor.ref(false);
    const showBackTop = common_vendor.ref(false);
    const currentSwiperIndex = common_vendor.ref(0);
    const displayProductList = common_vendor.computed(() => {
      return currentCategoryId.value === "0" ? hotProductList.value : categoryProductList.value;
    });
    const handleSwiperChange = (e) => {
      currentSwiperIndex.value = e.detail.current;
    };
    common_vendor.computed(() => userStore.isLogin);
    common_vendor.onLoad(() => {
      getBannerList();
      getCategoryList();
      getHotProductList();
      getHotKeywordList();
      getGuessLikeProductList();
      getNoticeContent();
    });
    common_vendor.onPageScroll((e) => {
      showBackTop.value = e.scrollTop > 400;
    });
    common_vendor.onReachBottom(() => {
      common_vendor.index.__f__("log", "at pages/main/index/index.vue:195", "触底加载更多猜你喜欢");
      getGuessLikeProductList(true, false);
    });
    const backToTop = () => {
      common_vendor.index.pageScrollTo({
        scrollTop: 0,
        duration: 300
      });
    };
    common_vendor.onShow(() => {
      common_vendor.index.__f__("log", "at pages/main/index/index.vue:209", "首页 onShow 被调用，检查登录状态");
      getBannerList();
      getCategoryList();
      getHotProductList();
      getHotKeywordList();
      getGuessLikeProductList();
      getNoticeContent();
      const currentToken = common_vendor.index.getStorageSync("token");
      const currentUserInfo = common_vendor.index.getStorageSync("userInfo") || {};
      if (currentToken && !userStore.token) {
        userStore.$patch({
          token: currentToken,
          userInfo: currentUserInfo,
          isLogin: true
        });
      } else if (!currentToken && userStore.token) {
        userStore.logout();
      }
      if (currentToken && userStore.token && JSON.stringify(currentUserInfo) !== JSON.stringify(userStore.userInfo)) {
        userStore.userInfo = currentUserInfo;
      }
    });
    common_vendor.index.$on("userLogin", (userInfo) => {
      common_vendor.index.__f__("log", "at pages/main/index/index.vue:246", "接收到用户登录事件", userInfo);
      setTimeout(() => {
        getBannerList();
        getCategoryList();
        getHotProductList();
        getHotKeywordList();
        getGuessLikeProductList();
        getNoticeContent();
      }, 300);
    });
    common_vendor.index.$on("userLogout", () => {
      common_vendor.index.__f__("log", "at pages/main/index/index.vue:261", "接收到用户登出事件");
      setTimeout(() => {
        getBannerList();
        getCategoryList();
        getHotProductList();
        getHotKeywordList();
        getGuessLikeProductList();
        getNoticeContent();
      }, 300);
    });
    common_vendor.onUnload(() => {
      common_vendor.index.$off("userLogin");
      common_vendor.index.$off("userLogout");
    });
    common_vendor.onPullDownRefresh(async () => {
      common_vendor.index.__f__("log", "at pages/main/index/index.vue:282", "触发下拉刷新，清理业务缓存并重新加载数据");
      utils_cacheUtil.cacheUtil.clearBusinessCache();
      utils_cacheUtil.cacheUtil.delete("home_guess_like");
      if (currentCategoryId.value !== "0") {
        utils_cacheUtil.cacheUtil.delete(`category_products_${currentCategoryId.value}`);
      }
      const refreshTasks = [
        getBannerList(true),
        getCategoryList(true),
        getHotProductList(true),
        getHotKeywordList(true),
        getGuessLikeProductList(false, true),
        getNoticeContent(true)
      ];
      if (currentCategoryId.value !== "0") {
        refreshTasks.push(getCategoryProductList(currentCategoryId.value, true));
      }
      await Promise.all(refreshTasks);
      common_vendor.index.stopPullDownRefresh();
      common_vendor.index.showToast({ title: "已刷新", icon: "none" });
    });
    const handleCategoryClick = async (categoryId) => {
      if (currentCategoryId.value === categoryId)
        return;
      currentCategoryId.value = categoryId;
      if (categoryId === "0") {
        if (hotProductList.value.length === 0) {
          await getHotProductList();
        }
      } else {
        await getCategoryProductList(categoryId);
      }
    };
    const getCategoryProductList = async (categoryId, forceRefresh = false) => {
      try {
        const cacheKey = `category_products_${categoryId}`;
        if (!forceRefresh) {
          const cachedData = utils_cacheUtil.cacheUtil.get(cacheKey);
          if (cachedData) {
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:337", `从缓存获取分类 ${categoryId} 商品数据成功`);
            categoryProductList.value = cachedData;
            return;
          }
        }
        common_vendor.index.__f__("log", "at pages/main/index/index.vue:343", `开始获取分类 ${categoryId} 商品数据...`);
        const result = await utils_request.request({
          url: `/api/category/product/list/${categoryId}/0`,
          method: "GET",
          params: {
            sortType: "default"
          },
          timeout: 3e4
        });
        if (result && result.success && result.data && Array.isArray(result.data.productList)) {
          const productData = result.data.productList;
          common_vendor.index.__f__("log", "at pages/main/index/index.vue:359", `提取到分类 ${categoryId} 商品数量:`, productData.length);
          const processedData = productData.map((item, index) => {
            let imgUrl = item.image || item.imageUrl || "";
            if (typeof imgUrl === "string") {
              imgUrl = imgUrl.replace(/`/g, "").trim();
              if (!imgUrl) {
                imgUrl = "https://via.placeholder.com/200x200?text=Product";
              }
            }
            return {
              id: String(item.id || index),
              name: item.name || `分类商品${index + 1}`,
              imageUrl: imgUrl,
              price: parseFloat(item.price) || 0,
              sellPoint: item.description || "",
              isEnterprisePrice: item.isEnterprisePrice || false
            };
          });
          categoryProductList.value = processedData;
          utils_cacheUtil.cacheUtil.set(cacheKey, processedData, 5);
        } else {
          common_vendor.index.__f__("warn", "at pages/main/index/index.vue:384", `分类 ${categoryId} 商品列表数据为空或格式不正确`);
          categoryProductList.value = [];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/main/index/index.vue:388", `获取分类 ${categoryId} 商品列表失败:`, error);
        categoryProductList.value = [];
        common_vendor.index.showToast({ title: "加载分类商品失败", icon: "none" });
      }
    };
    const getBannerList = async (forceRefresh = false) => {
      try {
        if (!forceRefresh) {
          const cachedData = utils_cacheUtil.cacheUtil.get("home_banners");
          if (cachedData) {
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:401", "从缓存获取轮播图数据成功");
            bannerList.value = cachedData;
            return;
          }
        }
        common_vendor.index.__f__("log", "at pages/main/index/index.vue:407", "开始获取轮播图数据...");
        const result = await utils_request.request({
          url: "/api/banner/list",
          method: "GET",
          timeout: 3e4
        });
        if (result && result.data) {
          const bannerData = Array.isArray(result.data) ? result.data : [result.data];
          common_vendor.index.__f__("log", "at pages/main/index/index.vue:420", "轮播图数据数量:", bannerData.length);
          const processedData = bannerData.map((item, index) => {
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:424", `第${index + 1}个轮播项原始数据:`, JSON.stringify(item, null, 2));
            let imgUrl = item.imageUrl || item.image_url || item.imageurl || "";
            if (typeof imgUrl === "string") {
              common_vendor.index.__f__("log", "at pages/main/index/index.vue:429", `原始图片URL: "${imgUrl}"`);
              imgUrl = imgUrl.replace(/`/g, "").trim();
              common_vendor.index.__f__("log", "at pages/main/index/index.vue:432", `清理后的图片URL: "${imgUrl}"`);
              if (!imgUrl) {
                imgUrl = "https://via.placeholder.com/200x200?text=Banner";
                common_vendor.index.__f__("log", "at pages/main/index/index.vue:436", `使用默认轮播图图片URL: "${imgUrl}"`);
              }
            }
            let linkUrl = item.linkUrl || item.link_url || "";
            if (typeof linkUrl === "string") {
              linkUrl = linkUrl.replace(/`/g, "").trim();
            }
            return {
              id: String(item.id) || String(index),
              title: item.title || `轮播图${index + 1}`,
              imageUrl: imgUrl,
              linkUrl,
              linkType: item.linkType || item.link_type || "url"
            };
          });
          common_vendor.index.__f__("log", "at pages/main/index/index.vue:455", "处理后的轮播图数据:", JSON.stringify(processedData, null, 2));
          bannerList.value = processedData;
          utils_cacheUtil.cacheUtil.set("home_banners", processedData, 60);
          common_vendor.index.__f__("log", "at pages/main/index/index.vue:461", "轮播图数据设置成功:", bannerList.value);
          if (processedData.length === 0) {
            common_vendor.index.showToast({ title: "轮播图数据为空", icon: "none" });
          }
        } else {
          common_vendor.index.__f__("error", "at pages/main/index/index.vue:468", "没有轮播图数据");
          common_vendor.index.showToast({ title: "轮播图数据不存在", icon: "none" });
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/main/index/index.vue:472", "轮播图请求异常:", err);
        common_vendor.index.showToast({ title: "轮播图加载失败", icon: "none" });
      }
    };
    const getCategoryList = async (forceRefresh = false) => {
      try {
        if (!forceRefresh) {
          const cachedData = utils_cacheUtil.cacheUtil.get("home_categories");
          if (cachedData) {
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:484", "从缓存获取分类数据成功");
            categoryList.value = cachedData;
            return;
          }
        }
        common_vendor.index.__f__("log", "at pages/main/index/index.vue:490", "开始获取分类数据...");
        const result = await utils_request.request({
          url: "/api/category/tree",
          method: "GET",
          timeout: 3e4
        });
        if (result) {
          let categoryData = [];
          if (result && result.data) {
            categoryData = Array.isArray(result.data) ? result.data : [result.data];
          } else if (Array.isArray(result)) {
            categoryData = result;
          }
          common_vendor.index.__f__("log", "at pages/main/index/index.vue:511", "提取到的分类数据:", JSON.stringify(categoryData, null, 2));
          common_vendor.index.__f__("log", "at pages/main/index/index.vue:512", "分类数据数量:", categoryData.length);
          const processedData = categoryData.slice(0, 8).map((item, index) => {
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:516", `第${index + 1}个分类项原始数据:`, JSON.stringify(item, null, 2));
            if (typeof item !== "object" || item === null) {
              return {
                id: String(index),
                name: `分类${index + 1}`,
                iconUrl: "https://via.placeholder.com/40x40?text=Icon"
              };
            }
            let iconUrl = item.iconUrl || item.icon_url || item.icon || item.logoUrl || item.logo_url || item.logo || "";
            if (typeof iconUrl === "string") {
              common_vendor.index.__f__("log", "at pages/main/index/index.vue:530", `原始图标URL: "${iconUrl}"`);
              iconUrl = iconUrl.replace(/`/g, "").trim();
              common_vendor.index.__f__("log", "at pages/main/index/index.vue:533", `清理后的图标URL: "${iconUrl}"`);
              if (!iconUrl) {
                iconUrl = "https://via.placeholder.com/40x40?text=Icon";
                common_vendor.index.__f__("log", "at pages/main/index/index.vue:537", `使用默认分类图标URL: "${iconUrl}"`);
              }
            } else {
              iconUrl = "https://via.placeholder.com/40x40?text=Icon";
            }
            return {
              id: String(item.id || item.categoryId || index),
              name: item.name || item.title || `分类${index + 1}`,
              iconUrl
            };
          });
          common_vendor.index.__f__("log", "at pages/main/index/index.vue:550", "处理后的分类数据:", JSON.stringify(processedData, null, 2));
          categoryList.value = processedData;
          utils_cacheUtil.cacheUtil.set("home_categories", processedData, 1440);
          common_vendor.index.__f__("log", "at pages/main/index/index.vue:556", "分类数据加载成功:", categoryList.value);
          if (processedData.length === 0) {
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:560", "分类数据为空，使用默认数据");
            categoryList.value = Array.from({ length: 8 }, (_, i) => ({
              id: String(i),
              name: `默认分类${i + 1}`,
              iconUrl: "https://via.placeholder.com/40x40?text=Icon"
            }));
          }
        } else {
          common_vendor.index.__f__("error", "at pages/main/index/index.vue:568", "分类请求失败，状态码:", res ? res.statusCode : "未知");
          categoryList.value = Array.from({ length: 8 }, (_, i) => ({
            id: String(i),
            name: `默认分类${i + 1}`,
            iconUrl: "https://via.placeholder.com/40x40?text=Icon"
          }));
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/main/index/index.vue:577", "分类请求异常:", error);
        common_vendor.index.__f__("log", "at pages/main/index/index.vue:579", "分类请求失败，使用默认数据");
        categoryList.value = Array.from({ length: 8 }, (_, i) => ({
          id: String(i),
          name: `默认分类${i + 1}`,
          iconUrl: "https://via.placeholder.com/40x40?text=Icon"
        }));
      }
    };
    const getHotProductList = async (forceRefresh = false) => {
      try {
        if (!forceRefresh) {
          const cachedData = utils_cacheUtil.cacheUtil.get("home_hot_products");
          if (cachedData) {
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:595", "从缓存获取热门产品数据成功");
            hotProductList.value = cachedData;
            return;
          }
        }
        common_vendor.index.__f__("log", "at pages/main/index/index.vue:601", "开始获取热门产品数据...");
        const result = await utils_request.request({
          url: "/api/product/hot",
          method: "GET",
          timeout: 3e4
        });
        if (result) {
          let productData = [];
          if (result && result.data) {
            productData = Array.isArray(result.data) ? result.data : [result.data];
          } else if (result && Array.isArray(result)) {
            productData = result;
          } else if (result && typeof result === "object") {
            productData = [result];
          }
          common_vendor.index.__f__("log", "at pages/main/index/index.vue:624", "提取到的热门产品数据:", JSON.stringify(productData, null, 2));
          common_vendor.index.__f__("log", "at pages/main/index/index.vue:625", "热门产品数据数量:", productData.length);
          const processedData = productData.map((item, index) => {
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:629", `第${index + 1}个热门产品原始数据:`, JSON.stringify(item, null, 2));
            if (typeof item !== "object" || item === null) {
              return {
                id: String(index),
                name: `产品${index + 1}`,
                imageUrl: "https://via.placeholder.com/200x200?text=Product",
                price: 0,
                sellPoint: "",
                isEnterprisePrice: false
              };
            }
            let imgUrl = item.image || item.imageUrl || item.image_url || item.imgUrl || item.img_url || "";
            if (typeof imgUrl === "string") {
              common_vendor.index.__f__("log", "at pages/main/index/index.vue:646", `原始产品图片URL: "${imgUrl}"`);
              imgUrl = imgUrl.replace(/`/g, "").trim();
              common_vendor.index.__f__("log", "at pages/main/index/index.vue:649", `清理后的产品图片URL: "${imgUrl}"`);
              if (!imgUrl) {
                imgUrl = "https://via.placeholder.com/200x200?text=Product";
                common_vendor.index.__f__("log", "at pages/main/index/index.vue:653", `使用默认产品图片URL: "${imgUrl}"`);
              }
            } else {
              imgUrl = "https://via.placeholder.com/200x200?text=Product";
            }
            let price = item.price || item.unit_price || item.amount || 0;
            price = typeof price === "number" ? price : parseFloat(price) || 0;
            return {
              id: String(item.id || item.productId || index),
              name: item.name || item.title || `产品${index + 1}`,
              imageUrl: imgUrl,
              price,
              sellPoint: item.sellPoint || item.description || item.detail || "",
              isEnterprisePrice: item.isEnterprisePrice || item.is_enterprise_price || false
            };
          });
          common_vendor.index.__f__("log", "at pages/main/index/index.vue:674", "处理后的热门产品数据:", JSON.stringify(processedData, null, 2));
          if (processedData.length === 0) {
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:678", "热门产品数据为空，使用默认数据");
            hotProductList.value = Array.from({ length: 4 }, (_, i) => ({
              id: String(i),
              name: `默认产品${i + 1}`,
              imageUrl: "https://via.placeholder.com/200x200?text=Product",
              price: (Math.random() * 1e3 + 100).toFixed(2),
              sellPoint: "这是一个优质产品",
              isEnterprisePrice: false
            }));
          } else {
            hotProductList.value = processedData;
            utils_cacheUtil.cacheUtil.set("home_hot_products", processedData, 1);
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:693", "热门产品数据加载成功:", hotProductList.value);
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:694", "热门产品数量:", hotProductList.value.length);
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/main/index/index.vue:698", "热门产品请求异常:", error);
        common_vendor.index.__f__("log", "at pages/main/index/index.vue:700", "热门产品请求失败，使用默认数据");
        hotProductList.value = Array.from({ length: 4 }, (_, i) => ({
          id: String(i),
          name: `默认产品${i + 1}`,
          imageUrl: "https://via.placeholder.com/200x200?text=Product",
          price: (Math.random() * 1e3 + 100).toFixed(2),
          sellPoint: "这是一个优质产品",
          isEnterprisePrice: false
        }));
      }
    };
    const getGuessLikeProductList = async (append = false, forceRefresh = false) => {
      if (isLoadingGuessLike.value)
        return;
      try {
        if (!append && !forceRefresh) {
          const cachedData = utils_cacheUtil.cacheUtil.get("home_guess_like");
          if (cachedData && cachedData.length > 0) {
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:721", "--- [猜你喜欢] 从缓存获取数据成功");
            guessLikeProductList.value = cachedData;
            return;
          }
        }
        isLoadingGuessLike.value = true;
        common_vendor.index.__f__("log", "at pages/main/index/index.vue:728", "--- [猜你喜欢] 开始请求数据, append:", append);
        const result = await utils_api.productApi.getScrollProductList();
        common_vendor.index.__f__("log", "at pages/main/index/index.vue:731", "--- [猜你喜欢] 接口返回原始数据:", JSON.stringify(result));
        let productData = [];
        if (result) {
          if (result.data && Array.isArray(result.data.productList)) {
            productData = result.data.productList;
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:738", "--- [猜你喜欢] 从 result.data.productList 获取到数据");
          } else if (result.data && Array.isArray(result.data)) {
            productData = result.data;
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:741", "--- [猜你喜欢] 从 result.data 获取到数据");
          } else if (Array.isArray(result)) {
            productData = result;
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:744", "--- [猜你喜欢] 直接从 result 获取到数据");
          }
        }
        common_vendor.index.__f__("log", "at pages/main/index/index.vue:748", "--- [猜你喜欢] 提取到的商品数量:", productData.length);
        if (productData.length > 0) {
          const processedData = productData.map((item, index) => {
            let imgUrl = item.image || item.imageUrl || item.imgUrl || item.image_url || "";
            if (typeof imgUrl === "string") {
              imgUrl = imgUrl.replace(/`/g, "").trim();
              if (!imgUrl) {
                imgUrl = "https://via.placeholder.com/200x200?text=Product";
              }
            } else {
              imgUrl = "https://via.placeholder.com/200x200?text=Product";
            }
            let price = item.price;
            if (typeof price === "string") {
              price = parseFloat(price.replace(/[^\d.]/g, ""));
            }
            return {
              id: String(item.id || index),
              name: item.name || item.title || `产品${index + 1}`,
              imageUrl: imgUrl,
              price: price || 0,
              sellPoint: item.description || item.sellPoint || item.subTitle || "",
              isEnterprisePrice: item.isEnterprisePrice || item.is_enterprise_price || false
            };
          });
          if (append) {
            guessLikeProductList.value = [...guessLikeProductList.value, ...processedData];
          } else {
            guessLikeProductList.value = processedData;
            utils_cacheUtil.cacheUtil.set("home_guess_like", processedData, 30);
          }
          common_vendor.index.__f__("log", "at pages/main/index/index.vue:786", "--- [猜你喜欢] 数据处理完成, 当前列表总数:", guessLikeProductList.value.length);
        } else {
          common_vendor.index.__f__("warn", "at pages/main/index/index.vue:788", "--- [猜你喜欢] 未提取到有效的商品数组");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/main/index/index.vue:791", "--- [猜你喜欢] 请求或处理异常:", error);
        if (!append && guessLikeProductList.value.length === 0) {
          common_vendor.index.__f__("log", "at pages/main/index/index.vue:793", "--- [猜你喜欢] 使用模拟数据兜底");
          guessLikeProductList.value = Array.from({ length: 10 }, (_, i) => ({
            id: `mock-${i}`,
            name: `推荐产品${i + 1}`,
            imageUrl: "https://via.placeholder.com/200x200?text=GuessLike",
            price: (Math.random() * 1e3 + 100).toFixed(2),
            sellPoint: "为您精选的优质产品",
            isEnterprisePrice: false
          }));
        }
      } finally {
        isLoadingGuessLike.value = false;
      }
    };
    const getHotKeywordList = async (forceRefresh = false) => {
      try {
        if (!forceRefresh) {
          const cachedData = utils_cacheUtil.cacheUtil.get("home_hot_keywords");
          if (cachedData) {
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:815", "从缓存获取热门关键词成功");
            hotKeywordList.value = cachedData;
            return;
          }
        }
        common_vendor.index.__f__("log", "at pages/main/index/index.vue:821", "开始获取热门关键词...");
        const result = await utils_request.request({
          url: "/api/product/user/keyword/list",
          method: "GET",
          timeout: 3e4
        });
        if (result && result.success && Array.isArray(result.data)) {
          hotKeywordList.value = result.data;
          utils_cacheUtil.cacheUtil.set("home_hot_keywords", result.data, 120);
          common_vendor.index.__f__("log", "at pages/main/index/index.vue:834", "热门关键词加载成功:", result.data.length);
        } else {
          common_vendor.index.__f__("warn", "at pages/main/index/index.vue:836", "热门关键词数据格式异常:", result);
          hotKeywordList.value = ["北欧简约沙发", "真皮床", "极简餐桌", "智能灯具"];
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/main/index/index.vue:841", "热门关键词请求异常:", error);
        hotKeywordList.value = ["北欧简约沙发", "真皮床", "极简餐桌", "智能灯具"];
      }
    };
    const getNoticeContent = async (forceRefresh = false) => {
      try {
        if (!forceRefresh) {
          const cachedData = utils_cacheUtil.cacheUtil.get("home_notice");
          if (cachedData) {
            common_vendor.index.__f__("log", "at pages/main/index/index.vue:853", "从缓存获取公告内容成功");
            noticeContent.value = cachedData;
            return;
          }
        }
        common_vendor.index.__f__("log", "at pages/main/index/index.vue:859", "开始获取公告内容...");
        const result = await utils_request.request({
          url: "/api/notice/latest",
          method: "GET",
          timeout: 3e4
        });
        if (result) {
          if (result && result.success) {
            if (result.data) {
              if (typeof result.data === "object" && result.data.content) {
                noticeContent.value = result.data.content;
                common_vendor.index.__f__("log", "at pages/main/index/index.vue:876", "公告内容加载成功");
              } else if (Array.isArray(result.data) && result.data.length > 0) {
                const firstNotice = result.data[0];
                if (firstNotice.content) {
                  noticeContent.value = firstNotice.content;
                } else if (firstNotice.title) {
                  noticeContent.value = firstNotice.title;
                } else {
                  noticeContent.value = JSON.stringify(firstNotice);
                }
                common_vendor.index.__f__("log", "at pages/main/index/index.vue:891", "从公告数组中提取内容成功");
              } else if (typeof result.data === "string") {
                noticeContent.value = result.data;
                common_vendor.index.__f__("log", "at pages/main/index/index.vue:896", "公告内容加载成功");
              }
              if (noticeContent.value) {
                utils_cacheUtil.cacheUtil.set("home_notice", noticeContent.value, 720);
              }
            }
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/main/index/index.vue:907", "公告请求异常:", error);
        noticeContent.value = "欢迎使用某某家具装修小程序";
      }
    };
    const goToSearch = () => {
      common_vendor.index.navigateTo({ url: "/pages/product/search/search" });
    };
    const goToTarget = (linkUrl) => {
      if (linkUrl.includes("productId")) {
        const productId = linkUrl.split("=")[1];
        common_vendor.index.navigateTo({ url: `/pages/product/detail/detail?productId=${productId}` });
      } else if (linkUrl) {
        common_vendor.index.navigateTo({ url: linkUrl });
      }
    };
    const goToProductDetail = (productId) => {
      common_vendor.index.navigateTo({ url: `/pages/product/detail/detail?productId=${productId}` });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          activePage: "home"
        }),
        b: common_vendor.f(bannerList.value, (item, index, i0) => {
          return {
            a: item.imageUrl,
            b: common_vendor.o(($event) => goToTarget(item.linkUrl), index),
            c: currentSwiperIndex.value === index ? 1 : "",
            d: index
          };
        }),
        c: common_vendor.o(handleSwiperChange, "28"),
        d: common_vendor.f(bannerList.value, (item, index, i0) => {
          return {
            a: index,
            b: currentSwiperIndex.value === index ? 1 : ""
          };
        }),
        e: common_vendor.t(noticeContent.value),
        f: common_vendor.p({
          scrollamount: "3"
        }),
        g: common_assets._imports_0,
        h: common_vendor.f(hotKeywordList.value, (keyword, index, i0) => {
          return {
            a: common_vendor.t(keyword),
            b: index
          };
        }),
        i: hotKeywordList.value.length === 0
      }, hotKeywordList.value.length === 0 ? {} : {}, {
        j: common_vendor.o(goToSearch, "d5"),
        k: currentCategoryId.value === "0" ? 1 : "",
        l: common_vendor.o(($event) => handleCategoryClick("0"), "b0"),
        m: common_vendor.f(categoryList.value, (item, index, i0) => {
          return {
            a: common_vendor.t(item.name),
            b: currentCategoryId.value === item.id ? 1 : "",
            c: index,
            d: common_vendor.o(($event) => handleCategoryClick(item.id), index)
          };
        }),
        n: common_vendor.f(displayProductList.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.imageUrl,
            b: common_vendor.t(item.name || ""),
            c: common_vendor.t(item.sellPoint || ""),
            d: common_vendor.t((item.price || 0).toFixed(2)),
            e: item.isEnterprisePrice
          }, item.isEnterprisePrice ? {} : {}, {
            f: index,
            g: common_vendor.o(($event) => goToProductDetail(item.id), index)
          });
        }),
        o: common_vendor.f(guessLikeProductList.value, (item, index, i0) => {
          return common_vendor.e({
            a: item.imageUrl,
            b: common_vendor.t(item.name || ""),
            c: common_vendor.t(item.sellPoint || ""),
            d: common_vendor.t((item.price || 0).toFixed(2)),
            e: item.isEnterprisePrice
          }, item.isEnterprisePrice ? {} : {}, {
            f: index,
            g: common_vendor.o(($event) => goToProductDetail(item.id), index)
          });
        }),
        p: isLoadingGuessLike.value
      }, isLoadingGuessLike.value ? {} : {}, {
        q: showBackTop.value ? 1 : "",
        r: common_vendor.o(backToTop, "c8")
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5a0044bb"]]);
_sfc_main.__runtimeHooks = 1;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pages/main/index/index.js.map
