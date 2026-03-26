import { defineStore } from 'pinia';
import request from '@/utils/request';
import socketService from '@/utils/websocket';

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessions: [], // 会话列表
    currentContactId: null, // 当前正在聊天的联系人ID
    messages: [], // 当前聊天历史记录
    unreadTotal: 0, // 总未读数
  }),

  actions: {
    // 获取会话列表
    async fetchSessions() {
      try {
        const res = await request({
          url: '/api/chat/sessions',
          method: 'GET'
        });
        if (res.success) {
          this.sessions = res.data || [];
          this._calculateUnreadTotal();
        }
      } catch (error) {
        console.error('Failed to fetch chat sessions:', error);
      }
    },

    // 获取聊天历史
    async fetchHistory(contactId) {
      try {
        const res = await request({
          url: `/api/chat/history/${contactId}`,
          method: 'GET',
          params: { page: 1, size: 50 } // 增加分页参数
        });
        if (res.success && res.data) {
          // 注意：res.data 是 PageResult 对象，包含 list 字段
          const historyList = res.data.list || [];
          // 后端返回通常是时间倒序，前端渲染通常需要时间正序
          this.messages = historyList.reverse();
          // 进入聊天页面，自动标记为已读
          this.clearUnread(contactId);
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    },

    // 清除未读数
    async clearUnread(contactId) {
      try {
        // 1. 发送 HTTP 请求清除
        await request({
          url: `/api/chat/clearUnread/${contactId}`,
          method: 'POST'
        });
        
        // 2. 发送 WebSocket 已读上报
        socketService.sendReadReport(contactId);

        // 3. 更新本地状态
        const session = this.sessions.find(s => s.contactId === contactId);
        if (session) {
          session.unreadCount = 0;
          this._calculateUnreadTotal();
        }
      } catch (error) {
        console.error('Failed to clear unread:', error);
      }
    },

    // 处理新消息推送 (PUSH_MSG)
    handlePushMsg(msg) {
      // 1. 如果是当前正在聊天的联系人，添加到消息列表
      if (this.currentContactId === msg.fromUserId) {
        this.messages.push(msg);
        // 自动上报已读
        socketService.sendReadReport(msg.fromUserId);
      } else {
        // 2. 否则更新会话列表中的未读数
        let session = this.sessions.find(s => s.contactId === msg.fromUserId);
        if (session) {
          session.unreadCount = (session.unreadCount || 0) + 1;
          session.lastMsgContent = msg.content;
          session.lastMsgTime = msg.createTime;
        } else {
          // 如果没有会话，重新拉取一次列表
          this.fetchSessions();
        }
      }
      this._calculateUnreadTotal();
    },

    // 处理消息发送成功回执 (MSG_ACK)
    handleMsgAck(ack) {
      // 可以根据 ack 中的消息 ID 或临时 ID 更新消息状态（如：发送中 -> 发送成功）
      console.log('[ChatStore] Message ACK received:', ack);
    },

    // 计算总未读数
    _calculateUnreadTotal() {
      this.unreadTotal = this.sessions.reduce((sum, s) => sum + (s.unreadCount || 0), 0);
      // 设置应用角标（如果平台支持）
      if (this.unreadTotal > 0) {
        uni.setTabBarBadge({
          index: 3, // 假设咨询在第四个 TabBar
          text: this.unreadTotal.toString()
        }).catch(() => {});
      } else {
        uni.removeTabBarBadge({ index: 3 }).catch(() => {});
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
