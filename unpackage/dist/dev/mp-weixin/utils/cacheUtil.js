"use strict";
const common_vendor = require("../common/vendor.js");
const cacheUtil = {
  /**
   * 设置缓存
   * @param {string} key 缓存键名
   * @param {any} data 缓存数据
   * @param {number} minutes 过期时间（分钟），默认30分钟
   */
  set(key, data, minutes = 30) {
    try {
      common_vendor.index.setStorageSync(key, {
        data,
        timestamp: Date.now(),
        expire: minutes * 60 * 1e3
      });
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/cacheUtil.js:21", `设置缓存失败: ${key}`, e);
    }
  },
  /**
   * 获取缓存
   * @param {string} key 缓存键名
   * @returns {any|null} 缓存数据，不存在或已过期返回null
   */
  get(key) {
    try {
      const cache = common_vendor.index.getStorageSync(key);
      if (cache && cache.timestamp && cache.expire) {
        if (Date.now() - cache.timestamp < cache.expire) {
          return cache.data;
        }
        this.remove(key);
      }
      return null;
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/cacheUtil.js:43", `读取缓存失败: ${key}`, e);
      return null;
    }
  },
  /**
   * 移除指定缓存
   * @param {string} key 缓存键名
   */
  remove(key) {
    try {
      common_vendor.index.removeStorageSync(key);
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/cacheUtil.js:56", `移除缓存失败: ${key}`, e);
    }
  },
  /**
   * 清理所有前端数据缓存（保留登录凭证等关键信息）
   * 通常在下拉刷新或手动清理时使用
   */
  clearBusinessCache() {
    const keys = [
      "home_banners",
      "home_categories",
      "home_hot_products",
      "home_notice",
      "product_detail_",
      // 注意：详情缓存通常带ID，需要更复杂的逻辑或全部清理
      "related_products_"
    ];
    try {
      const res = common_vendor.index.getStorageInfoSync();
      res.keys.forEach((key) => {
        if (keys.some((k) => key.startsWith(k))) {
          this.remove(key);
        }
      });
    } catch (e) {
      common_vendor.index.__f__("error", "at utils/cacheUtil.js:82", "清理业务缓存失败", e);
    }
  }
};
exports.cacheUtil = cacheUtil;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/cacheUtil.js.map
