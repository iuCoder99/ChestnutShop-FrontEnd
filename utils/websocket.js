/**
 * WebSocket 实时通信核心工具类
 */
class SocketService {
  constructor() {
    this.socketTask = null;
    this.isConnected = false;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.reconnectCount = 0;
    this.maxReconnectCount = 5;
    this.url = '';
    this.token = '';
    
    // 事件监听器
    this.listeners = new Map();
  }

  /**
   * 初始化连接
   * @param {string} token JWT Token
   */
  connect(token) {
    if (this.isConnected) return;
    
    this.token = token;
    
    // 默认生产环境地址
    //let baseUrl = 'wss://alena-subradical-ava.ngrok-free.dev';
    let baseUrl = 'ws://127.0.0.1:8888'; 
    
    // #ifdef H5
    // H5开发环境使用代理
    if (process.env.NODE_ENV === 'development') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      baseUrl = `${protocol}//${window.location.host}`;
    }
    // #endif
    
    this.url = `${baseUrl}/ws/chat?token=${token}`;
    this._doConnect();
  }

  _doConnect() {
    console.log('[WebSocket] Connecting to:', this.url);
    
    this.socketTask = uni.connectSocket({
      url: this.url,
      header: {
        'ngrok-skip-browser-warning': 'true'
      },
      success: () => {
        console.log('[WebSocket] Connection request success');
      },
      fail: (err) => {
        console.error('[WebSocket] Connection request failed:', err);
        this._handleReconnect();
      }
    });

    this.socketTask.onOpen(() => {
      console.log('[WebSocket] Open');
      this.isConnected = true;
      this.reconnectCount = 0;
      this._startHeartbeat();
      this._emit('open');
    });

    this.socketTask.onMessage((res) => {
      try {
        const data = JSON.parse(res.data);
        console.log('[WebSocket] Message received:', data);
        this._emit('message', data);
        
        if (data.action) {
          this._emit(data.action, data.data);
        }
      } catch (e) {
        console.error('[WebSocket] Message parse error:', e, res.data);
      }
    });

    this.socketTask.onClose((res) => {
      console.log('[WebSocket] Closed. Code:', res.code, 'Reason:', res.reason, 'Original:', res);
      this.isConnected = false;
      this._stopHeartbeat();
      this._emit('close', res);
      
      // 非主动关闭（code 为 1000 通常代表正常关闭）
      if (res.code !== 1000) {
        this._handleReconnect();
      }
    });

    this.socketTask.onError((err) => {
      console.error('[WebSocket] Error Details:', JSON.stringify(err), 'Original:', err);
      this.isConnected = false;
      this._stopHeartbeat();
      this._emit('error', err);
      this._handleReconnect();
    });
  }

  /**
   * 发送消息
   * @param {Object} data 消息内容
   */
  send(data) {
    if (!this.isConnected || !this.socketTask) {
      console.error('[WebSocket] Not connected, cannot send message');
      return false;
    }

    const message = JSON.stringify(data);
    this.socketTask.send({
      data: message,
      success: () => {
        console.log('[WebSocket] Message sent:', data);
      },
      fail: (err) => {
        console.error('[WebSocket] Message send failed:', err);
      }
    });
    return true;
  }

  /**
   * 发送业务消息 (SEND_MSG)
   */
  sendMessage({ toUserId, msgType = 0, content, productId = null }) {
    return this.send({
      action: 'SEND_MSG',
      data: { toUserId, msgType, content, productId }
    });
  }

  /**
   * 已读上报 (READ_REPORT)
   */
  sendReadReport(contactId) {
    return this.send({
      action: 'READ_REPORT',
      data: { contactId }
    });
  }

  /**
   * 关闭连接
   */
  close() {
    if (this.socketTask) {
      this.socketTask.close({
        code: 1000,
        reason: 'Client logout/close'
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
        // 后端如果支持 PING 动作，可以发送
        this.send({ action: 'HEARTBEAT', data: Date.now() });
      }
    }, 30000); // 30秒心跳
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  _handleReconnect() {
    if (this.reconnectTimer) return;
    if (this.reconnectCount >= this.maxReconnectCount) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectCount++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectCount), 30000);
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectCount})`);
    
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
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  _emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }
}

// 导出单例
export default new SocketService();
