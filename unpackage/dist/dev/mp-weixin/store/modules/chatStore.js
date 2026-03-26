"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_websocket = require("../../utils/websocket.js");
const useChatStore = common_vendor.defineStore("chat", {
  state: () => ({
    sessions: [],
    // 会话列表
    currentContactId: null,
    // 当前正在聊天的联系人ID
    messages: [],
    // 当前聊天历史记录
    unreadTotal: 0
    // 总未读数
  }),
  actions: {
    // 获取会话列表
    async fetchSessions() {
      try {
        const res = await utils_request.request({
          url: "/api/chat/sessions",
          method: "GET"
        });
        if (res.success) {
          this.sessions = res.data || [];
          this._calculateUnreadTotal();
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at store/modules/chatStore.js:26", "Failed to fetch chat sessions:", error);
      }
    },
    // 获取聊天历史
    async fetchHistory(contactId) {
      try {
        const res = await utils_request.request({
          url: `/api/chat/history/${contactId}`,
          method: "GET",
          params: { page: 1, size: 50 }
          // 增加分页参数
        });
        if (res.success && res.data) {
          const historyList = res.data.list || [];
          this.messages = historyList.reverse();
          this.clearUnread(contactId);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at store/modules/chatStore.js:47", "Failed to fetch chat history:", error);
      }
    },
    // 清除未读数
    async clearUnread(contactId) {
      try {
        await utils_request.request({
          url: `/api/chat/clearUnread/${contactId}`,
          method: "POST"
        });
        utils_websocket.socketService.sendReadReport(contactId);
        const session = this.sessions.find((s) => s.contactId === contactId);
        if (session) {
          session.unreadCount = 0;
          this._calculateUnreadTotal();
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at store/modules/chatStore.js:70", "Failed to clear unread:", error);
      }
    },
    // 处理新消息推送 (PUSH_MSG)
    handlePushMsg(msg) {
      if (this.currentContactId === msg.fromUserId) {
        this.messages.push(msg);
        utils_websocket.socketService.sendReadReport(msg.fromUserId);
      } else {
        let session = this.sessions.find((s) => s.contactId === msg.fromUserId);
        if (session) {
          session.unreadCount = (session.unreadCount || 0) + 1;
          session.lastMsgContent = msg.content;
          session.lastMsgTime = msg.createTime;
        } else {
          this.fetchSessions();
        }
      }
      this._calculateUnreadTotal();
    },
    // 处理消息发送成功回执 (MSG_ACK)
    handleMsgAck(ack) {
      common_vendor.index.__f__("log", "at store/modules/chatStore.js:99", "[ChatStore] Message ACK received:", ack);
    },
    // 计算总未读数
    _calculateUnreadTotal() {
      this.unreadTotal = this.sessions.reduce((sum, s) => sum + (s.unreadCount || 0), 0);
      if (this.unreadTotal > 0) {
        common_vendor.index.setTabBarBadge({
          index: 3,
          // 假设咨询在第四个 TabBar
          text: this.unreadTotal.toString()
        }).catch(() => {
        });
      } else {
        common_vendor.index.removeTabBarBadge({ index: 3 }).catch(() => {
        });
      }
    },
    // 设置当前聊天对象
    setCurrentContact(contactId) {
      this.currentContactId = contactId;
      if (contactId) {
        this.clearUnread(contactId);
      }
    }
  }
});
exports.useChatStore = useChatStore;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/store/modules/chatStore.js.map
