"use strict";
const common_vendor = require("../common/vendor.js");
class SocketService {
  constructor() {
    this.socketTask = null;
    this.isConnected = false;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.reconnectCount = 0;
    this.maxReconnectCount = 5;
    this.url = "";
    this.token = "";
    this.listeners = /* @__PURE__ */ new Map();
  }
  /**
   * 初始化连接
   * @param {string} token JWT Token
   */
  connect(token) {
    if (this.isConnected)
      return;
    this.token = token;
    let baseUrl = "ws://127.0.0.1:8888";
    this.url = `${baseUrl}/ws/chat?token=${token}`;
    this._doConnect();
  }
  _doConnect() {
    common_vendor.index.__f__("log", "at utils/websocket.js:45", "[WebSocket] Connecting to:", this.url);
    this.socketTask = common_vendor.index.connectSocket({
      url: this.url,
      header: {
        "ngrok-skip-browser-warning": "true"
      },
      success: () => {
        common_vendor.index.__f__("log", "at utils/websocket.js:53", "[WebSocket] Connection request success");
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/websocket.js:56", "[WebSocket] Connection request failed:", err);
        this._handleReconnect();
      }
    });
    this.socketTask.onOpen(() => {
      common_vendor.index.__f__("log", "at utils/websocket.js:62", "[WebSocket] Open");
      this.isConnected = true;
      this.reconnectCount = 0;
      this._startHeartbeat();
      this._emit("open");
    });
    this.socketTask.onMessage((res) => {
      try {
        const data = JSON.parse(res.data);
        common_vendor.index.__f__("log", "at utils/websocket.js:72", "[WebSocket] Message received:", data);
        this._emit("message", data);
        if (data.action) {
          this._emit(data.action, data.data);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at utils/websocket.js:79", "[WebSocket] Message parse error:", e, res.data);
      }
    });
    this.socketTask.onClose((res) => {
      common_vendor.index.__f__("log", "at utils/websocket.js:84", "[WebSocket] Closed. Code:", res.code, "Reason:", res.reason, "Original:", res);
      this.isConnected = false;
      this._stopHeartbeat();
      this._emit("close", res);
      if (res.code !== 1e3) {
        this._handleReconnect();
      }
    });
    this.socketTask.onError((err) => {
      common_vendor.index.__f__("error", "at utils/websocket.js:96", "[WebSocket] Error Details:", JSON.stringify(err), "Original:", err);
      this.isConnected = false;
      this._stopHeartbeat();
      this._emit("error", err);
      this._handleReconnect();
    });
  }
  /**
   * 发送消息
   * @param {Object} data 消息内容
   */
  send(data) {
    if (!this.isConnected || !this.socketTask) {
      common_vendor.index.__f__("error", "at utils/websocket.js:110", "[WebSocket] Not connected, cannot send message");
      return false;
    }
    const message = JSON.stringify(data);
    this.socketTask.send({
      data: message,
      success: () => {
        common_vendor.index.__f__("log", "at utils/websocket.js:118", "[WebSocket] Message sent:", data);
      },
      fail: (err) => {
        common_vendor.index.__f__("error", "at utils/websocket.js:121", "[WebSocket] Message send failed:", err);
      }
    });
    return true;
  }
  /**
   * 发送业务消息 (SEND_MSG)
   */
  sendMessage({ toUserId, msgType = 0, content, productId = null }) {
    return this.send({
      action: "SEND_MSG",
      data: { toUserId, msgType, content, productId }
    });
  }
  /**
   * 已读上报 (READ_REPORT)
   */
  sendReadReport(contactId) {
    return this.send({
      action: "READ_REPORT",
      data: { contactId }
    });
  }
  /**
   * 关闭连接
   */
  close() {
    if (this.socketTask) {
      this.socketTask.close({
        code: 1e3,
        reason: "Client logout/close"
      });
    }
    this._stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  // --- 私有方法 ---
  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ action: "HEARTBEAT", data: Date.now() });
      }
    }, 3e4);
  }
  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  _handleReconnect() {
    if (this.reconnectTimer)
      return;
    if (this.reconnectCount >= this.maxReconnectCount) {
      common_vendor.index.__f__("error", "at utils/websocket.js:186", "[WebSocket] Max reconnect attempts reached");
      return;
    }
    this.reconnectCount++;
    const delay = Math.min(1e3 * Math.pow(2, this.reconnectCount), 3e4);
    common_vendor.index.__f__("log", "at utils/websocket.js:192", `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectCount})`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this._doConnect();
    }, delay);
  }
  // --- 事件订阅机制 ---
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  off(event, callback) {
    if (!this.listeners.has(event))
      return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }
  _emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => cb(data));
    }
  }
}
const socketService = new SocketService();
exports.socketService = socketService;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/websocket.js.map
