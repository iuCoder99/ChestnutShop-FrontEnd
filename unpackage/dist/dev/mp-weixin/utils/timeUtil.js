"use strict";
const formatCountdown = (expireTimeMillis) => {
  const now = Date.now();
  const diff = expireTimeMillis - now;
  if (diff <= 0) {
    return "00:00";
  }
  const minutes = Math.floor(diff / 1e3 / 60);
  const seconds = Math.floor(diff / 1e3 % 60);
  const m = minutes.toString().padStart(2, "0");
  const s = seconds.toString().padStart(2, "0");
  return `${m}:${s}`;
};
const isExpired = (expireTimeMillis) => {
  return Date.now() >= expireTimeMillis;
};
exports.formatCountdown = formatCountdown;
exports.isExpired = isExpired;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/timeUtil.js.map
