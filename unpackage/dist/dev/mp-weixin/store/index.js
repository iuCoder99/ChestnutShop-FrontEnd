"use strict";
const common_vendor = require("../common/vendor.js");
require("./modules/userStore.js");
require("./modules/cartStore.js");
require("./modules/orderStore.js");
require("./modules/chatStore.js");
const pinia = common_vendor.createPinia();
exports.pinia = pinia;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/index.js.map
