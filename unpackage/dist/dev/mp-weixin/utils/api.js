"use strict";
const common_vendor = require("../common/vendor.js");
const utils_request = require("./request.js");
const userApi = {
  // 退出登录
  logout: () => utils_request.request({ url: "/api/user/logout", method: "DELETE" }),
  // 刷新 Token
  refreshToken: (token) => utils_request.request({
    url: "/api/user/refresh/token",
    method: "POST",
    header: {
      "content-type": "application/x-www-form-urlencoded"
    },
    data: {
      refreshToken: token || common_vendor.index.getStorageSync("refreshToken")
    }
  }),
  // 获取用户详情
  getUserDetail: () => utils_request.request({ url: "/api/user/detail/get", method: "GET" }),
  // 收藏相关
  // 获取收藏列表
  getCollectList: (params) => utils_request.request({ url: "/api/user/collect/list", method: "GET", params }),
  // 添加收藏
  addCollect: (productId) => utils_request.request({
    url: "/api/user/collect/add",
    method: "POST",
    params: { productId }
  }),
  // 删除收藏
  deleteCollect: (productIds) => {
    const ids = Array.isArray(productIds) ? productIds.join(",") : String(productIds);
    return utils_request.request({
      url: "/api/user/collect/delete",
      method: "DELETE",
      params: { productIds: ids }
    });
  }
};
const productApi = {
  // 获取商品详情
  getProductDetail: (id, header = {}) => utils_request.request({
    url: "/api/product/detail",
    method: "GET",
    params: { productId: id },
    header
  }),
  // 获取列表商品简单介绍
  getProductBriefList: (productIds) => {
    const ids = Array.isArray(productIds) ? productIds.join(",") : String(productIds);
    return utils_request.request({
      url: "/api/product/brief/list",
      method: "GET",
      params: { productIds: ids }
    });
  },
  // 获取滚动查询的商品列表（猜你喜欢）
  getScrollProductList: () => utils_request.request({
    url: "/api/product/scroll/query/list",
    method: "GET"
  }),
  // 获取热门搜索关键词
  getHotKeywords: () => utils_request.request({
    url: "/api/product/user/keyword/list",
    method: "GET"
  }),
  // 评论点赞/取消点赞
  likeComment: (data) => utils_request.request({
    url: "/api/user/product/comment/like",
    method: "PUT",
    params: data
  }),
  // 获取评论数统计
  getCommentCount: (productId) => utils_request.request({
    url: "/api/user/product/comment/count/show",
    method: "GET",
    params: { productId }
  }),
  // 获取相关推荐商品
  getRelatedProducts: (productName, limit = 10) => utils_request.request({
    url: "/api/product/related",
    method: "GET",
    params: { productName, limit }
  }),
  // 获取分类下商品列表 (支持滚动查询)
  getCategoryProducts: (params) => utils_request.request({
    url: "/api/product/categroy/list",
    method: "GET",
    params
  }),
  // 搜索商品 (支持滚动查询)
  searchProducts: (params) => utils_request.request({
    url: "/api/product/search",
    method: "GET",
    params
  })
};
exports.productApi = productApi;
exports.userApi = userApi;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/api.js.map
