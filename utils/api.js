import request from './request';

// 用户相关接口
export const userApi = {
  // 退出登录
  logout: () => request({ url: '/api/user/logout', method: 'DELETE' }),
  // 刷新 Token
  refreshToken: (token) => request({ 
    url: '/api/user/refresh/token', 
    method: 'POST',
    header: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    data: {
      refreshToken: token || uni.getStorageSync('refreshToken')
    }
  }),
  
  // 获取用户详情
  getUserDetail: () => request({ url: '/api/user/detail/get', method: 'GET' }),
  
  // 收藏相关
  // 获取收藏列表
  getCollectList: (params) => request({ url: '/api/user/collect/list', method: 'GET', params }),
  // 添加收藏
  addCollect: (productId) => request({ 
    url: '/api/user/collect/add', 
    method: 'POST', 
    params: { productId } 
  }),
  // 删除收藏
  deleteCollect: (productIds) => {
    const ids = Array.isArray(productIds) ? productIds.join(',') : String(productIds);
    return request({ 
      url: '/api/user/collect/delete', 
      method: 'DELETE', 
      params: { productIds: ids } 
    });
  }
};

// 商品相关接口
export const productApi = {
  // 获取商品详情
  getProductDetail: (id, header = {}) => request({ 
    url: '/api/product/detail', 
    method: 'GET',
    params: { productId: id },
    header: header
  }),
  // 获取列表商品简单介绍
  getProductBriefList: (productIds) => {
    const ids = Array.isArray(productIds) ? productIds.join(',') : String(productIds);
    return request({
      url: '/api/product/brief/list',
      method: 'GET',
      params: { productIds: ids }
    });
  },
  // 获取滚动查询的商品列表（猜你喜欢）
  getScrollProductList: () => request({
    url: '/api/product/scroll/query/list',
    method: 'GET'
  }),
  // 获取热门搜索关键词
  getHotKeywords: () => request({
    url: '/api/product/user/keyword/list',
    method: 'GET'
  }),
  // 评论点赞/取消点赞
  likeComment: (data) => request({
    url: '/api/user/product/comment/like',
    method: 'PUT',
    params: data
  }),
  // 获取评论数统计
  getCommentCount: (productId) => request({
    url: '/api/user/product/comment/count/show',
    method: 'GET',
    params: { productId }
  })
};

// 聊天相关接口
export const chatApi = {
  // 获取会话列表
  getSessions: () => request({ url: '/api/chat/sessions', method: 'GET' }),
  // 获取历史记录
  getHistory: (contactId) => request({ url: `/api/chat/history/${contactId}`, method: 'GET' }),
  // 清除未读数
  clearUnread: (contactId) => request({ url: `/api/chat/clearUnread/${contactId}`, method: 'POST' })
};

export default {
  user: userApi,
  product: productApi,
  chat: chatApi
};
