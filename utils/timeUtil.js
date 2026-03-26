/**
 * 格式化剩余时间
 * @param {number} expireTimeMillis 过期时间戳（毫秒）
 * @returns {string} 格式化后的时间，如 "25:30" 或 "已超时"
 */
export const formatCountdown = (expireTimeMillis) => {
  const now = Date.now();
  const diff = expireTimeMillis - now;
  
  if (diff <= 0) {
    return '00:00';
  }
  
  const minutes = Math.floor(diff / 1000 / 60);
  const seconds = Math.floor((diff / 1000) % 60);
  
  const m = minutes.toString().padStart(2, '0');
  const s = seconds.toString().padStart(2, '0');
  
  return `${m}:${s}`;
};

/**
 * 判断是否已超时
 * @param {number} expireTimeMillis 过期时间戳（毫秒）
 * @returns {boolean}
 */
export const isExpired = (expireTimeMillis) => {
  return Date.now() >= expireTimeMillis;
};
